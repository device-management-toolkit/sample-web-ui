See [`CLAUDE.md`](../CLAUDE.md) at the repo root for the full project, architecture, and conventions guide. The notes below are the short form.

- Angular 20+ idioms: standalone components, signals when applicable, reactive forms, control-flow syntax (`@if`/`@for`), prefer zoneless change detection.
- Use Angular Material components.
- No semicolons; single quotes in TypeScript (enforced by Prettier).
- Do not use deprecated test utilities like `HttpTestingModule` or `RouterTestingModule` in new specs.
- Every source file must carry the SPDX Apache-2.0 Intel copyright header.
- Every change must work for both deployment flavors (cloud MPS+RPS and Console/enterprise).
- After changes, verify the component and its template render/function correctly, run `npm run lint`, and ensure unit tests pass 100% before declaring done.
