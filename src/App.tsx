import { useEffect, useMemo, useState } from 'react'
import { ArrowDownToLine, ArrowLeft, ArrowRight, BookOpen, BringToFront, Check, ChevronDown, Copy, FileText, Heart, LoaderCircle, Move, Pencil, Printer, RotateCcw, SendToBack, Trash2 } from 'lucide-react'
import { PrintPreview } from './components/PrintPreview'
import { RecipeEditor } from './components/RecipeEditor'
import { A4Page } from './components/Page'
import { defaultRecipe, readSavedRecipe, storageKey, recipeCatalog } from './data/recipe'
import type { ArtworkPosition, ExportKind, FrameStyle, RecipeId, Language, PageKind, Recipe, RecipeMode } from './data/recipe'
import { translations } from './data/i18n'
import { flattenScene, recipeScene } from './data/layout'

export default function App() {
  const [language, setLanguage] = useState<Language>(() => { try { return localStorage.getItem('cook-color-language') === 'ka' ? 'ka' : 'en' } catch { return 'en' } })
  const [recipeId, setRecipeId] = useState<RecipeId>('cinnamon')
  const [library, setLibrary] = useState(() => Object.fromEntries(recipeCatalog.map(({ id }) => [id, { en: readSavedRecipe('en', id), ka: readSavedRecipe('ka', id) }])) as Record<RecipeId, Record<Language, Recipe>>)
  const recipes = library[recipeId]
  const setRecipes = (update: (previous: Record<Language, Recipe>) => Record<Language, Recipe>) => setLibrary(previous => ({ ...previous, [recipeId]: update(previous[recipeId]) }))
  const [bookItems, setBookItems] = useState<RecipeId[]>(['sandwich', 'cinnamon'])
  const [bookKind, setBookKind] = useState<ExportKind>('both')
  const [pageNumbers, setPageNumbers] = useState(false)
  const [bookName, setBookName] = useState('My family cookbook')
  const [savedBooks, setSavedBooks] = useState<{ name: string; items: RecipeId[]; kind: ExportKind; numbered: boolean }[]>(() => { try { return JSON.parse(localStorage.getItem('cook-color-books') || '[]') } catch { return [] } })
  const [buildingBook, setBuildingBook] = useState(false)
  const saveBook = () => { const next = [...savedBooks.filter(book => book.name !== bookName), { name: bookName || 'My cookbook', items: bookItems, kind: bookKind, numbered: pageNumbers }]; setSavedBooks(next); localStorage.setItem('cook-color-books', JSON.stringify(next)) }
  async function downloadBook() {
    setBuildingBook(true); setError(false)
    try { const { downloadCookbook } = await import('./lib/exportPdf'); await downloadCookbook(bookItems.map(id => library[id][language]), mode, bookKind, pageNumbers, bookName); setNotice('Your cookbook is ready.') }
    catch (cause) { console.error(cause); setError(true); setNotice(t.exportError) }
    finally { setBuildingBook(false) }
  }
  const recipe = recipes[language]
  const t = translations.en
  const setRecipe = (value: Recipe) => setRecipes(previous => ({ ...previous, [language]: value }))
  const [page, setPage] = useState<PageKind>('recipe')
  const [mode, setMode] = useState<RecipeMode>('blank')
  const [zoom, setZoom] = useState(1)
  const [editing, setEditing] = useState(false)
  const [arranging, setArranging] = useState(false)
  const [selectedObject, setSelectedObject] = useState<string | null>(null)
  const updateObject = (id: string, patch: Partial<ArtworkPosition>) => setRecipes(previous => {
    const artwork = { ...previous[language].artwork, [id]: { ...(previous[language].artwork[id] ?? { dx: 0, dy: 0 }), ...patch } }
    return { en: { ...previous.en, artwork }, ka: { ...previous.ka, artwork } }
  })
  const moveObject = (id: string, dx: number, dy: number) => updateObject(id, { dx, dy })
  const selectedArtwork = useMemo(() => flattenScene(recipeScene(recipe, mode)).find(item => item.type === 'image' && item.id === selectedObject), [recipe, mode, selectedObject])
  const selectedSection = useMemo(() => recipeScene(recipe, mode).find(item => item.type === 'section' && item.id === selectedObject), [recipe, mode, selectedObject])
  const layerOrder = (front: boolean) => {
    if (!selectedObject) return
    const orders = flattenScene(recipeScene(recipe, mode)).filter(item => item.type === 'image' && !!item.id).map(item => item.type === 'image' ? item.order ?? 0 : 0)
    updateObject(selectedObject, { order: front ? Math.max(...orders) + 1 : Math.min(...orders) - 1 })
  }
  const setFrame = (frame: FrameStyle) => setRecipes(previous => ({ en: { ...previous.en, frame }, ka: { ...previous.ka, frame } }))
  const copyObject = () => {
    if (!selectedObject || selectedArtwork?.type !== 'image') return
    const id = `${selectedArtwork.sourceId}-copy-${crypto.randomUUID()}`
    updateObject(id, { ...recipe.artwork[selectedObject], sourceId: selectedArtwork.sourceId, dx: (selectedArtwork.offsetX ?? 0) + 6, dy: (selectedArtwork.offsetY ?? 0) + 6, rotation: selectedArtwork.rotate, scale: selectedArtwork.scale, order: Math.max(...flattenScene(recipeScene(recipe, mode)).filter(item => item.type === 'image').map(item => item.type === 'image' ? item.order ?? 0 : 0)) + 1 })
    setSelectedObject(id)
  }
  const deleteObject = () => { if (selectedObject) { updateObject(selectedObject, { hidden: true }); setSelectedObject(null) } }
  const resetArtwork = () => setRecipes(previous => ({ en: { ...previous.en, artwork: structuredClone(defaultRecipe('en', recipeId).artwork) }, ka: { ...previous.ka, artwork: structuredClone(defaultRecipe('ka', recipeId).artwork) } }))
  const [exporting, setExporting] = useState<ExportKind | null>(null)
  const [notice, setNotice] = useState('')
  const [error, setError] = useState(false)
  useEffect(() => { try { for (const { id } of recipeCatalog) for (const key of ['en', 'ka'] as const) localStorage.setItem(storageKey(key, id), JSON.stringify(library[id][key])) } catch { /* Export remains available with storage disabled. */ } }, [library])
  useEffect(() => { document.documentElement.lang = 'en'; try { localStorage.setItem('cook-color-language', language) } catch { /* Language still switches without storage. */ } }, [language])
  useEffect(() => { if (!notice) return; const timeout = setTimeout(() => setNotice(''), 6000); return () => clearTimeout(timeout) }, [notice])

  async function download(kind: ExportKind) {
    setExporting(kind); setError(false); setNotice('')
    try {
      const { downloadPdf } = await import('./lib/exportPdf')
      await downloadPdf(kind, recipe, mode)
      setNotice(kind === 'both' ? t.setReady : t.pageReady)
    } catch (cause) {
      console.error('PDF export failed', cause)
      setError(true); setNotice(t.exportError)
    } finally { setExporting(null) }
  }

  return <>
    <header className="app-header"><a className="brand" href="/" aria-label="Cook and Color home"><BookOpen size={24} strokeWidth={1.5} /><span>{t.brand}</span></a><div className="header-right"><div className="header-caption">{t.caption}<Heart size={14} /></div><div className="language-choice"><span>Cookbook language</span><div className="language-toggle" role="group" aria-label="Cookbook language"><button aria-pressed={language === 'en'} onClick={() => setLanguage('en')}>EN</button><button aria-pressed={language === 'ka'} onClick={() => setLanguage('ka')}>ქართული</button></div></div></div></header>
    <div className="studio">
      <aside className="sidebar">
        <div className="recipe-intro"><span className="collection-link"><ArrowLeft size={13} /> {t.cookbook}</span><label className="frame-select">Choose recipe<select aria-label="Choose recipe" value={recipeId} onChange={event => { setRecipeId(event.target.value as RecipeId); setSelectedObject(null) }}>{recipeCatalog.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label><h1>{recipeCatalog.find(item => item.id === recipeId)?.name}</h1><p>{t.intro1}<br />{t.intro2}</p>{recipeId === 'cinnamon' && <a className="recipe-source" href="https://sallysbakingaddiction.com/easy-cinnamon-rolls-from-scratch/" target="_blank" rel="noreferrer">Recipe source: Sally’s Baking</a>}</div>
        <section className="sidebar-section"><h2>{t.pair}</h2><div className="page-list">
          <button className={`page-option ${page === 'recipe' ? 'selected' : ''}`} onClick={() => setPage('recipe')} aria-pressed={page === 'recipe'}><span className="mini-page mini-recipe"><img src={recipeId === 'cinnamon' ? '/illustrations/cinnamon/parent/single-roll.png' : '/illustrations/sandwich/parent/whole-sandwich.png'} alt="" /></span><span><strong>{t.recipePage}</strong><small>{t.kitchen}</small></span><span className="selection-dot">{page === 'recipe' && <Check size={12} />}</span></button>
          <button className={`page-option ${page === 'coloring' ? 'selected' : ''}`} onClick={() => setPage('coloring')} aria-pressed={page === 'coloring'}><span className="mini-page"><img src={`/illustrations/${recipeId}/kids/coloring-a4.png`} alt="" /></span><span><strong>{t.coloringPage}</strong><small>{t.hands}</small></span><span className="selection-dot">{page === 'coloring' && <Check size={12} />}</span></button>
        </div></section>
        <section className="sidebar-section template-options"><h2>{t.recipeStyle}</h2><div className="segmented-control" role="group" aria-label={t.recipeStyle}><button aria-pressed={mode === 'blank'} className={mode === 'blank' ? 'active' : ''} onClick={() => setMode('blank')}>{t.blank}</button><button aria-pressed={mode === 'filled'} className={mode === 'filled' ? 'active' : ''} onClick={() => setMode('filled')}>{t.filled}</button></div><p className="option-description">{mode === 'blank' ? t.blankDescription : t.filledDescription}</p><button className="button edit-button" onClick={() => setEditing(true)}><Pencil size={15} /> {t.edit}<ArrowRight size={14} /></button><label className="guides-toggle"><span>{t.guides}</span><input type="checkbox" checked={recipe.writingLines} onChange={event => setRecipe({ ...recipe, writingLines: event.target.checked })} /></label><label className="guides-toggle"><span>Notes section</span><input type="checkbox" checked={!recipe.artwork['section-notes']?.hidden} onChange={event => updateObject('section-notes', { hidden: !event.target.checked })} /></label>{recipe.artwork['section-notes']?.hidden && <button className="text-button add-notes" onClick={() => updateObject('section-notes', { hidden: false })}>+ Add Notes section</button>}<label className="frame-select">Page frame<select aria-label="Page frame" value={recipe.frame} onChange={event => setFrame(event.target.value as FrameStyle)}><option value="none">No frame</option><option value="line">Fine line</option><option value="double">Double line</option><option value="corners">Corner details</option><option value="paint">Paint corners</option><option value="gingham">Gingham ribbon</option></select></label><button className="text-button reference-layout" onClick={() => { resetArtwork(); setSelectedObject(null); setNotice('Reference layout applied.') }}>Apply reference layout</button><button className={`button edit-button arrange-button ${arranging ? 'is-arranging' : ''}`} aria-pressed={arranging} onClick={() => { setArranging(!arranging); setPage('recipe') }}><Move size={15} />{arranging ? 'Finish arranging' : 'Arrange artwork'}</button>{arranging && <div className="arrange-help"><p>Drag an object or a section.<br />Use arrow keys for small adjustments.</p>{selectedArtwork?.type === 'image' && selectedObject && <div className="object-inspector"><strong>{selectedArtwork.label}</strong><label>Rotation <output>{Math.round(selectedArtwork.rotate ?? 0)}°</output><input aria-label="Artwork rotation" type="range" min="-180" max="180" value={selectedArtwork.rotate ?? 0} onChange={event => updateObject(selectedObject, { rotation: Number(event.target.value) })} /></label><label>Size <output>{Math.round((selectedArtwork.scale ?? 1) * 100)}%</output><input aria-label="Artwork size" type="range" min="25" max="200" value={(selectedArtwork.scale ?? 1) * 100} onChange={event => updateObject(selectedObject, { scale: Number(event.target.value) / 100 })} /></label><div className="object-actions"><button onClick={copyObject}><Copy size={13} /> Copy</button><button onClick={deleteObject}><Trash2 size={13} /> Delete</button></div><div className="object-actions layer-actions"><button onClick={() => layerOrder(true)} title="Bring to front"><BringToFront size={13} /> To front</button><button onClick={() => layerOrder(false)} title="Send to back"><SendToBack size={13} /> To back</button></div></div>}{selectedSection?.type === 'section' && selectedObject && <div className="section-inspector"><strong>{selectedSection.label}</strong><button className="text-button" onClick={() => updateObject(selectedObject, { dx: 0, dy: 0 })}><RotateCcw size={12} /> Reset position</button>{selectedObject === 'section-notes' && <button className="text-button" onClick={deleteObject}><Trash2 size={12} /> Delete Notes section</button>}</div>}<button className="text-button" onClick={() => { resetArtwork(); setSelectedObject(null) }}><RotateCcw size={12} /> Reset layout</button></div>}</section>
        <section className="sidebar-section cookbook-builder"><h2>Build a cookbook</h2><p>Choose the recipes to include. Each selection uses your current edits in the chosen cookbook language.</p><label className="field">Book name<input value={bookName} onChange={event => setBookName(event.target.value)} maxLength={60} /></label>{recipeCatalog.map(item => <label className="guides-toggle" key={item.id}><span>{item.name}</span><input type="checkbox" checked={bookItems.includes(item.id)} onChange={event => setBookItems(previous => event.target.checked ? [...previous, item.id] : previous.filter(id => id !== item.id))} /></label>)}<label className="frame-select">Include<select aria-label="Cookbook pages" value={bookKind} onChange={event => setBookKind(event.target.value as ExportKind)}><option value="both">Recipe + coloring pages</option><option value="recipe">Recipe pages only</option><option value="coloring">Coloring pages only</option></select></label><label className="guides-toggle"><span>Page numbers</span><input type="checkbox" checked={pageNumbers} onChange={event => setPageNumbers(event.target.checked)} /></label><p>{bookItems.length} recipes · {bookItems.length * (bookKind === 'both' ? 2 : 1)} A4 pages</p><button className="button primary" disabled={!bookItems.length || buildingBook} onClick={downloadBook}>{buildingBook ? 'Preparing cookbook…' : 'Download cookbook PDF'}</button><button className="text-button" disabled={!bookItems.length} onClick={saveBook}>Save this cookbook selection</button>{savedBooks.length > 0 && <label className="frame-select">Saved cookbooks<select aria-label="Saved cookbooks" value="" onChange={event => { const book = savedBooks[Number(event.target.value)]; if (book) { setBookName(book.name); setBookItems(book.items.filter(id => recipeCatalog.some(item => item.id === id))); setBookKind(book.kind); setPageNumbers(book.numbered) } }}><option value="" disabled>Load a cookbook…</option>{savedBooks.map((book, i) => <option key={book.name} value={i}>{book.name}</option>)}</select></label>}</section>
        <section className="export-section"><h2>{t.keep}</h2><p>{t.ready}</p><button className="button primary download-both" onClick={() => download('both')} disabled={!!exporting}>{exporting === 'both' ? <LoaderCircle className="spin" size={17} /> : <ArrowDownToLine size={17} />}<span>{exporting === 'both' ? t.preparing : t.download}</span></button><div className="individual-exports"><button disabled={!!exporting} onClick={() => download('recipe')}><FileText size={14} /> {t.recipePdf}</button><button disabled={!!exporting} onClick={() => download('coloring')}><FileText size={14} /> {t.coloringPdf}</button></div><div className="print-spec"><span>{t.a4}</span><span>210 × 297 mm</span></div><p className="printing-tip">{t.actualSize}<br />{t.borderless}</p></section>
        <div className="sidebar-footer"><Heart size={13} /> {t.footer}</div>
      </aside>
      <main className="workspace">
        <div className="canvas-toolbar"><div className="page-tabs" role="group" aria-label="Preview page"><button className={page === 'recipe' ? 'active' : ''} aria-pressed={page === 'recipe'} onClick={() => setPage('recipe')}>{t.recipePage}</button><button className={page === 'coloring' ? 'active' : ''} aria-pressed={page === 'coloring'} onClick={() => setPage('coloring')}>{t.coloringPage}</button></div><div className="canvas-tools"><label className="zoom-select"><span className="sr-only">{t.zoom}</span><select value={zoom} onChange={event => setZoom(Number(event.target.value))}><option value={1}>{t.fit}</option><option value={.75}>75%</option><option value={1.25}>125%</option><option value={1.5}>150%</option></select><ChevronDown size={13} /></label><span className="toolbar-divider" /><button className="icon-button" onClick={() => window.print()} aria-label={t.print}><Printer size={17} /></button></div></div>
        <div className="canvas"><PrintPreview kind={page} recipe={recipe} mode={mode} zoom={zoom} editor={arranging && page === 'recipe' ? { selected: selectedObject, onSelect: setSelectedObject, onMove: moveObject } : undefined} /><div className="page-caption"><span>{page === 'recipe' ? `01 / ${t.recipePage}` : `02 / ${t.coloringPage}`}</span><span>A4 · {page === 'recipe' ? t.color : t.monochrome}</span></div></div>
      </main>
    </div>
    {notice && <div className={`toast ${error ? 'toast-error' : ''}`} role={error ? 'alert' : 'status'}>{!error && <Check size={16} />}{notice}</div>}
    {editing && <RecipeEditor recipe={recipe} onClose={() => setEditing(false)} onSave={value => { setRecipe(value); setMode('filled'); setPage('recipe'); setEditing(false); setNotice(t.updated) }} />}
    <div className="print-only"><A4Page kind="recipe" recipe={recipe} mode={mode} /><A4Page kind="coloring" recipe={recipe} mode={mode} /></div>
  </>
}
