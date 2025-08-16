declare module 'confluence-api' {
  interface ConfluenceConfig {
    username: string;
    password: string;
    baseUrl: string;
    version: number;
  }

  interface ConfluenceSearchOptions {
    start?: number;
    limit?: number;
    expand?: string | string[];
  }

  interface ConfluenceResponse {
    results: any[];
    size: number;
    start: number;
    limit: number;
  }

  class ConfluenceAPI {
    constructor(config: ConfluenceConfig);
    getSpace(spaceKey: string): Promise<any>;
    getContentBySpace(spaceKey: string, options?: ConfluenceSearchOptions): Promise<ConfluenceResponse>;
    getContentById(contentId: string, options?: ConfluenceSearchOptions): Promise<any>;
    search(cql: string, options?: ConfluenceSearchOptions): Promise<ConfluenceResponse>;
  }

  export = ConfluenceAPI;
}