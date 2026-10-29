import type { Recipe, RecipeMode } from './recipe'
import { accentPalettes } from './recipe'
import { translations } from './i18n'
import fontMetrics from './font-metrics.json'

// Both the React preview and vector PDF renderer consume this millimeter-based scene.
export const A4 = { width: 210, height: 297 } as const
export const fonts = {
  title: '/fonts/amatic-sc-latin-700-normal.woff',
  hand: '/fonts/patrick-hand-latin-400-normal.woff',
  georgian: '/fonts/Geo-Gorda-Unicode.ttf',
  georgianTitle: '/fonts/SS-GEO-CHALK-AllCaps.otf',
  georgianIngredients: '/fonts/Geo-Gorda-Unicode.ttf',
} as const
type Box = { x: number; y: number; w: number; h: number }
export type ScenePrimitive =
  | (Box & { type: 'image'; src: string; rotate?: number; opacity?: number; id?: string; sourceId?: string; label?: string; offsetX?: number; offsetY?: number; scale?: number; order?: number })
  | (Box & { type: 'icon'; path: string })
  | (Box & { type: 'text'; text: string; size: number; font: keyof typeof fonts; color: string; align?: 'left' | 'center'; lineHeight?: number; rotate?: number; stroke?: number })
  | (Box & { type: 'rect'; fill?: string; stroke?: string; radius?: number; opacity?: number; thickness?: number })
  | { type: 'line'; x: number; y: number; w: number; color: string; thickness?: number }
  | { type: 'circle'; x: number; y: number; r: number; fill: string; stroke?: string }
export type SceneSection = Box & { type: 'section'; id: string; label: string; items: SceneElement[]; offsetX: number; offsetY: number }
export type SceneElement = ScenePrimitive | { type: 'list'; ordered: boolean; label: string; items: ScenePrimitive[][] } | SceneSection
export const flattenScene = (scene: SceneElement[]): ScenePrimitive[] => scene.flatMap(item => {
  if (item.type === 'list') return item.items.flat()
  if (item.type === 'section') return flattenScene(item.items).map(child => ({ ...child, x: child.x + item.x, y: child.y + item.y }))
  return [item]
})
const shiftScene = (scene: SceneElement[], dx: number, dy: number): SceneElement[] => scene.map(item => item.type === 'list'
  ? { ...item, items: item.items.map(row => row.map(child => ({ ...child, x: child.x + dx, y: child.y + dy }))) }
  : { ...item, x: item.x + dx, y: item.y + dy })

const ink = '#54250f'
const rule = '#968777'
const peach = '#f6c49f'
const coral = '#fa7160'

// Short lines are deliberate so handwriting remains legible at actual A4 print size.
function textWidth(value: string, size: number, font: keyof typeof fonts): number {
  const metrics: Record<string, number> = fontMetrics[font]
  return [...value].reduce((total, character) => total + (metrics[character] ?? .6) * size, 0)
}

export function wrapText(value: string, max: number, size = 3.7, font: keyof typeof fonts = 'hand'): string {
  return value.split('\n').flatMap(paragraph => {
    const lines: string[] = []; let line = ''
    for (const word of paragraph.split(/\s+/)) {
      if (line && textWidth(`${line} ${word}`, size, font) > max) { lines.push(line); line = word }
      else line = line ? `${line} ${word}` : word
    }
    lines.push(line)
    return lines.flatMap(row => {
      const pieces: string[] = []; let piece = ''
      for (const character of row) {
        if (piece && textWidth(piece + character, size, font) > max) { pieces.push(piece); piece = character }
        else piece += character
      }
      return [...pieces, piece]
    })
  }).join('\n')
}

export function recipeScene(recipe: Recipe, mode: RecipeMode): SceneElement[] {
  const root = `/illustrations/${recipe.id ?? 'sandwich'}/`
  const georgian = recipe.language === 'ka'
  const t = translations[recipe.language]
  const bodyFont = georgian ? 'georgianIngredients' : 'hand'
  const titleFont = georgian ? 'georgianTitle' : 'title'
  const elements: SceneElement[] = []
  const palette = accentPalettes[recipe.palette ?? (recipe.id === 'cinnamon' ? 'lavender' : 'peach')]
  const tint = (scene: SceneElement[]): SceneElement[] => scene.map(item => {
    if (item.type === 'section') return { ...item, items: tint(item.items) }
    if (item.type === 'list') return { ...item, items: item.items.map(row => tint(row) as ScenePrimitive[]) }
    const colors: Record<string, string> = { '#8a7097': palette.primary, '#68785a': palette.secondary, '#f6c49f': palette.secondary, '#fa7160': palette.primary, '#d9ac8d': palette.primary, '#efd5be': palette.pale, '#dfb397': palette.primary, ...(recipe.id === 'cinnamon' ? { '#54250f': '#514052', '#968777': '#b7a7bf' } : {}) }
    const result = { ...item }
    for (const key of ['color', 'fill', 'stroke'] as const) if (key in result) { const typed = result as unknown as Record<string, unknown>; if (colors[typed[key] as string]) typed[key] = colors[typed[key] as string]; if (key === 'color' && item.type === 'text' && typed[key] !== '#ffffff') typed[key] = '#222222' }
    return result
  })
  const occurrence: Record<string, number> = {}
  let artworkOrder = 0
  const image = (file: string, x: number, y: number, w: number, h: number, rotate = 0) => {
    const editable = file !== 'brush.png' && file !== 'paper.png'
    const name = file.replace('.png', '')
    const id = editable ? `${name}-${occurrence[name] ?? 0}` : undefined
    occurrence[name] = (occurrence[name] ?? 0) + 1
    const order = editable ? artworkOrder++ : 0
    const insert = (key?: string) => {
      const offset = key ? recipe.artwork[key] : undefined
      if (offset?.hidden) return
      const scale = offset?.scale ?? 1
      elements.push({ type: 'image', src: root + 'parent/' + file, x: x + w * (1 - scale) / 2 + (offset?.dx ?? 0), y: y + h * (1 - scale) / 2 + (offset?.dy ?? 0), w: w * scale, h: h * scale, rotate: offset?.rotation ?? rotate, id: key, sourceId: id, label: name.replaceAll('-', ' '), offsetX: offset?.dx ?? 0, offsetY: offset?.dy ?? 0, scale, order: offset?.order ?? order })
    }
    insert(id)
    if (id) for (const [key, point] of Object.entries(recipe.artwork)) if (point.sourceId === id) insert(key)
  }
  const text = (value: string, x: number, y: number, w: number, size: number,
    options: Partial<Extract<SceneElement, { type: 'text' }>> = {}) =>
    elements.push({ type: 'text', text: value, x, y, w, h: size * 1.25, font: bodyFont, color: ink, ...options, size: Math.min(size, w / Math.max(...value.split('\n').map(row => textWidth(row, 1, options.font ?? bodyFont)), .01)) })
  const body = (value: string, x: number, y: number, w: number, preferredSize: number, maxLines: number, lineHeight: number, centered = false, font: keyof typeof fonts = bodyFont) => {
    let size = preferredSize
    while (wrapText(value, w, size, font).split('\n').length > maxLines && size > 2.8) size -= .1
    const wrapped = wrapText(value, w, size, font)
    text(wrapped, x, centered ? y - lineHeight / 2 : y, w, size, { lineHeight: lineHeight / size, font })
    return wrapped.split('\n').length
  }
  const line = (x: number, y: number, w: number, color = rule, thickness = .24) => {
    if (recipe.writingLines) elements.push({ type: 'line', x, y, w, color, thickness })
  }
  const brush = (x: number, y: number, w: number, h: number, rotate = 0) =>
    image('brush.png', x, y, w, h, rotate)
  const section = (id: string, label: string, x: number, y: number, w: number, h: number, items: SceneElement[]) => {
    const offset = recipe.artwork[id]
    if (offset?.hidden) return
    elements.push({ type: 'section', id, label, x: x + (offset?.dx ?? 0), y: y + (offset?.dy ?? 0), w, h, items: shiftScene(items, -x, -y), offsetX: offset?.dx ?? 0, offsetY: offset?.dy ?? 0 })
  }

  elements.push({ type: 'rect', x: 0, y: 0, w: 210, h: 297, fill: '#ffffff' })
  if (recipe.frame === 'line' || recipe.frame === 'double') {
    elements.push({ type: 'rect', x: 5, y: 5, w: 200, h: 287, radius: 2, stroke: '#d9ac8d', thickness: .22 })
    if (recipe.frame === 'double') elements.push({ type: 'rect', x: 7, y: 7, w: 196, h: 283, radius: 1, stroke: '#efd5be', thickness: .18 })
  }
  if (recipe.frame === 'corners') {
    for (const [x, y, right, bottom] of [[6, 6, false, false], [204, 6, true, false], [6, 291, false, true], [204, 291, true, true]] as const) {
      elements.push({ type: 'rect', x: right ? x - 17 : x, y, w: 17, h: .35, fill: '#dfb397' })
      elements.push({ type: 'rect', x, y: bottom ? y - 17 : y, w: .35, h: 17, fill: '#dfb397' })
    }
  }
  if (recipe.frame === 'gingham') {
    for (const y of [4, 289]) for (let i = 0; i < 50; i++) {
      elements.push({ type: 'rect', x: 5 + i * 4, y, w: 4, h: 2, fill: i % 2 ? palette.pale : palette.primary, opacity: .7 })
      elements.push({ type: 'rect', x: 5 + i * 4, y: y + 2, w: 4, h: 2, fill: i % 2 ? palette.secondary : palette.pale, opacity: .55 })
    }
    elements.push({ type: 'line', x: 5, y: 10, w: 200, color: palette.secondary, thickness: .3 })
    elements.push({ type: 'line', x: 5, y: 287, w: 200, color: palette.secondary, thickness: .3 })
  }
  if (recipe.frame === 'paint') {
    for (const [x, y, angle] of [[1, 2, -12], [176, 3, 15], [1, 287, 10], [175, 288, -12]]) brush(x, y, 34, 7, angle)
  }

  if (recipe.id === 'cinnamon') {
    const lavender = '#8a7097', sage = '#68785a', dark = '#493c46'
    const heading = (label: string, x: number, y: number, w: number, ingredient = false) => {
      brush(x - 3, y - 2, Math.min(w + 4, 98), 14)
      text(label, x + 2, y, w - 2, georgian ? 8 : 9, { font: georgian && ingredient ? 'georgianIngredients' : bodyFont, color: dark })
      elements.push({ type: 'line', x, y: y + 13, w, color: lavender, thickness: .5 })
    }
    let start = elements.length
    const title = recipe.title.replace(/ (?!.* )/, '\n')
    brush(16, 62, 116, 9, -3)
    text(title, 18, 16, 119, georgian ? 19 : 24, { font: georgian ? titleFont : 'hand', color: dark, lineHeight: 1.03 })
    if (mode === 'filled') text(recipe.subtitle, 19, 66, 118, 4.1, { color: sage })
    section('section-title', 'Title block', 16, 14, 123, 61, elements.splice(start))
    start = elements.length
    const labels = [t.prep, t.cook, t.serves]
    ;[recipe.prep, recipe.cook, recipe.serves].forEach((value, i) => {
      const x = 19 + i * 40
      text(labels[i], x, 79, 34, georgian ? 4.2 : 5.1, { font: titleFont, color: sage })
      if (mode === 'filled') text(value, x, 87, 34, 4.4, { color: dark })
      else line(x, 94, 30)
    })
    section('section-metadata', 'Prep, cook and serves', 17, 77, 123, 20, elements.splice(start))
    start = elements.length
    heading(t.ingredients, 18, 102, 174, true)
    const ingredientRows: ScenePrimitive[][] = []
    const rows = Math.ceil(recipe.ingredients.length / 2), gap = Math.min(8.1, 53 / Math.max(rows - 1, 1))
    recipe.ingredients.forEach((value, i) => {
      const rowStart = elements.length, col = Math.floor(i / rows), row = i % rows
      const x = 18 + col * 91, y = 123 + row * gap
      elements.push({ type: 'circle', x: x + 1.2, y, r: .9, fill: sage })
      if (mode === 'filled') body(value, x + 5, y, 77, georgian ? 3.8 : 4, 2, 4.4, true, georgian ? 'georgianIngredients' : 'hand')
      if (mode === 'blank' || recipe.writingLines) line(x + 5, y + 3, 77)
      ingredientRows.push(elements.splice(rowStart) as ScenePrimitive[])
    })
    section('section-ingredients', 'Ingredients section', 16, 100, 178, 79, [...elements.splice(start), { type: 'list', ordered: false, label: t.ingredients, items: ingredientRows }])
    start = elements.length
    heading(t.instructions, 18, 185, 111)
    const instructionHeading = elements.splice(start), stepRows: ScenePrimitive[][] = []
    const stepGap = Math.min(10.2, 77 / Math.max(recipe.steps.length - 1, 1))
    recipe.steps.forEach((value, i) => {
      const rowStart = elements.length, y = 207 + i * stepGap
      text(String(i + 1).padStart(2, '0'), 18, y - 3, 9, 5.5, { color: lavender, font: 'hand' })
      if (mode === 'filled') body(value, 30, y, 98, Math.min(georgian ? 3.8 : 3.9, stepGap * .42), 2, Math.min(4.2, stepGap / 2.2), true)
      if (mode === 'blank' || recipe.writingLines) line(30, y + 3.2, 98)
      stepRows.push(elements.splice(rowStart) as ScenePrimitive[])
    })
    section('section-instructions', 'How to make section', 16, 183, 115, 104, [...instructionHeading, { type: 'list', ordered: true, label: t.instructions, items: stepRows }])
    start = elements.length
    heading(t.notes, 141, 185, 51)
    if (mode === 'filled') body(recipe.notes, 141, 205, 50, georgian ? 3.8 : 4, 5, 5)
    else for (let i = 0; i < 3; i++) line(141, 209 + i * 7, 50)
    section('section-notes', 'Notes section', 139, 183, 55, 47, elements.splice(start))
    image('single-roll.png', 143, 10, 67, 65, 8)
    image('cinnamon-sticks.png', 176, 56, 37, 20, -8)
    image('roll-plate.png', 131, 222, 91, 65, -8)
    image('icing-bowl.png', 179, 260, 29, 30, -7)
    const art = elements.filter((item): item is Extract<ScenePrimitive, { type: 'image' }> => item.type === 'image' && !!item.id).sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
    return tint([...elements.filter(item => item.type !== 'image' || !item.id), ...art])
  }

  const titleStart = elements.length
  brush(16, 57, 95, 10, -8)
  text(recipe.title, 14, georgian ? 25 : 19, 98, georgian ? 21 : 27, { font: georgian ? titleFont : 'hand', align: 'center', rotate: -8, stroke: georgian ? 0 : .22 })
  if (mode === 'filled') text(recipe.subtitle, 22, 59, 80, georgian ? 4.2 : 3.8, { align: 'center', rotate: -8 })
  section('section-title', 'Title block', 10, 18, 103, 53, elements.splice(titleStart))

  image('half-sandwich.png', 155, -20, 85, 91, 32)
  image('tomato.png', 126, 17, 28, 29, 12)
  image('tomato-slices.png', 11, 7, 24, 19, -15)

  const metadataStart = elements.length
  const meta = [
    { label: 'PREP', value: recipe.prep, x: 112, path: 'M 6 13.87 A 4 4 0 1 1 7.34 6.14 A 5 5 0 0 1 16.66 6.14 A 4 4 0 1 1 18 13.87 V 21 H 6 Z M 6 17 H 18' },
    { label: 'COOK', value: recipe.cook, x: 137, path: 'M 22 12 A 10 10 0 1 1 2 12 A 10 10 0 1 1 22 12 Z M 12 6 V 12 L 16 14' },
    { label: 'SERVES', value: recipe.serves, x: 162, path: 'M 16 7 A 4 4 0 1 1 8 7 A 4 4 0 1 1 16 7 Z M 4 21 V 20 A 8 8 0 0 1 20 20 V 21 Z' },
  ]
  for (const item of meta) {
    // Small metadata icons are vector UI symbols; all food and coloring artwork is PNG.
    elements.push({ type: 'icon', path: item.path, x: item.x + 5.2, y: 59.4, w: 8.6, h: 8.6 })
    text(georgian ? [t.prep, t.cook, t.serves][meta.indexOf(item)] : item.label, item.x, 69, 19, georgian ? 3.9 : 5, { font: titleFont, align: 'center' })
    text(mode === 'filled' ? item.value : '', item.x, 76, 19, 4.2, { align: 'center' })
    line(item.x, 82, 19, ink, .28)
  }
  section('section-metadata', 'Prep, cook and serves', 110, 58, 76, 27, elements.splice(metadataStart))

  const headingStart = elements.length
  brush(10, 83, 78, 14)
  text(t.ingredients, 19, 84, 64, georgian ? 8.8 : 10, { font: georgian ? 'georgianIngredients' : 'hand', stroke: georgian ? 0 : .08 })
  const ingredientHeading = elements.splice(headingStart)
  brush(94, 83, 98, 14)
  text(t.instructions, 103, 84, 85, georgian ? 8.3 : 10, { stroke: georgian ? 0 : .08 })
  const instructionHeading = elements.splice(headingStart)
  brush(103, 206, 75, 14)
  text(t.notes, 109, 207, 59, georgian ? 8.5 : 9.5, { stroke: georgian ? 0 : .08 })
  const notesHeading = elements.splice(headingStart)

  const ingredientGap = Math.min(12, 76 / Math.max(recipe.ingredients.length - 1, 1))
  const stepGap = Math.min(14, 84 / Math.max(recipe.steps.length - 1, 1))
  const ingredientRadius = Math.min(3.4, ingredientGap * .32)
  const stepRadius = Math.min(4.5, stepGap * .36)
  const ingredients: ScenePrimitive[][] = []
  for (let i = 0; i < recipe.ingredients.length; i++) {
    const start = elements.length
    const y = 112 + i * ingredientGap
    const centerY = y - 1
    const leading = Math.min(4.6, ingredientGap / 2)
    elements.push({ type: 'circle', x: 19.4, y: centerY, r: ingredientRadius, fill: peach })
    const lines = mode === 'filled' ? body(recipe.ingredients[i], 28, centerY, 58, Math.min(georgian ? 4.2 : 4.1, ingredientGap * .44), ingredientGap < 7 ? 1 : 2, leading, true, georgian ? 'georgianIngredients' : 'hand') : 1
    for (let row = 0; row < lines; row++) line(27.5, centerY + leading / 2 + .25 + row * leading, 59.5)
    ingredients.push(elements.splice(start) as ScenePrimitive[])
  }
  section('section-ingredients', 'Ingredients section', 9, 81, 83, 109, [...ingredientHeading, { type: 'list', ordered: false, label: t.ingredients, items: ingredients }])
  const instructions: ScenePrimitive[][] = []
  for (let i = 0; i < recipe.steps.length; i++) {
    const start = elements.length
    const y = 112 + i * stepGap
    elements.push({ type: 'circle', x: 104.5, y: y - 1, r: stepRadius, fill: coral, stroke: '#ffffff' })
    const numberSize = stepRadius * 1.53
    text(String(i + 1), 100, y - 1 - numberSize * .625, 9, numberSize, { font: 'hand', color: '#ffffff', align: 'center' })
    const nearCheese = mode === 'filled' && y >= 175 && !recipe.artwork['cheese-0']?.hidden
    const leading = nearCheese ? Math.min(3.8, stepGap / 3) : Math.min(5.2, stepGap / 2.25)
    const width = nearCheese ? 53 : 81
    const lines = mode === 'filled' ? body(recipe.steps[i], 115, y - 1, width, Math.min(nearCheese ? 3.8 : georgian ? 4.6 : 4.4, stepGap * .42), nearCheese ? 3 : 2, leading, true) : 1
    for (let row = 0; row < lines; row++) line(114.5, y - 1 + leading / 2 + .25 + row * leading, nearCheese ? 54 : 82)
    instructions.push(elements.splice(start) as ScenePrimitive[])
  }
  section('section-instructions', 'How to make section', 94, 81, 109, 122, [...instructionHeading, { type: 'list', ordered: true, label: t.instructions, items: instructions }])
  const notesStart = elements.length
  for (let i = 0; i < 3; i++) line(109, 230 + i * 8.5, 78)
  if (mode === 'filled') body(recipe.notes, 109, 223, 77, georgian ? 4.5 : 4.1, 3, 8.5)
  section('section-notes', 'Notes section', 103, 204, 91, 52, [...notesHeading, ...elements.splice(notesStart)])

  image('whole-sandwich.png', -13, 188, 121, 111, -3)
  image('tomato.png', 63, 262, 31, 31, 15)
  image('cheese.png', 190, 227, 37, 43, -7)
  image('tomato-slices.png', 103, 272, 30, 23, -12)
  image('cucumber.png', 150, 260, 25, 28, -17)
  image('cucumber.png', 157, 269, 26, 28, 12)
  image('sauce.png', 176, 261, 38, 36, 3)
  const artwork = elements.filter((item): item is Extract<ScenePrimitive, { type: 'image' }> => item.type === 'image' && !!item.id).sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
  return tint([...elements.filter(item => item.type !== 'image' || !item.id), ...artwork])
}

export const coloringScene = (recipe?: Recipe): SceneElement[] => [
  { type: 'rect', x: 0, y: 0, w: 210, h: 297, fill: '#ffffff' },
  { type: 'image', src: `/illustrations/${recipe?.id ?? 'sandwich'}/kids/coloring-a4.png`, x: 0, y: 0, w: 210, h: 297 },
]
