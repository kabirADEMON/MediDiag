/**
 * Autocomplete Component
 * Reusable autocomplete input with suggestions
 */

import { useState, useEffect, useRef } from 'react'
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
  const wrapperRef = useRef(null)

  // Filter suggestions based on input
  useEffect(() => {
    console.log('🔍 Autocomplete - Input changed:', inputValue, 'Total suggestions:', suggestions.length)
    
    if (inputValue.length > 0) {
      const filtered = suggestions.filter((suggestion) =>
        suggestion.toLowerCase().includes(inputValue.toLowerCase())
      )
      console.log('✅ Filtered suggestions:', filtered.length, 'First 5:', filtered.slice(0, 5))
      setFilteredSuggestions(filtered)
      setShowSuggestions(true)
    } else {
      setFilteredSuggestions([])
      setShowSuggestions(false)
    }
  }, [inputValue, suggestions])

  // Close suggestions when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setShowSuggestions(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleInputChange = (e) => {
    setInputValue(e.target.value)
    setActiveSuggestionIndex(0)
  }

  const handleSuggestionClick = (suggestion) => {
    setInputValue('')
    setShowSuggestions(false)
    onSelect(suggestion)
  }

  const handleKeyDown = (e) => {
    // Enter key
    if (e.key === 'Enter') {
      e.preventDefault()
      if (filteredSuggestions.length > 0) {
        handleSuggestionClick(filteredSuggestions[activeSuggestionIndex])
      } else if (inputValue.trim()) {
        onSelect(inputValue.trim())
        setInputValue('')
      }
    }
    // Arrow up
    else if (e.key === 'ArrowUp') {
      e.preventDefault()
      if (activeSuggestionIndex > 0) {
        setActiveSuggestionIndex(activeSuggestionIndex - 1)
      }
    }
    // Arrow down
    else if (e.key === 'ArrowDown') {
      e.preventDefault()
      if (activeSuggestionIndex < filteredSuggestions.length - 1) {
        setActiveSuggestionIndex(activeSuggestionIndex + 1)
      }
    }
    // Escape
    else if (e.key === 'Escape') {
      setShowSuggestions(false)
    }
  }

  return (
    <div className={cn('w-full', containerClassName)} ref={wrapperRef}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}

      <div className="relative">
        <div className="relative">
          <input
            type="text"
            value={inputValue}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            onFocus={() => inputValue && setShowSuggestions(true)}
            placeholder={placeholder}
            className={cn(
              'w-full pl-10 pr-10 py-2 border rounded-lg transition-all',
              'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent',
              error ? 'border-red-500 focus:ring-red-500' : 'border-gray-300',
              className
            )}
          />
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          {inputValue && (
            <button
              type="button"
              onClick={() => setInputValue('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Suggestions dropdown */}
        {showSuggestions && filteredSuggestions.length > 0 && (
          <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
            {filteredSuggestions.map((suggestion, index) => (
              <button
                key={index}
                type="button"
                onClick={() => handleSuggestionClick(suggestion)}
                className={cn(
                  'w-full text-left px-4 py-2 hover:bg-primary-50 transition-colors',
                  index === activeSuggestionIndex && 'bg-primary-50'
                )}
              >
                {suggestion}
              </button>
            ))}
          </div>
        )}

        {/* No results */}
        {showSuggestions && inputValue && filteredSuggestions.length === 0 && (
          <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg p-4 text-center text-gray-500 text-sm">
            Aucune suggestion trouvée. Appuyez sur Entrée pour ajouter "{inputValue}"
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg p-4 text-center text-gray-500 text-sm">
            Chargement...
          </div>
        )}
      </div>

      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}

      {helperText && !error && (
        <p className="mt-1 text-sm text-gray-500">{helperText}</p>
      )}
    </div>
  )
}

export default Autocomplete
