---
version: alpha
name: Kicap
description: |
  KICAP's design system embodies premium minimalism with a technology-forward
  aesthetic. The visual language prioritizes clarity and craftsmanship,
  reflecting the brand's position as a curated marketplace for mechanical
  keyboards and input devices. A refined neutral palette anchors the experience,
  while carefully placed accent colors—warm oranges and deep blues—inject
  personality and guide user attention. The typography employs generous tracking
  and a bold, geometric display scale that commands space on hero moments,
  creating a confident, editorial feel. Rounded corners are deployed selectively
  rather than uniformly, establishing a modern yet grounded sensibility that
  respects both content and whitespace.
source:
  url: "https://kicap.vn/"
  pagesAnalyzed: 1
  extractedAt: 2026-10-01
  tokensMeasured: true
colors:
  primary: "#111315"
  accent: "#0657A3"
  canvas: "#F6F6F2"
  surface: "#FFFEFA"
  ink: "#66655F"
  body: "#85827B"
  hairline: "#D9D5CC"
  error: "#AD4650"
  success: "#2F7955"
  warning: "#A86B18"
  info: "#A95029"
  accent-1: "#E07A43"
  accent-2: "#F8ECD6"
  neutral-1: "#E2F0E8"
  neutral-2: "#F7E1E3"
typography:
  display-xl:
    fontFamily: Inter
    fontSize: 75.6px
    fontWeight: 700
    lineHeight: 0.98
    letterSpacing: -4.54px
  display-lg:
    fontFamily: Inter
    fontSize: 46.08px
    fontWeight: 700
    lineHeight: 1.04
    letterSpacing: -2.07px
  heading-md:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: 700
    lineHeight: 1.04
    letterSpacing: -0.9px
  heading-sm:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: 0.18px
  heading-xs:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: 1.44px
    textTransform: uppercase
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: 0px
  body-md-loose:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: 400
    lineHeight: 1.65
    letterSpacing: 0px
  body-sm:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: 0.14px
  body-sm-tight:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: 700
    lineHeight: 1.5
    letterSpacing: 0px
  body-xs:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: 400
    lineHeight: 1.65
    letterSpacing: 0px
  body-xs-strong:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: 600
    lineHeight: 1.5
    letterSpacing: 0px
  button:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: 0.12px
    textTransform: uppercase
  label:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: 0.25px
  caption-sm:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: 0px
  caption-xs:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: 0px
  caption-xs-strong:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: 700
    lineHeight: 1.5
    letterSpacing: 1.2px
  caption-xs-tight:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: 700
    lineHeight: 1
    letterSpacing: 0px
  caption-xs-uppercase:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: 1.68px
    textTransform: uppercase
  caption-xs-2:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: 700
    lineHeight: 1.5
    letterSpacing: 0.96px
    textTransform: uppercase
rounded:
  none: 0px
  xs: 3px
  sm: 8px
  md: 14px
  full: 9999px
spacing:
  xxs: 4px
  xs: 8px
  sm: 12px
  md: 16px
  lg: 20px
  xl: 24px
  xxl: 28px
  xxxl: 32px
  section: 44px
  band: 48px
borderWidths:
  thin: 1px
  medium: 2px
shadows:
  sm: "rgba(24, 24, 20, 0.1) 0px 18px 60px 0px"
elevationStrategy: single-tier
themes:
  derived: dark   # the other theme is the site's measured palette
  light:
    bg: "#F6F6F2"
    surface: "#FFFEFA"
    surfaceRaised: "#F9F8F4"
    text: "#66655F"
    textMuted: "#85827B"
    border: "#D9D5CC"
    accent: "#111315"
    accentFg: "#FFFFFF"
    focusRing: "#111315"
    elevation: shadow
  dark:
    bg: "#0E0E11"
    surface: "#1C1C1F"
    surfaceRaised: "#29292B"
    text: "#F5F6F6"
    textMuted: "#9D9E9F"
    border: "#353537"
    accent: "#768390"
    accentFg: "#0B0B0C"
    focusRing: "#5A656F"
    elevation: "border+surface"
  contrastFailures:
    - "light: muted on bg = 3.54:1 (needs 4.5:1)"
gradients:
  - context: section
    kind: radial
    value: "radial-gradient(color(srgb 0.784314 0.396078 0.207843 / 0.24), rgba(0, 0, 0, 0) 68%)"
    filter: "blur(2px)"
components:
  button-filled:
    textColor: "rgb(23, 24, 23)"
    border: "1px solid rgb(200, 194, 183)"
    height: 44px
    padding: "8px 16px 8px 16px"
    fontSize: 14px
    fontFamily: Inter
    fontWeight: 600
    lineHeight: 1.2
    rounded: "{rounded.sm}"
    backgroundColor: "{colors.surface}"
  button-primary:
    textColor: "rgb(245, 242, 235)"
    height: 44px
    padding: "8px 16px 8px 16px"
    fontSize: 14px
    fontFamily: Inter
    fontWeight: 600
    lineHeight: 1.2
    rounded: "{rounded.sm}"
    backgroundColor: "{colors.primary}"
  button-primary-sm:
    typography: "{typography.button}"
    textColor: "rgb(245, 242, 235)"
    height: 40px
    padding: "8px 12px 8px 12px"
    rounded: "{rounded.sm}"
    backgroundColor: "{colors.primary}"
  button-outline:
    textColor: "{colors.canvas}"
    border: "1px solid color(srgb 0.964706 0.964706 0.94902 / 0.52)"
    height: 44px
    padding: "8px 16px 8px 16px"
    fontSize: 14px
    fontFamily: Inter
    fontWeight: 600
    lineHeight: 1.2
    rounded: "{rounded.sm}"
  button-icon:
    textColor: "rgb(23, 24, 23)"
    height: 44px
    fontSize: 16px
    fontFamily: Inter
    fontWeight: 400
    lineHeight: 1.7
    rounded: "50%"
  button-icon-2:
    textColor: "rgb(23, 24, 23)"
    height: 44px
    fontSize: 14px
    fontFamily: Inter
    fontWeight: 600
    lineHeight: 1.2
    rounded: "50%"
  card:
    typography: "{typography.body-md}"
    textColor: "{colors.accent}"
    border: "1px solid {colors.hairline}"
    rounded: "{rounded.md}"
    backgroundColor: "{colors.surface}"
  card-sm:
    typography: "{typography.body-md}"
    textColor: "rgb(23, 24, 23)"
    border: "1px solid {colors.hairline}"
    padding: "32px 32px 32px 32px"
    rounded: "{rounded.md}"
    backgroundColor: "rgb(251, 250, 247)"
  badge-filled:
    textColor: "rgb(245, 242, 235)"
    border: "2px solid rgb(251, 250, 247)"
    height: 18px
    padding: "0px 4px 0px 4px"
    fontSize: 9px
    fontFamily: Inter
    fontWeight: 700
    lineHeight: 1.56
    rounded: 10px
    backgroundColor: "rgb(200, 101, 53)"
  navigation:
    typography: "{typography.body-md}"
    textColor: "rgb(23, 24, 23)"
    height: 73px
  footer:
    typography: "{typography.body-md}"
    textColor: "rgb(23, 24, 23)"
    border: "1px solid {colors.hairline}"
    padding: "48px 0px 24px 0px"
    backgroundColor: "{colors.surface}"
  link:
    typography: "{typography.body-md}"
    textColor: "{colors.body}"
    backgroundColor: "{colors.surface}"
  link-sm:
    typography: "{typography.body-md}"
    textColor: "rgb(23, 24, 23)"
    border: "1px solid {colors.hairline}"
    padding: "24px 24px 24px 24px"
    rounded: "{rounded.md}"
breakpoints:
  - width: 375
    containerWidth: 343
    gridColumns: 3
    navLinksVisible: 13
    menuToggleVisible: true
    headingPx: 45
    bodyPx: 16
    sectionPaddingX: 0
  - width: 768
    containerWidth: 720
    gridColumns: 4
    navLinksVisible: 13
    menuToggleVisible: true
    headingPx: 44
    bodyPx: 16
    sectionPaddingX: 0
  - width: 1024
    containerWidth: 984
    gridColumns: 7
    navLinksVisible: 20
    menuToggleVisible: true
    headingPx: 54
    bodyPx: 16
    sectionPaddingX: 0
  - width: 1280
    containerWidth: 1232
    gridColumns: 8
    navLinksVisible: 20
    menuToggleVisible: true
    headingPx: 67
    bodyPx: 16
    sectionPaddingX: 0
  - width: 1440
    containerWidth: 1280
    gridColumns: 8
    navLinksVisible: 20
    menuToggleVisible: true
    headingPx: 76
    bodyPx: 16
    sectionPaddingX: 0
coverage:
  statesFound: 0
  gradientsFound: 1
  rolesUnassigned: 4
  archetypesUnnamed: 0
  archetypesDetected: 0
  responsiveMeasured: true
  stylesheetsBlocked: true
  semanticRampDeclared: true
---

# Design System Inspired by KICAP

## 1. Visual Theme & Atmosphere

KICAP's design system embodies premium minimalism with a technology-forward aesthetic. The visual language prioritizes clarity and craftsmanship, reflecting the brand's position as a curated marketplace for mechanical keyboards and input devices. A refined neutral palette anchors the experience, while carefully placed accent colors—warm oranges and deep blues—inject personality and guide user attention. The typography employs generous tracking and a bold, geometric display scale that commands space on hero moments, creating a confident, editorial feel. Rounded corners are deployed selectively rather than uniformly, establishing a modern yet grounded sensibility that respects both content and whitespace.

**Key Characteristics**
- Sophisticated neutral-dominant palette with warm and cool accents
- Bold, negative-tracked display typography for visual hierarchy
- Selective use of rounding (sharp cards, gently rounded inputs)
- Restrained shadow and elevation—depth through color blocking, not layering
- Editorial heading scale that scales fluidly across viewports
- Premium product photography as the primary visual asset
- Warm accent (`{colors.accent-1}` — `#E07A43`) for decorative highlights and badges

## 2. Color Palette & Roles

### Primary & Brand
- **Primary** (`{colors.primary}` — `#111315`): Primary call-to-action fills, active states, brand accent, and high-contrast text on light surfaces.

### Accent Colors
- **Secondary Accent** (`{colors.accent}` — `#0657A3`): Supporting accent for hero bands, secondary highlights, and thematic color blocks.
- **Warm Decorative** (`{colors.accent-1}` — `#E07A43`): Informational badges, decorative accents, and highlight elements—not a semantic status role.
- **Light Cream** (`{colors.accent-2}` — `#F8ECD6`): Decorative background wash for sections and subtle visual separation.

### Neutral Scale
- **Canvas** (`{colors.canvas}` — `#F6F6F2`): Default page background, providing a soft, warm off-white foundation.
- **Surface** (`{colors.surface}` — `#FFFEFA`): Card, panel, and modal backgrounds—slightly warmer than canvas for subtle depth.
- **Ink** (`{colors.ink}` — `#66655F`): Primary heading and high-emphasis text color.
- **Body** (`{colors.body}` — `#85827B`): Secondary body copy and medium-emphasis text.
- **Hairline** (`{colors.hairline}` — `#D9D5CC`): Dividers, borders, and thin structural lines (1px).

### Decorative Neutrals
- **Neutral Green Wash** (`{colors.neutral-1}` — `#E2F0E8`): Decorative background element with no assigned semantic role.
- **Neutral Pink Wash** (`{colors.neutral-2}` — `#F7E1E3`): Decorative background element with no assigned semantic role.

### Semantic & Status
- **Error** (`{colors.error}` — `#AD4650`): Error states and destructive action messaging.
- **Success** (`{colors.success}` — `#2F7955`): Confirmation and positive action states.
- **Warning** (`{colors.warning}` — `#A86B18`): Caution and warning-level messaging.
- **Info** (`{colors.info}` — `#A95029`): Informational messaging and supporting context.

## 3. Typography Rules

### Font Family
**Primary:** Inter (400, 600, 700 weights)
**Fallback stack:** -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, sans-serif

Inter is a contemporary geometric sans-serif optimized for screen readability, with subtle humanist proportions and excellent multilingual support (critical for KICAP's Vietnamese audience).

### Hierarchy

| Role | Font | Size | Weight | Line Height | Letter Spacing | Notes |
|---|---|---|---|---|---|---|
| Display XL | Inter | 75.6px | 700 | 0.98 | -4.54px | Hero headlines; extreme negative tracking for impact |
| Display LG | Inter | 46.08px | 700 | 1.04 | -2.07px | Section headlines; pronounced tracking compression |
| Heading MD | Inter | 20px | 700 | 1.04 | -0.9px | Feature headlines; subtle negative tracking |
| Heading SM | Inter | 18px | 700 | 1.2 | 0.18px | Subsection titles; transitions to positive spacing |
| Heading XS | Inter | 12px | 700 | 1.2 | 1.44px | Uppercase labels; maximum spacing for emphasis |
| Body MD Loose | Inter | 16px | 400 | 1.65 | 0px | Primary body copy; generous line height for readability |
| Body MD | Inter | 16px | 400 | 1.5 | 0px | Links and secondary body text |
| Body SM Bold | Inter | 14px | 700 | 1.2 | 0.14px | Emphasis within body, labels |
| Body SM Tight | Inter | 14px | 700 | 1.5 | 0px | Tight-set emphasis text |
| Body XS Strong | Inter | 12px | 600 | 1.5 | 0px | Button labels; consistent weight for clickable elements |
| Body XS | Inter | 12px | 400 | 1.65 | 0px | Small utility text |
| Caption XS | Inter | 12px | 400 | 1.5 | 0px | Standard captions and metadata |
| Caption XS Strong | Inter | 12px | 700 | 1.5 | 1.2px | Emphasized captions |
| Caption XS Uppercase | Inter | 12px | 700 | 1.2 | 1.68px | All-caps labels; high tracking for distinctness |
| Caption XS Tight | Inter | 12px | 700 | 1 | 0px | Compact labels and badges |
| Caption SM | Inter | 14px | 400 | 1.5 | 0px | Larger captions and supporting text |

### Principles
- **Negative tracking on display.** Display XL and Display LG employ aggressive negative letter-spacing (-4.54px and -2.07px respectively) to create a bold, confident presence. This is a defining visual trait of the brand and must be preserved exactly.
- **Tracking expands as size contracts.** Small text (12px captions and labels) employ positive tracking (0.14px to 1.68px) for legibility and visual separation. This inverts the typical tracking pattern and signals emphasis through spacing rather than weight alone.
- **Line height scales loosely.** Body copy uses 1.65 line height for readability; tighter headings compress to 1.0–1.2 to reinforce hierarchy and save space.
- **Weight is reserved, not distributed.** Only 400, 600, and 700 are used; 500 is never employed. This constraint keeps the visual language clean and predictable.

## 4. Component Stylings

### Buttons

**Primary Button**
- Background: `{colors.primary}` (`#111315`)
- Text Color: `#F5F2EB`
- Typography: `{typography.body-sm-tight}` (14px, weight 600, line-height 1.2)
- Padding: `{spacing.xs}` 16px (`8px 16px`)
- Height: 44px
- Border: 1px solid transparent
- Border Radius: `{rounded.sm}` (8px)
- Box Shadow: none
- Width: auto (fits content)

**Primary Button Small**
- Background: `{colors.primary}` (`#111315`)
- Text Color: `#F5F2EB`
- Typography: `{typography.button}` (12px, weight 600, line-height 1.2, letter-spacing 0.12px)
- Padding: `{spacing.xs}` `{spacing.sm}` (`8px 12px`)
- Height: 40px
- Border: 1px solid transparent
- Border Radius: `{rounded.sm}` (8px)
- Box Shadow: none

**Secondary / Outline Button**
- Background: transparent
- Text Color: `{colors.canvas}` (`#F6F6F2`)
- Typography: `{typography.body-sm-tight}` (14px, weight 600, line-height 1.2)
- Padding: `{spacing.xs}` 16px (`8px 16px`)
- Height: 44px
- Border: 1px solid `rgba(246, 246, 242, 0.52)`
- Border Radius: `{rounded.sm}` (8px)
- Box Shadow: none
- Background: `{colors.surface}` (`#FFFEFA`)

**Filled Button**
- Background: `{colors.surface}` (`#FFFEFA`)
- Text Color: `#171817`
- Typography: `{typography.body-sm-tight}` (14px, weight 600, line-height 1.2)
- Padding: `{spacing.xs}` 16px (`8px 16px`)
- Height: 44px
- Border: 1px solid `{colors.hairline}` (`#D9D5CC`)
- Border Radius: `{rounded.sm}` (8px)
- Box Shadow: none

**Icon Button**
- Background: transparent
- Text Color: `#171817`
- Typography: 16px, weight 400, line-height 1.7
- Width: 44px
- Height: 44px
- Padding: 0px
- Border: 1px solid transparent
- Border Radius: `{rounded.full}` (9999px / circular)
- Box Shadow: none

**Icon Button (Variant 2)**
- Background: transparent
- Text Color: `#171817`
- Typography: 14px, weight 600, line-height 1.2
- Width: 44px
- Height: 44px
- Padding: 0px
- Border: 1px solid transparent
- Border Radius: `{rounded.full}` (9999px / circular)
- Box Shadow: none

### Cards & Containers

**Card Default**
- Background: `{colors.surface}` (`#FFFEFA`)
- Text Color: `{colors.accent}` (`#0657A3`)
- Typography: `{typography.body-md}` (16px, weight 400, line-height 1.5)
- Border: 1px solid `{colors.hairline}` (`#D9D5CC`)
- Border Radius: `{rounded.md}` (14px)
- Padding: 0px (image cards)
- Box Shadow: none
- Min height: 246px (square product cards)

**Card Default Small**
- Background: `#FBFAF7`
- Text Color: `#171817`
- Typography: `{typography.body-md}` (16px, weight 400, line-height 1.5)
- Border: 1px solid `{colors.hairline}` (`#D9D5CC`)
- Border Radius: `{rounded.md}` (14px)
- Padding: 32px
- Box Shadow: none
- Height: 152px (feature cards)
- Width: full width container

### Navigation

**Navigation Bar Default**
- Background: transparent
- Text Color: `#171817`
- Typography: `{typography.body-md}` (16px, weight 400, line-height 1.5)
- Height: 73px
- Padding: 0px
- Border: none
- Border Radius: 0px
- Box Shadow: none
- Container width: 922px (max navigation link container)

### Badges

**Badge Filled**
- Background: `#C86535` (warm orange, derived from `{colors.accent-1}`)
- Text Color: `#F5F2EB`
- Typography: `{typography.caption-xs-tight}` (12px, weight 700, line-height 1)
- Padding: 0px 4px
- Width: 18px
- Height: 18px
- Border: 2px solid `#FBFAF7`
- Border Radius: `{rounded.full}` (10px / pill)
- Font Size: 9px
- Box Shadow: none

### Footer

**Footer Default**
- Background: `{colors.surface}` (`#FFFEFA`)
- Text Color: `#171817`
- Typography: `{typography.body-md}` (16px, weight 400, line-height 1.5)
- Border: 1px solid `{colors.hairline}` (`#D9D5CC`)
- Border Radius: 0px
- Padding: 48px 0px 24px 0px
- Box Shadow: none

### Links

**Link Default**
- Text Color: `{colors.body}` (`#85827B`)
- Typography: `{typography.body-md}` (16px, weight 400, line-height 1.5)
- Underline: none (no underline observed in extraction)
- Background: `{colors.surface}` (`#FFFEFA`)
- Border: none
- Box Shadow: none

**Link Default Small (Card-style Link)**
- Background: transparent
- Text Color: `#171817`
- Typography: `{typography.body-md}` (16px, weight 400, line-height 1.5)
- Padding: 24px
- Border: 1px solid `{colors.hairline}` (`#D9D5CC`)
- Border Radius: `{rounded.md}` (14px)
- Height: 176px
- Box Shadow: none

## 5. Layout Principles

### Spacing System
KICAP employs a consistent 4px base unit with a geometric progression for larger intervals:

- **XXS** (`{spacing.xxs}`) = 4px — Micro-spacing within components (badge padding, icon gaps)
- **XS** (`{spacing.xs}`) = 8px — Button and input internal padding
- **SM** (`{spacing.sm}`) = 12px — Component-to-component gaps, label spacing
- **MD** (`{spacing.md}`) = 16px — Card content padding, section gutters
- **LG** (`{spacing.lg}`) = 20px — Between major sections on small screens
- **XL** (`{spacing.xl}`) = 24px — Feature card padding, footer spacing
- **XXL** (`{spacing.xxl}`) = 28px — Reserved for inter-section rhythm
- **XXXL** (`{spacing.xxxl}`) = 32px — Large feature card padding
- **Section** (`{spacing.section}`) = 44px — Between major content sections
- **Band** (`{spacing.band}`) = 48px — Large sectional margins (footer top, hero spacing)

### Grid & Container
- **Max Content Width:** 1280px (measured at 1440px viewport)
- **Grid Columns:** Responsive—3 cols at 375px, 4 cols at 768px, 7 cols at 1024px, 8 cols at 1280px+
- **Section Padding:** 0px horizontal (content expands edge-to-edge on mobile), increased via max-width constraints on desktop
- **Gutter:** Implicit in column layout; nav and hero span full width

### Whitespace Philosophy
KICAP treats whitespace as an active design element. Generous `{spacing.band}` gaps between major sections create breathing room for premium product photography and featured content. Headings and body copy use measured tracking and line-height expansion to ensure legibility without cramped layouts. Cards are clustered densely within a grid but separated from neighboring sections by substantial vertical rhythm.

### Border Radius Scale
- **None** (`{rounded.none}`) = 0px — Cards, images, hero blocks, footers (sharp, architectural quality)
- **Extra Small** (`{rounded.xs}`) = 3px — Form inputs (subtle softness without compromising clarity)
- **Small** (`{rounded.sm}`) = 8px — Buttons and interactive elements (balanced roundness)
- **Medium** (`{rounded.md}`) = 14px — Feature cards and container panels (welcoming, premium feel)
- **Full** (`{rounded.full}`) = 9999px — Icon buttons and badges (circular, maximum softness)

### Border Widths
- **Thin** = 1px — Standard borders on cards, inputs, dividers, and the footer
- **Medium** = 2px — Badge borders (adds emphasis and visual weight to notification elements)

## 6. Depth & Elevation

| Level | Treatment | Use |
|---|---|---|
| Base | Flat, no shadow | Card backgrounds, buttons, body text, navigational elements |
| Dropdown | `rgba(24, 24, 20, 0.1) 0px 18px 60px 0px` | Dropdown menus, floating panels, modals |

KICAP's elevation strategy prioritizes color-blocking over shadow-based depth. The neutral palette (canvas, surface, ink) establishes depth through subtle background color shifts rather than layered shadows. The single observed shadow is soft and distant, reserved for floating elements like dropdowns and modals. This restraint preserves the premium, editorial aesthetic and ensures the brand's photography and typography remain the primary visual focus.

### Opacity Levels
- **Full** (1.0) — Primary text, primary elements, standard state
- **Reduced** (0.65) — Secondary text, muted elements
- **Subtle** (0.60) — Tertiary text, de-emphasized copy
- **Faint** (0.20) — Decorative overlays, ghost backgrounds

### Z-index / Layering
- **Base** = 1–2 — Static page content and layout
- **Dropdown** = 10–12 — Expandable menus and popover elements
- **Sticky** = 100 — Fixed navigation and persistent headers
- **Modal** = 1000–1060 — Dialog overlays, lightboxes, and full-screen interactions

## 7. Do's and Don'ts

### Do
- **Use the full negative tracking on display sizes.** The -4.54px on Display XL and -2.07px on Display LG are signature visual elements; never normalize them to 0.
- **Preserve the neutral palette.** `{colors.canvas}` and `{colors.surface}` create the tonal foundation; maintain the slight warm cast in all light backgrounds.
- **Deploy rounded corners selectively.** Keep cards and images sharp (`{rounded.none}`); round buttons to `{rounded.sm}` and badges to `{rounded.full}`.
- **Respect color roles strictly.** `{colors.primary}` is brand-first, not error-first. Use semantic colors (`{colors.error}`, `{colors.success}`) only for explicit status messaging.
- **Use generous vertical spacing.** Apply `{spacing.band}` (48px) between major sections to create editorial rhythm.
- **Maintain line-height expansion on body text.** Use `{typography.body-md-loose}` (1.65 line-height) for primary reading passages to ensure comfort and accessibility.

### Don't
- **Invent intermediate radius values.** The system defines none, xs, sm, md, full—no 5px, 10px, or 12px variants.
- **Apply multiple shadow layers.** One shadow (dropdown) exists; do not create layered depth systems or micro-shadow stacks.
- **Compress display headings.** Never reduce letter-spacing on Display XL or LG; the negative tracking is intentional and brand-defining.
- **Mix font families.** Inter is the only typeface in the system; do not introduce serif, monospace, or geometric alternatives.
- **Use the decorative accents (`{colors.accent-2}`, `{colors.neutral-1}`, `{colors.neutral-2}`) as semantic status colors.** These are visual ornaments only.
- **Add padding to sharp cards.** Card images render with 0px padding and `{rounded.none}` to maintain clean, architectural proportion.

## 8. Responsive Behavior

### Breakpoints

| Viewport | Content Width | Grid Columns | Heading Size | Body Size | Section Padding X | Primary Nav Links Visible |
|---|---|---|---|---|---|---|
| 375px (Mobile) | 343px | 3 | 45px | 16px | 0px | 13 |
| 768px (Tablet) | 720px | 4 | 44px | 16px | 0px | 13 |
| 1024px (Desktop) | 984px | 7 | 54px | 16px | 0px | 20 |
| 1280px (Large Desktop) | 1232px | 8 | 67px | 16px | 0px | 20 |
| 1440px (XL Desktop) | 1280px | 8 | 76px | 16px | 0px | 20 |

The navigation menu remains visible across all breakpoints (hamburger toggle present but primary nav links always shown in measured data). Heading sizes scale fluidly—the 375px Display variant is 45px; at 1440px it expands to 76px. Grid columns increase from 3 (mobile) to 8 (desktop), allowing product cards and features to reflow naturally.

### Touch Targets
All interactive elements (buttons, icon buttons, inputs) maintain a minimum 44px × 44px hit area on mobile viewports, ensuring comfortable touch engagement. Navigation links inherit the 73px header height, providing ample touch space. Link underlines are not visually present in measured data but should be added for accessibility on interactive text.

### Collapsing Strategy
- **Grid reflow:** Product card grids compress from 8 columns (desktop) to 3 columns (mobile) without explicit breakpoint cutoffs—CSS Grid's `auto-fit` or `auto-fill` with a minimum column width handles the transition.
- **Typography scaling:** Display Heading sizes scale between 45px (375px) and 76px (1440px), following a fluid typographic scale. This ensures readability at all screen sizes without discrete font-size jumps.
- **Navigation:** Primary nav links remain visible throughout; the menu toggle observed at all breakpoints indicates a secondary mobile menu is available but the primary nav bar does not collapse.
- **Padding:** Section padding-x stays 0px across all measured breakpoints; max-width constraints handle horizontal spacing. This is a critical layout rule—never add horizontal padding to sections.

## 9. Agent Prompt Guide

### Quick Color Reference
- **Primary CTA & Brand Accent:** Primary (`#111315`)
- **Page Background:** Canvas (`#F6F6F2`)
- **Card & Panel Backgrounds:** Surface (`#FFFEFA`)
- **Heading Text:** Ink (`#66655F`)
- **Body Text:** Body (`#85827B`)
- **Borders & Dividers:** Hairline (`#D9D5CC`)
- **Secondary Accent:** Accent (`#0657A3`)
- **Warm Decorative Accents:** Accent-1 (`#E07A43`)
- **Error State:** Error (`#AD4650`)
- **Success State:** Success (`#2F7955`)
- **Warning State:** Warning (`#A86B18`)
- **Info State:** Info (`#A95029`)

### Iteration Guide
1. **Use Inter 700 weight with aggressive negative tracking for display headings** (Display XL: -4.54px, Display LG: -2.07px). This is the brand's signature visual language.
2. **Keep all cards and images sharp** (`border-radius: 0px`); round only buttons (`8px`) and badges (`9999px / pill`).
3. **Buttons are always 44px tall** (or 40px for small variants), with 8px vertical padding and 16px (or 12px for small) horizontal padding.
4. **Primary buttons use `#111315` (primary) background with `#F5F2EB` text**; secondary buttons are transparent with a hairline border.
5. **Section spacing is `48px` between major content blocks**; use `24px` for card padding and `16px` for component gutters.
6. **Opacity levels: 1.0 (primary), 0.65 (secondary), 0.60 (tertiary), 0.20 (faint).** Apply sparingly to text and overlays.
7. **Responsive grid scales from 3 columns (375px) to 8 columns (1280px+) without explicit breakpoints**—use CSS Grid's auto-fit or similar.
8. **Elevation uses one shadow only:** `rgba(24, 24, 20, 0.1) 0px 18px 60px 0px` for dropdowns and floating elements; everything else is flat with color-based depth.
9. **Never invent color roles.** Use semantic colors (`error`, `success`, `warning`, `info`) only for explicit status messaging; decorative accents (`accent-1`, `accent-2`, `neutral-1`, `neutral-2`) are ornamental.

## 10. Known Gaps

- **Interaction states unavailable.** Stylesheets were cross-origin and could not be read, so hover, active, focus, and disabled states are not documented. Implement these following platform conventions (e.g., color shifts, opacity reduction, outline rings for focus).
- **Four extracted colors lack assigned semantic roles** (`{colors.accent-1}`, `{colors.accent-2}`, `{colors.neutral-1}`, `{colors.neutral-2}`). These are confirmed as decorative; no error, warning, success, or info states derived from them.
- **Animation and transition properties were not extracted.** Easing functions, durations, and keyframe sequences are absent from the token data.
- **Gradient details are incomplete.** One decorative radial gradient was captured (`radial-gradient(color(srgb 0.784314 0.396078 0.207843 / 0.24), rgba(0, 0, 0, 0) 68%)` with `filter: blur(2px)`), but systematic gradient coverage across the full component palette is missing.
- **Dark mode or derived themes are not documented.** The extraction analyzed a single light theme; no dark-mode CSS or theme switching behavior was observed.
- **Surfaces behind authentication were not visited.** User account pages, checkout flows, and administrative dashboards are outside the scope of this extraction.
- **Form input styling is incomplete.** The `input` element was measured with a 3px border-radius, but placeholder text, focus states, validation messaging, and multiline textareas are undocumented.
- **Dropdown and popover content styling is inferred from shadow data alone.** No explicit dropdown item backgrounds, hover states, or menu item typography were extracted.
