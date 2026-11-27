# Reusable Components with CSS Modules

In this exercise you'll build six reusable UI components, each with its own CSS Module, and then use them on a template page.

The files are already created and connected. Your job is to **finish the logic** (look for `TODO`) and **write all the CSS**. The page loads now, but it looks unstyled and the buttons don't do anything yet.

## Where things are

```
app/template/
  page.js               <- the page that uses your components  (/template)
  template.module.css   <- page layout styles only
  INSTRUCTIONS.md       <- this file

components/test/
  Badge/       Badge.js       Badge.module.css
  IconButton/  IconButton.js  IconButton.module.css
  Toggle/      Toggle.js      Toggle.module.css
  Dropdown/    Dropdown.js    Dropdown.module.css
  Tabs/        Tabs.js        Tabs.module.css
  Carousel/    Carousel.js    Carousel.module.css
```

Run `npm run dev` and open <http://localhost:3000/template>.
(The app asks you to log in first. Sign in, then go to `/template`.)

## Suggested order (easiest first)

1. **Badge**: no state, only CSS and variants.
2. **IconButton**: props and accessibility (`aria-label`).
3. **Toggle**: your first `useState`.
4. **Tabs**: state plus mapping over an array.
5. **Dropdown**: open/close state, positioning with CSS.
6. **Carousel**: index math, and it reuses your IconButton.

## How CSS Modules work

```js
import styles from "./Badge.module.css";

<span className={styles.badge}>New</span>
```

- The file **must** end in `.module.css`.
- `.badge` in the CSS becomes `styles.badge` in JS. Next.js renames it to something unique like `Badge_badge__x7Yz2`, so a `.badge` in another file will never clash with yours.
- Use **camelCase** class names (`.iconWrap`, not `.icon-wrap`). Otherwise you have to write `styles["icon-wrap"]`.
- Combining classes:
  ```js
  className={`${styles.tab} ${isActive ? styles.active : ""}`}
  ```
- Variant from a prop:
  ```js
  className={`${styles.badge} ${styles[variant]}`}   // variant = "success" -> styles.success
  ```
- Styling a child based on the parent's state:
  ```css
  .on .knob { transform: translateX(20px); }
  ```
- Inspect the element in DevTools to check that your class was applied. Look for the generated class name.
- **Empty rules are thrown away.** If `.badge { }` has no declarations, `styles.badge` is `undefined` and no class shows up in the HTML. That's why each starter class has a `box-sizing: border-box; /* placeholder */` line. Replace it with your real styles.

## What makes a component "reusable"?

- **Props, not hard-coded content.** `<Badge>Trending</Badge>` and not a Badge that always says "Trending".
- **Each component styles itself.** The page decides *where* a component goes (layout, spacing). The component decides *how it looks*. Don't reach into a component's CSS from `template.module.css`.
- **Sensible defaults.** e.g. `variant = "default"`, `size = "md"`.
- **Callbacks for the parent.** `onChange`, `onSelect` and `onClick` let the page react without the component knowing about the page.

## Server vs Client Components (Next.js)

- Components that use `useState`, `onClick` and similar need `"use client"` at the very top of the file. Toggle, Tabs, Dropdown and Carousel already have it.
- `Badge` and `IconButton` don't need it.
- `page.js` is a Server Component. It can **render** client components, but it can't pass functions (like `onSelect={...}`) to them. If you want the page to react to a Dropdown choice, make a small client wrapper component (with `"use client"`) and hold the state there.

## Component hints

### Badge
- Start with `display: inline-flex`, small padding, `border-radius: 999px`, small bold text.
- Add a class per variant (`.success`, `.warning`, ...) that only changes colours.

### IconButton
- Uses the existing `<Icon name="..." />` from `components/ui/Icon.js`. Available names: `audience bell calendar campaign check chevron content copy edit email help instagram logout message repeat search settings sparkles target trash trend upload video`.
- It has no visible text, so **`aria-label` is required**. Don't remove it.
- Keep a visible `:focus-visible` outline so keyboard users can see where they are.

### Toggle
- `role="switch"` and `aria-checked` are already there, so screen readers understand it.
- In `handleClick`: `setChecked(!checked)` and then `onChange?.(!checked)`.
- Add `styles.on` to the root when `checked` is true. Then do the visual change in CSS.
- `transition: transform 0.2s` on `.knob` makes it slide.

### Tabs
- Clicking a tab: `onClick={() => setActiveId(tab.id)}`.
- The active tab gets `styles.active`.
- Stretch: arrow keys move between tabs.

### Dropdown
- The wrapper needs `position: relative`, and the menu needs `position: absolute; top: 100%`.
- Only show the menu when open: `{open && <ul>...</ul>}`.
- Stretch: close on `Escape`, close when clicking outside (`useEffect` + `useRef`).

### Carousel
- Wrap-around: next = `(index + 1) % slides.length`, prev = `(index - 1 + slides.length) % slides.length`.
- The `chevron` icon points right. Flip the "previous" one in CSS.
- Stretch: dots to jump to a slide, or a sliding animation with `transform: translateX(...)`.

## When you're done

1. Replace the test sections in `app/template/page.js` with your **own** page layout (a header, a card grid, a settings panel...) and use the components inside it.
2. Use at least one component **twice with different props**. That's the proof it's reusable.
3. Bonus: add your own seventh component (Avatar, Tooltip, Modal, Progress bar...) following the same folder pattern.

## Checklist

- [ ] Every component has its own `.module.css` and no global class names
- [ ] No inline `style={{}}` except where a value is dynamic (like the carousel transform)
- [ ] Everything works with the keyboard (Tab, Enter, Space)
- [ ] Each component takes props and has defaults
- [ ] The template page uses the components in a layout you designed
