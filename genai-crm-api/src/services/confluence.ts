import axios, { AxiosInstance } from 'axios'

export interface ConfluenceSpace {
  id: string
  key: string
  name: string
  description?: string
  type: 'global' | 'personal'
}

export interface ConfluencePage {
  id: string
  title: string
  content: string
  spaceKey: string
  spaceId: string
  url: string
  lastModified: string
  version: number
  labels: string[]
  excerpt?: string
}

export interface ConfluenceSearchResult {
  pages: ConfluencePage[]
  totalResults: number
  searchTime: number
}

export interface ConfluenceUser {
  accountId: string
  displayName: string
  emailAddress: string
}

export class ConfluenceService {
  private client: AxiosInstance
  private baseUrl: string
  private authToken: string

  constructor() {
    this.baseUrl = process.env.CONFLUENCE_BASE_URL || ''
    this.authToken = process.env.CONFLUENCE_API_TOKEN || ''
    
    if (!this.baseUrl || !this.authToken) {
      throw new Error('Confluence configuration missing. Please set CONFLUENCE_BASE_URL and CONFLUENCE_API_TOKEN')
    }

    this.client = axios.create({
      baseURL: this.baseUrl,
      headers: {
        'Authorization': `Bearer ${this.authToken}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      timeout: 30000,
    })
  }

  async getSpaces(): Promise<ConfluenceSpace[]> {
    try {
      const response = await this.client.get('/rest/api/space', {
        params: {
          limit: 100,
          expand: 'description.plain',
        },
      })

      return response.data.results.map((space: any) => ({
        id: space.id,
        key: space.key,
        name: space.name,
        description: space.description?.plain?.value,
        type: space.type,
      }))
    } catch (error) {
      console.error('Error fetching Confluence spaces:', error)
      throw new Error('Failed to fetch Confluence spaces')
    }
  }

  async searchPages(
    query: string,
    spaceKey?: string,
    limit: number = 25
  ): Promise<ConfluenceSearchResult> {
    try {
      const startTime = Date.now()
      
      // Build CQL (Confluence Query Language) query
      let cqlQuery = `text ~ "${query}" AND type = "page"`
      if (spaceKey) {
        cqlQuery += ` AND space = "${spaceKey}"`
      }

      const response = await this.client.get('/rest/api/search', {
        params: {
          cql: cqlQuery,
          limit,
          expand: 'content.body.storage,content.space,content.version,content.metadata.labels',
        },
      })

      const pages: ConfluencePage[] = response.data.results
        .filter((result: any) => result.content)
        .map((result: any) => ({
          id: result.content.id,
          title: result.content.title,
          content: this.stripHtml(result.content.body?.storage?.value || ''),
          spaceKey: result.content.space.key,
          spaceId: result.content.space.id,
          url: `${this.baseUrl}${result.content._links.webui}`,
          lastModified: result.content.version.when,
          version: result.content.version.number,
          labels: result.content.metadata?.labels?.results?.map((label: any) => label.name) || [],
          excerpt: result.excerpt,
        }))

      const searchTime = Date.now() - startTime

      return {
        pages,
        totalResults: response.data.totalSize,
        searchTime,
      }
    } catch (error) {
      console.error('Error searching Confluence pages:', error)
      throw new Error('Failed to search Confluence pages')
    }
  }

  async getPageById(pageId: string): Promise<ConfluencePage | null> {
    try {
      const response = await this.client.get(`/rest/api/content/${pageId}`, {
        params: {
          expand: 'body.storage,space,version,metadata.labels',
        },
      })

      const page = response.data

      return {
        id: page.id,
        title: page.title,
        content: this.stripHtml(page.body?.storage?.value || ''),
        spaceKey: page.space.key,
        spaceId: page.space.id,
        url: `${this.baseUrl}${page._links.webui}`,
        lastModified: page.version.when,
        version: page.version.number,
        labels: page.metadata?.labels?.results?.map((label: any) => label.name) || [],
      }
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        return null
      }
      console.error('Error fetching Confluence page:', error)
      throw new Error('Failed to fetch Confluence page')
    }
  }

  async getPagesBySpace(
    spaceKey: string,
    limit: number = 25,
    start: number = 0
  ): Promise<ConfluencePage[]> {
    try {
      const response = await this.client.get('/rest/api/content', {
        params: {
          spaceKey,
          type: 'page',
          limit,
          start,
          expand: 'body.storage,space,version,metadata.labels',
        },
      })

      return response.data.results.map((page: any) => ({
        id: page.id,
        title: page.title,
        content: this.stripHtml(page.body?.storage?.value || ''),
        spaceKey: page.space.key,
        spaceId: page.space.id,
        url: `${this.baseUrl}${page._links.webui}`,
        lastModified: page.version.when,
        version: page.version.number,
        labels: page.metadata?.labels?.results?.map((label: any) => label.name) || [],
      }))
    } catch (error) {
      console.error('Error fetching pages by space:', error)
      throw new Error('Failed to fetch pages by space')
    }
  }

  async searchSOPs(query: string, limit: number = 10): Promise<ConfluencePage[]> {
    try {
      // Search specifically for SOPs using labels and title patterns
      const sopQueries = [
        `text ~ "${query}" AND (label = "sop" OR label = "standard-operating-procedure" OR title ~ "SOP")`,
        `text ~ "${query}" AND (title ~ "procedure" OR title ~ "process" OR title ~ "guideline")`,
      ]

      const allResults: ConfluencePage[] = []

      for (const cqlQuery of sopQueries) {
        try {
          const response = await this.client.get('/rest/api/search', {
            params: {
              cql: cqlQuery,
              limit: Math.ceil(limit / sopQueries.length),
              expand: 'content.body.storage,content.space,content.version,content.metadata.labels',
            },
          })

          const pages = response.data.results
            .filter((result: any) => result.content)
            .map((result: any) => ({
              id: result.content.id,
              title: result.content.title,
              content: this.stripHtml(result.content.body?.storage?.value || ''),
              spaceKey: result.content.space.key,
              spaceId: result.content.space.id,
              url: `${this.baseUrl}${result.content._links.webui}`,
              lastModified: result.content.version.when,
              version: result.content.version.number,
              labels: result.content.metadata?.labels?.results?.map((label: any) => label.name) || [],
              excerpt: result.excerpt,
            }))

          allResults.push(...pages)
        } catch (queryError) {
          console.warn('SOP query failed:', cqlQuery, queryError)
          // Continue with next query
        }
      }

      // Remove duplicates and limit results
      const uniqueResults = allResults.filter(
        (page, index, self) => index === self.findIndex(p => p.id === page.id)
      )

      return uniqueResults.slice(0, limit)
    } catch (error) {
      console.error('Error searching SOPs:', error)
      throw new Error('Failed to search SOPs')
    }
  }

  async getRecentlyUpdatedPages(
    spaceKey?: string,
    days: number = 30,
    limit: number = 25
  ): Promise<ConfluencePage[]> {
    try {
      const sinceDate = new Date()
      sinceDate.setDate(sinceDate.getDate() - days)
      const since = sinceDate.toISOString().split('T')[0] // YYYY-MM-DD format

      let cqlQuery = `lastmodified >= "${since}" AND type = "page"`
      if (spaceKey) {
        cqlQuery += ` AND space = "${spaceKey}"`
      }
      cqlQuery += ' ORDER BY lastmodified DESC'

      const response = await this.client.get('/rest/api/search', {
        params: {
          cql: cqlQuery,
          limit,
          expand: 'content.body.storage,content.space,content.version,content.metadata.labels',
        },
      })

      return response.data.results
        .filter((result: any) => result.content)
        .map((result: any) => ({
          id: result.content.id,
          title: result.content.title,
          content: this.stripHtml(result.content.body?.storage?.value || ''),
          spaceKey: result.content.space.key,
          spaceId: result.content.space.id,
          url: `${this.baseUrl}${result.content._links.webui}`,
          lastModified: result.content.version.when,
          version: result.content.version.number,
          labels: result.content.metadata?.labels?.results?.map((label: any) => label.name) || [],
        }))
    } catch (error) {
      console.error('Error fetching recently updated pages:', error)
      throw new Error('Failed to fetch recently updated pages')
    }
  }

  private stripHtml(html: string): string {
    // Remove HTML tags and decode HTML entities
    return html
      .replace(/<[^>]*>/g, '') // Remove HTML tags
      .replace(/&nbsp;/g, ' ') // Replace non-breaking spaces
      .replace(/&amp;/g, '&') // Decode ampersands
      .replace(/&lt;/g, '<') // Decode less than
      .replace(/&gt;/g, '>') // Decode greater than
      .replace(/&quot;/g, '"') // Decode quotes
      .replace(/&#39;/g, "'") // Decode apostrophes
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim()
  }

  async testConnection(): Promise<boolean> {
    try {
      await this.client.get('/rest/api/user/current')
      return true
    } catch (error) {
      console.error('Confluence connection test failed:', error)
      return false
    }
  }

  async getCurrentUser(): Promise<ConfluenceUser | null> {
    try {
      const response = await this.client.get('/rest/api/user/current')
      return {
        accountId: response.data.accountId,
        displayName: response.data.displayName,
        emailAddress: response.data.emailAddress,
      }
    } catch (error) {
      console.error('Error getting current user:', error)
      return null
    }
  }
}

export const confluenceService = new ConfluenceService()