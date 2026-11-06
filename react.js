import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';

import { compose, TS_FILES } from './base.js';

/**
 * React apps a bundler builds. The hooks plugin's recommended set includes the React Compiler's
 * rules — purity, refs, state set during render or in an effect — which find real defects
 * whether or not the compiler itself is turned on.
 *
 * `react-refresh` is what keeps hot reload from silently breaking: a module that exports both a
 * component and a helper loses its refresh boundary.
 */
export const react = compose(
    {
        files: TS_FILES,
        languageOptions: {
            globals: {
                ...globals.browser,
            },
        },
    },
    {
        files: TS_FILES,
        ...reactHooks.configs.flat.recommended,
    },
    {
        files: TS_FILES,
        plugins: {
            'react-refresh': reactRefresh,
        },
        rules: {
            'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
        },
    },
    {
        // A lazily loaded page is the one place React wants a default export (`React.lazy`).
        files: ['**/*.route.tsx'],
        rules: {
            'import-x/no-default-export': 'off',
        },
    },
);
