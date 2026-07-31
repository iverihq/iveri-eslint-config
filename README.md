# @iveri/eslint-config

Shared ESLint **flat** configurations (ESLint 9+). Three variants: `base`, `nest`, `react`.

```bash
pnpm add -D @iveri/eslint-config eslint typescript
```

## NestJS service

`eslint.config.js` in the repo root:

```js
const { nest } = require('@iveri/eslint-config');

module.exports = [
    ...nest,
    {
        languageOptions: {
            parserOptions: { tsconfigRootDir: __dirname },
        },
    },
];
```

## React + Vite app

```js
import { react } from '@iveri/eslint-config';

export default [...react, { languageOptions: { parserOptions: { tsconfigRootDir: import.meta.dirname } } }];
```

## What it enforces

Type-aware `typescript-eslint` (`recommendedTypeChecked` + `stylisticTypeChecked`), plus the
rules that matter to us:

- **`no-explicit-any`: error.** Use `unknown` and narrow.
- **`explicit-function-return-type`: error** on exported and public functions.
- **`no-floating-promises` / `no-misused-promises`: error.** The single most common source of
  swallowed failures in a Nest service.
- **`require-await`: error.**
- **`import/order`: error** — builtin → external → internal → relative, blank line between
  groups, alphabetised.
- **`import/no-default-export`: error** — named exports everywhere, except config files,
  scripts, and `*.route.tsx`.
- **`naming-convention`** matching the workspace rules: `camelCase` members, `PascalCase`
  types, `UPPER_CASE` enum members. Quoted keys (`'Content-Type'`) are exempt.

`eslint-config-prettier` is applied last, so formatting is Prettier's job and never a lint
error.

### Relaxations, and why

- **Nest:** `no-extraneous-class` off — `@Module({})` classes are empty by design. Generated
  TypeORM migrations are exempt from naming rules; their shape is not ours to restyle.
- **React:** `react-hooks` recommended rules plus `react-refresh/only-export-components`,
  which is what stops hot reload from silently dying when a module exports a component _and_
  a helper.
