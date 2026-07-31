const eslint = require('@eslint/js');
const eslintConfigPrettier = require('eslint-config-prettier');
const importPlugin = require('eslint-plugin-import');
const globals = require('globals');
const tseslint = require('typescript-eslint');

const TS_FILES = ['**/*.ts', '**/*.tsx', '**/*.mts', '**/*.cts'];

/**
 * Naming rules from the workspace CLAUDE.md, expressed as selectors.
 * `requiresQuotes` is exempted so HTTP headers and other quoted keys
 * (`'Content-Type'`, `'x-correlation-id'`) do not have to fight the linter.
 */
const namingConvention = [
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
 * Shared TypeScript baseline. Consumers append their own block setting
 * `parserOptions.tsconfigRootDir` so the type-aware rules resolve the right project.
 */
const base = [
    {
        ignores: ['**/dist/**', '**/coverage/**', '**/node_modules/**', '**/*.d.ts'],
    },
    eslint.configs.recommended,
    ...tseslint.configs.recommendedTypeChecked,
    ...tseslint.configs.stylisticTypeChecked,
    eslintConfigPrettier,
    {
        files: TS_FILES,
        languageOptions: {
            parser: tseslint.parser,
            parserOptions: {
                projectService: true,
            },
        },
        plugins: {
            import: importPlugin,
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
            '@typescript-eslint/naming-convention': namingConvention,
            '@typescript-eslint/no-unused-vars': [
                'error',
                { argsIgnorePattern: '^_', varsIgnorePattern: '^_', caughtErrorsIgnorePattern: '^_' },
            ],
            'import/order': [
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
            'import/no-default-export': 'error',
            'no-console': ['warn', { allow: ['warn', 'error'] }],
            eqeqeq: ['error', 'always', { null: 'ignore' }],
        },
    },
    {
        // Tooling config files and scripts run outside the type-aware project and are allowed
        // a default export.
        //
        // Deliberately NOT `**/*.config.ts`: `.config.ts` is one of our own role suffixes
        // (`base-env.config.ts`, `app-env.config.ts`), and that glob would quietly strip type
        // information from real source files. The TypeScript tooling configs are listed by name.
        files: [
            '**/*.js',
            '**/*.cjs',
            '**/*.mjs',
            '**/scripts/**',
            '**/vite.config.ts',
            '**/tailwind.config.ts',
            '**/jest.config.ts',
        ],
        ...tseslint.configs.disableTypeChecked,
        languageOptions: {
            globals: {
                ...globals.node,
            },
        },
        rules: {
            ...tseslint.configs.disableTypeChecked.rules,
            'import/no-default-export': 'off',
            '@typescript-eslint/explicit-function-return-type': 'off',
            'no-console': 'off',
            '@typescript-eslint/no-require-imports': 'off',
        },
    },
];

/**
 * Rule relaxations for test files.
 *
 * Jest's matchers are typed loosely (`expect.any` and `objectContaining` return `any`) and test
 * doubles are deliberately partial. Enforcing the strict-typing rules in a spec buys nothing and
 * pushes people towards `eslint-disable`, which is worse.
 *
 * Exported separately, and spread **last** by every variant, because flat config resolves by
 * order: a later block matching `**\/*.ts` re-enables whatever an earlier one relaxed. Folding
 * this into `base` silently stopped working the moment `nest` set `no-unsafe-argument` after it.
 */
const specOverrides = {
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

module.exports = { base: [...base, specOverrides], namingConvention, specOverrides };
