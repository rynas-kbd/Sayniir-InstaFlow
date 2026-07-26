import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const SNOOZE_MS = 7 * 24 * 60 * 60 * 1000

// POST /api/ai/insights/[id]/dismiss — snoozes a finding for 7 days
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const now = new Date()
  const { data, error } = await supabase
    .from('ai_insights')
    .update({ dismissed_at: now.toISOString(), dismissed_until: new Date(now.getTime() + SNOOZE_MS).toISOString() })
    .eq('id', id)
    .select('id')
    .maybeSingle()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!data) return NextResponse.json({ error: 'Insight not found' }, { status: 404 })

  return NextResponse.json({ success: true })
}
