import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// POST /api/products/sync-sheet
// Body: { accountId: string, sheetUrl: string }
// Reads a PUBLIC Google Sheet (shared as "Anyone with link can view")
export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { accountId, sheetUrl } = body

  if (!accountId || !sheetUrl) {
    return NextResponse.json({ error: 'accountId et sheetUrl requis' }, { status: 400 })
  }

  // Verify ownership
  const { data: account } = await supabase
    .from('channel_accounts')
    .select('id')
    .eq('id', accountId)
    .eq('user_id', user.id)
    .single()
  if (!account) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  // Extract spreadsheet ID and optional gid from URL
  const sheetId = extractSheetId(sheetUrl)
  if (!sheetId) {
    return NextResponse.json({ error: 'URL Google Sheets invalide. Assurez-vous que le lien est correct.' }, { status: 400 })
  }

  // Use Google Sheets CSV export URL (works for public sheets)
  const gid = extractGid(sheetUrl)
  const csvUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv${gid ? `&gid=${gid}` : ''}`

  let csvText: string
  try {
    const res = await fetch(csvUrl, { headers: { 'User-Agent': 'InstaFlow-Sync/1.0' } })
    if (!res.ok) {
      throw new Error(`Google Sheets returned ${res.status}. Vérifiez que le Sheet est bien partagé en public (lecture seule).`)
    }
    csvText = await res.text()
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Impossible de lire le Google Sheet.'
    return NextResponse.json({ error: msg }, { status: 400 })
  }

  // Parse CSV
  const rows = parseCSV(csvText)
  if (rows.length === 0) {
    return NextResponse.json({ error: 'Aucune donnée trouvée dans le Google Sheet.' }, { status: 400 })
  }

  const products = rows.map((row) => normalizeRow(row, accountId)).filter(
    (p): p is NonNullable<ReturnType<typeof normalizeRow>> => p !== null
  )
  if (products.length === 0) {
    return NextResponse.json({
      error: 'Colonnes non reconnues. Assurez-vous que votre Sheet contient au moins "name" (ou "nom") et "price" (ou "prix").',
    }, { status: 400 })
  }

  // Upsert: delete existing products for this account and re-insert
  // (simple sync strategy: replace all)
  const { error: deleteError } = await supabase
    .from('products')
    .delete()
    .eq('channel_account_id', accountId)

  if (deleteError) return NextResponse.json({ error: deleteError.message }, { status: 500 })

  const { data: inserted, error } = await supabase
    .from('products')
    .insert(products)
    .select()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ synced: inserted?.length ?? 0, products: inserted })
}

// --- Helpers ---

function extractSheetId(url: string): string | null {
  const match = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/)
  return match ? match[1] : null
}

function extractGid(url: string): string | null {
  const match = url.match(/[#&?]gid=(\d+)/)
  return match ? match[1] : null
}

function parseCSV(text: string): Record<string, string>[] {
  const lines = text.trim().split('\n').filter(Boolean)
  if (lines.length < 2) return []
  const headers = splitCSVLine(lines[0])
  const rows: Record<string, string>[] = []
  for (let i = 1; i < lines.length; i++) {
    const values = splitCSVLine(lines[i])
    const row: Record<string, string> = {}
    headers.forEach((h, idx) => {
      row[h.trim().toLowerCase().replace(/\s+/g, '_')] = (values[idx] ?? '').trim().replace(/^"|"$/g, '')
    })
    rows.push(row)
  }
  return rows
}

function splitCSVLine(line: string): string[] {
  const result: string[] = []
  let current = ''
  let inQuotes = false
  for (let i = 0; i < line.length; i++) {
    if (line[i] === '"') {
      inQuotes = !inQuotes
    } else if (line[i] === ',' && !inQuotes) {
      result.push(current)
      current = ''
    } else {
      current += line[i]
    }
  }
  result.push(current)
  return result
}

function normalizeRow(row: Record<string, string>, accountId: string) {
  const name = row['name'] || row['nom'] || row['product'] || row['produit']
  const priceRaw = row['price'] || row['prix'] || row['price_ht'] || row['tarif']
  const price = parseFloat(priceRaw)
  if (!name || isNaN(price)) return null

  const sizesRaw = row['sizes'] || row['tailles'] || row['size'] || row['taille'] || ''
  const colorsRaw = row['colors'] || row['couleurs'] || row['color'] || row['couleur'] || ''
  const stockRaw = row['stock'] || row['stock_quantity'] || row['quantite'] || '0'

  return {
    channel_account_id: accountId,
    name: name.trim(),
    description: (row['description'] || row['desc'] || '').trim() || null,
    price,
    sizes: sizesRaw ? sizesRaw.split('|').map((s: string) => s.trim()).filter(Boolean) : [],
    colors: colorsRaw ? colorsRaw.split('|').map((c: string) => c.trim()).filter(Boolean) : [],
    image_url: (row['image_url'] || row['image'] || row['photo'] || '').trim() || null,
    stock_quantity: parseInt(stockRaw) || 0,
    is_active: true,
  }
}
