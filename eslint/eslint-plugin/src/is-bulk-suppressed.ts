import fs from 'fs';
import path from 'path';
import { Scope, ScopeType } from '@typescript-eslint/scope-manager';
import { /* AST_NODE_TYPES, ASTUtils, */ ESLintUtils, TSESLint, TSESTree } from '@typescript-eslint/utils';
import * as Guards from './utils/ast-type-guards';
import { BulkSuppressionsJson, serializeNodeScope } from './utils/scope';

type MessageIds = 'uppercase' | 'lowercase' | 'isBulkSuppressed';

type Options = [];

function readEslintBulkSuppressionsJson(
  context: Readonly<TSESLint.RuleContext<MessageIds, Options>>
): BulkSuppressionsJson | undefined {
  const filename = context.getFilename();
  for (let dirname = path.dirname(filename); dirname !== '/'; dirname = path.dirname(dirname)) {
    if (fs.existsSync(path.join(dirname, '.eslint-bulk-suppressions.json'))) {
      return require(path.join(dirname, '.eslint-bulk-suppressions.json'));
    }
  }
  return undefined;
}

const isBulkSuppressedRule: TSESLint.RuleModule<MessageIds, Options> = {
  create(context: Readonly<TSESLint.RuleContext<MessageIds, Options>>): TSESLint.RuleListener {
    const filename = context.getFilename();

    const eslintBulkSuppressions = readEslintBulkSuppressionsJson(context);
    if (eslintBulkSuppressions === undefined) return {};

    function checkForBulkSuppression(
      eslintBulkSuppressions: BulkSuppressionsJson,
      node: Guards.NodeWithName
    ): void {
      const scopeId = serializeNodeScope(context, node);
      const matchingSuppression = eslintBulkSuppressions.suppressions.find(
        (suppression) => suppression.scopeId === scopeId
      );

      if (matchingSuppression) {
        context.report({
          messageId: 'isBulkSuppressed',
          node,
          data: {
            rule: matchingSuppression.rule
          }
        });
      }
    }

    return {
      FunctionDeclaration(node) {
        console.log(serializeNodeScope(context, node));
        if (Guards.isNodeWithName(node)) checkForBulkSuppression(eslintBulkSuppressions, node);
      },
      ClassExpression(node) {
        if (Guards.isNodeWithName(node)) checkForBulkSuppression(eslintBulkSuppressions, node);
      },
      ClassDeclaration(node) {
        if (Guards.isNodeWithName(node)) checkForBulkSuppression(eslintBulkSuppressions, node);
      },
      FunctionExpression(node) {
        if (Guards.isNodeWithName(node)) checkForBulkSuppression(eslintBulkSuppressions, node);
      },
      VariableDeclarator(node) {
        if (Guards.isNodeWithName(node)) checkForBulkSuppression(eslintBulkSuppressions, node);
      },
      Property(node) {
        if (Guards.isNodeWithName(node)) checkForBulkSuppression(eslintBulkSuppressions, node);
      },
      PropertyDefinition(node) {
        if (Guards.isNodeWithName(node)) checkForBulkSuppression(eslintBulkSuppressions, node);
      },
      MethodDefinition(node) {
        if (Guards.isNodeWithName(node)) checkForBulkSuppression(eslintBulkSuppressions, node);
      },
      AssignmentPattern(node) {
        if (Guards.isNodeWithName(node)) checkForBulkSuppression(eslintBulkSuppressions, node);
      }
      // FunctionDeclaration(node) {
      //   if (node.id != null) {
      //     if (/^[a-z]/.test(node.id.name)) {
      //       context.report({
      //         messageId: 'uppercase',
      //         node: node.id,
      //         data: {
      //           variable: 'myVariable'
      //         }
      //       });
      //     } else {
      //       context.report({
      //         messageId: 'lowercase',
      //         node: node.id,
      //         data: {
      //           variable: 'myVariable'
      //         }
      //       });
      //     }
      //   }
      // }
    };
  },
  meta: {
    messages: {
      uppercase: 'Start this name with an upper-case letter. {{ variable }} ',
      lowercase: 'Start this name with a lower-case letter. {{ variable }} ',
      isBulkSuppressed: '{{ rule }} is suppressed at this location.'
    },
    type: 'layout',
    schema: []
  },
  defaultOptions: []
};

export { isBulkSuppressedRule };
