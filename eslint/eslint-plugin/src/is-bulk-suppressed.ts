import fs from 'fs';
import path from 'path';
import { Scope, ScopeType } from '@typescript-eslint/scope-manager';
import { /* AST_NODE_TYPES, ASTUtils, */ ESLintUtils, TSESLint, TSESTree } from '@typescript-eslint/utils';
import * as guards from './utils/ast-type-guards';
import { serializeNodeScope } from './utils/scope';

type MessageIds = 'uppercase' | 'lowercase' | 'isBulkSuppressed';

type Options = [];

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

const isBulkSuppressedRule: TSESLint.RuleModule<MessageIds, Options> = {
  create(context: Readonly<TSESLint.RuleContext<MessageIds, Options>>): TSESLint.RuleListener {
    return {
      FunctionDeclaration(node) {
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
