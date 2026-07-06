import { useTranslation } from 'react-i18next'
import { Globe } from 'lucide-react'
import { Button } from '@/shared/components/ui/button'

/**
 * Toggles between English (LTR) and Arabic (RTL).
 * Document direction is updated automatically by the i18n `languageChanged`
 * event handler registered in `src/shared/i18n/index.ts`.
 */
export function Header() {
  const { t, i18n } = useTranslation()

  const isArabic = i18n.language.startsWith('ar')

  const handleLanguageToggle = (): void => {
    const next = isArabic ? 'en' : 'ar'
    void i18n.changeLanguage(next)
  }

  return (
    <header className="flex h-16 items-center justify-end border-b bg-card px-6">
      <Button
        variant="ghost"
        size="sm"
        onClick={handleLanguageToggle}
        aria-label={isArabic ? t('common.switchToEnglish') : t('common.switchToArabic')}
      >
        <Globe className="me-2 h-4 w-4" aria-hidden="true" />
        {isArabic ? t('common.switchToEnglish') : t('common.switchToArabic')}
      </Button>
    </header>
  )
}
