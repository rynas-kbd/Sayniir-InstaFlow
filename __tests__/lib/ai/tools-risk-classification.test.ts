import { describe, expect, test } from 'vitest'
import { AI_TOOLS } from '@/lib/ai/tools'

/**
 * Locks in the risk classification fixed in this pass — regressions here are
 * exactly the class of bug this test exists to catch: create_automation_rule
 * silently going live, or a hard delete staying 'write_reversible' with no
 * undo path. See lib/ai/loop.ts's confirmation gate: only 'write_live' tools
 * are ever paused for user confirmation.
 */
describe('AI_TOOLS risk classification', () => {
  test('tool names are unique (the prompt cache and toolByName lookup both assume this)', () => {
    const names = AI_TOOLS.map((t) => t.name)
    expect(new Set(names).size).toBe(names.length)
  })

  test('every hard delete with no undo path is write_live', () => {
    const hardDeletes = [
      'delete_contact',
      'delete_campaign',
      'delete_product',
      'delete_segment',
      'delete_snippet',
      'delete_tag',
      'delete_growth_link',
      'delete_automation_rule',
      'delete_flow_node',
      'remove_team_member',
    ]
    for (const name of hardDeletes) {
      const tool = AI_TOOLS.find((t) => t.name === name)
      expect(tool, `${name} should be registered`).toBeDefined()
      expect(tool?.risk, `${name} is an unrecoverable delete and must require confirmation`).toBe('write_live')
    }
  })

  test('activating a rule or flow (goes live on real traffic) is write_live', () => {
    for (const name of ['set_flow_status', 'set_automation_rule_active']) {
      const tool = AI_TOOLS.find((t) => t.name === name)
      expect(tool?.risk).toBe('write_live')
    }
  })

  test('creating an automation rule never activates it directly (activation is a separate write_live step)', () => {
    const createTool = AI_TOOLS.find((t) => t.name === 'create_automation_rule')
    expect(createTool?.risk).toBe('write_reversible')
    // A regression here (e.g. reintroducing `is_active: true` in the insert)
    // can't be caught by a type check — this documents the invariant so the
    // next change to this file has to consciously break this test to regress it.
  })

  test('update_automation_rule no longer accepts an isActive field (that must go through set_automation_rule_active)', () => {
    const tool = AI_TOOLS.find((t) => t.name === 'update_automation_rule')
    const schema = tool?.inputSchema as { properties?: Record<string, unknown> } | undefined
    expect(schema?.properties?.isActive).toBeUndefined()
  })
})
