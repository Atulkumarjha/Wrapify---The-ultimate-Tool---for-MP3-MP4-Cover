declare module '@ffmpeg/ffmpeg' {
  export class FFmpeg {
    constructor();
    load(options?: { 
      coreURL?: string;
      wasmURL?: string;
      workerURL?: string;
    }): Promise<void>;
    exec(...args: string[]): Promise<number>;
    writeFile(name: string, data: Uint8Array): Promise<void>;
    readFile(name: string): Promise<Uint8Array>;
    deleteFile(name: string): Promise<void>;
    FS(command: string, ...args: any[]): any;
    on(eventName: string, callback: Function): void;
    off(eventName: string, callback: Function): void;
    isLoaded(): boolean;
  }
}

declare module '@ffmpeg/util' {
  export function fetchFile(file: string | File | Blob | ArrayBuffer): Promise<Uint8Array>;
  export function toBlobURL(url: string, mimeType: string): Promise<string>;
  export function toPromise<T = any>(fn: (...args: any[]) => any, ...args: any[]): Promise<T>;
}
