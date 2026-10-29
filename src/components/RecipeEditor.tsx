import { useEffect, useRef, useState } from 'react'
import { Check, Plus, RotateCcw, Trash2, X } from 'lucide-react'
import type { Recipe } from '../data/recipe'
import { defaultRecipe } from '../data/recipe'
import { translations } from '../data/i18n'

export function RecipeEditor({ recipe, onSave, onClose }: { recipe: Recipe; onSave: (recipe: Recipe) => void; onClose: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null)
  const [draft, setDraft] = useState<Recipe>(() => structuredClone(recipe))
  const t = translations.en
  useEffect(() => { dialog.current?.showModal() }, [])
  const field = (key: keyof Pick<Recipe, 'title' | 'subtitle' | 'prep' | 'cook' | 'serves' | 'notes'>, label: string, maxLength: number) =>
    <label className="field" key={key}>{label}<input value={draft[key]} maxLength={maxLength} required={key === 'title'} onChange={event => setDraft({ ...draft, [key]: event.target.value })} /></label>
  return <dialog ref={dialog} className="editor-dialog" onCancel={onClose} onClick={event => { if (event.target === event.currentTarget) onClose() }}>
    <form onSubmit={event => { event.preventDefault(); onSave(draft) }}>
      <div className="dialog-heading"><div><h2>{t.editorTitle}</h2><p>{t.localSave}</p></div><button type="button" className="icon-button" aria-label={t.close} onClick={onClose}><X size={20} /></button></div>
      <div className="editor-content">
        {field('title', t.title, 40)}
        {field('subtitle', t.subtitle, 36)}
        <div className="meta-fields">{field('prep', t.prep, 12)}{field('cook', t.cook, 12)}{field('serves', t.serves, 8)}</div>
        <h3>{t.ingredients}</h3><p className="field-hint">{t.ingredientHint}</p>
        {draft.ingredients.map((value, index) => <div className="numbered-field" key={`ingredient-${index}`}><span>{index + 1}</span><input aria-label={`${t.ingredient} ${index + 1}`} maxLength={58} value={value} onChange={event => setDraft({ ...draft, ingredients: draft.ingredients.map((item, i) => i === index ? event.target.value : item) })} /><button type="button" className="icon-button remove-row" disabled={draft.ingredients.length === 1} aria-label={`Remove ingredient ${index + 1}`} onClick={() => setDraft({ ...draft, ingredients: draft.ingredients.filter((_, i) => i !== index) })}><Trash2 size={15} /></button></div>)}
        <button type="button" className="text-button add-row" disabled={draft.ingredients.length >= 14} onClick={() => setDraft({ ...draft, ingredients: [...draft.ingredients, ''] })}><Plus size={15} /> {t.addIngredient}</button>
        <h3>{t.instructions}</h3>
        {draft.steps.map((value, index) => <div className="numbered-field" key={`step-${index}`}><span>{index + 1}</span><textarea aria-label={`${t.step} ${index + 1}`} maxLength={85} rows={2} value={value} onChange={event => setDraft({ ...draft, steps: draft.steps.map((item, i) => i === index ? event.target.value : item) })} /><button type="button" className="icon-button remove-row" disabled={draft.steps.length === 1} aria-label={`Remove step ${index + 1}`} onClick={() => setDraft({ ...draft, steps: draft.steps.filter((_, i) => i !== index) })}><Trash2 size={15} /></button></div>)}
        <button type="button" className="text-button add-row" disabled={draft.steps.length >= 12} onClick={() => setDraft({ ...draft, steps: [...draft.steps, ''] })}><Plus size={15} /> {t.addStep}</button>
        {field('notes', t.notes, 130)}
      </div>
      <div className="dialog-footer"><button type="button" className="text-button" onClick={() => setDraft(structuredClone(defaultRecipe(recipe.language, recipe.id)))}><RotateCcw size={15} /> {t.reset}</button><button className="button primary" type="submit"><Check size={17} /> {t.save}</button></div>
    </form>
  </dialog>
}
