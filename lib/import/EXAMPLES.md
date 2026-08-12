# Exemples d'utilisation du système de détection automatique

## Exemple 1 : Fichier CSV français simple

### Votre fichier `produits.csv` :
```csv
Nom,Prix,Stock
T-shirt Basic,29.99,150
Jean Slim,59.99,80
Robe d'été,45.00,60
```

### Ce qui se passe :
✅ **Détection automatique**
- "Nom" → `name` (correspondance exacte, 100%)
- "Prix" → `price` (correspondance exacte, 100%)
- "Stock" → `stock_quantity` (correspondance exacte, 100%)

### Résultat :
Tous les champs requis sont mappés. Import réussi de 3 produits ! 🎉

---

## Exemple 2 : Google Sheet avec noms descriptifs

### Votre Google Sheet :
| Référence | Désignation du Produit | Prix HT | Quantité en Stock | Description |
|-----------|------------------------|---------|-------------------|-------------|
| REF001    | T-shirt Basic          | 29.99   | 150               | Coton bio   |
| REF002    | Jean Slim              | 59.99   | 80                | Denim stretch|

### Ce qui se passe :
✅ **Détection intelligente**
- "Référence" → Non mappé (ignoré, champ non requis)
- "Désignation du Produit" → `name` (fuzzy match, 85%)
- "Prix HT" → `price` (synonyme reconnu, 100%)
- "Quantité en Stock" → `stock_quantity` (fuzzy match, 82%)
- "Description" → `description` (correspondance exacte, 100%)

### Résultat :
Import réussi avec mapping automatique intelligent ! ✨

---

## Exemple 3 : CSV avec fautes de frappe

### Votre fichier `products.csv` :
```csv
Produt Name,Pric,Stok Quantity
T-shirt Basic,29.99,150
Jean Slim,59.99,80
```

### Ce qui se passe :
⚠️ **Détection avec fuzzy matching**
- "Produt Name" → `name` (fuzzy match, 88% - faute dans "Product")
- "Pric" → `price` (fuzzy match, 80% - manque un "e")
- "Stok Quantity" → `stock_quantity` (fuzzy match, 92% - faute dans "Stock")

### Interface utilisateur :
Le dialogue de mapping s'ouvre avec des badges **Confiance moyenne** pour vous alerter. Vous pouvez :
1. Accepter les suggestions (recommandé)
2. Ajuster manuellement si nécessaire

---

## Exemple 4 : Export Shopify

### Votre export Shopify :
```csv
Title,Variant Price,Variant Inventory Qty,Option1 Value,Option2 Value,Body (HTML),Image Src
T-shirt Basic,29.99,150,M,Black,"<p>Cotton</p>",https://cdn.shopify.com/...
```

### Ce qui se passe :
✅ **Détection multi-sources**
- "Title" → `name` (synonyme reconnu, 100%)
- "Variant Price" → `price` (pattern reconnu, 95%)
- "Variant Inventory Qty" → `stock_quantity` (pattern reconnu, 90%)
- "Body (HTML)" → `description` (fuzzy match, 85%)
- "Image Src" → `image_url` (pattern URL détecté, 100%)

💡 **Suggestions pour les colonnes restantes :**
- "Option1 Value" → Pourrait être `sizes` ? (75%)
- "Option2 Value" → Pourrait être `colors` ? (75%)

### Action recommandée :
Acceptez le mapping automatique, puis ajustez manuellement les Options si elles correspondent à vos besoins.

---

## Exemple 5 : JSON avec structure imbriquée

### Votre fichier `catalog.json` :
```json
[
  {
    "product_info": {
      "name": "T-shirt Basic",
      "pricing": {
        "amount": 29.99
      }
    },
    "inventory": {
      "available": 150
    }
  }
]
```

### Ce qui se passe :
⚠️ **Structure plate requise**

Le système attend des objets plats. Vous devez d'abord aplatir votre JSON :

```json
[
  {
    "name": "T-shirt Basic",
    "price": 29.99,
    "stock": 150
  }
]
```

---

## Exemple 6 : Colonnes complètement personnalisées

### Votre fichier interne `articles.csv` :
```csv
Code Article,Libellé,Tarif Public,Qté Dispo,Coloris Dispo,Tailles Dispo
ART001,T-shirt Basic,29.99,150,Noir|Blanc,S|M|L
ART002,Jean Slim,59.99,80,Bleu|Noir,38|40|42
```

### Ce qui se passe :
🤖 **IA au travail**
- "Code Article" → Suggestion: pourrait être `name` ? (65%)
- "Libellé" → `name` (fuzzy match, 85%)
- "Tarif Public" → `price` (synonyme reconnu, 95%)
- "Qté Dispo" → `stock_quantity` (fuzzy match, 88%)
- "Coloris Dispo" → `colors` (fuzzy match, 90%)
- "Tailles Dispo" → `sizes` (fuzzy match, 92%)

### Interface de mapping :
Le dialogue s'ouvre avec toutes les détections. Vous voyez :

| Votre colonne | → | Champ détecté | Confiance |
|---------------|---|---------------|-----------|
| Code Article  | → | (Non mappé)   | —         |
| Libellé       | → | name          | 85% 🟡    |
| Tarif Public  | → | price         | 95% 🟢    |
| Qté Dispo     | → | stock_quantity| 88% 🟢    |
| Coloris Dispo | → | colors        | 90% 🟢    |
| Tailles Dispo | → | sizes         | 92% 🟢    |

💡 Avec un aperçu de vos données réelles pour vérifier !

---

## Exemple 7 : Format Excel (.csv exporté)

### Votre export Excel :
```csv
"Réf";"Nom Produit";"Prix €";"Stock";"Desc"
"001";"T-shirt Basic";"29,99";"150";"Coton bio"
"002";"Jean Slim";"59,99";"80";"Denim stretch"
```

### Particularités :
- Séparateur `;` au lieu de `,` ✅ Géré automatiquement
- Virgule décimale au lieu de point ✅ Parsing automatique
- Guillemets autour des valeurs ✅ Supprimés automatiquement

### Résultat :
Import parfait malgré le format européen ! 🇪🇺

---

## Exemple 9 : Fichier en arabe (DZ, MA, TN, etc.)

### Votre fichier `منتجات.csv` :
```csv
اسم المنتج,السعر,الكمية المتوفرة,المقاسات,الالوان
تيشرت أساسي,2999,150,S|M|L|XL,أسود|أبيض|رمادي
جينز سليم,5999,80,38|40|42|44,أزرق|أسود
فستان صيفي,4500,60,S|M|L,أحمر|أزرق|أخضر
```

### Ce qui se passe :
✅ **Détection automatique de l'arabe**
- "اسم المنتج" → `name` (correspondance exacte, 100%)
- "السعر" → `price` (correspondance exacte, 100%)
- "الكمية المتوفرة" → `stock_quantity` (fuzzy match, 90%)
- "المقاسات" → `sizes` (correspondance exacte, 100%)
- "الالوان" → `colors` (correspondance exacte, 100%)

### Résultat :
Import parfait avec support complet de la langue arabe ! 🇩🇿🇲🇦🇹🇳 ✨

### Variantes arabes reconnues :

**Pour le nom :**
- اسم، الاسم، منتج، المنتج، اسم المنتج، العنوان، السلعة

**Pour le prix :**
- سعر، السعر، ثمن، الثمن، تكلفة، التكلفة، المبلغ، القيمة

**Pour le stock :**
- مخزون، المخزون، كمية، الكمية، عدد، المتوفر، المتاح

**Pour les tailles :**
- حجم، الحجم، مقاس، المقاس، مقاسات، قياس، ابعاد

**Pour les couleurs :**
- لون، اللون، الوان، الالوان، لون متاح، الوان متاحة

### Exemple complet multilingue :
```csv
اسم المنتج,السعر,Description,Stock,Tailles
تيشرت,2999,T-shirt en coton,150,S|M|L
```

✅ Mélange arabe/français/anglais totalement supporté !

---

## Exemple 10 : Google Sheet en arabe

Si l'auto-détection ne trouve rien (cas rare), vous pouvez tout mapper manuellement :

### Votre fichier cryptique `data.csv` :
```csv
A,B,C,D
T-shirt Basic,29.99,150,Black
Jean Slim,59.99,80,Blue
```

### Interface de mapping :
Chaque colonne a un menu déroulant :

- Colonne A → ❌ Non mappé → **Sélectionnez** : Nom du produit ✅
- Colonne B → ❌ Non mappé → **Sélectionnez** : Prix ✅
- Colonne C → ❌ Non mappé → **Sélectionnez** : Stock ✅
- Colonne D → ❌ Non mappé → **Sélectionnez** : Couleurs ✅

Une fois les champs requis mappés (nom + prix), le bouton "Confirmer" s'active !

---

## Conseils pour de meilleurs résultats

### ✅ Recommandations

1. **Utilisez des noms de colonnes descriptifs**
   - ✅ "Nom du Produit" ou "Product Name"
   - ❌ "A" ou "Col1"

2. **Restez cohérent avec les conventions**
   - ✅ "prix", "price", "Prix TTC"
   - ❌ "montant_a_payer_ttc_avec_tva"

3. **Gardez la première ligne pour les en-têtes**
   - Les données commencent à la ligne 2

4. **Utilisez des séparateurs standards pour les listes**
   - Tailles : "S|M|L" ou "S, M, L"
   - Couleurs : "Rouge|Bleu" ou "Rouge, Bleu"

### ⚠️ À éviter

1. **Structures imbriquées dans JSON**
   - Le système attend des objets plats

2. **Plusieurs produits dans une cellule**
   - Une ligne = un produit

3. **Colonnes vides sans en-tête**
   - Supprimez-les avant l'import

---

## Support des formats

| Format | Extension | Taille max | Notes |
|--------|-----------|------------|-------|
| CSV | `.csv` | 5 Mo | Tous séparateurs (`,`, `;`, etc.) |
| JSON | `.json` | 5 Mo | Objets plats uniquement |
| Google Sheets | URL | Illimité | Doit être public (lecture) |

**Limite :** 5000 lignes par import pour CSV/JSON

---

## Besoin d'aide ?

Si vous rencontrez des problèmes :

1. **Vérifiez l'aperçu** dans le dialogue de mapping
2. **Consultez les suggestions** pour les colonnes non détectées
3. **Ajustez manuellement** si l'auto-détection n'est pas à 100%
4. **Essayez de renommer** vos colonnes avec des noms plus standards

L'objectif est de vous faire gagner du temps, pas de vous compliquer la vie ! 🚀


## Exemple 10 : Google Sheet en arabe

### Votre Google Sheet :

| المنتج | السعر | المخزون | الوصف | صورة المنتج |
|--------|-------|---------|-------|-------------|
| قميص رجالي | 3500 | 120 | قطن 100% | https://... |
| بنطلون جينز | 5500 | 85 | دنيم مريح | https://... |

### Ce qui se passe :
✅ **Reconnaissance automatique RTL (Right-to-Left)**
- "المنتج" → `name` (100%)
- "السعر" → `price` (100%)
- "المخزون" → `stock_quantity` (100%)
- "الوصف" → `description` (100%)
- "صورة المنتج" → `image_url` (100%)

### Particularités :
- ✅ Direction RTL gérée automatiquement
- ✅ Nombres en format arabe ou occidental
- ✅ Support complet Unicode arabe
- ✅ Mélange arabe/chiffres sans problème

---

## 🌍 Support multilingue

Le système supporte maintenant **3 langues** :

### Français 🇫🇷
```csv
Nom,Prix,Stock,Tailles,Couleurs
T-shirt,29.99,150,S|M|L,Rouge|Bleu
```

### English 🇬🇧
```csv
Name,Price,Stock,Sizes,Colors
T-shirt,29.99,150,S|M|L,Red|Blue
```

### العربية 🇩🇿🇲🇦🇹🇳
```csv
اسم المنتج,السعر,المخزون,المقاسات,الالوان
تيشرت,2999,150,S|M|L,أحمر|أزرق
```

### Mix multilingue ✨
```csv
Product Name,السعر,Stock,Tailles,Colors
T-shirt,29.99,150,S|M|L,Rouge|Blue|أحمر
```

**Tous ces formats sont automatiquement détectés !** 🎉
