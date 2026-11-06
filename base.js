import eslint from '@eslint/js';
import eslintConfigPrettier from 'eslint-config-prettier/flat';
import { importX } from 'eslint-plugin-import-x';
import globals from 'globals';
import tseslint from 'typescript-eslint';

/** @typedef {import('eslint').Linter.Config} Config */

export const TS_FILES = ['**/*.ts', '**/*.tsx', '**/*.mts', '**/*.cts'];

/**
 * Naming rules from the workspace CLAUDE.md, expressed as selectors.
 * `requiresQuotes` is exempted so HTTP headers and other quoted keys
 * (`'Content-Type'`, `'x-correlation-id'`) do not have to fight the linter.
 */
export const namingConvention = [
    'error',
    { selector: 'default', format: ['camelCase'], leadingUnderscore: 'allow' },
    { selector: 'variable', format: ['camelCase', 'UPPER_CASE', 'PascalCase'], leadingUnderscore: 'allow' },
    { selector: 'parameter', format: ['camelCase'], leadingUnderscore: 'allow' },
    { selector: 'function', format: ['camelCase', 'PascalCase'] },
    { selector: 'typeLike', format: ['PascalCase'] },
    { selector: 'enumMember', format: ['UPPER_CASE'] },
    { selector: 'objectLiteralProperty', format: null, modifiers: ['requiresQuotes'] },
    { selector: 'typeProperty', format: null, modifiers: ['requiresQuotes'] },
    // UPPER_CASE is allowed on properties because environment variables are modelled as
    // config-class properties and env maps (`{ NODE_ENV, PORT }`) — their names are not ours
    // to rewrite. PascalCase covers maps keyed by a type or component name.
    { selector: 'objectLiteralProperty', format: ['camelCase', 'UPPER_CASE', 'PascalCase'] },
    { selector: 'typeProperty', format: ['camelCase', 'UPPER_CASE'] },
    { selector: 'classProperty', format: ['camelCase', 'UPPER_CASE'], leadingUnderscore: 'allow' },
    { selector: 'import', format: ['camelCase', 'PascalCase'] },
];

/**
 * The type-aware TypeScript baseline every variant starts from. Not exported on its own: a
 * consumer takes a finished variant, so the spec relaxations and Prettier are always last.
 *
 * @type {Config[]}
 */
const core = [
    {
        ignores: ['**/dist/**', '**/coverage/**', '**/node_modules/**', '**/*.d.ts'],
    },
    eslint.configs.recommended,
    ...tseslint.configs.recommendedTypeChecked,
    ...tseslint.configs.stylisticTypeChecked,
    {
        files: TS_FILES,
        languageOptions: {
            parser: tseslint.parser,
            parserOptions: {
                projectService: true,
            },
        },
        plugins: {
            'import-x': importX,
        },
        rules: {
            '@typescript-eslint/no-explicit-any': 'error',
            '@typescript-eslint/explicit-function-return-type': 'error',
            '@typescript-eslint/explicit-module-boundary-types': 'off',
            '@typescript-eslint/no-inferrable-types': 'off',
            '@typescript-eslint/require-await': 'error',
            '@typescript-eslint/no-floating-promises': 'error',
            '@typescript-eslint/no-misused-promises': 'error',
            '@typescript-eslint/no-unnecessary-condition': 'error',
            '@typescript-eslint/consistent-type-definitions': 'off',
            // `verbatimModuleSyntax` makes TypeScript refuse a type imported as a value; this is the
            // half that can fix it. Separate statements, never `import { type X }`, because an
            // inline type specifier leaves an `import {} from` behind that still loads the module.
            // With decorator metadata on, files carrying decorators are left alone: an injected
            // class is a type annotation to the eye and a runtime value to Nest's DI.
            '@typescript-eslint/consistent-type-imports': [
                'error',
                { prefer: 'type-imports', fixStyle: 'separate-type-imports' },
            ],
            '@typescript-eslint/naming-convention': namingConvention,
            '@typescript-eslint/no-unused-vars': [
                'error',
                { argsIgnorePattern: '^_', varsIgnorePattern: '^_', caughtErrorsIgnorePattern: '^_' },
            ],
            'import-x/order': [
                'error',
                {
                    // `parent` is ranked ahead of `sibling` rather than sharing one relative
                    // group: alphabetising a combined group sorts `./x` before `../y`, which
                    // reads backwards — you climb out of the tree, then back in.
                    groups: ['builtin', 'external', 'internal', 'parent', ['sibling', 'index']],
                    'newlines-between': 'always',
                    alphabetize: { order: 'asc', caseInsensitive: true },
                },
            ],
            'import-x/no-default-export': 'error',
            'no-console': ['warn', { allow: ['warn', 'error'] }],
            eqeqeq: ['error', 'always', { null: 'ignore' }],
        },
    },
    {
        // Tooling configs and scripts run outside the type-aware project and may default-export.
        //
        // Deliberately NOT `**/*.config.ts`: `.config.ts` is one of our own role suffixes
        // (`base-env.config.ts`, `app-env.config.ts`), and that glob would quietly strip type
        // information from real source files. The tooling configs are listed by name.
        files: [
            '**/*.js',
            '**/*.cjs',
            '**/*.mjs',
            '**/scripts/**',
            '**/vite.config.ts',
            '**/vitest.config.ts',
            '**/postcss.config.ts',
            '**/eslint.config.ts',
        ],
        ...tseslint.configs.disableTypeChecked,
        languageOptions: {
            globals: {
                ...globals.node,
            },
        },
        rules: {
            ...tseslint.configs.disableTypeChecked.rules,
            'import-x/no-default-export': 'off',
            '@typescript-eslint/explicit-function-return-type': 'off',
            'no-console': 'off',
        },
    },
];

/**
 * Rule relaxations for test files.
 *
 * Matchers are typed loosely (`expect.any` and `objectContaining` return `any`) and test doubles
 * are deliberately partial. Enforcing the strict-typing rules in a spec buys nothing and pushes
 * people towards `eslint-disable`, which is worse.
 *
 * @type {Config}
 */
export const specOverrides = {
    files: ['**/*.spec.ts', '**/*.spec.tsx', '**/*.e2e-spec.ts', '**/test/**/*.ts', '**/test/**/*.tsx'],
    rules: {
        '@typescript-eslint/no-non-null-assertion': 'off',
        '@typescript-eslint/no-unsafe-assignment': 'off',
        '@typescript-eslint/no-unsafe-argument': 'off',
        '@typescript-eslint/no-unsafe-call': 'off',
        '@typescript-eslint/no-unsafe-member-access': 'off',
        '@typescript-eslint/no-unsafe-return': 'off',
        '@typescript-eslint/explicit-function-return-type': 'off',
        '@typescript-eslint/no-unnecessary-condition': 'off',
        '@typescript-eslint/unbound-method': 'off',

        // A test's job includes simulating a dependency that misbehaves. Asserting how code
        // survives a driver rejecting with a bare string requires writing that rejection.
        '@typescript-eslint/prefer-promise-reject-errors': 'off',
        '@typescript-eslint/only-throw-error': 'off',
    },
};

/**
 * Assembles a variant. The order is the contract, because flat config resolves by position: the
 * variant's own blocks after the shared core, then the spec relaxations, so nothing a variant sets
 * can re-enable a rule inside a spec, then Prettier's switch-offs, so no formatting rule survives.
 *
 * @param {...Config} variantBlocks
 * @returns {Config[]}
 */
export function compose(...variantBlocks) {
    return [...core, ...variantBlocks, specOverrides, eslintConfigPrettier];
}

/** The TypeScript baseline with nothing environment-specific. */
export const base = compose();
