'use client'

import { useCallback, useState } from 'react'
import {
  ReactFlow,
  ReactFlowProvider,
  Background,
  Controls,
  MiniMap,
  addEdge,
  useNodesState,
  useEdgesState,
  type Node,
  type Edge,
  type Connection,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { toast } from 'sonner'
import {
  MessageSquare,
  GitBranch,
  Clock,
  Tag,
  TagIcon,
  Sparkles,
  ArrowRightCircle,
  Save,
  Trash2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { FlowNodeVisual, type FlowNodeData } from './node-visual'
import { NodeInspector } from './node-inspector'
import type { FlowNodeRecord, FlowEdgeRecord, FlowNodeType, FlowSummary } from '../types'
import type { Tag as ContactTag } from '@/components/contacts/types'

const nodeTypes = { flowNode: FlowNodeVisual }

const ADDABLE: { type: FlowNodeType; icon: typeof MessageSquare; label: string }[] = [
  { type: 'send_message', icon: MessageSquare, label: 'Message' },
  { type: 'ai_reply', icon: Sparkles, label: 'Réponse IA' },
  { type: 'condition', icon: GitBranch, label: 'Condition' },
  { type: 'delay', icon: Clock, label: 'Délai' },
  { type: 'set_tag', icon: Tag, label: 'Ajouter tag' },
  { type: 'remove_tag', icon: TagIcon, label: 'Retirer tag' },
  { type: 'jump', icon: ArrowRightCircle, label: 'Aller vers' },
]

function summaryFor(type: FlowNodeType, config: Record<string, unknown>): string {
  switch (type) {
    case 'send_message':
      return config.message_type === 'card'
        ? `[Carte] ${config.card_title || 'Sans titre'}`
        : (config.text as string) || 'Aucun message'
    case 'ai_reply':
      return (config.instructions as string) || 'Aucune instruction'
    case 'condition':
      return config.field ? `${config.field} ${config.operator ?? 'equals'} ${config.value ?? ''}` : 'Non configuré'
    case 'delay':
      return `${config.seconds ?? 60}s`
    case 'set_tag':
    case 'remove_tag':
      return config.tag_id ? 'Tag sélectionné' : 'Aucun tag'
    case 'jump':
      return config.target_flow_id ? 'Flow sélectionné' : 'Aucun flow'
    default:
      return ''
  }
}

function toReactFlowNode(record: FlowNodeRecord): Node {
  return {
    id: record.node_key,
    type: 'flowNode',
    position: record.position ?? { x: 0, y: 0 },
    data: { nodeType: record.type, config: record.config, summary: summaryFor(record.type, record.config) },
  }
}

function toReactFlowEdge(record: FlowEdgeRecord): Edge {
  return {
    id: record.id || `${record.source_node_key}-${record.target_node_key}-${record.source_handle}`,
    source: record.source_node_key,
    target: record.target_node_key,
    sourceHandle: record.source_handle,
  }
}

export function FlowCanvas({
  flowId,
  initialNodes,
  initialEdges,
  tags,
  otherFlows,
}: {
  flowId: string
  initialNodes: FlowNodeRecord[]
  initialEdges: FlowEdgeRecord[]
  tags: ContactTag[]
  otherFlows: FlowSummary[]
}) {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes.map(toReactFlowNode))
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges.map(toReactFlowEdge))
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const selectedNode = nodes.find((n) => n.id === selectedId)

  const onConnect = useCallback(
    (connection: Connection) => setEdges((eds) => addEdge({ ...connection, sourceHandle: connection.sourceHandle ?? 'default' }, eds)),
    [setEdges]
  )

  function addNode(type: FlowNodeType) {
    const nodeKey = `${type}-${crypto.randomUUID()}`
    const newNode: Node = {
      id: nodeKey,
      type: 'flowNode',
      position: { x: 100 + nodes.length * 40, y: 100 + nodes.length * 80 },
      data: { nodeType: type, config: {}, summary: summaryFor(type, {}) },
    }
    setNodes((nds) => [...nds, newNode])
  }

  function updateSelectedConfig(config: Record<string, unknown>) {
    if (!selectedId) return
    setNodes((nds) =>
      nds.map((n) => (n.id === selectedId ? { ...n, data: { ...n.data, config, summary: summaryFor((n.data as unknown as FlowNodeData).nodeType, config) } } : n))
    )
  }

  function deleteSelected() {
    if (!selectedId) return
    setNodes((nds) => nds.filter((n) => n.id !== selectedId))
    setEdges((eds) => eds.filter((e) => e.source !== selectedId && e.target !== selectedId))
    setSelectedId(null)
  }

  async function handleSave() {
    setSaving(true)
    try {
      const payload = {
        nodes: nodes.map((n) => ({
          node_key: n.id,
          type: (n.data as unknown as FlowNodeData).nodeType,
          config: (n.data as unknown as FlowNodeData).config,
          position: n.position,
        })),
        edges: edges.map((e) => ({
          source_node_key: e.source,
          target_node_key: e.target,
          source_handle: e.sourceHandle ?? 'default',
        })),
      }
      const res = await fetch(`/api/flows/${flowId}/graph`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Erreur')
      }
      toast.success('Flow sauvegardé')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Impossible de sauvegarder le flow')
    } finally {
      setSaving(false)
    }
  }

  const nodeData = selectedNode ? (selectedNode.data as unknown as FlowNodeData) : null

  return (
    <ReactFlowProvider>
      <div className="flex h-full">
        <div className="flex w-48 shrink-0 flex-col gap-1 overflow-y-auto border-r border-border bg-sidebar p-3">
          <p className="mb-1 px-1 text-[11px] font-medium text-muted-foreground">Ajouter un nœud</p>
          {ADDABLE.map(({ type, icon: Icon, label }) => (
            <Button key={type} variant="outline" size="sm" className="justify-start" onClick={() => addNode(type)}>
              <Icon className="size-3.5" /> {label}
            </Button>
          ))}
          <Button size="sm" className="mt-3" onClick={handleSave} disabled={saving}>
            <Save className="size-3.5" /> {saving ? 'Sauvegarde…' : 'Sauvegarder'}
          </Button>
        </div>

        <div className="flex-1">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            nodeTypes={nodeTypes}
            onNodeClick={(_, node) => setSelectedId(node.id)}
            onPaneClick={() => setSelectedId(null)}
            fitView
          >
            <Background />
            <Controls />
            <MiniMap className="!bg-card" />
          </ReactFlow>
        </div>

        <div className="w-64 shrink-0 overflow-y-auto border-l border-border bg-sidebar p-4">
          {nodeData ? (
            <Card className="border-none shadow-none">
              <CardHeader className="px-0 pt-0">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm">Configuration</CardTitle>
                  {nodeData.nodeType !== 'trigger' && (
                    <Button variant="ghost" size="icon" onClick={deleteSelected} className="text-destructive hover:text-destructive">
                      <Trash2 className="size-4" />
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent className="px-0">
                <NodeInspector
                  nodeType={nodeData.nodeType}
                  config={nodeData.config}
                  onChange={updateSelectedConfig}
                  tags={tags}
                  flows={otherFlows}
                />
              </CardContent>
            </Card>
          ) : (
            <p className="text-sm text-muted-foreground">Sélectionnez un nœud pour le configurer.</p>
          )}
        </div>
      </div>
    </ReactFlowProvider>
  )
}
