export {};

declare global {
  interface Window {
    zE?: (service: string, event: string, ...args: (string | Record<string, unknown>)[]) => void;
  }
}
