import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// POST /api/products/import
// Body: multipart/form-data with "file" (CSV or JSON) and "accountId"
export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const formData = await request.formData()
  const file = formData.get('file') as File | null
  const accountId = formData.get('accountId') as string | null
  const mappingRaw = formData.get('mapping') as string | null

  if (!file || !accountId) {
    return NextResponse.json({ error: 'file et accountId requis' }, { status: 400 })
  }

  // Parse custom column mapping if provided
  let customMapping: Record<string, string> = {}
  if (mappingRaw) {
    try {
      customMapping = JSON.parse(mappingRaw)
    } catch {
      return NextResponse.json({ error: 'mapping JSON invalide' }, { status: 400 })
    }
  }

  // Verify ownership
  const { data: account } = await supabase
    .from('channel_accounts')
    .select('id')
    .eq('id', accountId)
    .eq('user_id', user.id)
    .single()
  if (!account) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const fileName = file.name.toLowerCase()
  const text = await file.text()

  let rows: Record<string, string>[] = []

  try {
    if (fileName.endsWith('.json')) {
      // JSON format: array of objects
      const parsed = JSON.parse(text)
      rows = Array.isArray(parsed) ? parsed : [parsed]
    } else if (fileName.endsWith('.csv')) {
      // CSV parsing (simple, handles quoted fields)
      rows = parseCSV(text)
    } else {
      return NextResponse.json({ error: 'Format non supporté. Utilisez CSV ou JSON.' }, { status: 400 })
    }
  } catch {
    return NextResponse.json({ error: 'Fichier invalide ou mal formaté.' }, { status: 400 })
  }

  if (rows.length === 0) {
    return NextResponse.json({ error: 'Aucune donnée trouvée dans le fichier.' }, { status: 400 })
  }

  // Normalize rows into product records
  const products = rows.map((row) => normalizeRow(row, accountId, customMapping)).filter(
    (p): p is NonNullable<ReturnType<typeof normalizeRow>> => p !== null
  )

  if (products.length === 0) {
    return NextResponse.json({ error: 'Aucune colonne "name" et "price" trouvées dans le fichier.' }, { status: 400 })
  }

  const { data: inserted, error } = await supabase
    .from('products')
    .insert(products)
    .select()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ imported: inserted?.length ?? 0, products: inserted })
}

// --- Helpers ---

function parseCSV(text: string): Record<string, string>[] {
  const lines = text.trim().split('\n').filter(Boolean)
  if (lines.length < 2) return []

  const headers = splitCSVLine(lines[0]).map(h => h.trim().replace(/^"|"$/g, ''))
  const rows: Record<string, string>[] = []

  for (let i = 1; i < lines.length; i++) {
    const values = splitCSVLine(lines[i])
    const row: Record<string, string> = {}
    headers.forEach((h, idx) => {
      row[h] = (values[idx] ?? '').trim().replace(/^"|"$/g, '')
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
        return row[mappedColumn].trim()
      }
    }
    // Fall back to automatic detection
    const lowerRow = Object.fromEntries(Object.entries(row).map(([k, v]) => [k.toLowerCase(), v]))
    for (const key of fallbacks) {
      if (lowerRow[key]) return lowerRow[key].trim()
    }
    return ''
  }

  const name = getValue('name', ['name', 'nom', 'product', 'produit', 'titre', 'title', 'article'])
  const priceRaw = getValue('price', ['price', 'prix', 'price_ht', 'tarif', 'cost', 'montant'])
  const price = parseFloat(priceRaw)

  if (!name || isNaN(price)) return null

  const sizesRaw = getValue('sizes', ['sizes', 'tailles', 'size', 'taille'])
  const colorsRaw = getValue('colors', ['colors', 'couleurs', 'color', 'couleur', 'colour'])
  const stockRaw = getValue('stock_quantity', ['stock', 'stock_quantity', 'quantite', 'quantity', 'qty', 'inventaire', 'inventory'])
  const description = getValue('description', ['description', 'desc', 'détails', 'details'])
  const imageUrl = getValue('image_url', ['image_url', 'image', 'photo', 'img', 'picture', 'url'])

  return {
    channel_account_id: accountId,
    name,
    description: description || null,
    price,
    sizes: sizesRaw ? sizesRaw.split('|').map((s: string) => s.trim()).filter(Boolean) : [],
    colors: colorsRaw ? colorsRaw.split('|').map((c: string) => c.trim()).filter(Boolean) : [],
    image_url: imageUrl || null,
    stock_quantity: parseInt(stockRaw) || 0,
    is_active: true,
  }
}
