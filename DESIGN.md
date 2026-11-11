# Design Guidelines

This document defines the visual language, spatial system, color tokens, typography, and component specifications for Jironimo. All interfaces in the extension—both the popup board and the options screens—follow a strict Metro UI design language built on Tailwind CSS v4, PrimeNG (`MetroPreset`), and custom CSS layers in `src/app/styles.css`.

---

## 1. Core Principles & Domain Alignment

### Domain Terminology
All labels, component classes, and design documentation must use the canonical terms from `GLOSSARY.md`:
- **Account**: A configured JIRA connection and its display preferences (never *server*, *instance*, or *profile*).
- **Workspace**: A named JQL query paired with an icon that populates the popup board (never *tab*, *filter*, or *view*).
- **Issue**: A work item returned by JIRA and tracked on the board (never *entry*, *ticket*, or *item*).
- **Tile**: The visual card representing a single Issue on the popup grid (never *card*, *box*, or *issue view*).
- **Worklog Timer**: The background stopwatch tracking active time against an Issue (never *timer entry* or *activity timer*).

### Visual Philosophy
1. **Zero-Radius Metro Geometry**: Every surface, control, button, input, dialog, tag, and tile uses sharp 90-degree corners (`border-radius: 0`). Rounded corners are globally disabled across both native elements and PrimeNG tokens.
2. **Flat Chromatic Hierarchy**: Hierarchy is communicated through saturated Metro color blocks, crisp `1px` and `2px` borders, and typographic scale rather than drop shadows or gradients.
3. **High-Density Scannability**: The popup board maximizes Issue density in a compact viewport (`min-width: 552px`) while keeping priority, status, assignee ownership, and progress immediately legible at a glance.
4. **Tactile Micro-Interactions**: Tiles and buttons respond immediately to hover and active states using high-contrast outlines (`rgba(0, 0, 0, 0.38)`) and subtle press scaling (`scale(0.985)`).

---

## 2. Color System

### Brand & Semantic Tokens

| Token / Role | Hex | CSS Variable / Usage |
| :--- | :--- | :--- |
| **Metro Teal (Primary)** | `#008287` | `--color-metro-teal`, primary buttons, active tabs, focus borders, blockquotes, notices |
| **Metro Teal Light (Hover)** | `#00aba9` | `--color-metro-teal-light`, primary button hover, active toggle switch hover |
| **Canvas Background** | `#ffffff` | Paired with subtle texture `/themes/default/bg.png` on `body.metro` |
| **Primary Text** | `#1d1d1d` | Body copy, headings `h1`–`h6`, form inputs |
| **Secondary / Muted Text** | `#555555` | Labels, table descriptions, pagination counters (`#666666`–`#777777` for subtitles) |
| **Link Default / Hover** | `#1ba1e2` / `#0050ef` | Standard anchor links (`cyan` to `cobalt` on hover) |
| **Border Neutral** | `#bababa` | Form controls (`#787878` on hover, `#dcdcdc`–`#e2e2e2` for structural containers) |

### Full Metro Palette

Every Metro color is exposed through four utility class prefixes in `src/app/styles.css`:
- Background: `.bg-<name>`
- Foreground text: `.fg-<name>`
- Border (`border-color`): `.bd-<name>` or `.border-<name>`
- Outline (`outline-color`): `.ol-<name>` or `.outline-<name>`

| Color Name | Hex | RGB | Notes |
| :--- | :--- | :--- | :--- |
| `red` | `#e51400` | `229, 20, 0` | Priority 1 default, danger buttons |
| `lightRed` | `#ff2d19` | `255, 45, 25` | Active Worklog Timer badge on Tiles |
| `crimson` | `#a20025` | `162, 0, 37` | Danger hover, disabled Account selector, error bars |
| `orange` | `#fa6800` | `250, 104, 0` | Priority 2 default, warning bars, transition links |
| `amber` | `#f0a30a` | `240, 163, 10` | Warm accent |
| `yellow` | `#e3c800` | `227, 200, 0` | Automatically pairs with `black` foreground text (`fg-black`) |
| `lime` | `#a4c400` | `164, 196, 0` | High-visibility green-yellow accent |
| `lightOlive` | `#78aa1c` | `120, 170, 28` | Priority 3 default |
| `green` | `#60a917` | `96, 169, 23` | Success buttons (`#7ad61d` on hover) |
| `emerald` | `#008a00` | `0, 138, 0` | Deep green (`.bg-darkEmerald` uses `#003e00`) |
| `teal` | `#00aba9` | `0, 171, 169` | Secondary brand accent |
| `cyan` | `#1ba1e2` | `27, 161, 226` | Priority 5 default, `.label.info` badge |
| `lightBlue` | `#4390df` | `67, 144, 223` | Priority 6 default, closed Tile corner ribbon |
| `blue` | `#00aff0` | `0, 175, 240` | Bright sky blue |
| `cobalt` | `#0050ef` | `0, 80, 239` | Info button hover, link hover |
| `darkCobalt` | `#00356a` | `0, 53, 106` | Deep navy accent |
| `darkBlue` | `#16499a` | `22, 73, 154` | Info / `.primary` buttons, `.bg-fg-darkBlue` |
| `indigo` | `#6a00ff` | `106, 0, 255` | Purple-blue accent |
| `violet` | `#aa00ff` | `170, 0, 255` | Vibrant violet |
| `pink` | `#dc4fad` | `220, 79, 173` | Soft magenta accent |
| `magenta` | `#d80073` | `216, 0, 115` | Deep magenta |
| `steel` | `#647687` | `100, 118, 135` | Cool metallic slate |
| `mauve` | `#76608a` | `118, 96, 138` | Muted purple-gray |
| `taupe` | `#87794e` | `135, 121, 78` | Warm earth tone |
| `brown` | `#825a2c` | `130, 90, 44` | Deep warm brown |
| `olive` | `#6d8764` | `109, 135, 100` | Muted sage green |
| `gray` | `#555555` | `85, 85, 85` | Priority 4 default, muted icons |
| `dark` | `#333333` | `51, 51, 51` | Dark neutral surface |
| `darker` | `#222222` | `34, 34, 34` | Contrast/inverse buttons, Tile transitions overlay |
| `white` | `#ffffff` | `255, 255, 255` | Default Tile foreground and inner border |
| `black` | `#000000` | `0, 0, 0` | High-contrast foreground on `yellow` Tiles |

### Priority Color Mapping

Each Account maps up to 6 priority slots (`1` through `6`) to four visual channels: Background (`bg`), Foreground (`fg`), Inner Border (`bd`), and Outer Outline (`ot`).

| Priority Slot | Background (`bg`) | Foreground (`fg`) | Border (`bd`) | Outline (`ot`) |
| :--- | :--- | :--- | :--- | :--- |
| **Priority 1** | `red` (`#e51400`) | `white` | `white` | `red` |
| **Priority 2** | `orange` (`#fa6800`) | `white` | `white` | `orange` |
| **Priority 3** | `lightOlive` (`#78aa1c`) | `white` | `white` | `lightOlive` |
| **Priority 4** | `gray` (`#555555`) | `white` | `white` | `gray` |
| **Priority 5** | `cyan` (`#1ba1e2`) | `white` | `white` | `lightBlue` |
| **Priority 6** | `lightBlue` (`#4390df`) | `white` | `white` | `lightBlue` |

When sampling custom priorities from a JIRA server (`Settings.samplePriorityColors` in `src/app/lib/settings.ts`), Jironimo resolves colors in three steps:
1. **Semantic Name Match**: `blocker`/`highest`/`critical`/`p0` -> `red`; `high`/`major`/`p1` -> `orange`; `medium`/`normal`/`p2` -> `lightOlive`; `low`/`minor`/`p3` -> `gray`; `lowest`/`trivial`/`p4` -> `lightBlue`.
2. **Perceptual RGB Distance**: Parses JIRA's `statusColor` and selects the closest Metro swatch using weighted Euclidean RGB distance.
3. **Positional Gradient Fallback**: Distributes unrecognized priorities evenly across `['red', 'orange', 'amber', 'lightOlive', 'cyan', 'steel']`.

---

## 3. Typography

### Font Stacks
- **Standard UI (`--font-sans`)**: `"Segoe UI", "Open Sans", -apple-system, BlinkMacSystemFont, "Helvetica Neue", Arial, sans-serif`
- **Display & Headings (`--font-light`)**: `"Segoe UI Light", "Segoe UI", "Open Sans", -apple-system, BlinkMacSystemFont, sans-serif`
- **Monospace Code**: `Consolas, "Liberation Mono", Menlo, Courier, monospace`

### Type Scale

| Element | Font Stack | Size | Weight | Line Height | Usage & Styling |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `h1` | `--font-light` | `36px` | `300` | `40px` | Options page main title (`letter-spacing: -0.01em`, `margin-bottom: 18px`) |
| `h1 small` | `--font-light` | `18px` | `300` | `22px` | Inline subtitle beside `h1` (`color: #777777`, `margin-left: 8px`) |
| `h2` | `--font-light` | `21px` | `300` | `26px` | Section headers inside options tabs (`margin: 12px 0 8px`) |
| `h3` | `--font-light` | `18px` | `400` | `22px` | Sub-section headers |
| `h4` | `--font-light` | `15px` | `600` | `20px` | Card and modal titles (`margin-bottom: 6px`) |
| `h5` | `--font-sans` | `13px` | `600` | `18px` | Tile Issue key (`bold`, single-line truncated) |
| `h6` | `--font-sans` | `11px` | `600` | `16px` | Tile reporter name (`normal` weight on Tiles, `opacity: 0.9`) |
| `body` | `--font-sans` | `14px` | `400` | `1.42857` | Default application copy (`color: #1d1d1d`, antialiased) |
| `.tile p` | `--font-sans` | `12px` | `400` | `14px` | Tile Issue summary (`10px` / `12px` in `half` Tiles) |
| `div.tiles h3` | `--font-sans` | `11px` | `600` | `11px` | Rotated vertical Workspace title (`uppercase`, `letter-spacing: 0.06em`, `#444444`) |

---

## 4. Layout & Spatial Grids

### Popup Board (`src/views/index.html`)
- **Viewport (`body.metro`)**: `min-width: 552px`, `min-height: 120px`, `padding: 0 0 0 10px`.
- **Widget Container (`.container-widget`)**: `padding: 4px 16px 8px 16px`.
- **Top Toolbar (`#tiles-toolbar`)**: Fixed `34px` height header strip above the Tile grid:
  - **Account Switcher (`#account-switch`)**: Left-aligned (`left: 16px`, `top: 4px`, `width: 130px`, `height: 26px`).
  - **Workspace Switcher (`#home-workspaces`)**: Right-aligned (`right: 76px`, `top: 4px`, `gap: 3px`), rendering `28×26px` icon buttons for each Workspace plus the options shortcut.
  - **Page Limit Selector (`#limit-per-page`)**: Right-aligned (`right: 16px`, `top: 4px`, `height: 26px`).
- **Vertical Workspace Label (`div.tiles h3`)**: Anchored to the left margin (`left: -17px`, `top: 6px`), rotated `-90deg` from `top right` so the active Workspace name reads vertically alongside the Tiles.
- **Dense Tile Grid (`div.tiles`)**:
  - `display: grid`
  - `grid-template-columns: repeat(auto-fill, minmax(55px, 1fr))`
  - `grid-auto-rows: 55px`
  - `grid-auto-flow: dense`
  - `gap: 10px`

### Options Shell (`src/views/default.html`)
- **Outer Container (`.container-options`)**: Centered `1040px` fixed-width surface (`max-width: calc(100vw - 24px)`, `margin: 20px auto`, `padding: 20px`, `background: #ffffff`, `border: 1px solid #e2e2e2`, `box-shadow: 0 2px 10px rgba(0, 0, 0, 0.04)`).
- **Top-Right Navigation (`.container-options > .toolbar`)**: Floating icon button bar (`top: 20px`, `right: 20px`, `gap: 4px`). Each button measures `44×36px` (`font-size: 16px`). The active route is disabled and highlighted in `#008287`.
- **12-Column Layout Grid (`.grid .row`)**:
  - `display: grid; grid-template-columns: repeat(12, minmax(0, 1fr)); gap: 16px`
  - Column span utilities `.span1` through `.span12` map to `grid-column: span N / span N`.
  - `.offset1` shifts a column start via `grid-column-start: 2`.

---

## 5. Tile Anatomy & Sizing System

### Tile Dimensions

The popup grid is built on a `55px` base module with a `10px` gutter (`N * 55px + (N - 1) * 10px`):

| Size Class | Grid Span | Pixel Dimensions | Default Issue Types | Behavior Adjustments |
| :--- | :--- | :--- | :--- | :--- |
| `half` | `1 × 1` | `55 × 55 px` | User-configured compact types | Hides `h6` reporter and `.brand` footer; summary `p` clamps to 2 lines at `10px` |
| `default` | `2 × 2` | `120 × 120 px` | `task`, `sub-task`, `bug`, `improvement` | Standard square Tile |
| `double` | `4 × 2` | `250 × 120 px` | `story` | Wide rectangular Tile |
| `triple` | `6 × 2` | `380 × 120 px` | `epic` | Extra-wide rectangular Tile |
| `quadro` | `8 × 2` | `510 × 120 px` | Full-row banner types | Spans all 8 columns of the default popup width |

### Tile Regions (`src/views/tile/tile.html`)
1. **Frame & Borders (`.tile`)**:
   - `border: 2px solid` (controlled by priority `bd-*`, defaulting to `white`)
   - `outline: 1px solid` (controlled by priority `ol-*`)
   - **Hover State**: `outline: 3px solid rgba(0, 0, 0, 0.38)`
   - **Active Press**: `transform: scale(0.985)`
   - **Closed Issue State (`.tile.selected`)**: Displays a `28px` top-right `#4390df` diagonal corner ribbon (`::after`) overlaid with a white SVG checkmark (`::before`), and hides the status icon.
2. **Content Area (`.tile-content`)**:
   - `height: 93px`, `padding: 6px 8px 0`.
   - **Issue Key (`h5`)**: `13px` bold, single-line ellipsis (`padding-right: 18px` to clear the status icon).
   - **Reporter (`h6`)**: `11px` regular, `opacity: 0.9`, single-line ellipsis.
   - **Summary (`p`)**: `12px` (`line-height: 14px`), multi-line clamped to 4 lines (`-webkit-line-clamp: 4`, `max-height: 56px`).
   - **Ownership & Status Icon (`i.icon-*`)**: Top-right `14×14px` icon (`top: 6px`, `right: 6px`, `opacity: 0.85`). Shows `icon-user` if assigned to the current Account user, `icon-busy` if in progress, `icon-History` if reopened, or `icon-unlocked` if unassigned.
3. **Brand Footer (`.brand`)**:
   - Anchored at `bottom: 3px`, `left: 8px`, `right: 4px`.
   - **Standard Mode**: Displays the truncated Issue type name (`10px`, `opacity: 0.85`) and an optional `sup` remaining time estimate (`9px`, `margin-left: 3px`).
   - **Active Worklog Timer Mode**: Displays elapsed hours and minutes (`HH:MM`) alongside a `26×26px` `.badge.bg-lightRed` square in the bottom-right corner with `icon-play-alt`.
4. **Progress Strip (`.progress-bar`)**:
   - `3px` high strip anchored at `bottom: 0`, `left: 0`, `right: 0`, `background: rgba(0, 0, 0, 0.25)` with a `.fg-white` inner progress fill.
5. **Hover Action Toolbar (`src/views/tile/toolbar.html`)**:
   - Appears on hover (`height: 32px`, `padding: 3px 4px`, `background: rgba(0, 0, 0, 0.72)`), hiding `.tile-content` and `.brand`.
   - Contains compact `26×26px` `.p-button-sm` action buttons for transitions (`icon-list`), comment (`icon-comments-4`), self-assign (`icon-user-3`), log work (`icon-clock`), and starting/stopping the Worklog Timer (`icon-play-alt` / `icon-pause`).
6. **Transitions Overlay (`src/views/tile/transitions.html`)**:
   - Full-Tile overlay (`.transitions.bg-darker`, `#222222`, `z-index: 99`, `padding: 6px 26px 6px 8px`, scrollable) listing available JIRA workflow transitions in `12px` `.fg-orange` links, paired with a top-right `22×22px` `.bg-orange` close button (`×`).

---

## 6. Component & PrimeNG Token Specifications

### CSS Cascade Layers
`src/app/styles.css` enforces a five-layer cascade order so utility classes and component overrides remain deterministic:
```css
@layer theme, base, primeng, components, utilities;
```

### Buttons (`.p-button` & Legacy Metro Classes)
- **Dimensions**: `min-height: 32px`, `padding: 6px 12px`, `font-size: 13px`, `font-weight: 400`, `border-radius: 0`.
- **Small Variant (`.p-button-sm`, `.mini`)**: `min-height: 26px`, `padding: 3px 8px`, `font-size: 12px`.
- **Severities**:
  - **Primary / Default (`severity="primary"`, `.default`)**: Background `#008287`, text `#ffffff`, hover `#00aba9`.
  - **Secondary (`severity="secondary"`)**: Background `#e6e6e6`, border `#dadada`, text `#1d1d1d`, hover `#d4d4d4`.
  - **Info / Dark Blue (`severity="info"`, `.primary`, `.bg-fg-darkBlue`)**: Background `#16499a`, text `#ffffff`, hover `#0050ef`.
  - **Success (`severity="success"`, `.success`)**: Background `#60a917`, text `#ffffff`, hover `#7ad61d`.
  - **Danger (`severity="danger"`, `.danger`)**: Background `#e51400`, text `#ffffff`, hover `#a20025`.
  - **Contrast / Inverse (`severity="contrast"`, `.inverse`, `.active`)**: Background `#222222`, text `#ffffff`, hover `#3a3a3a`.
- **Active Press**: `transform: translateY(1px)`.
- **Disabled**: `background: #e6e6e6`, `border-color: #d9d9d9`, `color: #999999`, `cursor: not-allowed`.

### Inputs, Textareas & Selects (`.p-inputtext`, `.p-textarea`, `.p-select`)
- **Dimensions**: `height: 32px` (`min-height: 58px` for textareas), `padding: 4px 8px`, `font-size: 13px`, `border-radius: 0`.
- **Borders**: `1px solid #bababa`, hover `#787878`, focus `#008287` (`outline: none`, `box-shadow: none`).
- **Input Groups (`.p-inputgroup`, `.input-control`)**: Action addons (`.btn-clear`, `.btn-reveal`, `.p-inputgroupaddon`) sit flush inside or beside the input at `32×30px` with `#f3f3f3` background (`#e0e0e0` on hover).
- **Select Overlays (`.p-select-overlay`)**: `#ffffff` background, `1px solid #008287` border, `box-shadow: 0 4px 12px rgba(0, 0, 0, 0.16)`. Selected options use `#008287` background with `#ffffff` text.

### Toggle Switch (`p-toggleswitch`)
- **Track**: `2.75rem × 1.25rem` (`44×20px`), `border-radius: 0`.
  - Unchecked: `#a6a6a6` (or `#a20025` crimson when `.switch-disabled` is applied).
  - Checked: `#008287` (`#00aba9` on hover).
- **Handle**: Square `0.875rem × 0.875rem` (`14×14px`), `#ffffff`.

### Tabs (`p-tabs`, `p-tablist`, `p-tab`, `p-tabpanels`)
- **Tab List (`.p-tablist-tab-list`)**: `border-bottom: 2px solid #008287`, `gap: 3px`.
- **Tab Item (`.p-tab`)**: `padding: 7px 14px`, `background: #eeeeee`, `color: #333333`, `font-size: 13px`.
- **Active Tab (`.p-tab-active`)**: `background: #008287`, `color: #ffffff` (native sliding indicator bar `.p-tablist-active-bar` is hidden).
- **Tab Panels (`.p-tabpanels`)**: `border: 1px solid #e2e2e2`, `border-top: 0`, `padding: 20px`, `background: #ffffff`.

### Callouts, Notices & Status Bars
- **Notice Box (`.notice`)**: `padding: 14px 16px`, `border: 1px solid #dcdcdc`, `border-left: 4px solid #008287`, `background: #ffffff`. Adding `.marker-on-left` renders a left-pointing `#008287` triangle indicator.
- **Blockquote (`blockquote`)**: `padding: 8px 14px`, `border-left: 4px solid #008287`, `background: rgba(0, 130, 135, 0.04)`.
- **Info Label (`.label.info`)**: Inline square badge (`padding: 2px 6px`, `font-size: 11px`, `font-weight: 600`, `background: #1ba1e2`, `color: #ffffff`).
- **Full-Bleed Status Bars (`.info-bar`, `.error-bar`, `.warning-bar`)**:
  - Fixed bottom overlays (`left: 0`, `right: 0`, `bottom: 0`, `min-height: 56px`, `z-index: 1000`, `padding: 12px 16px`).
  - `.info-bar`: `#ffffff` background, `#1d1d1d` text, `2px solid #008287` top border.
  - `.error-bar`: `#a20025` crimson background, `#ffffff` text.
  - `.warning-bar`: `#fa6800` orange background, `#ffffff` text.

### Scrollbars
Custom WebKit scrollbars keep the popup compact:
- Width & height: `4px`
- Track: `rgba(0, 0, 0, 0.06)`
- Thumb: `#008287` (`#00aba9` on hover)

---

## 7. Iconography

### CSS Mask Architecture
All icons use `.icon-*` classes in `src/app/styles.css` rendered via inline SVG data URLs assigned to `--metro-icon`:
```css
[class^="icon-"], [class*=" icon-"] {
  display: inline-block;
  width: 1em;
  height: 1em;
  background-color: currentColor;
  -webkit-mask-image: var(--metro-icon);
  mask-image: var(--metro-icon);
  -webkit-mask-repeat: no-repeat;
  mask-repeat: no-repeat;
  -webkit-mask-position: center;
  mask-position: center;
  -webkit-mask-size: contain;
  mask-size: contain;
}
```
Because icons inherit `currentColor` and scale to `1em × 1em`, they automatically match parent text colors (`.fg-*`) and font sizes without separate sprite sheets or icon fonts.

### Core System Icons
- **Navigation & Options**: `icon-home` (Accounts & Workspaces), `icon-search` (JQL templates), `icon- droplet` (Priority colors), `icon-clock` (Worklog Timer), `icon-help` (About), `icon-cog` (Open Options from popup).
- **Tile Status & Actions**: `icon-user` (Assigned to me), `icon-user-3` (Assign to me action), `icon-busy` (In progress), `icon-History` (Reopened), `icon-unlocked` (Unassigned), `icon-list` (Workflow transitions), `icon-comments-4` (Add comment), `icon-play-alt` (Start Worklog Timer), `icon-pause` (Stop Worklog Timer).
- **Pagination & Controls**: `icon-arrow-left`, `icon-arrow-right`, `icon-plus-2`, `icon-minus-2`, `icon-remove`, `icon-floppy`, `icon-eye`, `icon-checkmark`, `icon-cancel-2`, `icon-warning`.
