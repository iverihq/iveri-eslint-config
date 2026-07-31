// This repo lints itself with the config it publishes — the most direct proof that the
// exported flat configs actually load and run.
const { base } = require('./base');

module.exports = [
    { ignores: ['base.js', 'index.js', 'nest.js', 'react.js', 'eslint.config.js'] },
    ...base,
    {
        languageOptions: {
            parserOptions: { tsconfigRootDir: __dirname },
        },
    },
];
