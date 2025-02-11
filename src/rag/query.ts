import { Index as UpstashIndex } from '@upstash/vector'

const index = new UpstashIndex()

export const queryMovies = async ({
  query,
  filters,
  topK = 10,
}: {
  query: string,
  filters?: any,
  topK?: number,
}) => {
  
  const results = await index.query({
    data: query,
    topK,
    includeMetadata: true,
    includeData: true,
  })

  return results
}
