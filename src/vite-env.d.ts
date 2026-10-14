/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_DATA_PROVIDER?: string;
  readonly VITE_API_BASE_URL?: string;
  readonly VITE_API_TIMEOUT_MS?: string;
  readonly VITE_TERMINAL_ID?: string;
  readonly VITE_ENABLE_DEV_TOOLS?: string;
  readonly VITE_ALLOW_LOCAL_DATA_IN_PRODUCTION?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
