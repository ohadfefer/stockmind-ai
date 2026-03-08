---
name: copy-design
description: Reproduce a UI design from an image or URL into the application. Analyzes the visual design and implements it as closely as possible while matching the app's existing color scheme and design system.
user-invocable: true
disable-model-invocation: false
allowed-tools: Read, Write, Edit, Grep, Glob, Bash, WebFetch, Agent
---

# Copy Design

Reproduce a UI design from a provided image or URL as closely as possible within this Next.js application, matching the app's existing colors and design system.

## Steps

### 1. Get the Design Reference

Check if the user has attached an image or provided a URL in their message.

- If **neither** is present, ask: "Please attach a screenshot/image of the UI design you'd like me to reproduce, or provide a URL to view it."
- If a **URL** is provided, fetch it with WebFetch and also ask the user to confirm which part of the page they want reproduced if it's not obvious.
- If an **image** is provided, read/analyze it carefully.

Do NOT proceed until you have at least one design reference.

### 2. Get the Target Page

Ask the user: "Which page or route should I implement this design in?" unless they have already specified one.

Accept answers like:
- An existing file path (e.g. `src/app/details/[symbol]/page.tsx`)
- A route name (e.g. `/portfolio`, `/dashboard`)
- "Create a new page at /[route]"

Do NOT proceed until you know the target page.

### 3. Analyze the Design

Study the provided image or URL carefully. Identify:

- **Layout structure**: grid, flexbox, columns, sidebar, header placement
- **Components**: cards, tables, charts, buttons, inputs, tabs, modals, etc.
- **Typography**: headings, body text, labels, font sizes, font weights
- **Colors**: backgrounds, text colors, borders, accents, gradients
- **Spacing**: padding, margins, gaps between elements
- **Icons**: identify icon types and find Lucide equivalents
- **Data displayed**: understand what data is shown so you can wire it up or mock it
- **Interactive elements**: hover states, active states, dropdowns, toggles
- **Responsive considerations**: how the layout might adapt

### 4. Review the App's Existing Design System

Before writing any code, read these files to understand the current design tokens and patterns:

- `frontend/src/app/globals.css` — CSS variables, theme colors (light/dark)
- `frontend/src/app/layout.tsx` — root layout structure
- `frontend/src/components/ui/` — available shadcn/ui components
- `frontend/components.json` — shadcn/ui configuration
- The target page file (if it already exists)

Map the design's colors to the app's existing CSS variables and Tailwind classes:
- Use `bg-background`, `text-foreground`, `bg-card`, `text-muted-foreground`, `border`, `bg-primary`, `text-primary-foreground`, etc.
- Use the app's existing `--radius`, spacing scale, and font sizes
- Only introduce new CSS variables if the design absolutely requires a color not present in the theme

### 5. Implement the Design

Build the page to match the design as closely as possible:

- **Use existing shadcn/ui components** (`Card`, `Button`, `Table`, `Tabs`, `Badge`, etc.) wherever they match what's in the design. Install new shadcn components if needed with `cd frontend && npx shadcn@latest add <component>`.
- **Use Lucide icons** (`lucide-react`) for any icons in the design. Pick the closest match.
- **Use Recharts** for any charts or graphs, matching colors and chart types from the design.
- **Use Tailwind CSS with `clsx`** for all styling. Use `clsx()` (from the `clsx` package) for conditional and dynamic class composition — e.g. `clsx("text-sm font-medium", isActive && "text-primary", variant === "outline" && "border border-input")`. For merging with Tailwind conflict resolution, use the `cn()` helper from `@/lib/utils` (which wraps `clsx` + `tailwind-merge`). Avoid inline styles and string template literals for className.
- **Mock data**: If the design shows data (stock prices, user info, etc.), create realistic mock data inline or in `lib/mock-data.ts`.
- **Match proportions**: Get the sizing, spacing, and layout ratios as close as possible to the reference.
- **Dark/light mode**: Ensure the implementation works with the app's theme system. Use theme-aware CSS variables.

### 6. Compare and Refine

After implementing, compare your result against the original design:

- Check alignment and spacing
- Check color accuracy (mapped to theme variables)
- Check typography hierarchy
- Check component states (hover, active, disabled)
- Check that no major UI elements were missed

Fix any discrepancies before finishing.

## Typography & Color Rules

Always match the app's existing typography and color system — never hardcode hex/rgb values:

- **Typography**: Use Tailwind's type scale (`text-xs`, `text-sm`, `text-base`, `text-lg`, `text-xl`, `text-2xl`, etc.) with weight utilities (`font-normal`, `font-medium`, `font-semibold`, `font-bold`). Use `tracking-tight` for headings where appropriate. Respect the app's font family set in `globals.css`.
- **Colors**: Always use semantic theme variables via Tailwind — `text-foreground`, `text-muted-foreground`, `text-primary`, `bg-background`, `bg-card`, `bg-muted`, `bg-primary`, `bg-destructive`, `border`, `ring`, `accent`, etc. For stock-specific colors (green/red for gains/losses), use `clsx()` to toggle dynamically: `clsx("text-sm font-medium", gain >= 0 ? "text-green-500" : "text-destructive")`.
- **Spacing**: Follow the Tailwind spacing scale consistently (`p-4`, `gap-4`, `space-y-2`, etc.). Match the design's visual rhythm.

## Dynamic Styling with clsx

Use `clsx()` for all conditional and dynamic class logic. Common patterns:

```tsx
import { cn } from "@/lib/utils"
import clsx from "clsx"

// Conditional classes based on state
<div className={clsx("rounded-lg border p-4", isSelected && "ring-2 ring-primary", isDisabled && "opacity-50 pointer-events-none")} />

// Variant-based styling
<span className={clsx("inline-flex items-center rounded-full px-2 py-1 text-xs font-medium", variant === "success" && "bg-green-500/10 text-green-500", variant === "danger" && "bg-destructive/10 text-destructive")} />

// Use cn() when merging with props or when Tailwind class conflicts need resolution
<Card className={cn("bg-card", className)} />
```

Never use ternary expressions inside template literals for className (e.g. `` className={`text-sm ${isActive ? 'text-primary' : 'text-muted-foreground'}`} ``). Always use `clsx()` or `cn()` instead.

## Available UI Components (`frontend/src/components/ui/`)

Before building custom UI, check this list — **always prefer existing components** over building from scratch. Import from `@/components/ui/<name>`.

| Component | Use when you need... |
|---|---|
| **Accordion** | Expandable/collapsible sections |
| **Alert** | Status messages (default, destructive) |
| **AlertDialog** | Confirmation modals for critical actions |
| **AspectRatio** | Fixed aspect ratio containers (images, video) |
| **Avatar** | User profile images with fallback |
| **Badge** | Small labels, tags, or status indicators |
| **Breadcrumb** | Navigation path hierarchy |
| **Button** | Clickable actions (variants: default, destructive, outline, secondary, ghost, link) |
| **ButtonGroup** | Grouped buttons side by side |
| **Calendar** | Date picker grid |
| **Card** | Content containers (Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter) |
| **Carousel** | Swipeable content slider |
| **Chart** | Recharts wrapper with themed tooltips and legends |
| **Checkbox** | Binary on/off selection |
| **Collapsible** | Simple show/hide toggle |
| **Command** | Searchable command palette / combobox |
| **ContextMenu** | Right-click menus |
| **Dialog** | Modal overlays for forms/content |
| **Drawer** | Slide-out panels (any direction) |
| **DropdownMenu** | Menus triggered by button click |
| **Empty** | Empty state placeholders with icon and message |
| **Field** | Form field with label + input + error |
| **Form** | React Hook Form integration with validation |
| **HoverCard** | Rich tooltips on hover |
| **Input** | Text input fields |
| **InputGroup** | Input with prefix/suffix addons |
| **InputOTP** | One-time password input |
| **Item** | List items with content, media, actions |
| **Kbd** | Keyboard shortcut display |
| **Label** | Form field labels |
| **Menubar** | Top menu bar with dropdowns |
| **NavigationMenu** | Hierarchical nav with submenus |
| **Pagination** | Page navigation controls |
| **Popover** | Floating content anchored to an element |
| **Progress** | Progress bars |
| **RadioGroup** | Single selection from options |
| **Resizable** | Draggable panel dividers |
| **ScrollArea** | Custom scrollbar containers |
| **Select** | Dropdown selection with groups |
| **Separator** | Horizontal/vertical dividers |
| **Sheet** | Side panel overlays |
| **Sidebar** | Collapsible app navigation |
| **Skeleton** | Loading placeholder animations |
| **Slider** | Range slider inputs |
| **Sonner** | Toast notification system |
| **Spinner** | Loading indicator |
| **Switch** | Toggle on/off |
| **Table** | Data tables (Table, TableHeader, TableBody, TableRow, TableHead, TableCell) |
| **Tabs** | Tabbed content panels |
| **Textarea** | Multi-line text input |
| **Toast/Toaster** | Brief notification messages |
| **Toggle/ToggleGroup** | Toggle buttons (single or multi-select) |
| **Tooltip** | Hover hints |

To add a new shadcn component not listed above: `cd frontend && npx shadcn@latest add <component-name>`

## Guidelines

- Prioritize visual fidelity to the reference design
- Always use the app's design system (CSS variables, shadcn/ui, Tailwind) rather than hardcoded values
- Keep components well-structured — break into sub-components if a page gets large (>200 lines)
- Place sub-components in the same directory as the page or in `components/` with an appropriate subdirectory
- Add `"use client"` directive only when the component needs interactivity (state, effects, event handlers)
- Do not add comments explaining obvious code
- If the design contains text in a non-English language, keep the original text unless the user says otherwise
