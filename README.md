# @iveri/eslint-config

Shared ESLint **flat** configurations for **ESLint 10** and **TypeScript 6**, published as native
ES modules. Four variants: `base`, `node`, `nest`, `react`.

```bash
pnpm add -D @iveri/eslint-config eslint typescript@~6.0.3
```

Every variant is type-aware (`projectService`), so the repo's own `tsconfig.json` decides how a
file is checked — and the root config only has to say where that tsconfig lives.

## NestJS service

```js
// eslint.config.js — the repo is "type": "module"
import { nest } from '@iveri/eslint-config';

export default [...nest, { languageOptions: { parserOptions: { tsconfigRootDir: import.meta.dirname } } }];
```

`node` (libraries, scripts) and `react` (bundled apps) are used the same way.

## What it enforces

Type-aware `typescript-eslint` (`recommendedTypeChecked` + `stylisticTypeChecked`), plus the
rules that matter to us:

- **`no-explicit-any`: error.** Use `unknown` and narrow.
- **`explicit-function-return-type`: error** on every function; a callback whose type is fixed by
  where it is passed is exempt.
- **`no-floating-promises` / `no-misused-promises`: error.** The single most common source of
  swallowed failures in a Nest service.
- **`require-await`: error.**
- **`consistent-type-imports`: error**, fixed to separate `import type` statements. TypeScript's
  `verbatimModuleSyntax` refuses a type imported as a value; this is the half that fixes it.
  **Files carrying decorators are left alone while `emitDecoratorMetadata` is on** — an injected
  class is a type annotation to the eye and a runtime value to NestJS DI, so rewriting it would
  compile, lint clean, and inject `Object`. The verification pins this both ways.
- **`import-x/order`: error** — builtin → external → internal → parent → sibling, blank line
  between groups, alphabetised. (`eslint-plugin-import-x`: `eslint-plugin-import` does not support
  ESLint 10.)
- **`import-x/no-default-export`: error** — named exports everywhere, except tooling configs,
  scripts, and `*.route.tsx`.
- **`naming-convention`** matching the workspace rules: `camelCase` members, `PascalCase`
  types, `UPPER_CASE` enum members. Quoted keys (`'Content-Type'`) are exempt.

### The order of blocks is the contract

Each variant is `[shared core, variant blocks, tooling files, spec relaxations, eslint-config-prettier]`.
Flat config resolves by position, so no variant can re-enable a type-aware rule on a tooling config
that has no type information, nothing a variant sets can re-enable a rule in a spec, and no
formatting rule survives Prettier's switch-offs. `compose()` is exported for a repo that needs a
variant of its own and must keep that order.

### Relaxations, and why

- **Specs:** the strict `no-unsafe-*` family, return types and `unbound-method` are off — matchers
  are typed loosely and test doubles are partial by design. There are **no test-runner globals**:
  specs import `describe`, `it`, `expect` and `vi` from `vitest`.
- **Nest:** `no-extraneous-class` off — `@Module({})` classes are empty by design. Generated
  TypeORM migrations are exempt from naming rules; their shape is not ours to restyle.
- **React:** the hooks plugin's **recommended set, which now includes the React Compiler's rules**
  (purity, refs, state set during render or in an effect), plus
  `react-refresh/only-export-components`, which stops hot reload silently dying when a module
  exports a component _and_ a helper.
- **Tooling configs** (`vite.config.ts`, `vitest.config.ts`, `eslint.config.*`, `postcss.config.*`,
  plain JS, `scripts/`) are linted without type information and may default-export. The globs name
  each file: `**/*.config.ts` would also match the fleet's own `app-env.config.ts`.

## Verification

`pnpm test` lints fixtures through every variant with the ESLint this package declares: a decorated
NestJS class keeps its value import, a plain type import is fixed to `import type`, an unordered
import and a default export are refused, a tooling config may default-export, and a conditional
hook breaks `rules-of-hooks`. A tooling config is linted through **every** variant, and a fixture
that fails to parse fails the run. The package also lints itself with `node`.
