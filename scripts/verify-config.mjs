/**
 * Lints fixtures through every published variant with the ESLint this package declares.
 *
 * A malformed flat config only fails when a repo runs `eslint`, and a rule that is configured but
 * not doing what we think fails nowhere at all. Each assertion pins one behaviour a consumer
 * relies on — above all that the type-import fixer never turns an injected class into
 * `import type`, which would compile, lint clean, and leave NestJS injecting `Object`.
 */
import assert from 'node:assert/strict';
import { resolve } from 'node:path';

import { ESLint } from 'eslint';

import { base, nest, node, react } from '../index.js';

const FIXTURES = resolve(import.meta.dirname, '..', 'test', 'fixtures');

for (const [name, config] of Object.entries({ base, nest, node, react })) {
    assert.ok(Array.isArray(config) && config.length > 0, `${name} must be a non-empty flat config array`);
}

/** Lints one fixture file through a variant, optionally applying fixes in memory. */
async function lint(variant, fixture, file, { fix = false } = {}) {
    const cwd = resolve(FIXTURES, fixture);
    const eslint = new ESLint({
        cwd,
        fix,
        overrideConfigFile: true,
        overrideConfig: [...variant, { languageOptions: { parserOptions: { tsconfigRootDir: cwd } } }],
    });
    const [result] = await eslint.lintFiles([file]);

    // A file ESLint could not parse reports one fatal message and runs no rule at all, so every
    // assertion that a rule did *not* fire would pass on it. None of the fixtures may fail to parse.
    const fatal = result.messages.find((message) => message.fatal);
    assert.equal(fatal, undefined, `${fixture}/${file} did not parse: ${fatal?.message}`);

    return { ruleIds: result.messages.map((message) => message.ruleId), result };
}

const ruleIdsOf = (outcome) => outcome.ruleIds.join(', ') || 'none';

// NestJS: an injected class is a type annotation to the eye and a runtime value to DI.
const injected = await lint(nest, 'nest', 'src/scheduler.ts', { fix: true });
assert.equal(injected.result.output, undefined, 'the nest variant rewrote a file that carries decorators');
assert.deepEqual(injected.ruleIds, [], `scheduler.ts should lint clean, reported: ${ruleIdsOf(injected)}`);

// Everywhere else, a type imported as a value is fixed to a separate `import type`.
const typeImport = await lint(node, 'node', 'src/type-import.ts', { fix: true });
assert.match(
    typeImport.result.output ?? '',
    /^import type \{ Shape \} from '\.\/shape\.js';$/mu,
    'a type-only import should be fixed to a separate `import type` statement',
);

const unordered = await lint(node, 'node', 'src/unordered.ts');
assert.ok(
    unordered.ruleIds.includes('import-x/order'),
    `unordered.ts should violate import-x/order: ${ruleIdsOf(unordered)}`,
);

const defaultExport = await lint(node, 'node', 'src/default-export.ts');
assert.ok(
    defaultExport.ruleIds.includes('import-x/no-default-export'),
    `a default export in source should be refused: ${ruleIdsOf(defaultExport)}`,
);

// Outside every tsconfig by design, so each variant must lint it without type information — and
// then clean, default export included, because its tool requires one. Every variant, because a
// variant's own block can re-enable a type-aware rule that would abort the whole run here.
for (const [variant, fixture, file] of [
    [base, 'node', 'vite.config.ts'],
    [node, 'node', 'vite.config.ts'],
    [nest, 'nest', 'vitest.config.ts'],
    [react, 'react', 'vite.config.ts'],
]) {
    const outcome = await lint(variant, fixture, file);
    assert.deepEqual(outcome.ruleIds, [], `${fixture}/${file} should lint clean, reported: ${ruleIdsOf(outcome)}`);
}

const conditionalHook = await lint(react, 'react', 'src/conditional-hook.tsx');
assert.ok(
    conditionalHook.ruleIds.includes('react-hooks/rules-of-hooks'),
    `a conditional hook should violate rules-of-hooks: ${ruleIdsOf(conditionalHook)}`,
);

console.log('@iveri/eslint-config: base, node, nest and react load under ESLint 10 and enforce what they promise');
