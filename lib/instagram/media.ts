const GRAPH_API_VERSION = 'v21.0'
const MEDIA_FIELDS = 'id,caption,media_type,media_url,thumbnail_url,timestamp,permalink'

export interface InstagramMedia {
  id: string
  media_type?: string
  media_url: string
  thumbnail_url?: string
  caption?: string
  permalink?: string
  timestamp?: string
}

interface GraphMediaPage {
  data?: InstagramMedia[]
  paging?: {
    next?: string
    cursors?: {
      after?: string
    }
  }
}

export interface MediaPage {
  items: InstagramMedia[]
  nextCursor: string | null
}

/** Builds the Graph API URL for a page of the account's media. `after` is
 * omitted on the first page — Graph rejects an empty `after` param on some
 * accounts rather than treating it as "no cursor". */
export function buildMediaRequestUrl({
  accessToken,
  limit,
  after,
}: {
  accessToken: string
  limit: number
  after?: string | null
}): string {
  const params = new URLSearchParams({
    fields: MEDIA_FIELDS,
    limit: String(limit),
    access_token: accessToken,
  })
  if (after) params.set('after', after)
  return `https://graph.instagram.com/${GRAPH_API_VERSION}/me/media?${params.toString()}`
}

/** Extracts items + next-page cursor from a raw Graph response. `paging.cursors.after`
 * can be present even on the last page, so `nextCursor` only reports a value when
 * `paging.next` (the actual next-page link) is also present. */
export function parseMediaPage(json: GraphMediaPage): MediaPage {
  const items = json.data ?? []
  const nextCursor = json.paging?.next ? (json.paging?.cursors?.after ?? null) : null
  return { items, nextCursor }
}
