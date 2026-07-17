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
  Plus,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Sheet, SheetContent, SheetTitle, SheetHeader } from '@/components/ui/sheet'
import { useMediaQuery } from '@/lib/use-media-query'
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
    case 'trigger': {
      const triggerType = (config.trigger_type as string) ?? 'any_message'
      const kws = (config.trigger_keywords as string[] | null) ?? []
      if (triggerType === 'keyword') {
        return `Mots-clés : ${kws.join(', ') || 'Aucun'}`
      }
      if (triggerType === 'comment_keyword') {
        return `Commentaire mots-clés : ${kws.join(', ') || 'Aucun'}`
      }
      if (triggerType === 'any_comment') {
        return 'Tout commentaire'
      }
      return 'Tout message DM'
    }
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

export interface FlowMeta {
  id: string
  name: string
  trigger_type: string
  trigger_keywords: string[] | null
  target_post_ids: string[] | null
  status: string
}

export function FlowCanvas({
  flow,
  initialNodes,
  initialEdges,
  tags,
  otherFlows,
}: {
  flow: FlowMeta
  initialNodes: FlowNodeRecord[]
  initialEdges: FlowEdgeRecord[]
  tags: ContactTag[]
  otherFlows: FlowSummary[]
}) {
  const [nodes, setNodes, onNodesChange] = useNodesState(
    initialNodes.map((n) => {
      if (n.node_key === 'trigger') {
        const enrichedConfig = {
          ...n.config,
          trigger_type: flow.trigger_type,
          trigger_keywords: flow.trigger_keywords,
          target_post_ids: flow.target_post_ids,
        }
        return {
          id: n.node_key,
          type: 'flowNode',
          position: n.position ?? { x: 0, y: 0 },
          data: {
            nodeType: n.type,
            config: enrichedConfig,
            summary: summaryFor(n.type, enrichedConfig),
          },
        }
      }
      return toReactFlowNode(n)
    })
  )
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges.map(toReactFlowEdge))
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [paletteOpen, setPaletteOpen] = useState(false)
  const isMobile = useMediaQuery('(max-width: 767px)')
  // Local copy of trigger config (so changes are reflected immediately)
  const [triggerConfig, setTriggerConfig] = useState<{
    trigger_type: string
    trigger_keywords: string[] | null
    target_post_ids: string[] | null
  }>({
    trigger_type: flow.trigger_type,
    trigger_keywords: flow.trigger_keywords,
    target_post_ids: flow.target_post_ids,
  })

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

  async function updateTrigger(patch: Partial<typeof triggerConfig>) {
    const next = { ...triggerConfig, ...patch }
    setTriggerConfig(next)
    
    // Sync to React Flow nodes state immediately
    setNodes((nds) =>
      nds.map((n) =>
        n.id === 'trigger'
          ? {
              ...n,
              data: {
                ...(n.data as unknown as FlowNodeData),
                config: {
                  ...((n.data as unknown as FlowNodeData).config || {}),
                  trigger_type: next.trigger_type,
                  trigger_keywords: next.trigger_keywords,
                  target_post_ids: next.target_post_ids,
                },
                summary: summaryFor('trigger', {
                  trigger_type: next.trigger_type,
                  trigger_keywords: next.trigger_keywords,
                  target_post_ids: next.target_post_ids,
                }),
              },
            }
          : n
      )
    )

    try {
      const res = await fetch(`/api/flows/${flow.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          trigger_type: next.trigger_type,
          trigger_keywords: next.trigger_keywords,
          target_post_ids: next.target_post_ids,
        }),
      })
      if (!res.ok) throw new Error('Erreur')
      toast.success('Déclencheur mis à jour')
    } catch {
      setTriggerConfig(triggerConfig) // rollback triggerConfig
      // rollback nodes state
      setNodes((nds) =>
        nds.map((n) =>
          n.id === 'trigger'
            ? {
                ...n,
                data: {
                  ...(n.data as unknown as FlowNodeData),
                  config: {
                    ...((n.data as unknown as FlowNodeData).config || {}),
                    trigger_type: triggerConfig.trigger_type,
                    trigger_keywords: triggerConfig.trigger_keywords,
                    target_post_ids: triggerConfig.target_post_ids,
                  },
                  summary: summaryFor('trigger', {
                    trigger_type: triggerConfig.trigger_type,
                    trigger_keywords: triggerConfig.trigger_keywords,
                    target_post_ids: triggerConfig.target_post_ids,
                  }),
                },
              }
            : n
        )
      )
      toast.error('Impossible de mettre à jour le déclencheur')
    }
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
      const res = await fetch(`/api/flows/${flow.id}/graph`, {
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
  const isTriggerSelected = selectedId === 'trigger'

  const paletteContent = (
    <>
      <p className="mb-1 px-1 text-[11px] font-medium text-muted-foreground">Ajouter un nœud</p>
      {ADDABLE.map(({ type, icon: Icon, label }) => (
        <Button
          key={type}
          variant="outline"
          size="sm"
          className="justify-start"
          onClick={() => {
            addNode(type)
            setPaletteOpen(false)
          }}
        >
          <Icon className="size-3.5" /> {label}
        </Button>
      ))}
      <Button size="sm" className="mt-3" onClick={handleSave} disabled={saving}>
        <Save className="size-3.5" /> {saving ? 'Sauvegarde…' : 'Sauvegarder'}
      </Button>
    </>
  )

  const inspectorContent = isTriggerSelected ? (
    <Card className="border-none shadow-none">
      <CardHeader className="px-0 pt-0">
        <CardTitle className="text-sm">Déclencheur</CardTitle>
      </CardHeader>
      <CardContent className="px-0">
        <NodeInspector
          nodeType="trigger"
          config={triggerConfig as Record<string, unknown>}
          onChange={(cfg) =>
            updateTrigger({
              trigger_type: cfg.trigger_type as string,
              trigger_keywords: cfg.trigger_keywords as string[] | null,
              target_post_ids: cfg.target_post_ids as string[] | null,
            })
          }
          tags={tags}
          flows={otherFlows}
        />
      </CardContent>
    </Card>
  ) : nodeData ? (
    <Card className="border-none shadow-none">
      <CardHeader className="px-0 pt-0">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm">Configuration</CardTitle>
          <Button variant="ghost" size="icon" onClick={deleteSelected} className="text-destructive hover:text-destructive">
            <Trash2 className="size-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="px-0">
        <NodeInspector nodeType={nodeData.nodeType} config={nodeData.config} onChange={updateSelectedConfig} tags={tags} flows={otherFlows} />
      </CardContent>
    </Card>
  ) : (
    <p className="text-sm text-muted-foreground">Cliquez sur un nœud pour le configurer.</p>
  )

  return (
    <ReactFlowProvider>
      <div className="flex h-full w-full">
        {/* Left sidebar — add nodes (desktop only) */}
        <div className="hidden h-full w-48 shrink-0 flex-col gap-1 overflow-y-auto border-r border-border bg-sidebar p-3 md:flex">
          {paletteContent}
        </div>

        {/* Canvas */}
        <div className="relative h-full flex-1">
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
            <MiniMap className="!hidden !bg-card md:!block" />
          </ReactFlow>

          {/* Mobile FAB — opens node palette */}
          <Button
            size="icon"
            onClick={() => setPaletteOpen(true)}
            className="absolute bottom-4 right-4 z-10 size-12 rounded-full shadow-lg md:hidden"
            aria-label="Ajouter un nœud"
          >
            <Plus className="size-5" />
          </Button>
        </div>

        {/* Right sidebar — inspector (desktop only) */}
        <div className="hidden h-full w-72 shrink-0 overflow-y-auto border-l border-border bg-sidebar p-4 md:block">
          {inspectorContent}
        </div>
      </div>

      {/* Mobile: node palette sheet */}
      <Sheet open={paletteOpen} onOpenChange={setPaletteOpen}>
        <SheetContent side="bottom" className="max-h-[70vh] gap-1 overflow-y-auto">
          <SheetHeader className="sr-only">
            <SheetTitle>Ajouter un nœud</SheetTitle>
          </SheetHeader>
          {paletteContent}
        </SheetContent>
      </Sheet>

      {/* Mobile: node inspector sheet */}
      <Sheet open={isMobile && selectedId !== null} onOpenChange={(open) => !open && setSelectedId(null)}>
        <SheetContent side="bottom" className="max-h-[80vh] overflow-y-auto">
          <SheetHeader className="sr-only">
            <SheetTitle>Configuration du nœud</SheetTitle>
          </SheetHeader>
          {inspectorContent}
        </SheetContent>
      </Sheet>
    </ReactFlowProvider>
  )
}
