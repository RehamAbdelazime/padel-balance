import type en from './locales/en'

/**
 * Augments i18next's CustomTypeOptions so that `t('nav.dashboard')` is
 * type-checked against the English locale schema at compile time.
 */
declare module 'i18next' {
  interface CustomTypeOptions {
    defaultNS: 'translation'
    resources: {
      translation: typeof en
    }
  }
}

/**
 * Derives a union of all valid dot-notation key paths from the translation
 * schema. For example: 'nav.dashboard' | 'nav.players' | 'dashboard.title' | …
 *
 * Used to type `labelKey` in navigation items and anywhere a translation key
 * is stored in data (not called inline).
 */
type Leaves<T, K extends string = ''> = T extends Record<string, unknown>
  ? {
      [P in keyof T]: P extends string
        ? Leaves<T[P], K extends '' ? P : `${K}.${P}`>
        : never
    }[keyof T]
  : K

export type TranslationKey = Leaves<typeof en>
