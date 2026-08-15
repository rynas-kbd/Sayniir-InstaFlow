/**
 * Tests pour le système de détection automatique des colonnes
 * Exécutez avec: npm test column-detector.test.ts
 */

import {
  detectColumnMapping,
  validateMapping,
  createMappingDictionary,
  type ProductField,
} from '../column-detector'
import { describe, expect, it } from 'vitest'

describe('Column Detector', () => {
  describe('detectColumnMapping', () => {
    it('devrait détecter les colonnes avec noms français standards', () => {
      const columns = ['nom', 'prix', 'stock']
      const result = detectColumnMapping(columns)

      expect(result.matches).toHaveLength(3)
      expect(result.matches.some(m => m.field === 'name' && m.columnName === 'nom')).toBe(true)
      expect(result.matches.some(m => m.field === 'price' && m.columnName === 'prix')).toBe(true)
      expect(result.matches.some(m => m.field === 'stock_quantity' && m.columnName === 'stock')).toBe(true)
    })

    it('devrait détecter les colonnes avec noms anglais standards', () => {
      const columns = ['name', 'price', 'description', 'colors']
      const result = detectColumnMapping(columns)

      expect(result.matches).toHaveLength(4)
      expect(result.matches.some(m => m.field === 'name' && m.confidence === 1.0)).toBe(true)
      expect(result.matches.some(m => m.field === 'price' && m.confidence === 1.0)).toBe(true)
    })

    it('devrait gérer les variations de casse et accents', () => {
      const columns = ['Nom Du Produit', 'PRIX', 'Couleurs Disponibles']
      const result = detectColumnMapping(columns)

      expect(result.matches.length).toBeGreaterThan(0)
      expect(result.matches.some(m => m.field === 'name')).toBe(true)
      expect(result.matches.some(m => m.field === 'price')).toBe(true)
    })

    it('devrait gérer les noms de colonnes avec underscores et tirets', () => {
      const columns = ['product_name', 'unit-price', 'stock_quantity']
      const result = detectColumnMapping(columns)

      expect(result.matches.some(m => m.field === 'name')).toBe(true)
      expect(result.matches.some(m => m.field === 'price')).toBe(true)
      expect(result.matches.some(m => m.field === 'stock_quantity')).toBe(true)
    })

    it('devrait utiliser le fuzzy matching pour les fautes de frappe', () => {
      // "pric" au lieu de "price", "stok" au lieu de "stock"
      const columns = ['name', 'pric', 'stok']
      const result = detectColumnMapping(columns)

      expect(result.matches.some(m => m.field === 'price' && m.method === 'fuzzy')).toBe(true)
      expect(result.matches.some(m => m.field === 'stock_quantity' && m.method === 'fuzzy')).toBe(true)
    })

    it('devrait détecter les patterns dans le contenu', () => {
      const columns = ['product_name', 'cost', 'photo_url']
      const sampleRow = {
        product_name: 'T-shirt',
        cost: '29.99',
        photo_url: 'https://example.com/image.jpg',
      }
      const result = detectColumnMapping(columns, sampleRow)

      expect(result.matches.some(m => m.field === 'image_url')).toBe(true)
    })

    it('devrait fournir des suggestions pour les colonnes non mappées', () => {
      const columns = ['name', 'price', 'couleur_dominante', 'taille_disponible']
      const result = detectColumnMapping(columns)

      // Ces colonnes devraient avoir des suggestions car proches de "colors" et "sizes"
      expect(result.suggestions.length).toBeGreaterThan(0)
    })
  })

  describe('validateMapping', () => {
    it('devrait valider un mapping avec tous les champs requis', () => {
      const matches = [
        { field: 'name' as ProductField, columnName: 'nom', confidence: 1.0, method: 'exact' as const },
        { field: 'price' as ProductField, columnName: 'prix', confidence: 1.0, method: 'exact' as const },
      ]

      const result = validateMapping(matches)

      expect(result.isValid).toBe(true)
      expect(result.missingFields).toHaveLength(0)
    })

    it('devrait détecter les champs requis manquants', () => {
      const matches = [
        { field: 'name' as ProductField, columnName: 'nom', confidence: 1.0, method: 'exact' as const },
        // price manquant
      ]

      const result = validateMapping(matches)

      expect(result.isValid).toBe(false)
      expect(result.missingFields).toContain('price')
    })
  })

  describe('createMappingDictionary', () => {
    it('devrait créer un dictionnaire de mapping', () => {
      const matches = [
        { field: 'name' as ProductField, columnName: 'Nom Produit', confidence: 1.0, method: 'exact' as const },
        { field: 'price' as ProductField, columnName: 'Prix TTC', confidence: 1.0, method: 'exact' as const },
        { field: 'stock_quantity' as ProductField, columnName: 'Stock', confidence: 0.9, method: 'fuzzy' as const },
      ]

      const dictionary = createMappingDictionary(matches)

      expect(dictionary['Nom Produit']).toBe('name')
      expect(dictionary['Prix TTC']).toBe('price')
      expect(dictionary['Stock']).toBe('stock_quantity')
    })
  })

  describe('Scénarios réels', () => {
    it('devrait gérer un fichier e-commerce français typique', () => {
      const columns = [
        'Référence',
        'Nom du Produit',
        'Prix TTC',
        'Stock Disponible',
        'Tailles',
        'Couleurs',
        'Description',
        'Photo',
      ]

      const result = detectColumnMapping(columns)

      expect(result.matches.some(m => m.field === 'name')).toBe(true)
      expect(result.matches.some(m => m.field === 'price')).toBe(true)
      expect(result.matches.some(m => m.field === 'stock_quantity')).toBe(true)
      expect(result.matches.some(m => m.field === 'sizes')).toBe(true)
      expect(result.matches.some(m => m.field === 'colors')).toBe(true)
      expect(result.matches.some(m => m.field === 'description')).toBe(true)
      expect(result.matches.some(m => m.field === 'image_url')).toBe(true)
    })

    it('devrait gérer un fichier e-commerce en arabe', () => {
      const columns = [
        'اسم المنتج',
        'السعر',
        'المخزون',
        'المقاسات',
        'الالوان',
        'الوصف',
        'صورة المنتج',
      ]

      const result = detectColumnMapping(columns)

      expect(result.matches.some(m => m.field === 'name')).toBe(true)
      expect(result.matches.some(m => m.field === 'price')).toBe(true)
      expect(result.matches.some(m => m.field === 'stock_quantity')).toBe(true)
      expect(result.matches.some(m => m.field === 'sizes')).toBe(true)
      expect(result.matches.some(m => m.field === 'colors')).toBe(true)
      expect(result.matches.some(m => m.field === 'description')).toBe(true)
      expect(result.matches.some(m => m.field === 'image_url')).toBe(true)
    })

    it('devrait gérer un mélange multilingue français-arabe', () => {
      const columns = ['Product Name', 'السعر', 'Stock', 'المقاسات', 'Colors']

      const result = detectColumnMapping(columns)

      expect(result.matches.some(m => m.field === 'name')).toBe(true)
      expect(result.matches.some(m => m.field === 'price')).toBe(true)
      expect(result.matches.some(m => m.field === 'stock_quantity')).toBe(true)
      expect(result.matches.some(m => m.field === 'sizes')).toBe(true)
      expect(result.matches.some(m => m.field === 'colors')).toBe(true)
    })

    it('devrait gérer un export Shopify', () => {
      const columns = [
        'Title',
        'Variant Price',
        'Variant Inventory Qty',
        'Option1 Value', // Size
        'Option2 Value', // Color
        'Body HTML',
        'Image Src',
      ]

      const result = detectColumnMapping(columns)

      expect(result.matches.some(m => m.field === 'name')).toBe(true)
      expect(result.matches.some(m => m.field === 'price')).toBe(true)
      expect(result.matches.some(m => m.field === 'stock_quantity')).toBe(true)
    })

    it('devrait gérer des colonnes complètement personnalisées', () => {
      const columns = ['Article', 'Tarif', 'Qte', 'Teintes', 'Infos']

      const result = detectColumnMapping(columns)

      // Devrait au moins détecter quelques correspondances avec fuzzy matching
      expect(result.matches.length).toBeGreaterThan(0)
      expect(result.suggestions.length).toBeGreaterThan(0)
    })
  })
})
