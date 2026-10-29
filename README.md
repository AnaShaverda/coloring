# Cook & Color print studio

A local React/TypeScript studio for illustrated A4 recipe pages and matching penguin-family coloring pages. Includes Sandwich and Cinnamon Rolls, in English and Georgian. The editor interface stays in English.

## Run

```sh
npm install
npm run dev -- --port 5173
```

Open http://127.0.0.1:5173/. `npm run build` produces the production app in `dist/`; `npm run preview` serves it.

## Design and editing

Choose a recipe and cookbook language. Switch between blank templates and filled recipes. **Edit recipe** changes text and adds/removes ingredients and steps; these render as semantic `ul` and `ol` lists. Writing lines are optional.

**Arrange artwork** lets you drag illustrations and complete text sections, or nudge them using arrow keys (Shift for larger movements). Select artwork to rotate, resize, duplicate, delete or change its layer order. Notes can be deleted and restored with the Notes section checkbox or Add Notes section button. Choose a page frame, including a gingham ribbon. Reset layout restores all artwork and sections.

Changes are stored in this browser's local storage. Recipe text is saved separately for each language; artwork arrangements and frame are shared between languages of the same recipe. Recipes have independent layouts.

## Cookbooks and printing

Under **Build a cookbook**, check recipes, choose recipe pages/coloring pages/both, and optionally enable page numbers. Download produces one PDF in the selected order, with consecutive numbering when enabled. Save named selections to create different cookbook collections and reload them later. The catalog drives the selection list and has no fixed export item count. Currently there are two recipes; add future recipe definitions to `src/data/recipe.ts` and their artwork/layout in `src/data/layout.ts`.

Individual downloads remain available. All PDFs are exactly 210 × 297 mm. Recipe text is embedded/selectable, with generated PNG artwork; the coloring illustrations are raster images. Browser Print prints the current recipe pair; use Download cookbook PDF for selected multi-recipe books and numbering. Print at 100%/actual size; ordinary printers may leave nonprintable edge margins.

The page backgrounds are white. Accents and illustrations still consume color ink. Coloring pages contain only black and white. Coloring production files are normalized to 2480 × 3508 pixels, **upscaled from the generated master**, not native 300 dpi illustrations. Masters and prompts are retained under `artwork/masters` and `docs`. Test a physical print before a production run.

## Fonts and sources

English uses Patrick Hand and Amatic SC. Georgian uses **Geo Gorda** for all writing and **SS GEO CHALK AllCaps** for titles/uppercase labels. The earlier cursive Georgian face is no longer used. Original and Unicode-adapted Geo Gorda files are retained: the original uses legacy Latin codepoints; the derived font maps Georgian Unicode to the same outlines. `scripts/build-font-metrics.cjs` rebuilds layout measurements after font changes.

Font sources: https://typeface.ge/ka/font/Geo+Gorda and https://typeface.ge/ka/font/SS+GEO+CHALK+AllCaps. Commercial redistribution permission for these font files has not been verified; check the creators' terms before distributing a commercial product.

Cinnamon Rolls uses metric quantities and a concise, independently worded method based on [Sally's one-rise cinnamon rolls](https://sallysbakingaddiction.com/easy-cinnamon-rolls-from-scratch/). Recipe facts and Georgian translation should be proofread before publication.

## Implementation

`src/data/layout.ts` is a shared millimeter-based scene for the React preview and PDF renderer. Text/list/shape primitives stay code-native; food and character illustrations are PNG assets. `src/lib/exportPdf.ts` embeds fonts and images with pdf-lib, and combines selected recipes without rasterizing recipe text. PDF code is loaded only when exporting.

The **Apply reference layout** button restores the code-defined composition for the chosen recipe, including saved positions for every movable section and object. It replaces that recipe's custom arrangement; recipe text is retained. Georgian PDF titles use a TrueType conversion of the original Chalk outlines for reliable printer/PDF support; regenerate it with `scripts/prepare-chalk-pdf-font.py`.
