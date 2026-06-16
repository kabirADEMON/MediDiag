import { useState, useEffect, useRef, useLayoutEffect } from 'react'
import { createPortal } from 'react-dom'
import { Search, X } from 'lucide-react'
import { cn } from '@/utils/helpers'

export function Autocomplete({
  label,
  placeholder = 'Rechercher...',
  suggestions = [],
  onSelect,
  loading = false,
  error,
  helperText,
  required = false,
  className,
  containerClassName,
}) {
  const [inputValue, setInputValue] = useState('')
  const [filteredSuggestions, setFilteredSuggestions] = useState([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(0)
  const [dropdownPos, setDropdownPos] = useState(null)
  const wrapperRef = useRef(null)
  const portalRef = useRef(null)

  useEffect(() => {
    if (inputValue.length > 0) {
      const filtered = suggestions.filter(s =>
        s.toLowerCase().includes(inputValue.toLowerCase())
      )
      setFilteredSuggestions(filtered)
      setShowSuggestions(true)
    } else {
      setFilteredSuggestions([])
      setShowSuggestions(false)
    }
  }, [inputValue, suggestions])

  // Recalculate dropdown position every time it opens or list changes
  useLayoutEffect(() => {
    if (showSuggestions && wrapperRef.current) {
      const rect = wrapperRef.current.getBoundingClientRect()
      setDropdownPos({ top: rect.bottom + 4, left: rect.left, width: rect.width })
    }
  }, [showSuggestions, filteredSuggestions.length])

  // Close on outside click — check both wrapper and portal
  useEffect(() => {
    function handleClickOutside(e) {
      const inWrapper = wrapperRef.current?.contains(e.target)
      const inPortal  = portalRef.current?.contains(e.target)
      if (!inWrapper && !inPortal) setShowSuggestions(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSelect = (suggestion) => {
    setInputValue('')
    setShowSuggestions(false)
    onSelect(suggestion)
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      if (filteredSuggestions.length > 0) {
        handleSelect(filteredSuggestions[activeSuggestionIndex])
      } else if (inputValue.trim()) {
        onSelect(inputValue.trim())
        setInputValue('')
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveSuggestionIndex(i => Math.max(0, i - 1))
    } else if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveSuggestionIndex(i => Math.min(filteredSuggestions.length - 1, i + 1))
    } else if (e.key === 'Escape') {
      setShowSuggestions(false)
    }
  }

  // Portal dropdown — rendered at document.body, escapes any overflow-hidden ancestor
  const dropdown = (
    <div
      ref={portalRef}
      style={{
        position: 'fixed',
        top: dropdownPos?.top ?? 0,
        left: dropdownPos?.left ?? 0,
        width: dropdownPos?.width ?? 'auto',
        zIndex: 9999,
      }}
      className="bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden"
    >
      {loading ? (
        <div className="px-4 py-3 text-sm text-slate-400 text-center">Chargement...</div>
      ) : filteredSuggestions.length > 0 ? (
        <div className="max-h-56 overflow-y-auto">
          {filteredSuggestions.map((s, i) => (
            <button
              key={i}
              type="button"
              onMouseDown={e => { e.preventDefault(); handleSelect(s) }}
              className={cn(
                'w-full text-left px-4 py-2.5 text-sm transition-colors',
                i === activeSuggestionIndex
                  ? 'bg-indigo-50 text-indigo-700 font-medium'
                  : 'text-slate-700 hover:bg-slate-50'
              )}
            >
              {s}
            </button>
          ))}
        </div>
      ) : inputValue ? (
        <div className="px-4 py-3 text-sm text-slate-400 text-center">
          Aucun résultat — appuyez sur Entrée pour ajouter "{inputValue}"
        </div>
      ) : null}
    </div>
  )

  return (
    <div className={cn('w-full', containerClassName)} ref={wrapperRef}>
      {label && (
        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
          {label}
          {required && <span className="text-red-500 ml-1 normal-case">*</span>}
        </label>
      )}

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
        <input
          type="text"
          value={inputValue}
          onChange={e => { setInputValue(e.target.value); setActiveSuggestionIndex(0) }}
          onKeyDown={handleKeyDown}
          onFocus={() => inputValue && setShowSuggestions(true)}
          placeholder={placeholder}
          className={cn(
            'w-full pl-9 pr-9 py-2.5 rounded-xl border text-sm text-slate-900 placeholder-slate-300',
            'focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all',
            error ? 'border-red-300 bg-red-50' : 'border-slate-200 bg-white hover:border-slate-300',
            className
          )}
        />
        {inputValue && (
          <button
            type="button"
            onClick={() => setInputValue('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {showSuggestions && dropdownPos && createPortal(dropdown, document.body)}

      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
      {helperText && !error && <p className="mt-1 text-xs text-slate-400">{helperText}</p>}
    </div>
  )
}

export default Autocomplete
