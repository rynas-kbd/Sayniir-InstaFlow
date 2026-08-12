'use client'

import { useEffect, useState } from 'react'
import type { InstagramMedia } from './media'

interface MediaState {
  items: InstagramMedia[]
  loading: boolean
  loadingMore: boolean
  error: string
  nextCursor: string | null
  /** Set once the first page has resolved, success or failure — lets a fresh
   * subscriber tell "not fetched yet" apart from "fetched, zero results". */
  fetched: boolean
}

const EMPTY_STATE: MediaState = {
  items: [],
  loading: false,
  loadingMore: false,
  error: '',
  nextCursor: null,
  fetched: false,
}

/** Per-account cache + subscriber list, so the preview field and the picker grid
 * (which mount independently, and — in the flow builder — the inspector itself
 * mounts twice at once for the desktop sidebar and the mobile sheet) share one
 * fetch instead of each hitting the Graph API separately. */
const cache = new Map<string, MediaState>()
const subscribers = new Map<string, Set<() => void>>()

function getState(accountId: string): MediaState {
  return cache.get(accountId) ?? EMPTY_STATE
}

function setState(accountId: string, patch: Partial<MediaState>) {
  cache.set(accountId, { ...getState(accountId), ...patch })
  subscribers.get(accountId)?.forEach((notify) => notify())
}

async function fetchPage(accountId: string, after: string | null): Promise<void> {
  const params = new URLSearchParams({ accountId, limit: '24' })
  if (after) params.set('after', after)

  const res = await fetch(`/api/instagram/media?${params.toString()}`)
  const data = await res.json()

  if (!res.ok || data.error) {
    setState(accountId, {
      loading: false,
      loadingMore: false,
      error: typeof data.error === 'string' ? data.error : 'Impossible de récupérer les posts',
      fetched: true,
    })
    return
  }

  const prevItems = after ? getState(accountId).items : []
  setState(accountId, {
    items: [...prevItems, ...(data.data ?? [])],
    nextCursor: data.nextCursor ?? null,
    loading: false,
    loadingMore: false,
    error: '',
    fetched: true,
  })
}

function ensureLoaded(accountId: string) {
  const current = getState(accountId)
  if (current.fetched || current.loading) return
  setState(accountId, { loading: true, error: '' })
  fetchPage(accountId, null)
}

export function useInstagramMedia(accountId: string | undefined) {
  const [, forceRender] = useState(0)

  useEffect(() => {
    if (!accountId) return
    const notify = () => forceRender((n) => n + 1)
    const set = subscribers.get(accountId) ?? new Set<() => void>()
    set.add(notify)
    subscribers.set(accountId, set)
    ensureLoaded(accountId)
    return () => {
      set.delete(notify)
    }
  }, [accountId])

  if (!accountId) {
    return { ...EMPTY_STATE, loadMore: () => {}, reload: () => {} }
  }

  const state = getState(accountId)

  function loadMore() {
    if (!accountId || state.loadingMore || !state.nextCursor) return
    setState(accountId, { loadingMore: true })
    fetchPage(accountId, state.nextCursor)
  }

  function reload() {
    if (!accountId) return
    cache.delete(accountId)
    setState(accountId, { loading: true })
    fetchPage(accountId, null)
  }

  return {
    items: state.items,
    loading: state.loading,
    loadingMore: state.loadingMore,
    error: state.error,
    hasMore: state.nextCursor !== null,
    loadMore,
    reload,
  }
}
