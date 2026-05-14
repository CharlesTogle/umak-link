/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_ENABLE_E2E_AUTH?: string
  readonly VITE_E2E_AUTH?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
