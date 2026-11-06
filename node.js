import globals from 'globals';

import { compose, TS_FILES } from './base.js';

/**
 * Packages Node executes directly that are not NestJS services — the contracts and tokens
 * libraries, scripts. Node's globals, nothing framework-specific.
 */
export const node = compose({
    files: TS_FILES,
    languageOptions: {
        globals: {
            ...globals.node,
        },
    },
});
