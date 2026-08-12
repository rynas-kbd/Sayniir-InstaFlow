import { NextRequest, NextResponse } from 'next/server'
import { jsonError } from '@/lib/api/errors'
import { createClient } from '@/lib/supabase/server'

// POST /api/products/sync-sheet
// Body: { accountId: string, sheetUrl: string, mapping?: Record<string, string> }
// Reads a PUBLIC Google Sheet (shared as "Anyone with link can view")
export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json().catch(() => ({}))
  const { accountId, sheetUrl, mapping } = body

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

  const products = rows.map((row) => normalizeRow(row, accountId, mapping)).filter(
    (p): p is NonNullable<ReturnType<typeof normalizeRow>> => p !== null
  )
  if (products.length === 0) {
    return NextResponse.json({
      error: 'Colonnes non reconnues. Assurez-vous que votre Sheet contient au moins "name" (ou "nom") et "price" (ou "prix").',
    }, { status: 400 })
  }

  // A Google Sheet row has no stable id to upsert against (unlike Shopify's
  // product id), so we match by name instead: a product whose name already
  // exists for this account gets updated in place, everything else is
  // inserted. This used to delete every existing product for the account
  // before re-inserting — a re-sync after manually editing a product in the
  // app (or one whose row was temporarily removed from the sheet) silently
  // destroyed it. Products no longer present in the sheet are left alone
  // rather than deleted — safer default, consistent with the CSV importer
  // (app/api/products/import/route.ts), which never deletes either.
  const { data: existing } = await supabase.from('products').select('id, name').eq('channel_account_id', accountId)
  const existingByName = new Map((existing ?? []).map((p) => [p.name.trim().toLowerCase(), p.id]))

  const toInsert = products.filter((p) => !existingByName.has(p.name.trim().toLowerCase()))
  const toUpdate = products.filter((p) => existingByName.has(p.name.trim().toLowerCase()))

  const results: unknown[] = []

  if (toInsert.length > 0) {
    const { data: inserted, error } = await supabase.from('products').insert(toInsert).select()
    if (error) return jsonError(500, 'Une erreur est survenue', error)
    results.push(...(inserted ?? []))
  }

  for (const p of toUpdate) {
    const id = existingByName.get(p.name.trim().toLowerCase())!
    const { data: updated, error } = await supabase.from('products').update(p).eq('id', id).select().single()
    if (error) return jsonError(500, 'Une erreur est survenue', error)
    if (updated) results.push(updated)
  }

  return NextResponse.json({ synced: results.length, products: results })
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

function normalizeRow(row: Record<string, string>, accountId: string, customMapping?: Record<string, string>) {
  // Helper to get value from row using custom mapping or fallback patterns
  const getValue = (field: string, fallbacks: string[]): string => {
    // Check if there's a custom mapping for this field
    if (customMapping) {
      const mappedColumn = Object.entries(customMapping).find(([, targetField]) => targetField === field)?.[0]
      if (mappedColumn && row[mappedColumn] !== undefined) {
        return (row[mappedColumn] ?? '').trim()
      }
    }
    // Fall back to automatic detection
    const lowerRow = Object.fromEntries(Object.entries(row).map(([k, v]) => [k.toLowerCase(), v]))
    for (const key of fallbacks) {
      if (lowerRow[key]) return (lowerRow[key] ?? '').trim()
    }
    return ''
  }

  const name = getValue('name', ['name', 'nom', 'product', 'produit'])
  const priceRaw = getValue('price', ['price', 'prix', 'price_ht', 'tarif'])
  const price = parseFloat(priceRaw)
  if (!name || isNaN(price)) return null

  const sizesRaw = getValue('sizes', ['sizes', 'tailles', 'size', 'taille'])
  const colorsRaw = getValue('colors', ['colors', 'couleurs', 'color', 'couleur'])
  const stockRaw = getValue('stock_quantity', ['stock', 'stock_quantity', 'quantite'])
  const description = getValue('description', ['description', 'desc'])
  const imageUrl = getValue('image_url', ['image_url', 'image', 'photo'])

  return {
    channel_account_id: accountId,
    name: name.trim(),
    description: description || null,
    price,
    sizes: sizesRaw ? sizesRaw.split('|').map((s: string) => s.trim()).filter(Boolean) : [],
    colors: colorsRaw ? colorsRaw.split('|').map((c: string) => c.trim()).filter(Boolean) : [],
    image_url: imageUrl || null,
    stock_quantity: parseInt(stockRaw) || 0,
    is_active: true,
  }
}
