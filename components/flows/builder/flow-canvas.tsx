'use client'

import { useCallback, useState, useEffect } from 'react'
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
  useReactFlow,
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
  Focus,
} from 'lucide-react'
import { useMediaQuery } from '@/lib/use-media-query'
import { PostPickerDialog } from '@/components/shared/post-picker-dialog'
import { FlowNodeVisual, type FlowNodeData } from './node-visual'
import { NodeInspector } from './node-inspector'
import type { FlowNodeRecord, FlowEdgeRecord, FlowNodeType, FlowSummary } from '../types'
import type { Tag as ContactTag } from '@/components/contacts/types'
import type { AiInsight } from '@/components/ai/types'
import { useT, useLocale } from '@/components/i18n-provider'
import type { Translator } from '@/lib/i18n/translate'

const nodeTypes = { flowNode: FlowNodeVisual }

const ADDABLE: { type: FlowNodeType; icon: typeof MessageSquare }[] = [
  { type: 'send_message', icon: MessageSquare },
  { type: 'ai_reply', icon: Sparkles },
  { type: 'capture_input', icon: ListPlus },
  { type: 'external_request', icon: Globe },
  { type: 'split_test', icon: SplitSquareHorizontal },
  { type: 'condition', icon: GitBranch },
  { type: 'delay', icon: Clock },
  { type: 'set_tag', icon: Tag },
  { type: 'remove_tag', icon: TagIcon },
  { type: 'jump', icon: ArrowRightCircle },
]

function summaryFor(type: FlowNodeType, config: Record<string, unknown>, t: Translator): string {
  switch (type) {
    case 'trigger': {
      const triggerType = (config.trigger_type as string) ?? 'any_message'
      const kws = (config.trigger_keywords as string[] | null) ?? []
      const postIds = (config.target_post_ids as string[] | null) ?? []
      const postsSuffix =
        postIds.length > 0
          ? t('flows.builder.flowCanvas.summary.postsSuffixCount', { count: postIds.length })
          : t('flows.builder.flowCanvas.summary.postsSuffixAll')
      const none = t('flows.builder.flowCanvas.summary.none')
      if (triggerType === 'keyword') {
        return t('flows.builder.flowCanvas.summary.keywordsPrefix', { keywords: kws.join(', ') || none })
      }
      if (triggerType === 'comment_keyword') {
        return t('flows.builder.flowCanvas.summary.commentKeywordsPrefix', { keywords: kws.join(', ') || none }) + postsSuffix
      }
      if (triggerType === 'any_comment') {
        return t('flows.builder.flowCanvas.summary.anyComment') + postsSuffix
      }
      return t('flows.builder.flowCanvas.summary.anyMessageDm')
    }
    case 'send_message':
      return config.message_type === 'card'
        ? t('flows.builder.flowCanvas.summary.cardPrefix', { title: (config.card_title as string) || t('flows.builder.flowCanvas.summary.untitled') })
        : (config.text as string) || t('flows.builder.flowCanvas.summary.noMessage')
    case 'ai_reply':
      return (config.instructions as string) || t('flows.builder.flowCanvas.summary.noInstructions')
    case 'capture_input':
      return config.variable_name
        ? t('flows.builder.flowCanvas.summary.variablePrefix', { name: config.variable_name as string })
        : t('flows.builder.flowCanvas.summary.notConfigured')
    case 'external_request':
      return config.url ? String(config.url) : t('flows.builder.flowCanvas.summary.notConfigured')
    case 'split_test': {
      const pctA = (config.percentage_a as number) ?? 50
      return t('flows.builder.flowCanvas.summary.splitSummary', { pctA, pctB: 100 - pctA })
    }
    case 'condition':
      return config.field ? `${config.field} ${config.operator ?? 'equals'} ${config.value ?? ''}` : t('flows.builder.flowCanvas.summary.notConfigured')
    case 'delay':
      return t('flows.builder.flowCanvas.summary.delaySeconds', { seconds: (config.seconds as number) ?? 60 })
    case 'set_tag':
    case 'remove_tag':
      return config.tag_id ? t('flows.builder.flowCanvas.summary.tagSelected') : t('flows.builder.flowCanvas.summary.noTag')
    case 'jump':
      return config.target_flow_id ? t('flows.builder.flowCanvas.summary.flowSelected') : t('flows.builder.flowCanvas.summary.noFlow')
    default:
      return ''
  }
}

function toReactFlowNode(record: FlowNodeRecord, insights: AiInsight[], t: Translator): Node {
  return {
    id: record.node_key,
    type: 'flowNode',
    position: record.position ?? { x: 0, y: 0 },
    data: { nodeType: record.type, config: record.config, summary: summaryFor(record.type, record.config, t), insights },
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

export function FlowCanvas(props: {
  flow: FlowMeta
  initialNodes: FlowNodeRecord[]
  initialEdges: FlowEdgeRecord[]
  tags: ContactTag[]
  otherFlows: FlowSummary[]
  insightsByNodeKey?: Record<string, AiInsight[]>
}) {
  return (
    <ReactFlowProvider>
      <FlowCanvasInner {...props} />
    </ReactFlowProvider>
  )
}

function FlowCanvasInner({
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
  const { fitView } = useReactFlow()
  const t = useT()
  const locale = useLocale()
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
            summary: summaryFor(n.type, enrichedConfig, t),
            insights: insightsByNodeKey[n.node_key] ?? [],
          },
        }
      }
      return toReactFlowNode(n, insightsByNodeKey[n.node_key] ?? [], t)
    })
  )
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges.map(toReactFlowEdge))
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
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

  // Détecter les changements non sauvegardés
  useEffect(() => {
    setHasUnsavedChanges(true)
  }, [nodes, edges])

  // Raccourci clavier Ctrl+S / Cmd+S pour sauvegarder
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault()
        handleSave()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const onConnect = useCallback(
    (connection: Connection) => setEdges((eds) => addEdge({ ...connection, sourceHandle: connection.sourceHandle ?? 'default' }, eds)),
    [setEdges]
  )

  function deleteEdge(edgeId: string) {
    const edgeToDelete = edges.find((e) => e.id === edgeId)
    if (!edgeToDelete) return
    setEdges((eds) => eds.filter((e) => e.id !== edgeId))
    setSelectedEdgeId(null)
    toast.success(t('flows.builder.flowCanvas.linkDeleted'), {
      action: {
        label: t('flows.builder.flowCanvas.undo'),
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

  function addNextStep(type: FlowNodeType) {
    const parentId = selectedId ?? 'trigger'
    const parentNode = nodes.find((n) => n.id === parentId)
    
    const newNodeKey = `${type}-${crypto.randomUUID()}`
    const existingOutgoingEdges = edges.filter((e) => e.source === parentId)
    
    const basePos = parentNode ? parentNode.position : { x: 100, y: 100 }
    const newPos = {
      x: basePos.x + (existingOutgoingEdges.length > 0 ? existingOutgoingEdges.length * 180 : 0),
      y: basePos.y + 160,
    }

    const newNode: Node = {
      id: newNodeKey,
      type: 'flowNode',
      position: newPos,
      data: { nodeType: type, config: {}, summary: summaryFor(type, {}, t) },
    }

    const parentNodeType = parentNode ? (parentNode.data as unknown as FlowNodeData)?.nodeType : undefined
    const sourceHandle = parentNodeType === 'condition'
      ? (existingOutgoingEdges.length === 0 ? 'true' : 'false')
      : 'default'

    const newEdge: Edge = {
      id: `${parentId}-${newNodeKey}-${sourceHandle}`,
      source: parentId,
      target: newNodeKey,
      sourceHandle,
    }

    setNodes((nds) => [...nds, newNode])
    setEdges((eds) => [...eds, newEdge])
    setSelectedId(newNodeKey)
    setSelectedEdgeId(null)

    toast.success(t('flows.builder.flowCanvas.stepAddedAndConnected') ?? 'Étape ajoutée et reliée !')
    
    setTimeout(() => {
      fitView({ padding: 0.35, duration: 400 })
    }, 50)
  }

  function connectToExistingNode(targetNodeId: string) {
    if (!selectedId || selectedId === targetNodeId) return
    const existingEdge = edges.find((e) => e.source === selectedId && e.target === targetNodeId)
    if (existingEdge) {
      toast.error('Ces étapes sont déjà reliées')
      return
    }

    const parentNode = nodes.find((n) => n.id === selectedId)
    const parentNodeType = parentNode ? (parentNode.data as unknown as FlowNodeData)?.nodeType : undefined
    const existingOutgoing = edges.filter((e) => e.source === selectedId)
    const sourceHandle = parentNodeType === 'condition'
      ? (existingOutgoing.length === 0 ? 'true' : 'false')
      : 'default'

    const newEdge: Edge = {
      id: `${selectedId}-${targetNodeId}-${sourceHandle}`,
      source: selectedId,
      target: targetNodeId,
      sourceHandle,
    }

    setEdges((eds) => [...eds, newEdge])
    toast.success('Étapes reliées !')
  }

  const existingNodesList = nodes
    .filter((n) => n.id !== selectedId)
    .map((n) => {
      const data = n.data as unknown as FlowNodeData
      const typeLabel = t(`flows.nodeTypes.${data.nodeType || 'unknown'}.short`)
      const summaryText = data.summary ? `: ${data.summary.slice(0, 25)}` : ''
      return {
        id: n.id,
        label: `${n.id === 'trigger' ? '⚡ Déclencheur' : typeLabel}${summaryText}`,
      }
    })

  function addNode(type: FlowNodeType) {
    if (selectedId) {
      addNextStep(type)
      return
    }
    const newNodeKey = `${type}-${crypto.randomUUID()}`
    const lastNode = nodes[nodes.length - 1]
    const basePos = lastNode ? lastNode.position : { x: 100, y: 100 }
    const newNode: Node = {
      id: newNodeKey,
      type: 'flowNode',
      position: { x: basePos.x, y: basePos.y + 160 },
      data: { nodeType: type, config: {}, summary: summaryFor(type, {}, t) },
    }
    setNodes((nds) => [...nds, newNode])
    setSelectedId(newNodeKey)
    setTimeout(() => {
      fitView({ padding: 0.35, duration: 400 })
    }, 50)
  }

  function updateSelectedConfig(config: Record<string, unknown>) {
    if (!selectedId) return
    setNodes((nds) =>
      nds.map((n) => (n.id === selectedId ? { ...n, data: { ...n.data, config, summary: summaryFor((n.data as unknown as FlowNodeData).nodeType, config, t) } } : n))
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
                }, t),
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
      if (!res.ok) throw new Error(t('flows.builder.flowCanvas.genericError'))
      toast.success(t('flows.builder.flowCanvas.triggerUpdated'))
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
                  }, t),
                },
              }
            : n
        )
      )
      toast.error(t('flows.builder.flowCanvas.triggerUpdateError'))
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
      console.log('Saving flow:', { flowId: flow.id, nodeCount: nodes.length, edgeCount: edges.length })
      
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
      
      console.log('Payload:', payload)
      
      const res = await fetch(`/api/flows/${flow.id}/graph`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      
      console.log('Response status:', res.status)
      
      if (!res.ok) {
        const data = await res.json()
        console.error('Save failed:', data)
        throw new Error(data.error || t('flows.builder.flowCanvas.genericError'))
      }

      toast.success(t('flows.builder.flowCanvas.flowSaved'))
      setLastSavedAt(new Date())
      setHasUnsavedChanges(false)
    } catch (err) {
      console.error('Save error:', err)
      toast.error(err instanceof Error ? err.message : t('flows.builder.flowCanvas.saveError'))
    } finally {
      setSaving(false)
    }
  }

  const nodeData = selectedNode ? (selectedNode.data as unknown as FlowNodeData) : null
  const isTriggerSelected = selectedId === 'trigger'

  const inspectorContent = isTriggerSelected ? (
    <div className="space-y-4">
      <div className="flex items-center justify-between pb-2 border-b border-[color-mix(in_srgb,var(--organic-sand-400)_20%,transparent)]">
        <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground/60">{t('flows.builder.flowCanvas.triggerHeading')}</h3>
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
        onAddNextStep={addNextStep}
        onConnectToNode={connectToExistingNode}
        existingNodes={existingNodesList}
      />
    </div>
  ) : nodeData ? (
    <div className="space-y-4">
      <div className="flex items-center justify-between pb-2 border-b border-[color-mix(in_srgb,var(--organic-sand-400)_20%,transparent)]">
        <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground/60">{t('flows.builder.flowCanvas.configHeading')}</h3>
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
          onAddNextStep={addNextStep}
          onConnectToNode={connectToExistingNode}
          existingNodes={existingNodesList}
        />
        <Button
          type="button"
          variant="outline"
          onClick={deleteSelected}
          className="w-full border-destructive/20 text-destructive bg-destructive/5 hover:bg-destructive/10 hover:text-destructive rounded-xl transition-all duration-200"
        >
          <Trash2 className="size-3.5" /> {t('flows.builder.flowCanvas.deleteNode')}
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
        <p className="text-xs font-bold text-foreground/80">{t('flows.builder.flowCanvas.emptyInspectorTitle')}</p>
        <p className="text-[11px] text-muted-foreground/60 leading-relaxed">
          {t('flows.builder.flowCanvas.emptyInspectorDescription')}
        </p>
      </div>
    </div>
  )

  return (
    <div className="flex h-full w-full flex-col">
      {/* Top toolbar avec bouton Save & Recenter */}
      <div className="flex shrink-0 items-center justify-between gap-3 border-b border-border bg-sidebar px-4 py-2.5">
        <div className="flex items-center gap-2">
          <Workflow className="size-4 text-muted-foreground" />
          <h2 className="text-sm font-semibold text-foreground truncate max-w-[140px] sm:max-w-none">{flow.name}</h2>
          {hasUnsavedChanges && (
            <span className="flex items-center gap-1 text-[10px] text-amber-600 dark:text-amber-500 shrink-0">
              <span className="size-1.5 rounded-full bg-amber-600 dark:bg-amber-500 animate-pulse" />
              {t('flows.builder.flowCanvas.unsaved')}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {lastSavedAt && !hasUnsavedChanges && (
            <span className="hidden sm:block text-[11px] text-muted-foreground">
              {t('flows.builder.flowCanvas.savedAt', {
                time: lastSavedAt.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' }),
              })}
            </span>
          )}
          <Button
            size="sm"
            variant="outline"
            onClick={() => fitView({ padding: 0.35, duration: 400 })}
            title="Recadrer la vue (Recenter)"
            className="gap-1.5 shadow-sm text-xs"
          >
            <Focus className="size-3.5" />
            <span className="hidden sm:inline">Recadrer</span>
          </Button>
          <Button
            size="sm"
            onClick={handleSave}
            disabled={saving || !hasUnsavedChanges}
            className="gap-1.5 shadow-sm"
          >
            <Save className="size-3.5" />
            <span className="hidden sm:inline">
              {saving ? t('flows.builder.flowCanvas.saving') : hasUnsavedChanges ? t('flows.builder.flowCanvas.save') : t('flows.builder.flowCanvas.saved')}
            </span>
            <span className="sm:hidden">
              {saving ? '…' : t('flows.builder.flowCanvas.saveShort')}
            </span>
          </Button>
        </div>
      </div>

        <div className="flex h-full w-full flex-1 overflow-hidden">
        {/* Left sidebar — add nodes (desktop only) */}
        <div className="hidden h-full w-48 shrink-0 flex-col gap-1 overflow-y-auto border-r border-border bg-sidebar p-3 md:flex">
          <p className="mb-1 px-1 text-[11px] font-medium text-muted-foreground">{t('flows.builder.flowCanvas.addNodeHeading')}</p>
          {ADDABLE.map(({ type, icon: Icon }) => (
            <Button
              key={type}
              variant="outline"
              size="sm"
              className="justify-start"
              onClick={() => {
                addNode(type)
              }}
            >
              <Icon className="size-3.5" /> {t(`flows.nodeTypes.${type}.short`)}
            </Button>
          ))}
        </div>

        {/* Canvas — forced LTR: @xyflow/react has no RTL support (physical
            left/right CSS baked into its stylesheet, no `dir` prop), so a
            mirrored node graph would just be broken, not "translated". The
            toolbar/palette/inspector around it keep the inherited direction
            and flip normally; only this wrapper and its children stay LTR. */}
        <div dir="ltr" className="relative h-full flex-1">
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
                  <span className="text-xs font-bold text-foreground">{t('flows.builder.flowCanvas.edgeSelected')}</span>
                </div>
                <Button
                  type="button"
                  size="sm"
                  variant="destructive"
                  onClick={() => deleteEdge(selectedEdgeId)}
                  className="h-7 rounded-xl px-2.5 font-bold text-[11px] gap-1 shadow-sm"
                >
                  <Trash2 className="size-3" /> {t('flows.builder.flowCanvas.delete')}
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
          <motion.button
            onClick={() => setPaletteOpen(true)}
            className="absolute bottom-20 right-4 z-10 md:hidden flex size-14 items-center justify-center rounded-full shadow-2xl"
            style={{
              background: 'linear-gradient(145deg, var(--organic-terracotta-400) 0%, var(--organic-terracotta-600) 100%)',
            }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            aria-label={t('flows.builder.flowCanvas.addNodeFabAria')}
          >
            {/* Outer glow */}
            <motion.span
              aria-hidden="true"
              className="pointer-events-none absolute -inset-2 rounded-full"
              style={{
                background:
                  'radial-gradient(circle, color-mix(in srgb, var(--organic-terracotta) 50%, transparent) 0%, transparent 70%)',
              }}
              animate={{ opacity: [0.4, 0.7, 0.4], scale: [0.95, 1, 0.95] }}
              transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
            />
            <Plus className="size-6 text-white" strokeWidth={2.5} />
          </motion.button>
        </div>

        {/* Right sidebar — inspector (desktop only) */}
        <div className="hidden h-full w-80 shrink-0 overflow-y-auto border-l border-[color-mix(in_srgb,var(--organic-sand-400)_30%,transparent)] bg-[color-mix(in_srgb,var(--organic-bg)_70%,transparent)] backdrop-blur-xl p-4 md:block">
          {inspectorContent}
        </div>
      </div>

      {/* Mobile: node palette sheet */}
      <Sheet open={paletteOpen} onOpenChange={setPaletteOpen}>
        <SheetContent side="bottom" className="max-h-[75vh] overflow-y-auto pb-safe">
          <SheetHeader>
            <SheetTitle className="text-base font-semibold">{t('flows.builder.flowCanvas.addNodeHeading')}</SheetTitle>
          </SheetHeader>

          <div className="mt-4 grid grid-cols-2 gap-3">
            {ADDABLE.map(({ type, icon: Icon }) => (
              <button
                key={type}
                onClick={() => {
                  addNode(type)
                  setPaletteOpen(false)
                }}
                className="group relative flex flex-col items-center gap-2.5 rounded-2xl border border-border bg-card p-4 transition-all duration-200 active:scale-95 hover:border-primary/40 hover:bg-primary/5"
              >
                {/* Icon container */}
                <div className="flex size-12 items-center justify-center rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 transition-colors group-hover:from-primary/20 group-hover:to-primary/10">
                  <Icon className="size-5 text-primary" strokeWidth={2} />
                </div>

                {/* Label */}
                <span className="text-center text-xs font-medium leading-tight text-foreground">
                  {t(`flows.nodeTypes.${type}.short`)}
                </span>
              </button>
            ))}
          </div>

          {/* Save button at bottom */}
          <div className="mt-4 pt-4 border-t border-border">
            <Button
              onClick={() => {
                handleSave()
                setPaletteOpen(false)
              }}
              disabled={saving}
              className="w-full gap-2"
              size="lg"
            >
              <Save className="size-4" />
              {saving ? t('flows.builder.flowCanvas.mobileSheetSaving') : t('flows.builder.flowCanvas.mobileSheetSave')}
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      {/* Mobile: node inspector sheet */}
      <Sheet open={isMobile && selectedId !== null} onOpenChange={(open) => !open && setSelectedId(null)}>
        <SheetContent side="bottom" className="max-h-[80vh] overflow-y-auto">
          <SheetHeader className="sr-only">
            <SheetTitle>{t('flows.builder.flowCanvas.mobileInspectorTitle')}</SheetTitle>
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
    </div>
  )
}
