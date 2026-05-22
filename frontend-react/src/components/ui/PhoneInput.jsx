import { useState, useEffect } from 'react'
import { parsePhoneNumber } from 'libphonenumber-js'

const COUNTRIES = [
  { code: 'CI', dial: '+225', flag: '🇨🇮', name: "Côte d'Ivoire" },
  { code: 'SN', dial: '+221', flag: '🇸🇳', name: 'Sénégal' },
  { code: 'CM', dial: '+237', flag: '🇨🇲', name: 'Cameroun' },
  { code: 'ML', dial: '+223', flag: '🇲🇱', name: 'Mali' },
  { code: 'BF', dial: '+226', flag: '🇧🇫', name: 'Burkina Faso' },
  { code: 'TG', dial: '+228', flag: '🇹🇬', name: 'Togo' },
  { code: 'BJ', dial: '+229', flag: '🇧🇯', name: 'Bénin' },
  { code: 'GN', dial: '+224', flag: '🇬🇳', name: 'Guinée' },
  { code: 'GH', dial: '+233', flag: '🇬🇭', name: 'Ghana' },
  { code: 'NG', dial: '+234', flag: '🇳🇬', name: 'Nigeria' },
  { code: 'FR', dial: '+33',  flag: '🇫🇷', name: 'France' },
  { code: 'BE', dial: '+32',  flag: '🇧🇪', name: 'Belgique' },
  { code: 'CH', dial: '+41',  flag: '🇨🇭', name: 'Suisse' },
  { code: 'MA', dial: '+212', flag: '🇲🇦', name: 'Maroc' },
  { code: 'DZ', dial: '+213', flag: '🇩🇿', name: 'Algérie' },
  { code: 'TN', dial: '+216', flag: '🇹🇳', name: 'Tunisie' },
]

function parseInitialValue(value) {
  if (!value) return { countryCode: 'CI', localNumber: '' }
  if (value.startsWith('+')) {
    const sorted = [...COUNTRIES].sort((a, b) => b.dial.length - a.dial.length)
    const country = sorted.find(c => value.startsWith(c.dial))
    if (country) {
      return { countryCode: country.code, localNumber: value.slice(country.dial.length) }
    }
  }
  return { countryCode: 'CI', localNumber: value }
}

function toE164(countryCode, localNumber) {
  if (!localNumber) return ''
  const country = COUNTRIES.find(c => c.code === countryCode) || COUNTRIES[0]
  const digits = localNumber.replace(/\D/g, '')
  if (!digits) return ''
  try {
    const parsed = parsePhoneNumber(country.dial + digits, countryCode)
    if (parsed.isValid()) return parsed.format('E.164')
  } catch {}
  return country.dial + digits
}

export function PhoneInput({ value = '', onChange, label, error, required, className = '' }) {
  const initial = parseInitialValue(value)
  const [countryCode, setCountryCode] = useState(initial.countryCode)
  const [localNumber, setLocalNumber] = useState(initial.localNumber)

  useEffect(() => {
    const parsed = parseInitialValue(value)
    setCountryCode(parsed.countryCode)
    setLocalNumber(parsed.localNumber)
  }, [value])

  const handleCountryChange = (e) => {
    const code = e.target.value
    setCountryCode(code)
    onChange?.(toE164(code, localNumber))
  }

  const handleLocalChange = (e) => {
    const local = e.target.value
    setLocalNumber(local)
    onChange?.(toE164(countryCode, local))
  }

  const country = COUNTRIES.find(c => c.code === countryCode) || COUNTRIES[0]

  return (
    <div className={className}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}{required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <div className={`flex rounded-lg border ${
        error ? 'border-red-500 ring-1 ring-red-500' : 'border-gray-300'
      } overflow-hidden focus-within:ring-2 focus-within:ring-primary-500/30 focus-within:border-primary-500 transition-colors`}>
        <select
          className="pl-2 pr-6 py-2 bg-gray-50 border-r border-gray-300 text-sm focus:outline-none cursor-pointer shrink-0"
          value={countryCode}
          onChange={handleCountryChange}
          title={country.name}
        >
          {COUNTRIES.map(c => (
            <option key={c.code} value={c.code}>
              {c.flag} {c.dial}
            </option>
          ))}
        </select>
        <input
          type="tel"
          className="flex-1 px-3 py-2 text-sm focus:outline-none bg-white placeholder-gray-400 min-w-0"
          placeholder="XX XX XX XX"
          value={localNumber}
          onChange={handleLocalChange}
        />
      </div>
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  )
}

export default PhoneInput
