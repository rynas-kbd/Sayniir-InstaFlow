import { describe, test, expect } from 'vitest'
import { runInSandbox, isSandbox, captureSandboxMessage } from '../../../lib/channels/sandbox'

describe('sandbox', () => {
  test('isSandbox() is false outside any sandbox context', () => {
    expect(isSandbox()).toBe(false)
  })

  test('isSandbox() is true inside runInSandbox, and captured messages are returned', async () => {
    const captured = await runInSandbox(async () => {
      expect(isSandbox()).toBe(true)
      captureSandboxMessage({ text: 'hello' })
      captureSandboxMessage({ text: 'world' })
    })
    expect(captured).toEqual([{ text: 'hello' }, { text: 'world' }])
  })

  test('isSandbox() follows the async call chain — true inside an awaited nested async function', async () => {
    async function nested() {
      // A microtask boundary away from the runInSandbox callback itself —
      // this is exactly the scenario dispatchInboundMessage/runFlowsForInbound
      // rely on: many awaits deep, still inside the sandbox context.
      await Promise.resolve()
      return isSandbox()
    }
    let sawSandboxed = false
    await runInSandbox(async () => {
      sawSandboxed = await nested()
    })
    expect(sawSandboxed).toBe(true)
  })

  test('captureSandboxMessage() outside a sandbox context is a silent no-op', () => {
    expect(() => captureSandboxMessage({ text: 'ignored' })).not.toThrow()
  })

  test('is false again after the sandbox callback resolves', async () => {
    await runInSandbox(async () => {
      /* no-op */
    })
    expect(isSandbox()).toBe(false)
  })

  test('two concurrent sandboxes do not leak messages into each other', async () => {
    const [a, b] = await Promise.all([
      runInSandbox(async () => {
        await new Promise((r) => setTimeout(r, 5))
        captureSandboxMessage({ text: 'from-a' })
      }),
      runInSandbox(async () => {
        captureSandboxMessage({ text: 'from-b' })
      }),
    ])
    expect(a).toEqual([{ text: 'from-a' }])
    expect(b).toEqual([{ text: 'from-b' }])
  })
})
