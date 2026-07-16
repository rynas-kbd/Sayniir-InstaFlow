import type { ChannelAccountRef } from '../channels/types'
import type { ChannelAdapter } from '../channels/types'

export interface FlowNode {
  id: string
  flow_id: string
  node_key: string
  type: 'trigger' | 'send_message' | 'condition' | 'delay' | 'set_tag' | 'remove_tag' | 'ai_reply' | 'jump'
  config: Record<string, unknown>
}

export interface FlowEdge {
  id: string
  source_node_key: string
  target_node_key: string
  source_handle: string
}

export interface FlowRun {
  id: string
  flow_id: string
  channel_account_id: string
  contact_id: string | null
  sender_id: string
  current_node_key: string | null
  status: 'active' | 'waiting' | 'completed' | 'failed' | 'cancelled'
  resume_at: string | null
  context: Record<string, unknown>
}

export interface NodeExecContext {
  account: { id: string; access_token: string; user_id: string }
  ref: ChannelAccountRef
  adapter: ChannelAdapter
  run: FlowRun
  agentArgs: {
    aiProvider: string | null
    aiApiKey: string | null
    aiModel: string | null
  }
}

export type NodeResult =
  | { type: 'continue'; handle: string }
  | { type: 'wait'; seconds: number }
  | { type: 'pause' }
  | { type: 'stop' }
