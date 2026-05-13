declare module '@netlify/database' {
  export function createDatabaseClient(): {
    query: (sql: string, params?: unknown[]) => Promise<{ rows: any[] }>;
  };
}
