export type FlowNodeType = 'trigger' | 'send_message' | 'condition' | 'delay' | 'set_tag' | 'remove_tag' | 'ai_reply' | 'jump' | 'capture_input'

export interface CardButton {
  type: 'postback' | 'web_url'
  title: string
  url?: string
  payload?: string
}

export interface FlowSummary {
  id: string
  name: string
  status: 'draft' | 'active' | 'paused'
  trigger_type: string
  trigger_keywords: string[] | null
  created_at: string
}

export interface FlowNodeRecord {
  id: string
  node_key: string
  type: FlowNodeType
  config: Record<string, unknown>
  position: { x: number; y: number }
}

export interface FlowEdgeRecord {
  id: string
  source_node_key: string
  target_node_key: string
  source_handle: string
}
