import type { ToolFn } from '../../types'
import { z } from 'zod'
import { openai } from '../ai'
import { queryMovies } from '../rag/query'

export const movieSearchToolDefinition = {
  name: 'movie_search',
  parameters: z.object({
    query: z.string().optional().describe('query used for vector search on movies'),
  }),
  description: 'use this tool to find movies or answer questions about movies and their metadata like score, ratings, costs, directors, actors, etc.',
}

type Args = z.infer<typeof movieSearchToolDefinition.parameters>

export const movieSearch: ToolFn<Args> = async ({userMessage, toolArgs}) => {
  let results;
  try {
  results = await queryMovies({
      query: toolArgs.query!,
    })
  } catch (e) {
    console.error(e)
    return {
      error: 'Failed to search for movies',
    }
  }
  const formattedResults = results.map((result: any) => {
    const { metadata, data } = result;
    return {
      ...metadata, description: data
    }
  })

  return JSON.stringify(formattedResults, null, 2)
}