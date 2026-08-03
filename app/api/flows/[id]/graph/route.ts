import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { quickUrlShapeCheck } from '@/lib/security/url-guard'
import { jsonError, badRequest } from '@/lib/api/errors'

const MAX_NODES = 200
const MAX_EDGES = 400

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
  const { data: flow } = await supabase
    .from('flows')
    .select('id, channel_account_id, channel_accounts!inner(user_id)')
    .eq('id', id)
    .eq('channel_accounts.user_id', user.id)
    .single()
  if (!flow) return NextResponse.json({ error: 'Flow not found' }, { status: 404 })

  const body = await request.json().catch(() => null)
  if (!body || typeof body !== 'object') return badRequest('Corps de requête invalide')

  const rawNodes = (body as { nodes?: unknown }).nodes ?? []
  const rawEdges = (body as { edges?: unknown }).edges ?? []
  if (!Array.isArray(rawNodes) || !Array.isArray(rawEdges)) {
    return badRequest('"nodes" et "edges" doivent être des tableaux')
  }
  if (rawNodes.length > MAX_NODES) return badRequest(`Un flow ne peut pas dépasser ${MAX_NODES} nœuds`)
  if (rawEdges.length > MAX_EDGES) return badRequest(`Un flow ne peut pas dépasser ${MAX_EDGES} connexions`)

  const nodes = rawNodes as NodeInput[]
  const edges = rawEdges as EdgeInput[]

  if (!nodes.some((n) => n && typeof n === 'object' && n.type === 'trigger')) {
    return NextResponse.json({ error: 'Un flow doit avoir exactement un nœud de déclenchement' }, { status: 400 })
  }

  // Save-time SSRF sanity check for external_request nodes — cheap shape
  // check only (no DNS lookup); execution time re-validates authoritatively
  // via assertSafeOutboundUrl since DNS answers can change between save and run.
  for (const node of nodes) {
    if (node.type === 'external_request' && typeof node.config?.url === 'string' && node.config.url) {
      const shapeError = quickUrlShapeCheck(node.config.url)
      if (shapeError) {
        return NextResponse.json({ error: `URL invalide dans le nœud "${node.node_key}": ${shapeError}` }, { status: 400 })
      }
    }
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
  if (rpcError) return jsonError(500, 'Impossible d\'enregistrer le flow', rpcError)

  return NextResponse.json({ success: true })
}
