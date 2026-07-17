export interface FlowTriggerLike {
  trigger_type: string
  trigger_keywords: string[] | null
  target_post_ids?: string[] | null
}

export function matchesMessageTrigger(
  flow: FlowTriggerLike,
  messageText: string,
  storyEventType?: 'reply' | 'mention'
): boolean {
  if (flow.trigger_type === 'story_reply') return storyEventType === 'reply'
  if (flow.trigger_type === 'story_mention') return storyEventType === 'mention'
  // A story reply/mention still carries text, but shouldn't silently match
  // a generic any_message/keyword flow — those are for regular DMs.
  if (storyEventType) return false
  if (flow.trigger_type === 'any_message') return true
  if (flow.trigger_type === 'keyword') {
    const lower = messageText.toLowerCase()
    return (flow.trigger_keywords ?? []).some((kw) => lower.includes(kw.toLowerCase()))
  }
  return false
}

export function matchesCommentTrigger(flow: FlowTriggerLike, commentText: string, mediaId?: string | null): boolean {
  if (flow.target_post_ids?.length && mediaId && !flow.target_post_ids.includes(mediaId)) return false
  if (flow.trigger_type === 'any_comment') return true
  if (flow.trigger_type === 'comment_keyword') {
    const lower = commentText.toLowerCase()
    return (flow.trigger_keywords ?? []).some((kw) => lower.includes(kw.toLowerCase()))
  }
  return false
}
