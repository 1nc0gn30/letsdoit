declare module '@netlify/blobs' {
  export interface BlobStore {
    get(key: string): Promise<string | null>;
    set(key: string, value: string): Promise<void>;
    delete(key: string): Promise<void>;
  }
  export function getStore(options: { name: string }): Promise<BlobStore>;
}
