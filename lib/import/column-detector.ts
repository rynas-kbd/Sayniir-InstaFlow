/**
 * Système de détection automatique et intelligente des colonnes lors de l'import de données.
 * Utilise du fuzzy matching, des synonymes et des patterns pour reconnaître les colonnes
 * même si elles ne correspondent pas exactement aux noms attendus.
 */

export type ProductField = 
  | 'name'
  | 'description'
  | 'price'
  | 'sizes'
  | 'colors'
  | 'stock_quantity'
  | 'image_url'
  | 'category'
  | 'kind'
  | 'currency'

export interface FieldMatch {
  field: ProductField
  columnName: string
  confidence: number // 0-1
  method: 'exact' | 'fuzzy' | 'synonym' | 'pattern'
}

export interface DetectionResult {
  matches: FieldMatch[]
  unmatchedColumns: string[]
  suggestions: Array<{
    columnName: string
    possibleFields: Array<{ field: ProductField; confidence: number }>
  }>
}

/**
 * Dictionnaire de synonymes et variations pour chaque champ produit.
 * Supporte français, anglais, arabe et variations courantes.
 */
const FIELD_SYNONYMS: Record<ProductField, string[]> = {
  name: [
    'name', 'nom', 'product', 'produit', 'titre', 'title', 'article', 
    'product_name', 'nom_produit', 'designation', 'libelle', 'label',
    'item', 'article_name', 'product_title', 'nom_article',
    // Arabe
    'اسم', 'الاسم', 'منتج', 'المنتج', 'اسم المنتج', 'العنوان', 'السلعة',
    'البضاعة', 'المادة', 'التسمية'
  ],
  description: [
    'description', 'desc', 'details', 'détails', 'texte', 'text',
    'contenu', 'content', 'informations', 'info', 'infos',
    'product_description', 'description_produit', 'long_description',
    // Arabe
    'وصف', 'الوصف', 'تفاصيل', 'التفاصيل', 'معلومات', 'المعلومات',
    'شرح', 'الشرح', 'بيانات', 'محتوى', 'المحتوى'
  ],
  price: [
    'price', 'prix', 'price_ht', 'prix_ht', 'tarif', 'cost', 'cout',
    'montant', 'amount', 'unit_price', 'prix_unitaire', 'sale_price',
    'prix_vente', 'price_ttc', 'prix_ttc', 'value', 'valeur',
    // Arabe
    'سعر', 'السعر', 'ثمن', 'الثمن', 'تكلفة', 'التكلفة', 'سعر البيع',
    'المبلغ', 'القيمة', 'تسعيرة', 'التسعيرة', 'سعر الوحدة'
  ],
  sizes: [
    'sizes', 'size', 'tailles', 'taille', 'dimensions', 'dimension',
    'pointures', 'pointure', 'format', 'formats', 'variante_taille',
    'size_variants', 'available_sizes', 'tailles_disponibles',
    // Arabe
    'حجم', 'الحجم', 'احجام', 'الاحجام', 'مقاس', 'المقاس', 'مقاسات',
    'المقاسات', 'قياس', 'القياس', 'قياسات', 'ابعاد', 'الابعاد'
  ],
  colors: [
    'colors', 'color', 'colours', 'colour', 'couleurs', 'couleur',
    'teintes', 'teinte', 'coloris', 'variante_couleur', 'color_variants',
    'available_colors', 'couleurs_disponibles', 'palette',
    // Arabe
    'لون', 'اللون', 'الوان', 'الالوان', 'لون متاح', 'الوان متاحة',
    'درجة اللون', 'الوان متوفرة'
  ],
  stock_quantity: [
    'stock', 'stock_quantity', 'quantite', 'quantity', 'qty', 'qte',
    'inventaire', 'inventory', 'disponible', 'available', 'stock_disponible',
    'quantite_stock', 'stock_qty', 'units', 'unites', 'nombre', 'count',
    // Arabe
    'مخزون', 'المخزون', 'كمية', 'الكمية', 'عدد', 'العدد', 'متوفر',
    'المتوفر', 'متاح', 'المتاح', 'الكمية المتوفرة', 'مخزن', 'مخزن متاح'
  ],
  image_url: [
    'image_url', 'image', 'photo', 'img', 'picture', 'url', 'image_link',
    'photo_url', 'picture_url', 'thumbnail', 'miniature', 'visual',
    'visuel', 'media', 'asset', 'image_principale', 'main_image',
    // Arabe
    'صورة', 'الصورة', 'صور', 'الصور', 'رابط الصورة', 'صورة المنتج',
    'الصورة الرئيسية', 'وسائط', 'الوسائط'
  ],
  category: [
    'category', 'categorie', 'type', 'famille', 'family', 'groupe',
    'group', 'section', 'rayon', 'department', 'departement',
    'product_category', 'categorie_produit', 'classification',
    // Arabe
    'فئة', 'الفئة', 'نوع', 'النوع', 'صنف', 'الصنف', 'تصنيف', 'التصنيف',
    'قسم', 'القسم', 'مجموعة', 'المجموعة', 'عائلة', 'فئة المنتج'
  ],
  kind: [
    'kind', 'type', 'product_type', 'type_produit', 'nature',
    'product_kind', 'categorie_type', 'format_type', 'service_type',
    // Arabe
    'نوع', 'النوع', 'نوع المنتج', 'طبيعة', 'الطبيعة', 'شكل', 'الشكل'
  ],
  currency: [
    'currency', 'devise', 'monnaie', 'currency_code', 'code_devise',
    'symbol', 'symbole', 'unit', 'unite_monetaire',
    // Arabe
    'عملة', 'العملة', 'رمز العملة', 'وحدة نقدية', 'دينار', 'درهم', 'ريال'
  ],
}

/**
 * Patterns regex pour détecter certains types de colonnes par leur contenu
 */
const CONTENT_PATTERNS: Partial<Record<ProductField, RegExp>> = {
  price: /^\d+[.,]?\d*$/,
  image_url: /^https?:\/\//i,
  currency: /^[A-Z]{3}$/, // ISO codes like USD, EUR, DZD
  stock_quantity: /^\d+$/,
}

/**
 * Calcule la distance de Levenshtein entre deux chaînes
 * (nombre minimum d'opérations pour transformer s1 en s2)
 */
function levenshteinDistance(s1: string, s2: string): number {
  const m = s1.length
  const n = s2.length
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0))

  for (let i = 0; i <= m; i++) dp[i][0] = i
  for (let j = 0; j <= n; j++) dp[0][j] = j

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (s1[i - 1] === s2[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1]
      } else {
        dp[i][j] = 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1])
      }
    }
  }

  return dp[m][n]
}

/**
 * Calcule un score de similarité entre deux chaînes (0-1)
 * Basé sur la distance de Levenshtein normalisée
 */
function similarityScore(s1: string, s2: string): number {
  const maxLen = Math.max(s1.length, s2.length)
  if (maxLen === 0) return 1
  const distance = levenshteinDistance(s1, s2)
  return 1 - distance / maxLen
}

/**
 * Normalise un nom de colonne pour la comparaison
 * - Convertit en minuscules
 * - Supprime les accents
 * - Remplace les underscores, tirets et espaces par des underscores
 * - Supprime les caractères spéciaux (sauf l'arabe)
 */
function normalizeColumnName(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Supprime les accents (sauf arabe)
    .replace(/[_\-\s]+/g, '_') // Normalise les séparateurs
    .replace(/[^a-z0-9_\u0600-\u06FF]/g, '') // Supprime les caractères spéciaux (garde l'arabe U+0600 à U+06FF)
    .replace(/^_+|_+$/g, '') // Supprime les underscores en début/fin
}

/**
 * Détecte automatiquement le mapping entre les colonnes d'un fichier
 * et les champs attendus d'un produit
 */
export function detectColumnMapping(
  columns: string[],
  sampleRow?: Record<string, unknown>
): DetectionResult {
  const matches: FieldMatch[] = []
  const unmatchedColumns: string[] = []
  const usedColumns = new Set<string>()

  // Pour chaque champ produit, trouve la meilleure colonne correspondante
  for (const field of Object.keys(FIELD_SYNONYMS) as ProductField[]) {
    const synonyms = FIELD_SYNONYMS[field]
    let bestMatch: FieldMatch | null = null

    for (const column of columns) {
      if (usedColumns.has(column)) continue

      const normalizedColumn = normalizeColumnName(column)
      
      // 1. Vérifier les correspondances exactes
      for (const synonym of synonyms) {
        const normalizedSynonym = normalizeColumnName(synonym)
        if (normalizedColumn === normalizedSynonym) {
          bestMatch = {
            field,
            columnName: column,
            confidence: 1.0,
            method: 'exact',
          }
          break
        }
      }

      if (bestMatch) break

      // 2. Vérifier les correspondances floues (fuzzy matching)
      for (const synonym of synonyms) {
        const normalizedSynonym = normalizeColumnName(synonym)
        const score = similarityScore(normalizedColumn, normalizedSynonym)
        
        // Seuil de 0.75 pour considérer une correspondance floue
        if (score >= 0.75) {
          if (!bestMatch || score > bestMatch.confidence) {
            bestMatch = {
              field,
              columnName: column,
              confidence: score,
              method: 'fuzzy',
            }
          }
        }
      }

      // 3. Vérifier les patterns de contenu si on a un échantillon
      if (sampleRow && CONTENT_PATTERNS[field]) {
        const value = sampleRow[column]
        if (typeof value === 'string' && CONTENT_PATTERNS[field]?.test(value)) {
          const patternScore = 0.8 // Score réduit car basé sur le contenu uniquement
          if (!bestMatch || patternScore > bestMatch.confidence) {
            bestMatch = {
              field,
              columnName: column,
              confidence: patternScore,
              method: 'pattern',
            }
          }
        }
      }
    }

    if (bestMatch) {
      matches.push(bestMatch)
      usedColumns.add(bestMatch.columnName)
    }
  }

  // Identifier les colonnes non mappées
  for (const column of columns) {
    if (!usedColumns.has(column)) {
      unmatchedColumns.push(column)
    }
  }

  // Générer des suggestions pour les colonnes non mappées
  const suggestions: DetectionResult['suggestions'] = []
  for (const column of unmatchedColumns) {
    const normalizedColumn = normalizeColumnName(column)
    const possibleFields: Array<{ field: ProductField; confidence: number }> = []

    for (const field of Object.keys(FIELD_SYNONYMS) as ProductField[]) {
      // Éviter de suggérer des champs déjà mappés
      if (matches.some(m => m.field === field)) continue

      const synonyms = FIELD_SYNONYMS[field]
      let maxScore = 0

      for (const synonym of synonyms) {
        const normalizedSynonym = normalizeColumnName(synonym)
        const score = similarityScore(normalizedColumn, normalizedSynonym)
        maxScore = Math.max(maxScore, score)
      }

      // Seuil de 0.5 pour une suggestion
      if (maxScore >= 0.5) {
        possibleFields.push({ field, confidence: maxScore })
      }
    }

    if (possibleFields.length > 0) {
      possibleFields.sort((a, b) => b.confidence - a.confidence)
      suggestions.push({
        columnName: column,
        possibleFields: possibleFields.slice(0, 3), // Top 3 suggestions
      })
    }
  }

  return {
    matches,
    unmatchedColumns,
    suggestions,
  }
}

/**
 * Valide qu'un mapping contient au minimum les champs requis
 */
export function validateMapping(matches: FieldMatch[]): {
  isValid: boolean
  missingFields: ProductField[]
} {
  const requiredFields: ProductField[] = ['name', 'price']
  const mappedFields = new Set(matches.map(m => m.field))
  const missingFields = requiredFields.filter(f => !mappedFields.has(f))

  return {
    isValid: missingFields.length === 0,
    missingFields,
  }
}

/**
 * Crée un dictionnaire de mapping à partir des correspondances détectées
 */
export function createMappingDictionary(matches: FieldMatch[]): Record<string, ProductField> {
  const mapping: Record<string, ProductField> = {}
  for (const match of matches) {
    mapping[match.columnName] = match.field
  }
  return mapping
}

/**
 * Suggère des noms de colonnes manquantes basés sur les synonymes courants
 */
export function suggestColumnNames(field: ProductField): string[] {
  const synonyms = FIELD_SYNONYMS[field]
  // Retourne les 5 synonymes les plus courants
  return synonyms.slice(0, 5)
}
