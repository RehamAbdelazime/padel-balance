import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'
import en from './locales/en'
import ar from './locales/ar'

// Import types to activate module augmentation and key-checking.
// This import has no runtime effect — it exists solely for type safety.
import './types'

const resources = {
  en: { translation: en },
  ar: { translation: ar },
} as const

/**
 * Keeps <html lang> and <html dir> in sync with the active language.
 * Called on every language change, including the initial detection.
 */
function syncDocumentAttributes(language: string): void {
  const lang = language.split('-')[0] ?? 'en'
  document.documentElement.lang = lang
  document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr'
}

// Register handler before init so it fires during initial language detection.
i18n.on('languageChanged', syncDocumentAttributes)

void i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    supportedLngs: ['en', 'ar'],
    interpolation: {
      escapeValue: false, // React handles XSS escaping
    },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
      lookupLocalStorage: 'padel-balance-lang',
    },
  })

export default i18n
