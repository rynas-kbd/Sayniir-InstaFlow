import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * POST /api/products/preview-sheet
 * Prévisualise les données d'un Google Sheet pour détecter les colonnes
 * Body: { sheetUrl: string }
 */
export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json().catch(() => ({}))
  const { sheetUrl } = body

  if (!sheetUrl) {
    return NextResponse.json({ error: 'sheetUrl requis' }, { status: 400 })
  }

  // Extract spreadsheet ID and optional gid from URL
  const sheetId = extractSheetId(sheetUrl)
  if (!sheetId) {
    return NextResponse.json({
      error: 'URL Google Sheets invalide. Assurez-vous que le lien est correct.',
    }, { status: 400 })
  }

  // Use Google Sheets CSV export URL (works for public sheets)
  const gid = extractGid(sheetUrl)
  const csvUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv${gid ? `&gid=${gid}` : ''}`

  let csvText: string
  try {
    const res = await fetch(csvUrl, {
      headers: { 'User-Agent': 'Raddlly-Preview/1.0' },
    })
    if (!res.ok) {
      throw new Error(
        `Google Sheets returned ${res.status}. Vérifiez que le Sheet est bien partagé en public (lecture seule).`
      )
    }
    csvText = await res.text()
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Impossible de lire le Google Sheet.'
    return NextResponse.json({ error: msg }, { status: 400 })
  }

  // Parse CSV
  const rows = parseCSV(csvText)
  if (rows.length === 0) {
    return NextResponse.json({
      error: 'Aucune donnée trouvée dans le Google Sheet.',
    }, { status: 400 })
  }

  const columns = Object.keys(rows[0])
  const sampleData = rows.slice(0, 5) // Retourner les 5 premières lignes

  return NextResponse.json({
    columns,
    sampleData,
    totalRows: rows.length,
  })
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
      row[h.trim()] = (values[idx] ?? '').trim().replace(/^"|"$/g, '')
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
