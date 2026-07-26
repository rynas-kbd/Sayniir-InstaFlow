import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

const BUCKET = 'images'
const MAX_SIZE_BYTES = 5 * 1024 * 1024
const ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'image/gif']

// Generic image upload endpoint — not tied to Boutique products specifically, so campaigns,
// automation rule cards, and the flow builder card node can reuse it later without a new route.
// POST multipart/form-data: file, channelAccountId, folder (e.g. 'products').
export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const formData = await request.formData()
  const file = formData.get('file')
  const channelAccountId = formData.get('channelAccountId')
  const folder = formData.get('folder')

  if (!(file instanceof File) || typeof channelAccountId !== 'string' || !channelAccountId) {
    return NextResponse.json({ error: 'file et channelAccountId sont requis' }, { status: 400 })
  }
  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json({ error: 'Type de fichier non supporté (png, jpeg, webp, gif uniquement)' }, { status: 400 })
  }
  if (file.size > MAX_SIZE_BYTES) {
    return NextResponse.json({ error: 'Fichier trop volumineux (5 Mo maximum)' }, { status: 400 })
  }

  // Verify ownership — same pattern as every other route (e.g. app/api/products/route.ts)
  const { data: account } = await supabase
    .from('channel_accounts')
    .select('id')
    .eq('id', channelAccountId)
    .eq('user_id', user.id)
    .single()
  if (!account) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const safeFolder = typeof folder === 'string' && /^[a-z0-9-]+$/.test(folder) ? folder : 'misc'
  const ext = ALLOWED_TYPES.includes(file.type) ? file.type.split('/')[1] : 'jpg'
  const path = `${channelAccountId}/${safeFolder}/${crypto.randomUUID()}.${ext}`

  const admin = createAdminClient()
  const { error: uploadError } = await admin.storage.from(BUCKET).upload(path, file, {
    contentType: file.type,
    upsert: false,
  })
  if (uploadError) return NextResponse.json({ error: uploadError.message }, { status: 500 })

  const { data: publicUrlData } = admin.storage.from(BUCKET).getPublicUrl(path)
  return NextResponse.json({ url: publicUrlData.publicUrl }, { status: 201 })
}
