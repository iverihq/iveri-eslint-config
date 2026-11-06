// The package lints itself with the config it publishes — the most direct proof that the
// exported flat configs load and run under the ESLint version it declares.
import { node } from './index.js';

export default [
    ...node,
    {
        languageOptions: {
            parserOptions: { tsconfigRootDir: import.meta.dirname },
        },
    },
    {
        ignores: ['test/fixtures/**'],
    },
];
