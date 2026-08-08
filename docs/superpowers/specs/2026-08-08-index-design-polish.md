# Index.html Design Polish Specification

## Goal

Refine the existing NovaSync landing page for publication readiness without changing its content architecture, brand tokens, integrations, or sibling pages.

## Approved Direction

Use a surgical polish limited to `Index.html`. Preserve the current dark visual language, Manrope typography, violet interaction accent, existing navigation destinations, Sheet Monkey submission, IBGE city lookup, FAQ schema, and local image assets.

## Scope

- Make focus-visible treatment consistent for links, buttons, form controls, and disclosure summaries.
- Improve form field states for focus, invalid, disabled, loading, and recovery.
- Prevent JavaScript errors when optional sidebar or navigation elements are absent.
- Keep the responsive layout stable from 360px through desktop widths, especially topbar, grids, map, and form.
- Preserve reduced-motion behavior and avoid introducing new dependencies.
- Verify links, balanced markup, script syntax, schema parsing, and required form semantics.

## Out Of Scope

- No redesign of sections or copy.
- No changes to design tokens or external pages.
- No replacement of existing images or APIs.
- No new analytics, backend, or build tooling.

## Acceptance Criteria

- Every keyboard-focusable interactive element has a visible focus ring.
- Invalid required fields expose `aria-invalid="true"` and a Portuguese status message.
- Submit loading disables the submit button and exposes `aria-busy="true"` without blocking native POST.
- Missing optional sidebar elements do not throw script errors.
- Mobile layouts do not create horizontal overflow.
- FAQ JSON-LD remains valid and synchronized with the visible FAQ.
