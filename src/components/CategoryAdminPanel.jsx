import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  X,
  Save,
  Trash2,
  Plus,
  AlertTriangle,
  Loader2,
  CheckSquare,
  Square,
} from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useToast } from '../context/ToastContext'

function uid() {
  return crypto.randomUUID?.() ?? Math.random().toString(36).slice(2, 10)
}

/* ── Subcategory Card ── */

function SubcategoryEditor({ sub, onUpdate, onDelete }) {
  const [confirmDelete, setConfirmDelete] = useState(false)

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -40, transition: { duration: 0.2 } }}
      className="bg-dark-bg border border-surface-border rounded-xl p-3 space-y-3"
    >
      {/* Name + delete */}
      <div className="flex items-center gap-2">
        <input
          value={sub.name}
          onChange={(e) => onUpdate({ ...sub, name: e.target.value })}
          placeholder="Название подкатегории"
          className="flex-1 min-w-0 px-2.5 py-1.5 text-sm font-medium bg-card border border-surface-border rounded-lg text-gray-100 placeholder-gray-600 focus:outline-none focus:border-accent transition-colors"
        />
        {confirmDelete ? (
          <div className="flex gap-1 shrink-0">
            <button onClick={onDelete} className="px-2 py-1 text-xs bg-red-600 text-white rounded-lg">Да</button>
            <button onClick={() => setConfirmDelete(false)} className="px-2 py-1 text-xs bg-surface-hover text-gray-300 rounded-lg">Нет</button>
          </div>
        ) : (
          <button onClick={() => setConfirmDelete(true)} className="p-1.5 text-gray-500 hover:text-red-400 transition-colors shrink-0">
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Progress slider */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-500">Прогресс</span>
          <span className="text-sm font-bold text-emerald-400">{sub.progress}%</span>
        </div>
        <input
          type="range"
          min={0}
          max={100}
          value={sub.progress}
          onChange={(e) => onUpdate({ ...sub, progress: Number(e.target.value) })}
          className="w-full h-2 rounded-full appearance-none bg-gray-700 accent-emerald-500 cursor-pointer
            [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4
            [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-emerald-500
            [&::-webkit-slider-thumb]:shadow-[0_0_8px_rgba(16,185,129,0.4)]"
        />
      </div>

      {/* Workers + Done */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 flex-1">
          <span className="text-xs text-gray-500">Рабочих:</span>
          <input
            type="number"
            min={0}
            value={sub.workers || 0}
            onChange={(e) => onUpdate({ ...sub, workers: Math.max(0, Number(e.target.value)) })}
            className="w-16 px-2 py-1 text-sm bg-card border border-surface-border rounded-lg text-gray-200 focus:outline-none focus:border-accent transition-colors"
          />
        </div>
        <button
          onClick={() => onUpdate({ ...sub, done: !sub.done })}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs rounded-lg border transition-colors ${
            sub.done
              ? 'bg-emerald-600/20 border-emerald-600/50 text-emerald-400'
              : 'bg-card border-surface-border text-gray-400 hover:text-gray-200'
          }`}
        >
          {sub.done ? <CheckSquare className="w-3.5 h-3.5" /> : <Square className="w-3.5 h-3.5" />}
          Выполнено
        </button>
      </div>

      {/* Dates */}
      <div className="flex gap-2">
        <input
          type="date"
          value={sub.start_date || ''}
          onChange={(e) => onUpdate({ ...sub, start_date: e.target.value || null })}
          className="flex-1 px-2 py-1.5 text-xs bg-card border border-surface-border rounded-lg text-gray-300 focus:outline-none focus:border-accent transition-colors"
        />
        <input
          type="date"
          value={sub.end_date || ''}
          onChange={(e) => onUpdate({ ...sub, end_date: e.target.value || null })}
          className="flex-1 px-2 py-1.5 text-xs bg-card border border-surface-border rounded-lg text-gray-300 focus:outline-none focus:border-accent transition-colors"
        />
      </div>

      {/* TG link */}
      <input
        value={sub.telegram_link || ''}
        onChange={(e) => onUpdate({ ...sub, telegram_link: e.target.value })}
        placeholder="Telegram-ссылка — https://t.me/..."
        className="w-full px-2.5 py-1.5 text-xs bg-card border border-surface-border rounded-lg text-gray-200 placeholder-gray-600 focus:outline-none focus:border-accent transition-colors"
      />

      {/* Comment */}
      <textarea
        value={sub.comment || ''}
        onChange={(e) => onUpdate({ ...sub, comment: e.target.value })}
        placeholder="Комментарий менеджера..."
        rows={2}
        className="w-full px-2.5 py-1.5 text-xs bg-card border border-surface-border rounded-lg text-gray-200 placeholder-gray-600 focus:outline-none focus:border-accent transition-colors resize-none"
      />
    </motion.div>
  )
}

/* ── Main ── */

export default function CategoryAdminPanel({ project, categoryId, onClose, onProjectUpdated }) {
  const { addToast } = useToast()
  const categories = project.settings?.categories || []
  const catIndex = categories.findIndex((c) => c.id === categoryId)
  const category = categories[catIndex]

  const [catName, setCatName] = useState(category?.name || '')
  const [catStartDate, setCatStartDate] = useState(category?.start_date || '')
  const [catEndDate, setCatEndDate] = useState(category?.end_date || '')
  const [subcategories, setSubcategories] = useState(
    () => (category?.subcategories || []).map((s) => ({ ...s }))
  )
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (category) {
      setCatName(category.name)
      setCatStartDate(category.start_date || '')
      setCatEndDate(category.end_date || '')
      setSubcategories((category.subcategories || []).map((s) => ({ ...s })))
    }
  }, [category])

  function updateSub(id, updated) {
    setSubcategories((prev) => prev.map((s) => (s.id === id ? updated : s)))
  }

  function deleteSub(id) {
    setSubcategories((prev) => prev.filter((s) => s.id !== id))
  }

  function addSub() {
    setSubcategories((prev) => [
      ...prev,
      {
        id: uid(),
        name: '',
        progress: 0,
        workers: 0,
        done: false,
        comment: '',
        telegram_link: '',
        start_date: null,
        end_date: null,
      },
    ])
  }

  async function handleSave() {
    setSaving(true)
    setError(null)

    const catProgress = subcategories.length > 0
      ? Math.round(subcategories.reduce((s, sub) => s + (sub.progress || 0), 0) / subcategories.length)
      : 0

    const updatedCategory = {
      ...category,
      name: catName,
      start_date: catStartDate || null,
      end_date: catEndDate || null,
      progress: catProgress,
      subcategories,
    }

    const updatedCategories = categories.map((c, i) =>
      i === catIndex ? updatedCategory : c
    )

    const overallProgress = updatedCategories.length > 0
      ? Math.round(updatedCategories.reduce((s, c) => s + (c.progress || 0), 0) / updatedCategories.length)
      : 0

    try {
      const { data, error: err } = await supabase
        .from('projects')
        .update({
          progress: overallProgress,
          settings: {
            ...project.settings,
            categories: updatedCategories,
          },
        })
        .eq('id', project.id)
        .select()
        .single()

      if (err) throw err
      onProjectUpdated(data)
      addToast('Категория сохранена')
      onClose()
    } catch (e) {
      setError(e.message)
      addToast(e.message, 'error')
    } finally {
      setSaving(false)
    }
  }

  if (!category) return null

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />

      <motion.aside
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="fixed inset-y-0 right-0 z-50 w-full max-w-lg bg-dark-bg border-l border-surface-border flex flex-col overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-surface-border shrink-0">
          <h2 className="text-lg font-bold truncate">Настройки: {catName}</h2>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-100 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-5 space-y-6">
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-900/30 border border-red-800 rounded-lg text-red-300 text-sm">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              {error}
            </div>
          )}

          {/* Category name */}
          <div className="space-y-1.5">
            <label className="text-xs text-gray-500 uppercase tracking-wide">Название категории</label>
            <input
              value={catName}
              onChange={(e) => setCatName(e.target.value)}
              className="w-full px-3 py-2.5 bg-card border border-surface-border rounded-xl text-gray-100 font-medium focus:outline-none focus:border-accent transition-colors"
            />
          </div>

          {/* Dates */}
          <div className="space-y-1.5">
            <label className="text-xs text-gray-500 uppercase tracking-wide">Даты</label>
            <div className="flex gap-2">
              <input
                type="date"
                value={catStartDate}
                onChange={(e) => setCatStartDate(e.target.value)}
                className="flex-1 px-3 py-2 text-sm bg-card border border-surface-border rounded-xl text-gray-300 focus:outline-none focus:border-accent transition-colors"
              />
              <input
                type="date"
                value={catEndDate}
                onChange={(e) => setCatEndDate(e.target.value)}
                className="flex-1 px-3 py-2 text-sm bg-card border border-surface-border rounded-xl text-gray-300 focus:outline-none focus:border-accent transition-colors"
              />
            </div>
          </div>

          {/* Subcategories */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs text-gray-500 uppercase tracking-wide">
                Подкатегории ({subcategories.length})
              </label>
              <button
                onClick={addSub}
                className="flex items-center gap-1 text-xs font-medium text-emerald-400 hover:text-emerald-300 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" /> Добавить
              </button>
            </div>

            <AnimatePresence initial={false}>
              {subcategories.map((sub) => (
                <SubcategoryEditor
                  key={sub.id}
                  sub={sub}
                  onUpdate={(updated) => updateSub(sub.id, updated)}
                  onDelete={() => deleteSub(sub.id)}
                />
              ))}
            </AnimatePresence>

            {subcategories.length === 0 && (
              <p className="text-sm text-gray-600 text-center py-4">Нет подкатегорий</p>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-surface-border shrink-0">
          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full flex items-center justify-center gap-2 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-xl transition-colors disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Сохранить
          </button>
        </div>
      </motion.aside>
    </>
  )
}
