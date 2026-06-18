/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_REPOSITORY_URL?: string;
  readonly VITE_SITE_URL?: string;
  readonly VITE_UMAMI_SCRIPT_URL?: string;
  readonly VITE_UMAMI_WEBSITE_ID?: string;
}

interface Window {
  umami?: {
    track: (event: string, data?: Record<string, string | number | boolean>) => void;
  };
}
