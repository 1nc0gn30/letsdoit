declare module 'pg' {
  export class Pool {
    constructor(config?: { connectionString?: string; ssl?: { rejectUnauthorized?: boolean } });
    query(sql: string, params?: unknown[]): Promise<{ rows: any[] }>;
  }
}
