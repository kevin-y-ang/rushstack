/**
 * @Copyright (c) Microsoft Corporation.  All rights reserved.
 */

import * as child_process from 'child_process';
import * as path from 'path';
import * as fs from 'fs';
import RushConfig from './RushConfig';
import JsonFile from './JsonFile';
import Utilities from './Utilities';

/**
 * Entry point for the "rush update" command.
 */
export default function executeUpdate(rushConfig: RushConfig): void {
  const startTime: number = Utilities.getTimeInMs();
  console.log('Starting "rush update"\n');

  // 1. Delete "common\node_modules"
  const nodeModulesPath: string = path.join(rushConfig.commonFolder, 'node_modules');

  if (fs.existsSync(nodeModulesPath)) {
    console.log('Deleting common/node_modules folder...');
    Utilities.dangerouslyDeletePath(nodeModulesPath);
  }

  // 2. Delete "common\temp_modules"
  const tempModulesPath: string = path.join(rushConfig.commonFolder, 'temp_modules');

  if (fs.existsSync(tempModulesPath)) {
    console.log('Deleting common/temp_modules folder');
    Utilities.dangerouslyDeletePath(tempModulesPath);
  }

  // 3. Delete the previous npm-shrinkwrap.json
  const shrinkwrapFilename: string = path.join(rushConfig.commonFolder, 'npm-shrinkwrap.json');

  if (fs.existsSync(shrinkwrapFilename)) {
    console.log('Deleting common/npm-shrinkwrap.json');
    Utilities.dangerouslyDeletePath(shrinkwrapFilename);
  }

  // 4. Construct common\package.json and common\temp_modules
  console.log('Creating a clean common/temp_modules folder');
  Utilities.createFolderWithRetry(tempModulesPath);

  let commonPackageJson: PackageJson = {
    dependencies: {},
    description: 'Temporary file generated by the Rush tool',
    name: 'rush-common',
    private: true,
    version: '0.0.0'
  };

  console.log('Creating temp projects...');
  for (let rushProject of rushConfig.projects) {
    const packageJson: PackageJson = rushProject.packageJson;

    const tempProjectName: string = rushProject.tempProjectName;

    const tempProjectFolder: string = path.join(tempModulesPath, tempProjectName);
    fs.mkdirSync(tempProjectFolder);

    commonPackageJson.dependencies[tempProjectName] = 'file:./temp_modules/' + tempProjectName;

    const tempPackageJsonFilename: string = path.join(tempProjectFolder, 'package.json');

    const tempPackageJson: PackageJson = {
      name: tempProjectName,
      version: '0.0.0',
      private: true,
      dependencies: {}
    };

    // If there are any optional dependencies, copy them over directly
    if (packageJson.optionalDependencies) {
      tempPackageJson.optionalDependencies = packageJson.optionalDependencies;
    }

    // If there are devDependencies, we need to merge them with the regular
    // dependencies.  If the same library appears in both places, then the
    // regular dependency takes precedence over the devDependency.
    // It also takes precedence over a duplicate in optionalDependencies,
    // but NPM will take care of that for us.  (Frankly any kind of duplicate
    // should be an error, but NPM is pretty lax about this.)
    if (packageJson.devDependencies) {
      for (let key of Object.keys(packageJson.devDependencies)) {
        tempPackageJson.dependencies[key] = packageJson.devDependencies[key];
      }
    }

    if (packageJson.dependencies) {
      for (let key of Object.keys(packageJson.dependencies)) {
        tempPackageJson.dependencies[key] = packageJson.dependencies[key];
      }
    }

    JsonFile.saveJsonFile(tempPackageJson, tempPackageJsonFilename);
  }

  console.log('Writing common/package.json');
  const commonPackageJsonFilename: string = path.join(rushConfig.commonFolder, 'package.json');
  JsonFile.saveJsonFile(commonPackageJson, commonPackageJsonFilename);

  // 5. Run "npm install" and "npm shrinkwrap"
  const options = {
    cwd: rushConfig.commonFolder,
    stdio: [0, 1, 2] // (omit this to suppress gulp console output)
  };

  console.log('\nRunning "npm install"...');
  child_process.execSync('npm install', options);
  console.log('"npm install" completed\n');

  console.log('\nRunning "npm shrinkwrap"...');
  child_process.execSync('npm shrinkwrap', options);
  console.log('"npm shrinkwrap" completed\n');

  const endTime: number = Utilities.getTimeInMs();
  const totalSeconds: string = ((endTime - startTime) / 1000.0).toFixed(2);

  console.log(`\nRush update finished successfully. (${totalSeconds} seconds)`);
};
