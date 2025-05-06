
/// <reference types="vite/client" />

interface Window {
  electron?: {
    send: (channel: string, data?: any) => void;
    receive: (channel: string, func: (...args: any[]) => void) => void;
    invoke: (channel: string, data?: any) => Promise<any>;
    getResourcePath: (resourceName: string) => string | null;
  };
}
