import fs from 'fs';
import path from 'path';
import { analyze } from '@typescript-eslint/scope-manager';
import { parse } from '@typescript-eslint/typescript-estree';
import { /* AST_NODE_TYPES, ASTUtils, */ ESLintUtils, TSESLint, TSESTree } from '@typescript-eslint/utils';

type MessageIds = 'uppercase' | 'lowercase' | 'isBulkSuppressed';

type Options = [];

type BulkSuppression = {
  file: string;
  scope: string;
  rule: string;
};

function findEslintBulkSuppressionsJson(
  context: Readonly<TSESLint.RuleContext<MessageIds, Options>>
): string | undefined {
  const filename = context.getFilename();
  for (let dirname = path.dirname(filename); dirname !== '/'; dirname = path.dirname(dirname)) {
    if (fs.existsSync(path.join(dirname, '.eslint-bulk-suppressions.json'))) {
      return path.join(dirname, '.eslint-bulk-suppressions.json');
    }
  }
  return undefined;
}

// function manageScope(context: Readonly<TSESLint.RuleContext<MessageIds, Options>>): void {
//   const code = context.getSourceCode().text;
//   const ast = parse(code, { range: true });
//   const scope = analyze(ast, { sourceType: 'module' });
// }

// function getScopeId(context: Readonly<TSESLint.RuleContext<MessageIds, Options>>): number | undefined {
//   const scopeManager = context.getSourceCode().scopeManager;
//   const deprecatedScope = context.getScope();
//   scopeManager?.scopes.forEach((scope) => {
//     console.log(scope);
//   });
//   return scopeManager?.currentScope?.$id;
// }

function serializeNodeScope(
  context: Readonly<TSESLint.RuleContext<MessageIds, Options>>,
  node: TSESTree.Node
): BulkSuppression {
  const scopeManager = context.getSourceCode().scopeManager;
  if (!scopeManager) throw new Error('scopeManager is null');

  const scopes = scopeManager.nodeToScope.get(node);
  console.log(scopes);

  return {
    file: context.getFilename(),
    scope: '',
    rule: context.id
  };
}

const isBulkSuppressedRule: TSESLint.RuleModule<MessageIds, Options> = {
  create(context: Readonly<TSESLint.RuleContext<MessageIds, Options>>): TSESLint.RuleListener {
    return {
      FunctionDeclaration(node) {
        console.log('hello');
        if (node.id != null) {
          if (/^[a-z]/.test(node.id.name)) {
            context.report({
              messageId: 'uppercase',
              node: node.id
            });
          }
        } else {
          context.report({
            messageId: 'lowercase',
            node
          });
        }
      }
    };
  },
  meta: {
    messages: {
      uppercase: 'Start this name with an upper-case letter.',
      lowercase: 'Start this name with a lower-case letter.',
      isBulkSuppressed: 'isBulkSuppressed'
    },
    type: 'layout',
    schema: []
  },
  defaultOptions: []
};

export { isBulkSuppressedRule };
