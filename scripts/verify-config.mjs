/**
 * Loads every exported variant through ESLint itself. A malformed flat config only fails when
 * a repo runs `eslint`, which is too late — this catches it at publish time instead.
 */
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { Linter } from 'eslint';

const PACKAGE_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(import.meta.url);

const { base, nest, react } = require(resolve(PACKAGE_ROOT, 'index.js'));

for (const [name, config] of Object.entries({ base, nest, react })) {
    assert.ok(Array.isArray(config) && config.length > 0, `${name} must be a non-empty flat config array`);

    // Linter.verify throws on a structurally invalid flat config.
    const linter = new Linter({ configType: 'flat' });
    const messages = linter.verify('const answer = 1;\n', [
        ...config.filter((block) => !block.languageOptions?.parserOptions?.projectService),
        { files: ['**/*.js'] },
    ]);
    assert.ok(Array.isArray(messages), `${name} did not produce a valid lint result`);
}

console.log('@iveri/eslint-config: base, nest and react variants load');
