# Old UI — Port Reference

**Source of truth for markup:** git object `a630ff7`. Read any page directly:

```bash
git show a630ff7:app/page.tsx
git show a630ff7:app/globals.css
git ls-tree -r --name-only a630ff7 -- app/
```

This document holds only what is **not** recoverable from git: the computed daisyUI theme values, the catalogue of latent defects, and the motion plan. Do not duplicate markup here — read it from `a630ff7` when porting each page.

**Directive:** preserve layout, copy, and colour identity exactly. Improve motion and effects only.

---

## 1. daisyUI "night" theme — resolved values

The old app used daisyUI v4 with `themes: ["night"]`. Every `bg-base-300`, `text-base-content`, `text-primary` resolves against these. daisyUI derived `base-200`, `base-300`, and `base-content` at build time, so they appear nowhere in the old source — they must be reproduced by hand.

| Token | Hex | oklch | Role |
|---|---|---|---|
| `--p` primary | `#38bdf8` | — | sky-400. Used by `text-primary` on the 404 page. |
| `--s` secondary | `#818CF8` | — | |
| `--a` accent | `#F471B5` | — | |
| `--n` neutral | `#1E293B` | — | `btn-neutral` background |
| `--b1` base-100 | `#0F172A` | `20.768191% 0.039824 265.754874` | card surfaces |
| `--b2` base-200 | `#0c1425` | `19.314418% 0.037037 265.754874` | derived |
| `--b3` base-300 | `#0a1120` | `17.860645% 0.034249 265.754874` | **site background** |
| `--bc` base-content | `#c8cbd0` | `84.153638% 0.007965 265.754874` | default text |
| info | `#0CA5E9` | — | |
| success | `#2DD4BF` | — | |
| warning | `#F4BF50` | — | |
| error | `#FB7085` | — | |

**Brand accent gradient** — drives the nav underline and `.nav-selected`:

```css
--primary-gradient: linear-gradient(90deg, #f17211, #b10eca); /* orange → magenta */
```

### Mapping onto the new token system

The cosmic palette in `src/app/globals.css` already approximates this. When porting, map old → new rather than reintroducing daisyUI names:

| Old | New |
|---|---|
| `bg-base-300` | `bg-background` |
| `bg-base-200` | `bg-card` / `bg-secondary` |
| `bg-base-100` | `bg-card` |
| `text-base-content` | `text-foreground` |
| `text-primary` | `text-primary` |
| `btn-neutral` | `<Button variant="secondary">` |
| `btn-outline` | `<Button variant="outline">` |
| `btn-ghost` | `<Button variant="ghost">` |

---

## 2. Custom CSS to carry over

These are defined in `a630ff7:app/globals.css` and must be reimplemented (Tailwind 4 has no `@layer components` + `@apply` config file, so `.btn-stylized` becomes a Button variant or a utility in `globals.css`).

| Class | Behaviour | Port as |
|---|---|---|
| `.btn-stylized` | Pill, `p-3 px-10 rounded-3xl`, 2px gray-100 border, gradient sized `170% 100%` anchored left; on hover stops become orange-400 → pink-500 → violet-700 **and** position animates to right, sweeping colour L→R over 500ms ease-in-out | A `Button` variant `stylized` |
| `.nav-link::before` | 3px underline, 5px below text, grows centre-out (width 0→100%, left 50%→0) over 300ms | Keep as CSS |
| `.nav-selected` | Gradient-filled text via `background-clip: text` | Keep as CSS — see defect #1 |
| `.animation-swipe-from-bottom` | 1s `cubic-bezier(.25,.46,.45,.94)` both, translateY(100%)→0, opacity 0→1 | **This curve is the site's motion signature — reuse it for all scroll reveals** |
| `.animation-fade-in` | 3s, opacity holds 0 until 50% (1.5s dead hold, then 1.5s fade) | Replace the dead hold with a real delay |
| `.display-animation` | 2s ease-in-out, same 50%-hold profile | Replace with staggered scroll reveal |
| `.mask-image-gradient` | top-opaque → bottom-transparent mask | Keep (mission globe) |
| `.planet-bg` | `/images/login-bg.jpg`, cover, centre | Keep (auth pages) |
| `.font-tc` | Noto Serif TC — used for 傳道部 on the mission hero | Keep |

---

## 3. Latent defects — fix during the port, deliberately

These look intentional but never worked. Each is a decision, not an automatic fix.

1. **`hover:nav-selected` emits no CSS.** Used 12 times in the Header. `nav-selected` is a custom class, not a Tailwind utility, so the `hover:` variant generates nothing — the intended gradient-text hover **never fired**. Intent is obvious; implement it properly.
2. **`/designs/layer-8.png` does not exist** — referenced by the mission parallax at factor 0.0. One broken image in the old build. Drop the layer.
3. **Invalid classes, silently no-ops:** `top-30` (home about watermark), `minh-96` (mission globe), `from-bg-base-300` (both auth pages), `flex-hidden` (Header), `grid-cols-subgrid` on the events `<ul>` with no parent grid.
4. **Mobile drawer parks off-screen left** — `-translate-x-full` on a `right-0 w-screen` panel. Should be `translate-x-full`.
5. **`CountUp` (`Count.jsx`) was never wired up.** Written for the "Our Impact" numbers, styled identically. Stats are hardcoded strings (`"500+"`, `"3+"`, `"10+"`, `"50+"`), so counting up needs a numeric + suffix split.
6. **`StarryCanvas` leaks.** No `cancelAnimationFrame` on unmount, no devicePixelRatio scaling (blurry on retina), full star regeneration on every resize, and `Date.now()` as the twinkle clock so every star shares one global phase.
7. **Mission scroll handler is unthrottled** and calls `setState` per scroll event — a full React re-render every frame.
8. **`StarryCanvas` is imported but never rendered on both auth pages.** Clearly intended. Render it.
9. **`<Analytics />` imported in layout but never rendered.**
10. **Dead weight:** `animate-slide-left` in the Tailwind config, Audiowide and Azonix fonts loaded but never applied, `/images/logo.png` and `/images/profile-user.png` unused.
11. **Every image is a raw `<img>`** — no `next/image` anywhere. `/designs/globe.png` is 4000×4000 and **5.9 MB**, rendered at 384px.

### Original spellings to preserve verbatim

"Affliated Societies", "Sponsorships and Affliations", "Information about our sponsors and affliations", and the curly apostrophes in the mission Technology description ("what’s", "today’s").

---

## 4. The shared geometric hero

Used **verbatim on 7 pages** (alliance, highlights, legal, jobs, products, research, sponsorship) and in a blurred variant on settings and admin. Extract as one component — animating it once lifts the whole site.

Contents: 3 gradient circles (128/64/80px), 1 rotated-45° square (48px), 2 hairline gradient rules (1px × 96px / 64px), 1 rotated-45° open corner (40px, 4px pink-400 top+left borders), 1 full-width 4px bottom divider. **All eight are completely static in the old build.**

Title class differs between the two groups:
- alliance / highlights: `text-7xl mb-3 font-bold text-white z-10`
- legal / jobs / products / research / sponsorship: `text-4xl md:text-7xl mb-3 font-bold text-white z-10 text-center`

Blurred variant (settings/admin): same three circles at lower opacity with `blur-xl` / `blur-lg`, no lines, no divider.

Page copy:

| Route | Title | Subheading |
|---|---|---|
| `/legal` | Legal Information | Legal information about our organization and our privacy policy. |
| `/jobs` | Job Opportunities | Check out our current job openings and internships and apply today! |
| `/products` | Products and Spin-Offs | Have a glimpse at our latest state of the art products and spin-off services. |
| `/research` | Research and Labs | Our latest research and experimental analysis. |
| `/sponsorship` | Sponsorships and Affliations | Information about our sponsors and affliations. |
| `/alliance` | Alliances | Collaborating with the brightest minds and innovative institutions to drive innovation and progress. |
| `/highlights` | Event Highlights | Showcasing the best moments from our events! |

---

## 5. Motion plan

Layout, colour, and copy stay fixed. Everything here is motion-only. All of it sits behind a `useReducedMotion` guard and animates `transform`/`opacity` only.

### Global primitives — build these first

- **`<Reveal>`** — the old site has *zero* scroll-triggered motion; every animation fires on mount. One IntersectionObserver wrapper (`once: true`, `amount: 0.25`) reusing the exact `swipe-from-bottom` curve so new motion reads as the same design language. Apply to every section heading and card grid.
- **`<Stagger>`** — every repeated grid (sponsors, stats, community cards, elements, chapters, events) currently animates together or not at all. 60–90ms per child.
- **Button `stylized` variant** — keep the 500ms gradient wipe; add pointer-follow highlight, 2px lift + shadow bloom on hover, spring press (`scale .97`) on active, and a real `:focus-visible` ring. There is no focus indicator today.
- **Nav underline** — already grows centre-out; upgrade to a shared-layout indicator that travels between items, and wire up `.nav-selected` as a working hover/active state.
- **Header scroll state** — currently sits at full `backdrop-blur-3xl` over the hero from the first frame. Make blur and border-bottom scroll-linked past ~80px.
- **Page transitions** — none exist. Short cross-fade + 8px rise on route change.

### Per-surface priorities

**Starfield (home hero)** — highest-leverage single upgrade. Fix the leak and DPR, pause when off-screen, give each star an independent phase, add 3 parallax depth layers drifting with pointer and scroll, occasional shooting stars, additive glow on the largest stars, and fade the canvas out as the hero scrolls away.

**Home** — per-line mask reveal on the headline ("Here Ideas" / "Spark into Reality" 120ms apart); parallax + slow rotation on the logo watermark; **wire up `CountUp`** for "Our Impact", triggered on viewport entry with the gradient animating as the number climbs; grayscale→colour on sponsor logos; animate the three static gradient bars in "Become a Member" so the sweep travels; stagger the benefit list with the lightning SVG drawing in; pointer-tilt on the glass CTA card; drift the two blurred orbs in "Join Our Community".

**Mission** — move the parallax off unthrottled `setState` to rAF-batched transforms, keeping the exact eight factors (0.0 / 0.08 / 0.1 / 0.16 / 0.18 / 0.24 / 0.32 / 0.34); add horizontal pointer parallax; drifting fog between mid layers; the empty `#102866` band gets a slow gradient breathe so it isn't a dead 480px void; keep the 80→128px icon growth on "Our Elements" but move it to a spring with a coloured radial glow; rotate the globe continuously and light the six `<strong>` emphases in sequence as the paragraph scrolls.

**Shared geometric hero** — independent slow floats (8–16s, varied phase) on the circles and square, sliding hairlines, very slow spin on the open corner, looping gradient position on the divider, plus shared pointer-parallax. One implementation, seven pages.

**Events** — staggered scroll reveal replacing the simultaneous `display-animation`; skeleton cards while loading; Ken Burns on card images; animated `<dialog>` open (scale-from-0.96 + backdrop blur); in-place button morph with a brand-gradient spark burst on register, replacing the current `window.location.reload()`.

**Auth** — **render the already-imported `StarryCanvas`**; spring the glass rail in from the left; stagger logo → heading → fields; animate the password strength bar as a *filling* bar with a colour tween rather than a hard class swap; inline spinner morph on submit with no layout jump.

**Settings / Admin** — drift the blurred hero circles; stagger the glass panels; **shared-layout gradient pill sliding between admin sidebar tabs** with content crossfade; `CountUp` on the three overview counters; banners slide in with a dismissal progress bar instead of blinking out at 3000ms; animate row deletions out rather than snapping.

**404** — float loop on the illustration, glitch/chromatic offset on the "404" hover, brand-gradient sweep on "Page Not Found".
