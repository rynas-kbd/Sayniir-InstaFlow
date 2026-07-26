import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { jsonError } from '@/lib/api/errors'

const BUCKET = 'images'
const MAX_SIZE_BYTES = 5 * 1024 * 1024
const ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'image/gif']

/**
 * Sniffs the actual file signature rather than trusting the client-supplied
 * multipart Content-Type — without this, an attacker can upload arbitrary
 * bytes (e.g. HTML/SVG) labeled as `image/png` and have it stored and served
 * from the public bucket under that declared type.
 */
function sniffImageType(bytes: Uint8Array): string | null {
  if (bytes.length >= 8 && bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) {
    return 'image/png'
  }
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return 'image/jpeg'
  }
  if (bytes.length >= 6 && bytes[0] === 0x47 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x38) {
    return 'image/gif'
  }
  if (
    bytes.length >= 12 &&
    bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46 &&
    bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50
  ) {
    return 'image/webp'
  }
  return null
}

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

  const headerBytes = new Uint8Array(await file.slice(0, 12).arrayBuffer())
  const sniffedType = sniffImageType(headerBytes)
  if (!sniffedType || !ALLOWED_TYPES.includes(sniffedType)) {
    return NextResponse.json({ error: 'Le contenu du fichier ne correspond pas à une image valide' }, { status: 400 })
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
  // Use the sniffed type, not the client-declared one, for both the stored
  // extension and the Content-Type served back — the whole point of sniffing
  // is to not trust file.type past this point.
  const ext = sniffedType.split('/')[1]
  const path = `${channelAccountId}/${safeFolder}/${crypto.randomUUID()}.${ext}`

  const admin = createAdminClient()
  const { error: uploadError } = await admin.storage.from(BUCKET).upload(path, file, {
    contentType: sniffedType,
    upsert: false,
  })
  if (uploadError) return jsonError(500, "Impossible d'uploader le fichier", uploadError)

  const { data: publicUrlData } = admin.storage.from(BUCKET).getPublicUrl(path)
  return NextResponse.json({ url: publicUrlData.publicUrl }, { status: 201 })
}
