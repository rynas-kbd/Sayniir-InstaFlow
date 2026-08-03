/**
 * The 58 Algerian wilayas — used to resolve a customer's free-text wilaya answer
 * deterministically instead of relying on an LLM guess (see parse.ts).
 *
 * Each entry lists the official French name, the Arabic name, and common
 * alternate spellings (accents dropped, colloquial/Darija forms, frequent
 * typos). Matching itself is done in `resolveWilaya` below, which normalizes
 * both sides (lowercase, diacritics stripped) before comparing — the `alt`
 * lists only need to cover spellings that don't reduce to the canonical name
 * after that normalization.
 */
export interface WilayaEntry {
  code: number
  fr: string
  ar: string
  alt?: string[]
}

export const WILAYAS: WilayaEntry[] = [
  { code: 1, fr: 'Adrar', ar: 'أدرار' },
  { code: 2, fr: 'Chlef', ar: 'الشلف', alt: ['chelef'] },
  { code: 3, fr: 'Laghouat', ar: 'الأغواط' },
  { code: 4, fr: 'Oum El Bouaghi', ar: 'أم البواقي', alt: ['oum el bouaghi', 'om bouaghi'] },
  { code: 5, fr: 'Batna', ar: 'باتنة' },
  { code: 6, fr: 'Béjaïa', ar: 'بجاية', alt: ['bejaia', 'bougie', 'vgayet'] },
  { code: 7, fr: 'Biskra', ar: 'بسكرة' },
  { code: 8, fr: 'Béchar', ar: 'بشار', alt: ['bechar'] },
  { code: 9, fr: 'Blida', ar: 'البليدة' },
  { code: 10, fr: 'Bouira', ar: 'البويرة' },
  { code: 11, fr: 'Tamanrasset', ar: 'تمنراست', alt: ['tamanghasset'] },
  { code: 12, fr: 'Tébessa', ar: 'تبسة', alt: ['tebessa'] },
  { code: 13, fr: 'Tlemcen', ar: 'تلمسان' },
  { code: 14, fr: 'Tiaret', ar: 'تيارت' },
  { code: 15, fr: 'Tizi Ouzou', ar: 'تيزي وزو', alt: ['tizi-ouzou', 'tizi'] },
  { code: 16, fr: 'Alger', ar: 'الجزائر', alt: ['algiers', 'alger centre'] },
  { code: 17, fr: 'Djelfa', ar: 'الجلفة' },
  { code: 18, fr: 'Jijel', ar: 'جيجل' },
  { code: 19, fr: 'Sétif', ar: 'سطيف', alt: ['setif'] },
  { code: 20, fr: 'Saïda', ar: 'سعيدة', alt: ['saida'] },
  { code: 21, fr: 'Skikda', ar: 'سكيكدة' },
  { code: 22, fr: 'Sidi Bel Abbès', ar: 'سيدي بلعباس', alt: ['sidi bel abbes', 'sidi bel abbas'] },
  { code: 23, fr: 'Annaba', ar: 'عنابة' },
  { code: 24, fr: 'Guelma', ar: 'قالمة' },
  { code: 25, fr: 'Constantine', ar: 'قسنطينة', alt: ['qacentina'] },
  { code: 26, fr: 'Médéa', ar: 'المدية', alt: ['medea'] },
  { code: 27, fr: 'Mostaganem', ar: 'مستغانم' },
  { code: 28, fr: "M'Sila", ar: 'المسيلة', alt: ['msila', "m sila"] },
  { code: 29, fr: 'Mascara', ar: 'معسكر' },
  { code: 30, fr: 'Ouargla', ar: 'ورقلة' },
  { code: 31, fr: 'Oran', ar: 'وهران' },
  { code: 32, fr: 'El Bayadh', ar: 'البيض', alt: ['el bayadh'] },
  { code: 33, fr: 'Illizi', ar: 'إليزي' },
  { code: 34, fr: 'Bordj Bou Arréridj', ar: 'برج بوعريريج', alt: ['bordj bou arreridj', 'bba'] },
  { code: 35, fr: 'Boumerdès', ar: 'بومرداس', alt: ['boumerdes'] },
  { code: 36, fr: 'El Tarf', ar: 'الطارف', alt: ['eltarf'] },
  { code: 37, fr: 'Tindouf', ar: 'تندوف' },
  { code: 38, fr: 'Tissemsilt', ar: 'تيسمسيلت' },
  { code: 39, fr: 'El Oued', ar: 'الوادي', alt: ['eloued', 'oued souf', 'souf'] },
  { code: 40, fr: 'Khenchela', ar: 'خنشلة' },
  { code: 41, fr: 'Souk Ahras', ar: 'سوق أهراس', alt: ['souk-ahras'] },
  { code: 42, fr: 'Tipaza', ar: 'تيبازة' },
  { code: 43, fr: 'Mila', ar: 'ميلة' },
  { code: 44, fr: 'Aïn Defla', ar: 'عين الدفلى', alt: ['ain defla'] },
  { code: 45, fr: 'Naâma', ar: 'النعامة', alt: ['naama'] },
  { code: 46, fr: 'Aïn Témouchent', ar: 'عين تموشنت', alt: ['ain temouchent'] },
  { code: 47, fr: 'Ghardaïa', ar: 'غرداية', alt: ['ghardaia'] },
  { code: 48, fr: 'Relizane', ar: 'غليزان' },
  { code: 49, fr: 'Timimoun', ar: 'تيميمون' },
  { code: 50, fr: 'Bordj Badji Mokhtar', ar: 'برج باجي مختار', alt: ['bordj badji mokhtar', 'bbm'] },
  { code: 51, fr: 'Ouled Djellal', ar: 'أولاد جلال' },
  { code: 52, fr: 'Béni Abbès', ar: 'بني عباس', alt: ['beni abbes'] },
  { code: 53, fr: 'In Salah', ar: 'عين صالح', alt: ['in-salah', 'ain salah'] },
  { code: 54, fr: 'In Guezzam', ar: 'عين قزام', alt: ['in-guezzam'] },
  { code: 55, fr: 'Touggourt', ar: 'تقرت' },
  { code: 56, fr: 'Djanet', ar: 'جانت' },
  { code: 57, fr: "El M'Ghair", ar: 'المغير', alt: ['el mghair', "el m ghair"] },
  { code: 58, fr: 'El Meniaa', ar: 'المنيعة', alt: ['el meniaa', 'el golea'] },
]

/** Lowercase, strip diacritics, collapse punctuation/whitespace — makes "Béjaïa", "bejaia" and "BÉJAÏA" compare equal. */
function normalize(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/^wilaya\s+(de|d')\s*/i, '')
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim()
}

/**
 * Resolves free text to a canonical wilaya name (the `fr` field, used
 * everywhere else in the codebase — order_sessions.wilaya, orders.wilaya).
 * Returns null when nothing matches, so the caller can re-ask instead of
 * silently storing garbage (see the bug this replaces: any string was
 * previously accepted as-is for `wilaya`).
 */
export function resolveWilaya(text: string): string | null {
  const needle = normalize(text)
  if (!needle) return null

  for (const w of WILAYAS) {
    if (normalize(w.fr) === needle) return w.fr
    if (w.ar === text.trim()) return w.fr
    if (w.alt?.some((a) => normalize(a) === needle)) return w.fr
  }

  // Substring pass: "je suis a bejaia akbou" contains "bejaia".
  for (const w of WILAYAS) {
    const candidates = [w.fr, ...(w.alt ?? [])].map(normalize)
    if (candidates.some((c) => c.length >= 3 && needle.includes(c))) return w.fr
    if (w.ar && text.includes(w.ar)) return w.fr
  }

  return null
}
