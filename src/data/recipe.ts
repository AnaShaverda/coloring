export type AccentPalette = 'peach' | 'lavender' | 'berry' | 'blue'
export const accentPalettes = {
  peach: { name: 'Peach & coral', primary: '#d47a5b', secondary: '#f4b68d', pale: '#fce8d8' },
  lavender: { name: 'Lavender & sage', primary: '#9272ad', secondary: '#8caa75', pale: '#ece3f3' },
  berry: { name: 'Berry & rose', primary: '#b64d77', secondary: '#dd8b9f', pale: '#f8e2e9' },
  blue: { name: 'Blue & butter', primary: '#507da9', secondary: '#d9b957', pale: '#e0ecf5' },
} as const
export type RecipeId = 'sandwich' | 'cinnamon'
export const recipeCatalog: { id: RecipeId; name: string }[] = [{ id: 'sandwich', name: 'Sandwich' }, { id: 'cinnamon', name: 'Cinnamon Rolls' }]
export type Language = 'en' | 'ka'
export type ArtworkPosition = { dx: number; dy: number; rotation?: number; scale?: number; hidden?: boolean; sourceId?: string; order?: number }
export type FrameStyle = 'none' | 'line' | 'double' | 'corners' | 'paint' | 'gingham'
export type Recipe = {
  palette?: AccentPalette
  layoutVersion?: number
  id?: RecipeId
  language: Language
  title: string
  subtitle: string
  prep: string
  cook: string
  serves: string
  ingredients: string[]
  steps: string[]
  notes: string
  writingLines: boolean
  artwork: Record<string, ArtworkPosition>
  frame: FrameStyle
}

export type PageKind = 'recipe' | 'coloring'
export type RecipeMode = 'blank' | 'filled'
export type ExportKind = PageKind | 'both'

export const sandwichRecipe: Recipe = {
  language: 'en',
  title: 'SANDWICH',
  subtitle: 'A little crunch, a lot of goodness',
  prep: '10 min',
  cook: 'No cook',
  serves: '2',
  ingredients: [
    '4 slices seeded bread',
    '2 tbsp cream cheese or hummus',
    '4 crisp lettuce leaves',
    '1 ripe tomato, sliced',
    '½ cucumber, thinly sliced',
    '4 slices mild cheddar',
    '¼ red onion, thinly sliced',
    'A pinch of salt & black pepper',
  ],
  steps: [
    'Wash the lettuce, tomato and cucumber. Pat dry.',
    'Slice the tomato, cucumber and red onion.',
    'Lay the bread on a clean chopping board.',
    'Spread cream cheese or hummus on each slice.',
    'Add the lettuce, cheese and tomato.',
    'Layer on cucumber and a little red onion.',
    'Season gently and add the remaining bread.',
    'Cut in half, share and enjoy together!',
  ],
  notes: 'Make it yours: try avocado, grated carrot or your favorite spread. Best enjoyed fresh.',
  writingLines: true,
  artwork: {},
  frame: 'double',
}

export const georgianRecipe: Recipe = {
  language: 'ka',
  title: 'სენდვიჩი',
  subtitle: 'ცოტა ხრაშუნი, ბევრი გემო',
  prep: '10 წთ',
  cook: 'არ სჭირდება',
  serves: '2',
  ingredients: [
    '4 ნაჭერი მარცვლოვანი პური',
    '2 ს.კ. კრემყველი ან ჰუმუსი',
    'სალათის 4 ხრაშუნა ფოთოლი',
    '1 მწიფე პომიდორი',
    '½ კიტრი, თხლად დაჭრილი',
    'ჩედარის ყველის 4 ნაჭერი',
    '¼ წითელი ხახვი',
    'ცოტა მარილი და შავი პილპილი',
  ],
  steps: [
    'გარეცხე სალათი, პომიდორი და კიტრი. კარგად გააშრე.',
    'თხლად დაჭერი პომიდორი, კიტრი და წითელი ხახვი.',
    'პურის ნაჭრები სუფთა დაფაზე დაალაგე.',
    'თითოეულ ნაჭერს კრემყველი ან ჰუმუსი წაუსვი.',
    'დაამატე სალათი, ყველი და პომიდორი.',
    'ზემოდან კიტრი და ცოტა წითელი ხახვი დაალაგე.',
    'მოაყარე მარილი, პილპილი და პური დააფარე.',
    'შუაზე გაჭერი, გაუზიარე სხვებს და გემრიელად მიირთვი!',
  ],
  notes: 'სცადე ავოკადო, გახეხილი სტაფილო ან საყვარელი სოუსი. სენდვიჩი ახალმომზადებული უფრო გემრიელია.',
  writingLines: true,
  artwork: {},
  frame: 'double',
}

export const cinnamonRecipe: Recipe = {
  ...sandwichRecipe, id: 'cinnamon', layoutVersion: 2, palette: 'lavender', frame: 'gingham', title: 'CINNAMON ROLLS', subtitle: 'Soft swirls, warm from the oven',
  prep: '1h 40 min', cook: '25 min', serves: '10–12', writingLines: false,
  ingredients: ['344 g flour', '50 g sugar', '½ tsp salt', '180 ml whole milk', '43 g butter · dough', '7 g instant yeast', '1 large egg', '43 g butter · filling', '67 g brown sugar', '1 tbsp cinnamon', '113 g cream cheese', '28 g butter · icing', '80 g icing sugar', '1 tsp vanilla'],
  steps: ['Combine flour, sugar and salt.', 'Warm milk and butter to 43°C; stir in yeast.', 'Add liquids and egg. Knead 3–5 min; rest 10 min.', 'Roll to 36 × 20 cm. Add filling butter, sugar and cinnamon.', 'Roll up; cut 10–12 pieces. Place in a greased 25 cm pan.', 'Cover; let rise 60–90 min, until doubled.', 'Bake at 190°C for 24–27 min. Tent if browning quickly.', 'Beat icing ingredients; spread over slightly cooled rolls.'],
  notes: 'Use softened butter for filling and icing. Allow time for the dough to double.',
}
export const cinnamonGeorgianRecipe: Recipe = {
  ...cinnamonRecipe, language: 'ka', title: 'დარიჩინის რულეტები', subtitle: 'ფუმფულა და სურნელოვანი', prep: '1 სთ 40 წთ', cook: '25 წთ',
  ingredients: ['344 გ ფქვილი', '50 გ შაქარი', '½ ჩ.კ. მარილი', '180 მლ რძე', '43 გ კარაქი · ცომი', '7 გ სწრაფი საფუარი', '1 დიდი კვერცხი', '43 გ კარაქი · შიგთავსი', '67 გ ყავისფერი შაქარი', '1 ს.კ. დარიჩინი', '113 გ კრემყველი', '28 გ კარაქი · მინანქარი', '80 გ შაქრის პუდრა', '1 ჩ.კ. ვანილი'],
  steps: ['შეურიე ფქვილი, შაქარი და მარილი.', 'რძე და კარაქი 43°C-მდე გაათბე; საფუარი შეურიე.', 'დაამატე სითხე და კვერცხი. ზილე 3–5 წთ; დაასვენე 10 წთ.', 'გააბრტყელე 36 × 20 სმ-ზე. წაუსვი კარაქი, მოაყარე შაქარი და დარიჩინი.', 'გადაახვიე; დაჭერი 10–12 ნაწილად. ჩაალაგე ცხიმწასმულ 25 სმ ფორმაში.', 'დააფარე; აცალე ამოსვლა 60–90 წთ, გაორმაგებამდე.', 'აცხვე 190°C-ზე 24–27 წთ. საჭიროებისას ფოლგა დააფარე.', 'ათქვიფე მინანქრის მასალა; ოდნავ გაგრილებულ რულეტებს წაუსვი.'],
  notes: 'შიგთავსისა და მინანქრისთვის რბილი კარაქი გამოიყენე. ცომს გაორმაგება აცალე.',
}
export const defaultRecipe = (language: Language, id: RecipeId = 'sandwich'): Recipe => {
  if (id === 'cinnamon') return language === 'ka' ? cinnamonGeorgianRecipe : cinnamonRecipe
  return { ...(language === 'ka' ? georgianRecipe : sandwichRecipe), artwork: {
    'tomato-0': { dx: 0, dy: 0, hidden: true },
    'cheese-0': { dx: -20, dy: -52, scale: 1.15, rotation: -22 },
    'tomato-slices-1': { dx: -13, dy: 0 },
    'sauce-0': { dx: 0, dy: 5 },
    'section-metadata': { dx: 0, dy: -13 },
    'section-ingredients': { dx: -3, dy: -6 },
    'section-instructions': { dx: 2, dy: -4 },
    'section-notes': { dx: 6, dy: 12 },
  } }
}
export const storageKey = (language: Language, id: RecipeId = 'sandwich') => id === 'sandwich' ? (language === 'ka' ? 'cook-color-sandwich-ka-v1' : 'cook-color-sandwich-v1') : `cook-color-${id}-${language}-v1`

export function readSavedRecipe(language: Language = 'en', id: RecipeId = 'sandwich'): Recipe {
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(storageKey(language, id)) || 'null')
    if (!parsed || typeof parsed !== 'object') return defaultRecipe(language, id)
    const value = parsed as Record<string, unknown>
    const textKeys = ['title', 'subtitle', 'prep', 'cook', 'serves', 'notes'] as const
    if (!textKeys.every(key => typeof value[key] === 'string')) return defaultRecipe(language, id)
    if (!['ingredients', 'steps'].every(key => Array.isArray(value[key]) &&
      (value[key] as unknown[]).length > 0 && (value[key] as unknown[]).length <= 14 && (value[key] as unknown[]).every(item => typeof item === 'string'))) return defaultRecipe(language, id)
    const artwork: Record<string, ArtworkPosition> = {}
    if (value.artwork && typeof value.artwork === 'object') {
      for (const [key, point] of Object.entries(value.artwork)) {
        if (point && typeof point === 'object' && Number.isFinite(point.dx) && Number.isFinite(point.dy)) artwork[key] = {
          dx: point.dx, dy: point.dy,
          ...(Number.isFinite(point.rotation) ? { rotation: point.rotation } : {}),
          ...(Number.isFinite(point.scale) && point.scale >= .2 && point.scale <= 3 ? { scale: point.scale } : {}),
          ...(typeof point.hidden === 'boolean' ? { hidden: point.hidden } : {}),
          ...(typeof point.sourceId === 'string' ? { sourceId: point.sourceId } : {}),
          ...(Number.isFinite(point.order) ? { order: point.order } : {}),
        }
      }
    }
    if (id === 'cinnamon' && value.layoutVersion !== 2) {
      const shifts: Record<string, [number, number]> = { 'cinnamon-sticks-0': [-21, 22], 'roll-plate-0': [-3, 10], 'icing-bowl-0': [-36, -41] }
      for (const [key, point] of Object.entries(artwork)) {
        const shift = shifts[point.sourceId ?? key]
        if (shift) { point.dx += shift[0]; point.dy += shift[1] }
      }
    }
    return { ...parsed as Recipe, layoutVersion: id === 'cinnamon' ? 2 : undefined, language, id, palette: Object.keys(accentPalettes).includes(value.palette as string) ? value.palette as AccentPalette : defaultRecipe(language, id).palette, writingLines: typeof value.writingLines === 'boolean' ? value.writingLines : true, artwork, frame: ['none', 'line', 'double', 'corners', 'paint', 'gingham'].includes(value.frame as string) ? value.frame as FrameStyle : 'none' }
  } catch { return defaultRecipe(language, id) }
}
