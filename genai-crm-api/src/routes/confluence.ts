import { Router, Request, Response } from 'express'
import { confluenceService } from '../services/confluence'
import { validateAuth } from '../middleware/auth'

const router = Router()

// Apply authentication middleware to all routes
router.use(validateAuth)

// Get all Confluence spaces
router.get('/spaces', async (req: Request, res: Response) => {
  try {
    const spaces = await confluenceService.getSpaces()
    res.json({
      success: true,
      data: spaces,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Error fetching Confluence spaces:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to fetch Confluence spaces',
      timestamp: new Date().toISOString(),
    })
  }
})

// Search pages in Confluence
router.get('/search', async (req: Request, res: Response) => {
  try {
    const { query, spaceKey, limit } = req.query
    
    if (!query || typeof query !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Query parameter is required',
        timestamp: new Date().toISOString(),
      })
    }

    const searchLimit = limit ? parseInt(limit as string, 10) : 25
    const result = await confluenceService.searchPages(
      query,
      spaceKey as string,
      searchLimit
    )

    res.json({
      success: true,
      data: result,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Error searching Confluence pages:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to search Confluence pages',
      timestamp: new Date().toISOString(),
    })
  }
})

// Search SOPs specifically
router.get('/sops/search', async (req: Request, res: Response) => {
  try {
    const { query, limit } = req.query
    
    if (!query || typeof query !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Query parameter is required',
        timestamp: new Date().toISOString(),
      })
    }

    const searchLimit = limit ? parseInt(limit as string, 10) : 10
    const sops = await confluenceService.searchSOPs(query, searchLimit)

    res.json({
      success: true,
      data: sops,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Error searching SOPs:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to search SOPs',
      timestamp: new Date().toISOString(),
    })
  }
})

// Get page by ID
router.get('/pages/:pageId', async (req: Request, res: Response) => {
  try {
    const { pageId } = req.params
    const page = await confluenceService.getPageById(pageId)
    
    if (!page) {
      return res.status(404).json({
        success: false,
        error: 'Page not found',
        timestamp: new Date().toISOString(),
      })
    }

    res.json({
      success: true,
      data: page,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Error fetching Confluence page:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to fetch Confluence page',
      timestamp: new Date().toISOString(),
    })
  }
})

// Get pages by space
router.get('/spaces/:spaceKey/pages', async (req: Request, res: Response) => {
  try {
    const { spaceKey } = req.params
    const { limit, start } = req.query

    const pageLimit = limit ? parseInt(limit as string, 10) : 25
    const pageStart = start ? parseInt(start as string, 10) : 0

    const pages = await confluenceService.getPagesBySpace(
      spaceKey,
      pageLimit,
      pageStart
    )

    res.json({
      success: true,
      data: pages,
      pagination: {
        limit: pageLimit,
        start: pageStart,
        total: pages.length,
      },
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Error fetching pages by space:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to fetch pages by space',
      timestamp: new Date().toISOString(),
    })
  }
})

// Get recently updated pages
router.get('/recent', async (req: Request, res: Response) => {
  try {
    const { spaceKey, days, limit } = req.query

    const dayLimit = days ? parseInt(days as string, 10) : 30
    const pageLimit = limit ? parseInt(limit as string, 10) : 25

    const pages = await confluenceService.getRecentlyUpdatedPages(
      spaceKey as string,
      dayLimit,
      pageLimit
    )

    res.json({
      success: true,
      data: pages,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Error fetching recently updated pages:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to fetch recently updated pages',
      timestamp: new Date().toISOString(),
    })
  }
})

// Test Confluence connection
router.get('/health', async (req: Request, res: Response) => {
  try {
    const isConnected = await confluenceService.testConnection()
    const currentUser = isConnected ? await confluenceService.getCurrentUser() : null

    res.json({
      success: true,
      data: {
        connected: isConnected,
        user: currentUser,
        timestamp: new Date().toISOString(),
      },
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Error testing Confluence connection:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to test Confluence connection',
      timestamp: new Date().toISOString(),
    })
  }
})

// Get SOP suggestions based on customer issue/query
router.post('/sops/suggest', async (req: Request, res: Response) => {
  try {
    const { query, customerId, interactionType } = req.body

    if (!query || typeof query !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Query is required',
        timestamp: new Date().toISOString(),
      })
    }

    // Search for relevant SOPs
    const sops = await confluenceService.searchSOPs(query, 5)

    // Enhance with context if available
    const suggestions = sops.map(sop => ({
      ...sop,
      relevanceScore: calculateRelevanceScore(sop, query, interactionType),
      suggestedSections: extractRelevantSections(sop.content, query),
    }))

    // Sort by relevance score
    suggestions.sort((a, b) => b.relevanceScore - a.relevanceScore)

    res.json({
      success: true,
      data: {
        suggestions,
        query,
        customerId,
        interactionType,
        totalFound: suggestions.length,
      },
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Error getting SOP suggestions:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to get SOP suggestions',
      timestamp: new Date().toISOString(),
    })
  }
})

// Helper function to calculate relevance score
function calculateRelevanceScore(
  sop: any,
  query: string,
  interactionType?: string
): number {
  let score = 0
  const queryLower = query.toLowerCase()
  const titleLower = sop.title.toLowerCase()
  const contentLower = sop.content.toLowerCase()

  // Title match bonus
  if (titleLower.includes(queryLower)) {
    score += 10
  }

  // Content relevance
  const queryWords = queryLower.split(' ').filter(word => word.length > 2)
  const matchedWords = queryWords.filter(word => 
    titleLower.includes(word) || contentLower.includes(word)
  )
  score += (matchedWords.length / queryWords.length) * 5

  // Label bonus for SOPs
  if (sop.labels.some((label: string) => 
    ['sop', 'standard-operating-procedure', 'procedure', 'process'].includes(label.toLowerCase())
  )) {
    score += 5
  }

  // Interaction type bonus
  if (interactionType && contentLower.includes(interactionType.toLowerCase())) {
    score += 3
  }

  // Recency bonus (newer documents get slight boost)
  const daysOld = Math.floor(
    (Date.now() - new Date(sop.lastModified).getTime()) / (1000 * 60 * 60 * 24)
  )
  if (daysOld < 30) {
    score += 2
  } else if (daysOld < 90) {
    score += 1
  }

  return Math.max(score, 0)
}

// Helper function to extract relevant sections
function extractRelevantSections(content: string, query: string): string[] {
  const sections: string[] = []
  const queryWords = query.toLowerCase().split(' ').filter(word => word.length > 2)
  const paragraphs = content.split('\n').filter(p => p.trim().length > 50)

  for (const paragraph of paragraphs) {
    const paragraphLower = paragraph.toLowerCase()
    const matchCount = queryWords.filter(word => paragraphLower.includes(word)).length
    
    if (matchCount > 0) {
      sections.push(paragraph.trim())
    }
  }

  return sections.slice(0, 3) // Return top 3 relevant sections
}

export default router