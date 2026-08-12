# Système de détection automatique des colonnes pour l'import

## Vue d'ensemble

Ce système intelligent détecte automatiquement les correspondances entre les colonnes de vos fichiers (CSV, JSON, Google Sheets) et les champs attendus pour les produits, même si les noms de colonnes ne correspondent pas exactement.

## Fonctionnalités

### 1. Détection multi-méthodes

Le système utilise plusieurs techniques pour identifier les colonnes :

- **Correspondance exacte** : Reconnaissance des noms standards (nom, name, اسم, prix, price, سعر, etc.)
- **Fuzzy matching** : Distance de Levenshtein pour gérer les fautes de frappe et variations
- **Synonymes multilingues** : Support français, anglais, arabe avec variations courantes
- **Patterns de contenu** : Détection basée sur le format des données (URLs, nombres, etc.)

### 2. Normalisation intelligente

Les noms de colonnes sont normalisés pour maximiser les correspondances :

- Suppression des accents
- Conversion en minuscules
- Normalisation des séparateurs (underscores, tirets, espaces)
- Suppression des caractères spéciaux

### 3. Interface utilisateur intuitive

L'interface de mapping permet de :

- **Voir les détections automatiques** avec niveau de confiance
- **Prévisualiser les données** avant l'import
- **Ajuster manuellement** les correspondances si nécessaire
- **Recevoir des suggestions** pour les colonnes non mappées
- **Valider** que tous les champs requis sont présents

## Utilisation

### Dans le code

```typescript
import { detectColumnMapping } from '@/lib/import/column-detector'

// Détecter automatiquement les colonnes
const columns = ['Nom Produit', 'Prix HT', 'Stock Dispo']
const sampleRow = {
  'Nom Produit': 'T-shirt',
  'Prix HT': '29.99',
  'Stock Dispo': '150'
}

const result = detectColumnMapping(columns, sampleRow)

// result.matches contient les correspondances détectées
// result.unmatchedColumns contient les colonnes non reconnues
// result.suggestions contient des suggestions pour améliorer le mapping
```

### Dans l'interface

1. Cliquez sur **"Importer CSV/JSON"** ou **"Synchroniser un Google Sheet"**
2. Le système analyse automatiquement vos colonnes
3. Un dialogue s'ouvre avec les correspondances détectées
4. Vérifiez et ajustez si nécessaire
5. Cliquez sur **"Confirmer et importer"**

## Champs supportés

| Champ | Requis | Synonymes reconnus |
|-------|--------|-------------------|
| `name` | ✅ | nom, name, اسم, produit, product, منتج, titre, title, العنوان, article... |
| `price` | ✅ | prix, price, سعر, tarif, ثمن, cost, تكلفة, montant, المبلغ... |
| `description` | ❌ | desc, وصف, details, تفاصيل, texte, content, محتوى... |
| `sizes` | ❌ | tailles, size, حجم, مقاس, dimensions, احجام, pointures... |
| `colors` | ❌ | couleurs, color, لون, الوان, teintes, coloris... |
| `stock_quantity` | ❌ | stock, مخزون, quantity, كمية, qty, عدد, inventaire... |
| `image_url` | ❌ | image, صورة, photo, img, picture, رابط الصورة... |
| `category` | ❌ | categorie, فئة, type, نوع, famille, صنف, groupe... |
| `kind` | ❌ | type, نوع, product_type, nature, طبيعة... |
| `currency` | ❌ | devise, عملة, monnaie, currency_code, رمز العملة... |

## Exemples de formats reconnus

### Fichier avec noms français
```csv
Nom du Produit,Prix TTC,Stock Disponible,Couleurs Dispo
T-shirt Basic,29.99,150,Noir|Blanc|Gris
Jean Slim,59.99,80,Bleu|Noir
```

### Fichier avec noms anglais
```csv
Product Name,Unit Price,Available Stock,Colors
Basic T-shirt,29.99,150,Black|White|Gray
Slim Jeans,59.99,80,Blue|Black
```

### Fichier avec noms personnalisés
```csv
Article,Tarif,Qte Stock,Teintes
T-shirt Basic,29.99,150,Noir|Blanc|Gris
Jean Slim,59.99,80,Bleu|Noir
```

### Fichier avec noms en arabe
```csv
اسم المنتج,السعر,المخزون,الالوان
تيشرت بيسك,29.99,150,أسود|أبيض|رمادي
جينز سليم,59.99,80,أزرق|أسود
```

Tous ces formats sont reconnus automatiquement ! 🎉

## Configuration

Le système est entièrement autonome et ne nécessite aucune configuration. Les synonymes et patterns sont définis dans `column-detector.ts` et peuvent être étendus si nécessaire.

## Seuils de confiance

- **Haute confiance (≥90%)** : Correspondance exacte ou presque exacte
- **Confiance moyenne (≥75%)** : Correspondance floue probable
- **Faible confiance (<75%)** : Suggestion nécessitant validation

## Extensibilité

Pour ajouter de nouveaux champs ou synonymes, modifiez les constantes dans `column-detector.ts` :

```typescript
const FIELD_SYNONYMS: Record<ProductField, string[]> = {
  // Ajouter vos synonymes ici
  name: ['name', 'nom', 'votre_synonyme_personnalisé', ...],
  // ...
}
```

## Notes techniques

- Utilise l'algorithme de distance de Levenshtein pour le fuzzy matching
- Supporte la normalisation Unicode (NFD) pour les accents
- Préserve les caractères arabes (plage Unicode U+0600 à U+06FF)
- Optimisé pour gérer jusqu'à 5000 lignes par import
- Compatible avec CSV, JSON et Google Sheets
