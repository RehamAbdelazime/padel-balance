/// <reference types="vite/client" />

/**
 * Typed environment variables.
 * Extend this interface when adding new VITE_* variables.
 */
interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string
  readonly VITE_SUPABASE_ANON_KEY: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
