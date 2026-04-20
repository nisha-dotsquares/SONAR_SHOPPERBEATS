export {};

declare global {
  interface Window {
    google?: {
      grecaptcha: {
        ready: (callback: () => void) => void;
        execute: (siteKey: string, options?: { action: string }) => Promise<string>;
      };
    };
  }
}
