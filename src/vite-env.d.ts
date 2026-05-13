/// <reference types="vite/client" />

declare global {
  interface Window {
    netlifyIdentity?: {
      currentUser: () => {
        email: string;
        user_metadata: { display_name?: string };
        jwt: () => Promise<string>;
      } | null;
      on: (event: string, cb: (...args: any[]) => void) => void;
      off: (event: string, cb: (...args: any[]) => void) => void;
      init: () => void;
      open: () => void;
      close: () => void;
      logout: () => void;
      login: (email: string, password: string, remember?: boolean) => Promise<void>;
      signup: (email: string, password: string, data?: { data?: Record<string, unknown> }) => Promise<void>;
    };
  }
}
