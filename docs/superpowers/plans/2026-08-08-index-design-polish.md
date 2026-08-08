# Index.html Design Polish Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Prepare the NovaSync landing page for publication with focused accessibility, responsive, and interaction-state polish.

**Architecture:** Keep the single-file `Index.html` architecture. Add only scoped CSS refinements and defensive JavaScript around the existing form, sidebar, and FAQ logic; do not split files or change integrations.

**Tech Stack:** Self-contained HTML, CSS custom properties, browser-native Constraint Validation API, IntersectionObserver, JSON-LD.

## Global Constraints

- Preserve NovaSync's dark canvas, Manrope body/display type, SF Mono metadata, and existing tokens.
- Keep all user-visible copy in pt-BR.
- Do not add external dependencies or alter Sheet Monkey, IBGE, FAQ, or image URLs.
- Do not edit sector pages, privacy page, shared CSS, or design tokens.
- Maintain responsive behavior from 360px through desktop widths.

---

### Task 1: Harden Interaction States

**Files:**
- Modify: `Index.html` CSS block around the focus, form, sidebar, and responsive rules.

**Interfaces:**
- Consumes: Existing `.btn`, `.technical-form`, `.section-sidebar`, and media-query selectors.
- Produces: Consistent focus, hover, invalid, disabled, and mobile sizing states.

- [ ] Add focus-visible coverage for `a`, `button`, `summary`, `input`, and `select` without lowering contrast.
- [ ] Add explicit disabled styling for `.btn:disabled` and disabled form controls while preserving readable text.
- [ ] Replace fragile inline select styling only if needed to make focus and invalid states match the existing inputs.
- [ ] Confirm mobile grids collapse without horizontal overflow and preserve touch targets of at least 44px.

### Task 2: Harden Form and Sidebar Scripts

**Files:**
- Modify: `Index.html` form and navigation scripts around lines 1621-1762.

**Interfaces:**
- Consumes: Existing form validation, city lookup, loading state, sidebar observers, and `data-section-link` attributes.
- Produces: Defensive scripts that tolerate missing optional elements and retain native submission.

- [ ] Guard sidebar queries before calling `querySelectorAll` on a possibly missing element.
- [ ] Ensure city lookup reports loading and failure states through the existing field/status semantics.
- [ ] Keep `aria-invalid`, `aria-busy`, disabled submit state, and live status text synchronized.
- [ ] Preserve the valid native POST path to Sheet Monkey and the redirect hidden field.

### Task 3: Static and Rendered Verification

**Files:**
- Verify: `Index.html`.

**Interfaces:**
- Consumes: The completed single-file artifact.
- Produces: Evidence that the page is structurally valid and usable at responsive widths.

- [ ] Parse the HTML and confirm balanced `main`, `header`, `nav`, `form`, `script`, and `section` tags.
- [ ] Parse the FAQ JSON-LD and confirm eight questions match the visible FAQ details.
- [ ] Confirm all internal section links resolve and required form fields retain `required` plus `aria-required="true"`.
- [ ] Check CSS/markup for placeholder text and obvious fixed-width overflow risks.
- [ ] Render once if static inspection cannot establish layout integrity, then inspect the result for collisions, clipping, and focus/hover contrast.
