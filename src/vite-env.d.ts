/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_WEATHERAI_KEY?: string;
  readonly VITE_WEATHERAI_BASE_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
