# Loom DSL & Style Specification v1.0

**Version:** 1.0
**Date:** 2025-11-13
**Status:** Authoritative specification for v1 MVP
**Authors:** Loom Team

---

## Changelog

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2025-11-13 | Initial release: grammar, components, style system, performance constraints |

---

## Table of Contents

1. [Introduction](#introduction)
2. [Scope](#scope)
3. [DSL Grammar](#dsl-grammar)
   - [Line Syntax Structure](#line-syntax-structure)
   - [Placement Tokens](#placement-tokens)
   - [Alignment Tokens](#alignment-tokens)
   - [Property Tokens](#property-tokens)
4. [Component Catalog](#component-catalog)
   - [Container Components](#container-components)
   - [UI Components](#ui-components)
   - [Component Property Matrix](#component-property-matrix)
5. [Style System](#style-system)
   - [Style Block Structure](#style-block-structure)
   - [Selector Taxonomy](#selector-taxonomy)
   - [Selector Precedence](#selector-precedence)
   - [Style Declarations](#style-declarations)
   - [Variables](#variables)
   - [Skin System](#skin-system)
6. [Breakpoints](#breakpoints)
7. [Performance Constraints](#performance-constraints)
8. [Complete Examples](#complete-examples)
   - [Valid Examples](#valid-examples)
   - [Error Examples](#error-examples)
9. [AST Data Model](#ast-data-model)
10. [Error Handling](#error-handling)
11. [Decision Log](#decision-log)
12. [References](#references)

---

## Introduction

Loom is a domain-specific language (DSL) for creating UI mockups and wireframes with a text-first authoring experience. This specification defines the authoritative syntax, semantics, and constraints for Loom v1 MVP.

**Design Philosophy:**
- **Text-first**: Write layouts faster than dragging boxes
- **Grid-based**: 12-column grid system for structured layouts
- **Style-aware**: Separate content from presentation
- **Static**: No data-binding or interactivity in v1 (placeholder-only)
- **Export-friendly**: Generates clean SVG output

**Target Users:**
- Product designers creating wireframes
- Engineers prototyping UI layouts
- Technical writers documenting interfaces

---

## Scope

### In Scope (v1 MVP)
- Complete DSL grammar for layout and components
- Grid, stack, and card-based layouts
- 14 static UI components (text, button, input, etc.)
- Style system with selectors, variables, and two built-in skins
- Responsive breakpoints
- Performance targets for ≤300 node documents
- SVG rendering and export

### Out of Scope (Future Versions)
- Data binding and dynamic content
- User interaction and event handling
- Animation and transitions
- Custom components or plugins
- Backend integration or API calls
- Real-time collaboration

---

## DSL Grammar

### Line Syntax Structure

Every line in Loom follows this grammar:

```
<type> ["Label"]? [#id]? [.class*]? [@c<start> s<cols> r<row> rs<rows>]? [prop:value*]
```

**Components:**
1. `<type>` - Component type (required): `grid`, `card`, `button`, `input`, etc.
2. `"Label"` - Optional quoted string: display text or placeholder
3. `#id` - Optional unique identifier: `#submit`, `#nav`
4. `.class` - Zero or more class names: `.primary`, `.large`
5. Placement tokens - Grid positioning: `@c5 s4 r1 rs2`
6. Property tokens - Key-value pairs: `gap:2`, `tone:primary`, `grow`

**Example:**
```
button "Submit" #submit .primary @c9 s4 tone:brand grow
```

This creates a button with:
- Label: "Submit"
- ID: `submit`
- Class: `primary`
- Grid position: column 9, span 4 columns
- Tone: brand color
- Flex grow enabled

---

### Placement Tokens

Placement tokens control grid positioning. They only apply within `grid` containers.

| Token | Syntax | Description | Default | Example |
|-------|--------|-------------|---------|---------|
| **Column start** | `@c<n>` | Starting column position (1-indexed) | Auto (next available) | `@c5` = start at column 5 |
| **Column span** | `s<n>` | Number of columns to span | 1 | `s4` = span 4 columns |
| **Row start** | `r<n>` | Starting row position (1-indexed) | Auto (next available) | `r2` = start at row 2 |
| **Row span** | `rs<n>` | Number of rows to span | 1 | `rs3` = span 3 rows |

**Rules:**
- Column values must be between 1 and the grid's `cols` value (default: 12)
- Row values must be ≥ 1
- Spans must not exceed grid boundaries
- Auto-placement fills left-to-right, top-to-bottom when omitted

**Valid Examples:**
```
@c5 s4        → start col 5, span 4 cols; row auto
@c1 s12       → full-width (spans all 12 columns)
@c1 s12 r1 rs2 → header across top, 2 rows tall
r3            → auto column, explicit row 3
```

**Invalid Examples:**
```
@c13 s2       → ERROR: Column 13 exceeds grid cols (12)
s0            → ERROR: Span must be ≥ 1
@c10 s5       → ERROR: Span exceeds grid boundary (10+5-1 = 14 > 12)
```

---

### Alignment Tokens

Alignment tokens control content positioning within a component's bounds using the `at:` property.

**Syntax:**
```
at:<horizontal>/<vertical>
```

**Alignment Values:**

| Horizontal | Vertical | Description |
|------------|----------|-------------|
| `l` | `t` | Left / Top (default) |
| `c` | `m` | Center / Middle |
| `r` | `b` | Right / Bottom |
| `s` | `s` | Stretch / Stretch |

**Examples:**
```
at:c/m    → center horizontal, middle vertical
at:r/b    → right-aligned, bottom-aligned
at:s/s    → stretch both axes (fill container)
at:l/t    → left/top (same as default)
```

**Component Support:**
- Applies to: `hstack`, `vstack`, `zstack`, and text within any container
- Does not apply to: `grid` (uses placement tokens instead)

---

### Property Tokens

Property tokens modify component behavior and appearance.

| Property | Syntax | Type | Description | Valid Values | Example |
|----------|--------|------|-------------|--------------|---------|
| `gap` | `gap:<n>` | number | Spacing between children (in units) | 0-10 | `gap:2` |
| `pad` | `pad:<n>` | number | Internal padding (in units) | 0-10 | `pad:3` |
| `w` | `w:<n>` | number | Width (in pixels or units) | >0 | `w:200` |
| `h` | `h:<n>` | number | Height (in pixels or units) | >0 | `h:100` |
| `grow` | `grow` | boolean | Flex grow (expands to fill space) | - | `grow` |
| `shrink` | `shrink` | boolean | Flex shrink (contracts if needed) | - | `shrink` |
| `radius` | `radius:<n>` | number | Corner radius (in pixels) | 0-24 | `radius:12` |
| `tone` | `tone:<name>` | string | Semantic color/style variant | `primary`, `ghost`, `brand`, `danger` | `tone:primary` |
| `type` | `type:<name>` | string | Component variant | Component-specific | `type:password` |
| `cols` | `cols:<n>` | number | Grid column count | 1-24 | `cols:12` |
| `at` | `at:<h>/<v>` | string | Alignment (horizontal/vertical) | See alignment tokens | `at:c/m` |

**Units:**
- Numbers without suffix use the spacing unit (`u`, default 8px)
- `gap:2` = 2 × 8px = 16px spacing
- Explicit pixel values: `w:200` = 200px width

---

## Component Catalog

Loom v1 provides 14 components organized into containers and UI elements.

### Container Components

Containers organize child components with layout rules.

#### `grid`

**Description:** 12-column grid system (default) for structured layouts.

**Syntax:**
```
grid [cols:<n>] [gap:<n>] [pad:<n>]
  <children>
```

**Properties:**
- `cols` - Number of columns (default: 12, range: 1-24)
- `gap` - Spacing between grid cells (default: 0)
- `pad` - Internal padding (default: 0)

**Children:** Any component with optional placement tokens (`@c`, `s`, `r`, `rs`)

**Example:**
```
grid cols:12 gap:2 pad:3
  card "Header" @c1 s12
  card "Content" @c1 s8
  card "Sidebar" @c9 s4
```

---

#### `hstack`

**Description:** Horizontal stack (flexbox row) for linear horizontal layouts.

**Syntax:**
```
hstack [gap:<n>] [pad:<n>] [at:<h>/<v>]
  <children>
```

**Properties:**
- `gap` - Spacing between children (default: 0)
- `pad` - Internal padding (default: 0)
- `at` - Alignment (default: `l/t`)

**Children:** Any component; supports `grow` and `shrink` on children

**Example:**
```
hstack gap:1 at:c/m
  button "Cancel" tone:ghost
  button "Submit" tone:primary grow
```

---

#### `vstack`

**Description:** Vertical stack (flexbox column) for linear vertical layouts.

**Syntax:**
```
vstack [gap:<n>] [pad:<n>] [at:<h>/<v>]
  <children>
```

**Properties:**
- `gap` - Spacing between children (default: 0)
- `pad` - Internal padding (default: 0)
- `at` - Alignment (default: `l/t`)

**Children:** Any component; supports `grow` and `shrink` on children

**Example:**
```
vstack gap:2 pad:3
  text "Welcome back"
  input "Email"
  input "Password" type:password
  button "Sign in" tone:primary
```

---

#### `zstack`

**Description:** Layered stack (z-axis) for overlapping content.

**Syntax:**
```
zstack [pad:<n>]
  <children>
```

**Properties:**
- `pad` - Internal padding (default: 0)

**Children:** Any component; later children render on top

**Example:**
```
zstack
  image "Background"
  card "Overlay" pad:3
    text "Floating content"
```

---

#### `section`

**Description:** Semantic grouping container without visual styling.

**Syntax:**
```
section ["Label"] [gap:<n>] [pad:<n>]
  <children>
```

**Properties:**
- Label - Optional section title
- `gap` - Spacing between children (default: 0)
- `pad` - Internal padding (default: 0)

**Children:** Any component

**Example:**
```
section "User Settings" gap:2 pad:2
  text "Profile Information"
  input "Name"
  input "Email"
```

---

#### `card`

**Description:** Elevated card container with optional border and shadow.

**Syntax:**
```
card ["Label"] [gap:<n>] [pad:<n>] [radius:<n>] [tone:<name>]
  <children>
```

**Properties:**
- Label - Optional card title
- `gap` - Spacing between children (default: 0)
- `pad` - Internal padding (default: 2)
- `radius` - Corner radius (default: 12)
- `tone` - Color variant (default: `surface`)

**Children:** Any component

**Example:**
```
card "Dashboard" pad:3 radius:12
  text "Welcome back, User"
  hstack gap:1
    button "Action 1"
    button "Action 2"
```

---

### UI Components

UI components are leaf nodes (no children in v1 MVP).

#### `text`

**Description:** Text label or paragraph.

**Syntax:**
```
text "Content" [#id] [.class*] [at:<h>/<v>]
```

**Properties:**
- Label - Text content (required)
- `at` - Alignment within container (default: `l/t`)

**Example:**
```
text "Welcome to Loom" .heading
text "Create wireframes with text" at:c/m
```

---

#### `input`

**Description:** Text input field with optional placeholder.

**Syntax:**
```
input "Placeholder" [#id] [.class*] [type:<variant>]
```

**Properties:**
- Label - Placeholder text (required)
- `type` - Input variant: `text` (default), `password`, `email`, `number`

**Example:**
```
input "Email address" #email type:email
input "Password" #password type:password
```

---

#### `button`

**Description:** Button element with label.

**Syntax:**
```
button "Label" [#id] [.class*] [tone:<variant>] [grow] [shrink]
```

**Properties:**
- Label - Button text (required)
- `tone` - Style variant: `primary`, `ghost`, `brand`, `danger` (default: `primary`)
- `grow` - Expand to fill available space
- `shrink` - Contract if space is limited

**Example:**
```
button "Submit" #submit tone:primary grow
button "Cancel" tone:ghost
```

---

#### `image`

**Description:** Image placeholder (v1: static placeholder only, no external URLs).

**Syntax:**
```
image "Alt text" [#id] [.class*] [w:<n>] [h:<n>]
```

**Properties:**
- Label - Alt text / description (required)
- `w` - Width in pixels (optional)
- `h` - Height in pixels (optional)

**Rendering:** Displays as a gray box with alt text label (aspect ratio preserved if w/h specified)

**Example:**
```
image "Product screenshot" w:400 h:300
```

---

#### `icon`

**Description:** Icon element (v1: labeled placeholder box, no icon set loaded).

**Syntax:**
```
icon "Icon name" [#id] [.class*]
```

**Properties:**
- Label - Icon name / description (required)

**Rendering:** Displays as a small labeled box (24×24px default)

**Future:** May integrate Hugeicons or similar icon set in v2

**Example:**
```
icon "search" .header-icon
icon "settings"
```

---

#### `spacer`

**Description:** Empty space or divider for layout control.

**Syntax:**
```
spacer [h:<n>] [w:<n>]
```

**Properties:**
- `h` - Height in pixels (for vertical spacing)
- `w` - Width in pixels (for horizontal spacing)

**Example:**
```
vstack gap:0
  text "Section 1"
  spacer h:24
  text "Section 2"
```

---

#### `list`

**Description:** Static list (v1: placeholder with label count, no item definition).

**Syntax:**
```
list "List title" [#id] [.class*]
```

**Properties:**
- Label - List title (required)

**Rendering:** Displays as labeled box suggesting list structure (3-5 placeholder items)

**Future:** v2 may add item syntax

**Example:**
```
list "Recent Items" #recent
```

---

#### `tabs`

**Description:** Static tab control (v1: placeholder with label, no tab definitions).

**Syntax:**
```
tabs "Tab group" [#id] [.class*]
```

**Properties:**
- Label - Tab group name (required)

**Rendering:** Displays as labeled box with 2-4 placeholder tab headers

**Future:** v2 may add tab item syntax and selection state

**Example:**
```
tabs "Settings tabs" #settings-nav
```

---

### Component Property Matrix

| Component | Label | `#id` | `.class` | Placement (`@c`, `s`, etc.) | `gap` | `pad` | `w` / `h` | `grow` / `shrink` | `tone` | `type` | `at` | `radius` | `cols` | Children |
|-----------|-------|-------|----------|----------------------------|-------|-------|-----------|-------------------|--------|--------|------|----------|--------|----------|
| `grid` | ✗ | ✓ | ✓ | ✗ | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✓ | ✓ |
| `hstack` | ✗ | ✓ | ✓ | ✓ | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ | ✓ | ✗ | ✗ | ✓ |
| `vstack` | ✗ | ✓ | ✓ | ✓ | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ | ✓ | ✗ | ✗ | ✓ |
| `zstack` | ✗ | ✓ | ✓ | ✓ | ✗ | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✓ |
| `section` | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✓ |
| `card` | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✗ | ✗ | ✓ | ✗ | ✗ | ✓ | ✗ | ✓ |
| `text` | ✓ (req) | ✓ | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✓ | ✗ | ✗ | ✗ |
| `input` | ✓ (req) | ✓ | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ | ✓ | ✗ | ✗ | ✗ | ✗ |
| `button` | ✓ (req) | ✓ | ✓ | ✓ | ✗ | ✗ | ✗ | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ |
| `image` | ✓ (req) | ✓ | ✓ | ✓ | ✗ | ✗ | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ |
| `icon` | ✓ (req) | ✓ | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ |
| `spacer` | ✗ | ✓ | ✓ | ✓ | ✗ | ✗ | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ |
| `list` | ✓ (req) | ✓ | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ |
| `tabs` | ✓ (req) | ✓ | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ |

**Legend:**
- ✓ = Supported
- ✗ = Not supported
- (req) = Required property

---

## Style System

The style system separates presentation from content using CSS-like selectors and declarations.

### Style Block Structure

**Syntax:**
```
style <selector> {
  <declaration>: <value>;
  ...
}
```

**Global Defaults:**
```
style default {
  skin: clean              // Visual theme: 'clean' or 'sketch'
  font: ui-sans            // Font family (maps to system font stack)
  u: 8                     // Spacing unit in pixels

  // Color tokens
  color.brand: #6D28D9
  color.text: #111827
  color.stroke: #D1D5DB
  color.surface: #FFFFFF

  // Radius tokens
  radius.card: 12
  radius.ctrl: 8

  // Shadow tokens
  shadow.card: soft        // 'soft', 'medium', 'hard', or 'none'
}
```

**Multiple Blocks:**
- Multiple style blocks allowed
- Later declarations override earlier ones (cascade)
- Specificity determines precedence when selectors conflict

---

### Selector Taxonomy

Selectors target components for styling.

| Selector Type | Syntax | Specificity | Description | Example |
|---------------|--------|-------------|-------------|---------|
| **Default** | `default` | 0 | Global defaults | `style default { ... }` |
| **Type** | `type(<name>)` | 1 | Matches component type | `style type(card) { ... }` |
| **Class** | `.<classname>` | 10 | Matches class attribute | `style .primary { ... }` |
| **ID** | `#<id>` | 100 | Matches id attribute | `style #submit { ... }` |

**Examples:**
```
style default {
  color.text: #111827
}

style type(card) {
  fill: surface;
  stroke: stroke;
  radius: 12
}

style .primary {
  tone: brand;
  stroke: brand
}

style #submit {
  fill: brand;
  text: white
}
```

---

### Selector Precedence

When multiple selectors match a component, declarations are applied in specificity order:

**Precedence (lowest to highest):**
1. **Default** (specificity: 0)
2. **Type** (specificity: 1)
3. **Class** (specificity: 10)
4. **ID** (specificity: 100)

**Tie-breaking:**
- If specificity is equal, later declarations override earlier ones (insertion order)
- Multiple classes on a component: all matching class rules apply (merged by insertion order)

**Example:**
```
// Component:
button "Submit" #submit .primary .large

// Matching styles (applied in order):
style default { tone: ghost }           // Specificity: 0
style type(button) { stroke: stroke }   // Specificity: 1
style .primary { tone: brand }          // Specificity: 10
style .large { pad: 3 }                 // Specificity: 10 (later in source)
style #submit { fill: brand }           // Specificity: 100

// Effective styles:
// tone: brand (from .primary, overrides default)
// stroke: stroke (from type(button))
// pad: 3 (from .large)
// fill: brand (from #submit, highest precedence)
```

---

### Style Declarations

Style declarations define visual properties.

| Declaration | Values | Description | Example |
|-------------|--------|-------------|---------|
| `skin` | `clean`, `sketch` | Visual theme | `skin: clean` |
| `font` | font-family | Typography (system font stack) | `font: ui-sans` |
| `u` | number | Spacing unit in pixels | `u: 8` |
| `fill` | color token / hex | Background fill color | `fill: #FFFFFF` |
| `stroke` | color token / hex | Border/outline color | `stroke: #D1D5DB` |
| `text` | color token / hex | Text color | `text: #111827` |
| `radius` | number | Corner radius in pixels | `radius: 12` |
| `shadow` | `soft`, `medium`, `hard`, `none` | Shadow intensity | `shadow: soft` |
| `tone` | `brand`, `primary`, `ghost`, `danger` | Semantic color variant | `tone: primary` |
| `gap` | number | Spacing between children (in units) | `gap: 2` |
| `pad` | number | Internal padding (in units) | `pad: 3` |

**Color Tokens:**
- `brand` - Primary brand color
- `text` - Body text color
- `stroke` - Border/divider color
- `surface` - Background surface color

**Referencing Tokens:**
```
style default {
  color.brand: #6D28D9
}

style type(card) {
  fill: surface;        // References color.surface
  stroke: stroke        // References color.stroke
}
```

---

### Variables

Variables allow reusable values across style declarations.

**Syntax:**
```
let <name> = <value>

style <selector> {
  <property>: $<name>
}
```

**Examples:**
```
let primaryGap = 2
let accentColor = #6D28D9

style default {
  gap: $primaryGap;
  color.brand: $accentColor
}

style type(card) {
  pad: $primaryGap
}
```

**Rules:**
- Variables defined with `let` keyword
- Referenced with `$` prefix
- Scoped to the style block or globally if outside blocks
- Undefined variable usage: parser error

**Supported Value Types:**
- Numbers: `let gap = 2`
- Units: `let spacing = 3u` (3 × spacing unit)
- Colors: `let brandColor = #6D28D9`
- Strings: `let fontFamily = ui-sans`

**v1 Limitation:** Variables cannot reference other variables (no nesting)

---

### Skin System

Skins define cohesive visual themes. v1 provides two built-in skins.

#### Built-in Skins

**1. Clean (Default)**

Modern, polished aesthetic:
```
skin: clean

Palette:
- surface: #FFFFFF (white background)
- text: #111827 (dark gray text)
- stroke: #D1D5DB (light gray borders)
- brand: #6D28D9 (purple accent)

Typography:
- font: ui-sans (system font stack: -apple-system, Segoe UI, Roboto)

Borders:
- Solid strokes (1px width)
- Subtle: #D1D5DB

Shadows:
- soft: 0 1px 3px rgba(0,0,0,0.1)
- medium: 0 4px 6px rgba(0,0,0,0.1)
- hard: 0 10px 15px rgba(0,0,0,0.2)

Radii:
- card: 12px
- ctrl: 8px (buttons, inputs)
```

**2. Sketch**

Hand-drawn, wireframe aesthetic:
```
skin: sketch

Palette:
- Same as clean (overridable)

Typography:
- font: ui-sans (can be overridden to handwriting font)

Borders:
- Dashed strokes: dash pattern [4, 4]
- Stroke width: 1.5px
- Path jitter: slight organic deviation (±1-2px)

Shadows:
- Minimal or none (sketch aesthetic)

Radii:
- Hand-drawn corners (approximated via SVG path jitter)
- Organic, imperfect curves

Rendering:
- SVG paths with slight randomization for organic feel
- Roughened edges on rectangles and cards
```

**Switching Skins:**
```
style default {
  skin: sketch
}
```

**Skin Token Overrides:**
```
style default {
  skin: sketch;
  color.brand: #E63946;     // Override brand color for sketch skin
  stroke.width: 2           // Thicker sketch strokes
}
```

---

## Breakpoints

Breakpoints enable responsive layouts based on viewport width.

**Syntax:**
```
when <operator><width> {
  <nodes or style overrides>
}
```

**Operators:**
- `<` - Less than
- `<=` - Less than or equal
- `>=` - Greater than or equal
- `>` (implied) - Greater than

**Width Units:** Pixels (px assumed if no unit specified)

**Examples:**

**Mobile Layout:**
```
when <600 {
  vstack gap:2 pad:2
    card "Header"
    card "Content"
    card "Footer"
}
```

**Desktop Layout:**
```
when >=1024 {
  grid cols:12 gap:2
    card "Header" @c1 s12
    card "Content" @c1 s8
    card "Sidebar" @c9 s4
}
```

**Multiple Breakpoints:**
```
when <600 {
  vstack gap:1
    text "Mobile" at:c/m
}

when >=600 <1024 {
  hstack gap:2
    text "Tablet"
}

when >=1024 {
  grid cols:12 gap:3
    text "Desktop" @c1 s12
}
```

**Rules:**
- Multiple breakpoint blocks allowed
- Last matching block wins (based on current viewport width)
- Evaluates on viewport/panel resize
- Updates debounced (120-160ms) to avoid thrashing
- Parser warning for overlapping or ambiguous conditions

**Behavior:**
- Breakpoint blocks can contain full node trees or style overrides
- Nodes in breakpoint blocks replace base layout nodes (not merged)
- Style declarations in breakpoint blocks merge with base styles (cascade)

---

## Performance Constraints

Loom v1 is optimized for documents with ≤300 nodes. Performance targets ensure fast parsing, layout, and rendering.

### Performance Targets

| Metric | Target | Context |
|--------|--------|---------|
| **Parse + Layout + Render (P95)** | < 200ms | Modern laptop, ≤300 nodes |
| **SVG Render Time** | < 16ms | 300 nodes (60fps target) |
| **Node Limit** | 300 nodes | Parser warning beyond this count |
| **Re-render Debounce** | 120-160ms | Input debounce window |
| **Incremental Parse** | < 50ms | Changed ranges only (≤20 nodes) |

### Constraints

**Node Count:**
- Warning issued for documents >300 nodes
- Performance degradation expected >500 nodes
- Hard limit: 1000 nodes (parser error)

**Grid Complexity:**
- Maximum grid columns: 24
- Maximum explicit row: 100
- Placement tokens validated for boundary violations

**Nesting Depth:**
- Maximum nesting: 10 levels
- Warning at 8+ levels
- Performance impact for deep trees

**Style Rules:**
- Maximum style blocks: 100
- Maximum selectors per block: 50
- Variable resolution: single pass (no circular refs)

### Optimization Strategies

**Parser:**
- Incremental parsing (diff by changed ranges)
- Token stream with lookahead
- Early exit on syntax errors

**Layout Engine:**
- Memoization by node ID + props signature
- Avoid full re-layout on style-only changes
- Grid resolver caches column arithmetic

**Renderer:**
- RequestAnimationFrame batching
- Avoid recreating large SVG trees
- Reuse SVG defs (gradients, filters)
- Prefer CSS classes over inline styles

**Monitoring:**
- Performance telemetry for parse/layout/render times
- Node count tracking
- Warnings surfaced in editor diagnostics

---

## Complete Examples

### Valid Examples

#### Example 1: Login Form

```
grid cols:12 gap:2 pad:3
  card "Sign in" @c5 s4 rs3 pad:3
    input "Email" #email type:email
    input "Password" #password type:password
    hstack gap:1
      button "Sign in" #submit tone:primary grow
      button "Forgot?" tone:ghost

style default {
  skin: clean
  color.brand: #6D28D9
  radius.card: 12
}

style type(card) {
  fill: surface;
  stroke: stroke
}

style #submit {
  fill: brand;
  text: white
}
```

**Rendered Output:**
- 12-column grid with centered card (cols 5-8, spans 4 columns, 3 rows tall)
- Card contains email input, password input, and button row
- Primary button expands to fill space, ghost button stays minimal
- Clean skin with brand accent color

---

#### Example 2: Dashboard Layout

```
grid cols:12 gap:2 pad:2
  card "Dashboard" #header @c1 s12 pad:2
    text "Welcome back, User" .heading

  card "Recent Activity" @c1 s8 r2 rs4 pad:3
    list "Activity List" #activity

  card "Quick Actions" @c9 s4 r2 rs2 pad:2
    vstack gap:1
      button "New Item" tone:primary
      button "Settings" tone:ghost

  card "Stats" @c9 s4 r4 rs2 pad:2
    text "Statistics placeholder"

style default {
  skin: clean
  u: 8
  color.brand: #6D28D9
  color.text: #111827
}

style .heading {
  text: brand
}

style type(card) {
  fill: surface;
  stroke: stroke;
  shadow: soft
}
```

**Rendered Output:**
- Full-width header card across top
- Main content area (cols 1-8, rows 2-5) with activity list
- Right sidebar (cols 9-12) with quick actions (rows 2-3) and stats (rows 4-5)
- Clean skin with soft shadows on cards

---

#### Example 3: Responsive Layout

```
// Mobile (< 600px)
when <600 {
  vstack gap:2 pad:2
    card "Mobile Header" pad:2
      text "App Name" at:c/m
    card "Content" pad:3
      text "Mobile content here"
    hstack gap:1
      button "Action 1" grow
      button "Action 2" grow
}

// Desktop (>= 600px)
when >=600 {
  grid cols:12 gap:3 pad:3
    card "Desktop Header" @c1 s12 pad:2
      text "Application Name" .heading
    card "Main Content" @c1 s8 r2 pad:3
      text "Desktop content with more space"
    card "Sidebar" @c9 s4 r2 pad:2
      vstack gap:1
        button "Action 1"
        button "Action 2"
}

style default {
  skin: clean
}

style .heading {
  text: brand
}
```

**Behavior:**
- Viewport < 600px: stacked vertical layout
- Viewport ≥ 600px: grid layout with sidebar
- Breakpoint switching on resize (debounced)

---

#### Example 4: Card Gallery

```
grid cols:12 gap:3 pad:3
  card "Product 1" @c1 s4 pad:2
    image "Product image" w:200 h:200
    text "Product Name" .product-title
    button "View" tone:primary

  card "Product 2" @c5 s4 pad:2
    image "Product image" w:200 h:200
    text "Product Name" .product-title
    button "View" tone:primary

  card "Product 3" @c9 s4 pad:2
    image "Product image" w:200 h:200
    text "Product Name" .product-title
    button "View" tone:primary

style default {
  skin: clean
  radius.card: 16
}

style .product-title {
  text: text
}

style type(card) {
  fill: surface;
  stroke: stroke;
  shadow: medium
}
```

**Rendered Output:**
- 3-column product grid
- Each card contains image placeholder, title, and action button
- Medium shadow for elevated card appearance

---

### Error Examples

#### Error 1: Syntax Error - Unterminated String

**Invalid:**
```
card "Missing closing quote
  text "Content"
```

**Error:**
```
ParseError {
  code: "E001_UNTERMINATED_STRING",
  severity: "error",
  message: "Unterminated string literal",
  line: 1,
  col: 6,
  hint: "Add closing quote: card \"Missing closing quote\""
}
```

---

#### Error 2: Semantic Error - Duplicate ID

**Invalid:**
```
grid cols:12
  button "Submit" #submit
  button "Cancel" #submit
```

**Error:**
```
ParseError {
  code: "E201_DUPLICATE_ID",
  severity: "error",
  message: "Duplicate ID '#submit' found",
  line: 3,
  col: 19,
  hint: "IDs must be unique across the document. Consider using classes instead."
}
```

---

#### Error 3: Layout Error - Placement Out of Bounds

**Invalid:**
```
grid cols:12
  card "Overflow" @c10 s5
```

**Error:**
```
ParseError {
  code: "E301_PLACEMENT_OUT_OF_BOUNDS",
  severity: "error",
  message: "Column span exceeds grid boundary (10 + 5 - 1 = 14 > 12)",
  line: 2,
  col: 19,
  hint: "Reduce span to 's3' or start at earlier column"
}
```

---

#### Error 4: Style Error - Undefined Variable

**Invalid:**
```
style default {
  gap: $undefinedVar
}
```

**Error:**
```
ParseError {
  code: "E401_UNDEFINED_VARIABLE",
  severity: "error",
  message: "Variable '$undefinedVar' is not defined",
  line: 2,
  col: 8,
  hint: "Define variable with: let undefinedVar = <value>"
}
```

---

#### Error 5: Performance Warning - Node Count Exceeded

**Invalid:**
```
grid cols:12
  // ... 350 nodes total ...
```

**Warning:**
```
ParseError {
  code: "W501_NODE_COUNT_EXCEEDED",
  severity: "warning",
  message: "Document contains 350 nodes (recommended max: 300)",
  line: 1,
  col: 1,
  hint: "Consider splitting into multiple layouts or simplifying structure"
}
```

---

#### Error 6: Invalid Component Property

**Invalid:**
```
text "Hello" gap:2
```

**Error:**
```
ParseError {
  code: "E101_INVALID_PROPERTY",
  severity: "error",
  message: "Property 'gap' is not valid for component type 'text'",
  line: 1,
  col: 14,
  hint: "Valid properties for 'text': #id, .class, at:<h>/<v>"
}
```

---

#### Error 7: Invalid Placement Token Usage

**Invalid:**
```
hstack gap:2
  button "Test" @c5 s2
```

**Error:**
```
ParseError {
  code: "E302_INVALID_PLACEMENT_CONTEXT",
  severity: "error",
  message: "Placement tokens (@c, s, r, rs) only valid within 'grid' containers",
  line: 2,
  col: 17,
  hint: "Remove placement tokens or use a 'grid' parent instead of 'hstack'"
}
```

---

#### Error 8: Overlapping Grid Placements

**Invalid:**
```
grid cols:12
  card "A" @c1 s6 r1 rs2
  card "B" @c3 s4 r1 rs2
```

**Warning:**
```
ParseError {
  code: "W303_OVERLAPPING_PLACEMENTS",
  severity: "warning",
  message: "Card 'B' overlaps with card 'A' (cols 3-6, rows 1-2)",
  line: 3,
  col: 3,
  hint: "Adjust placement to avoid overlap or rely on auto-placement"
}
```

---

## AST Data Model

The Abstract Syntax Tree (AST) represents the parsed Loom document structure.

### Node Structure

```typescript
type Node = {
  type: string;                  // Component type: 'grid', 'card', 'button', etc.
  id?: string;                   // From #id token
  classes?: string[];            // From .class tokens
  label?: string;                // From "Label" string
  place?: PlacementTokens;       // Grid placement (only for grid children)
  props?: Record<string, any>;   // Properties: gap, pad, tone, etc.
  children?: Node[];             // Child nodes (for containers)
};

type PlacementTokens = {
  c?: number;                    // Column start (@c)
  s?: number;                    // Column span (s)
  r?: number;                    // Row start (r)
  rs?: number;                   // Row span (rs)
};
```

### Style Rule Structure

```typescript
type StyleRule = {
  selector: Selector;            // Selector definition
  declarations: Record<string, any>;  // Style declarations
};

type Selector =
  | { type: 'default' }
  | { type: 'type', name: string }
  | { type: 'class', name: string }
  | { type: 'id', name: string };
```

### Document Structure

```typescript
type Document = {
  version: string;               // Spec version: '1.0'
  nodes: Node[];                 // Root-level nodes
  styles: StyleRule[];           // Style blocks
  variables: Record<string, any>; // Let variables
  breakpoints?: Breakpoint[];    // Responsive breakpoints
};

type Breakpoint = {
  condition: string;             // '<600', '>=1024', etc.
  nodes?: Node[];                // Alternative node tree
  styles?: StyleRule[];          // Override styles
};
```

### Example AST

**Source:**
```
grid cols:12 gap:2
  card "Header" @c1 s12 pad:2
    text "Welcome" .heading

style .heading {
  text: brand
}
```

**AST:**
```json
{
  "version": "1.0",
  "nodes": [
    {
      "type": "grid",
      "props": { "cols": 12, "gap": 2 },
      "children": [
        {
          "type": "card",
          "label": "Header",
          "place": { "c": 1, "s": 12 },
          "props": { "pad": 2 },
          "children": [
            {
              "type": "text",
              "label": "Welcome",
              "classes": ["heading"]
            }
          ]
        }
      ]
    }
  ],
  "styles": [
    {
      "selector": { "type": "class", "name": "heading" },
      "declarations": { "text": "brand" }
    }
  ],
  "variables": {},
  "breakpoints": []
}
```

---

## Error Handling

Loom provides structured diagnostics for syntax, semantic, and performance issues.

### Error Format

```typescript
type Diagnostic = {
  code: string;                  // Error/warning code (e.g., 'E001', 'W501')
  severity: 'error' | 'warning' | 'info';
  message: string;               // Human-readable description
  line: number;                  // Line number (1-indexed)
  col: number;                   // Column number (1-indexed)
  hint?: string;                 // Suggested fix
};
```

### Error Categories

| Code Prefix | Category | Description |
|-------------|----------|-------------|
| `E001-E099` | Syntax Errors | Malformed tokens, unterminated strings, invalid characters |
| `E101-E199` | Property Errors | Invalid properties, wrong value types, out-of-range values |
| `E201-E299` | Semantic Errors | Duplicate IDs, undefined references, type mismatches |
| `E301-E399` | Layout Errors | Placement out of bounds, overlaps, invalid nesting |
| `E401-E499` | Style Errors | Undefined variables, invalid selectors, unknown tokens |
| `W501-W599` | Performance Warnings | Node count exceeded, deep nesting, complex layouts |
| `W601-W699` | Best Practice Warnings | Unused IDs, redundant styles, accessibility hints |

### Error Recovery

**Best-Effort Parsing:**
- Parser attempts to continue after errors
- Partial AST returned with error nodes marked
- Maximum 10 errors reported per parse (avoid flooding)

**Fallback Rendering:**
- Errors render as placeholder boxes with error message
- Document still renderable despite errors
- Diagnostics panel shows all errors/warnings

**Validation Modes:**
- **Strict:** Fail on any error (for CI/CD)
- **Permissive:** Warn but continue (for live editing)

---

## Decision Log

This section records decisions made during specification development.

| Decision | Rationale | Date | Alternatives Considered |
|----------|-----------|------|-------------------------|
| **Grid is 1-indexed** | Aligns with common design tool conventions (Figma, Sketch) | 2025-11-13 | 0-indexed (programmer convention) |
| **ID selector has highest specificity** | Matches CSS specificity model for familiarity | 2025-11-13 | All selectors equal (insertion order only) |
| **No variable nesting in v1** | Simplifies parser and avoids circular reference issues | 2025-11-13 | Full variable expressions (deferred to v2) |
| **Icon and image are placeholders only** | Avoids security complexity (external URLs) in MVP | 2025-11-13 | Built-in icon set (Hugeicons) - roadmapped for v2 |
| **List and tabs are static (no item syntax)** | Reduces scope for v1; item definition complex | 2025-11-13 | Full list/tab item syntax (deferred to v2) |
| **Node limit: 300 (warning), 1000 (error)** | Based on performance testing; 300 = <200ms target | 2025-11-13 | 500 warning, unlimited max |
| **Breakpoints replace nodes, merge styles** | Clear behavior: layout is swapped, styles cascade | 2025-11-13 | Merge both nodes and styles (ambiguous) |
| **Spacing unit default: 8px** | Standard 8px grid system (common in design systems) | 2025-11-13 | 4px (too granular), 16px (too coarse) |
| **Two skins only (clean, sketch)** | Covers primary use cases; extensible in v2 | 2025-11-13 | 5+ skins (scope creep), single skin (too limited) |
| **Tie-breaking: insertion order** | Simple, predictable, matches CSS cascade | 2025-11-13 | Source line number (fragile to edits) |

---

## References

- [PRD.md §6 Requirements](../prd/PRD.md#6-requirements)
- [DEV_PLAN.md §17 Week-by-Week Timeline](../dev-plan/DEV_PLAN.md#17-week-by-week-timeline)
- [T-001 Ticket](../tickets/T-001-finalize-dsl-style-spec.md)

---

**End of Specification v1.0**
