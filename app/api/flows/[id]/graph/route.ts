import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

interface NodeInput {
  node_key: string
  type: string
  config: Record<string, unknown>
  position: { x: number; y: number }
}
interface EdgeInput {
  source_node_key: string
  target_node_key: string
  source_handle: string
}

// PUT /api/flows/[id]/graph — replaces the full node/edge set (builder save)
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const { data: flow } = await supabase.from('flows').select('id, channel_account_id').eq('id', id).single()
  if (!flow) return NextResponse.json({ error: 'Flow not found' }, { status: 404 })

  const body = await request.json()
  const nodes = (body.nodes ?? []) as NodeInput[]
  const edges = (body.edges ?? []) as EdgeInput[]

  if (!nodes.some((n) => n.type === 'trigger')) {
    return NextResponse.json({ error: 'Un flow doit avoir exactement un nœud de déclenchement' }, { status: 400 })
  }

  const { error: rpcError } = await supabase.rpc('replace_flow_graph', {
    p_flow_id: id,
    p_channel_account_id: flow.channel_account_id,
    p_nodes: nodes.map((n) => ({
      node_key: n.node_key,
      type: n.type,
      config: n.config ?? {},
      position: n.position ?? { x: 0, y: 0 },
    })),
    p_edges: edges.map((e) => ({
      source_node_key: e.source_node_key,
      target_node_key: e.target_node_key,
      source_handle: e.source_handle ?? 'default',
    })),
    p_graph_snapshot: body,
  })
  if (rpcError) return NextResponse.json({ error: rpcError.message }, { status: 500 })

  return NextResponse.json({ success: true })
}
