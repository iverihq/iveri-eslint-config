const globals = require('globals');
const reactHooks = require('eslint-plugin-react-hooks');
const reactRefresh = require('eslint-plugin-react-refresh');

const { base } = require('./base');

/**
 * React + Vite apps. `react-refresh` is what keeps hot reload from silently breaking:
 * a module that exports both a component and a helper loses its refresh boundary.
 */
const react = [
    ...base,
    {
        files: ['**/*.ts', '**/*.tsx'],
        languageOptions: {
            globals: {
                ...globals.browser,
            },
        },
        plugins: {
            'react-hooks': reactHooks,
            'react-refresh': reactRefresh,
        },
        rules: {
            ...reactHooks.configs.recommended.rules,
            'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
        },
    },
    {
        // Route modules and lazy-loaded pages are the one place react-router wants a default export.
        files: ['**/vite.config.ts', '**/tailwind.config.ts', '**/*.route.tsx'],
        rules: {
            'import/no-default-export': 'off',
        },
    },
];

module.exports = { react };
