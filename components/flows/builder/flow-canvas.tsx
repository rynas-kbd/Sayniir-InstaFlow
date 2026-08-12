'use client'

import { useCallback, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTitle, SheetHeader } from '@/components/ui/sheet'
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
  ListPlus,
  Globe,
  SplitSquareHorizontal,
  Workflow,
  HelpCircle,
  X,
  Link2,
} from 'lucide-react'
import { useMediaQuery } from '@/lib/use-media-query'
import { PostPickerDialog } from '@/components/shared/post-picker-dialog'
import { FlowNodeVisual, type FlowNodeData } from './node-visual'
import { NodeInspector } from './node-inspector'
import type { FlowNodeRecord, FlowEdgeRecord, FlowNodeType, FlowSummary } from '../types'
import type { Tag as ContactTag } from '@/components/contacts/types'
import type { AiInsight } from '@/components/ai/types'

const nodeTypes = { flowNode: FlowNodeVisual }

const ADDABLE: { type: FlowNodeType; icon: typeof MessageSquare; label: string }[] = [
  { type: 'send_message', icon: MessageSquare, label: 'Message' },
  { type: 'ai_reply', icon: Sparkles, label: 'Réponse IA' },
  { type: 'capture_input', icon: ListPlus, label: 'Enregistrer réponse' },
  { type: 'external_request', icon: Globe, label: 'Requête externe' },
  { type: 'split_test', icon: SplitSquareHorizontal, label: 'Split A/B' },
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
      const postIds = (config.target_post_ids as string[] | null) ?? []
      const postsSuffix = postIds.length > 0 ? ` · ${postIds.length} post(s)` : ' · tous les posts'
      if (triggerType === 'keyword') {
        return `Mots-clés : ${kws.join(', ') || 'Aucun'}`
      }
      if (triggerType === 'comment_keyword') {
        return `Commentaire mots-clés : ${kws.join(', ') || 'Aucun'}${postsSuffix}`
      }
      if (triggerType === 'any_comment') {
        return `Tout commentaire${postsSuffix}`
      }
      return 'Tout message DM'
    }
    case 'send_message':
      return config.message_type === 'card'
        ? `[Carte] ${config.card_title || 'Sans titre'}`
        : (config.text as string) || 'Aucun message'
    case 'ai_reply':
      return (config.instructions as string) || 'Aucune instruction'
    case 'capture_input':
      return config.variable_name ? `Variable : ${config.variable_name}` : 'Non configuré'
    case 'external_request':
      return config.url ? String(config.url) : 'Non configuré'
    case 'split_test':
      return `${(config.percentage_a as number) ?? 50}% A / ${100 - ((config.percentage_a as number) ?? 50)}% B`
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

function toReactFlowNode(record: FlowNodeRecord, insights: AiInsight[]): Node {
  return {
    id: record.node_key,
    type: 'flowNode',
    position: record.position ?? { x: 0, y: 0 },
    data: { nodeType: record.type, config: record.config, summary: summaryFor(record.type, record.config), insights },
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
  channel_account_id: string
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
  insightsByNodeKey = {},
}: {
  flow: FlowMeta
  initialNodes: FlowNodeRecord[]
  initialEdges: FlowEdgeRecord[]
  tags: ContactTag[]
  otherFlows: FlowSummary[]
  insightsByNodeKey?: Record<string, AiInsight[]>
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
            insights: insightsByNodeKey[n.node_key] ?? [],
          },
        }
      }
      return toReactFlowNode(n, insightsByNodeKey[n.node_key] ?? [])
    })
  )
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges.map(toReactFlowEdge))
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [paletteOpen, setPaletteOpen] = useState(false)
  const [postPickerOpen, setPostPickerOpen] = useState(false)
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

  function deleteEdge(edgeId: string) {
    const edgeToDelete = edges.find((e) => e.id === edgeId)
    if (!edgeToDelete) return
    setEdges((eds) => eds.filter((e) => e.id !== edgeId))
    setSelectedEdgeId(null)
    toast.success('Lien supprimé', {
      action: {
        label: 'Annuler',
        onClick: () => setEdges((eds) => [...eds, edgeToDelete]),
      },
    })
  }

  // Highlight selected edge visually with animation and terracotta stroke
  const styledEdges = edges.map((e) => {
    const isSelected = e.id === selectedEdgeId
    return {
      ...e,
      animated: isSelected ? true : e.animated,
      style: {
        ...e.style,
        strokeWidth: isSelected ? 4 : 2.5,
        stroke: isSelected ? 'var(--organic-terracotta)' : undefined,
      },
    }
  })

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
    <div className="space-y-4">
      <div className="flex items-center justify-between pb-2 border-b border-[color-mix(in_srgb,var(--organic-sand-400)_20%,transparent)]">
        <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground/60">Déclencheur</h3>
      </div>
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
        channelAccountId={flow.channel_account_id}
        onOpenPostPicker={() => setPostPickerOpen(true)}
      />
    </div>
  ) : nodeData ? (
    <div className="space-y-4">
      <div className="flex items-center justify-between pb-2 border-b border-[color-mix(in_srgb,var(--organic-sand-400)_20%,transparent)]">
        <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground/60">Configuration</h3>
      </div>
      <div className="flex flex-col gap-4">
        <NodeInspector
          nodeType={nodeData.nodeType}
          config={nodeData.config}
          onChange={updateSelectedConfig}
          tags={tags}
          flows={otherFlows}
          channelAccountId={flow.channel_account_id}
          onOpenPostPicker={() => setPostPickerOpen(true)}
        />
        <Button
          type="button"
          variant="outline"
          onClick={deleteSelected}
          className="w-full border-destructive/20 text-destructive bg-destructive/5 hover:bg-destructive/10 hover:text-destructive rounded-xl transition-all duration-200"
        >
          <Trash2 className="size-3.5" /> Supprimer le nœud
        </Button>
      </div>
    </div>
  ) : (
    <div className="flex h-[calc(100vh-140px)] flex-col items-center justify-center text-center p-6 space-y-4">
      <div className="relative flex size-14 items-center justify-center rounded-2xl bg-[color-mix(in_srgb,var(--organic-sand-300)_15%,transparent)] border border-[color-mix(in_srgb,var(--organic-sand-400)_20%,transparent)] shadow-sm">
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-tr from-[var(--organic-terracotta)]/10 to-transparent opacity-60 animate-pulse" />
        <Workflow className="size-6 text-muted-foreground/60" />
      </div>
      <div className="space-y-1.5 max-w-[200px]">
        <p className="text-xs font-bold text-foreground/80">Configuration</p>
        <p className="text-[11px] text-muted-foreground/60 leading-relaxed">
          Sélectionnez un nœud dans le canvas pour afficher et modifier ses options.
        </p>
      </div>
    </div>
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
          {/* Floating banner when an edge / link is selected */}
          <AnimatePresence>
            {selectedEdgeId && (
              <motion.div
                initial={{ opacity: 0, y: -20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -20, scale: 0.95 }}
                className="absolute top-4 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2 rounded-2xl border border-destructive/30 bg-card/95 px-3 py-1.5 shadow-2xl backdrop-blur-xl"
              >
                <div className="flex items-center gap-1.5 pl-1">
                  <span className="size-2 rounded-full bg-destructive animate-pulse" />
                  <span className="text-xs font-bold text-foreground">Lien sélectionné</span>
                </div>
                <Button
                  type="button"
                  size="sm"
                  variant="destructive"
                  onClick={() => deleteEdge(selectedEdgeId)}
                  className="h-7 rounded-xl px-2.5 font-bold text-[11px] gap-1 shadow-sm"
                >
                  <Trash2 className="size-3" /> Supprimer
                </Button>
                <button
                  type="button"
                  onClick={() => setSelectedEdgeId(null)}
                  className="rounded-full p-1 text-muted-foreground hover:text-foreground"
                >
                  <X className="size-3.5" />
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          <ReactFlow
            nodes={nodes}
            edges={styledEdges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            nodeTypes={nodeTypes}
            onNodeClick={(_, node) => {
              setSelectedId(node.id)
              setSelectedEdgeId(null)
            }}
            onEdgeClick={(_, edge) => {
              setSelectedId(null)
              setSelectedEdgeId(edge.id)
            }}
            onPaneClick={() => {
              setSelectedId(null)
              setSelectedEdgeId(null)
            }}
            fitView
            fitViewOptions={{ padding: 0.3 }}
            panOnDrag
            zoomOnPinch
            minZoom={0.25}
            maxZoom={2}
            connectionRadius={40}
          >
            <Background />
            <Controls position="bottom-left" showInteractive={true} />
            <MiniMap
              position="bottom-right"
              zoomable
              pannable
              nodeColor={(n) => {
                if (n.id === 'trigger') return 'var(--organic-terracotta)'
                const type = (n.data as unknown as FlowNodeData)?.nodeType
                if (type === 'condition' || type === 'delay') return 'var(--organic-sage)'
                if (type === 'ai_reply') return '#8b5cf6'
                return 'var(--primary)'
              }}
              nodeBorderRadius={6}
              maskColor="rgba(0, 0, 0, 0.45)"
            />
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
        <div className="hidden h-full w-80 shrink-0 overflow-y-auto border-l border-[color-mix(in_srgb,var(--organic-sand-400)_30%,transparent)] bg-[color-mix(in_srgb,var(--organic-bg)_70%,transparent)] backdrop-blur-xl p-4 md:block">
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

      <PostPickerDialog
        open={postPickerOpen}
        accountId={flow.channel_account_id}
        selectedIds={triggerConfig.target_post_ids ?? []}
        onSelect={(ids) => updateTrigger({ target_post_ids: ids.length > 0 ? ids : null })}
        onClose={() => setPostPickerOpen(false)}
      />
    </ReactFlowProvider>
  )
}
