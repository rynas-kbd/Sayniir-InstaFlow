# 🎯 Guide d'import intelligent - Section Boutique

## Bienvenue dans le nouveau système d'import ! ✨

Votre boutique peut maintenant **accepter n'importe quel format de fichier** avec **n'importe quels noms de colonnes**. Notre IA détecte automatiquement vos colonnes !

---

## 🚀 Démarrage rapide (30 secondes)

### Étape 1 : Préparez votre fichier
Créez un fichier CSV, JSON ou Google Sheet avec au minimum :
- ✅ Une colonne pour le **nom** du produit
- ✅ Une colonne pour le **prix**

### Étape 2 : Importez
1. Allez dans **Boutique** → Onglet **Produits**
2. Cliquez sur **Importer CSV/JSON** ou **Synchroniser un Google Sheet**
3. Sélectionnez votre fichier

### Étape 3 : Validez
Une fenêtre s'ouvre avec la détection automatique :
- 🟢 **Colonnes détectées** avec niveau de confiance
- 👀 **Aperçu de vos données** (5 premières lignes)
- 💡 **Suggestions** si nécessaire

### Étape 4 : Confirmez
Cliquez sur **"Confirmer et importer"** et c'est fait ! 🎉

---

## 📋 Colonnes reconnues automatiquement

### Champs obligatoires ⚠️

#### Nom du produit
```
✅ Reconnu : nom, name, produit, product, titre, title, article,
              désignation, libellé, item, product_name, nom_produit
              اسم, الاسم, منتج, المنتج, اسم المنتج, العنوان, السلعة
```

#### Prix
```
✅ Reconnu : prix, price, tarif, cost, coût, montant, amount,
              prix_ht, prix_ttc, unit_price, sale_price, valeur
              سعر, السعر, ثمن, الثمن, تكلفة, المبلغ, القيمة
```

### Champs optionnels (mais recommandés)

#### Description
```
✅ Reconnu : description, desc, détails, details, texte, text,
              contenu, content, informations, info
              وصف, الوصف, تفاصيل, التفاصيل, معلومات, شرح
```

#### Stock
```
✅ Reconnu : stock, quantity, quantite, qty, qte, inventaire,
              inventory, disponible, available, stock_quantity
              مخزون, المخزون, كمية, الكمية, عدد, متوفر, متاح
```

#### Tailles
```
✅ Reconnu : sizes, size, tailles, taille, dimensions, pointures,
              format, variante_taille, available_sizes
              حجم, الحجم, مقاس, المقاس, مقاسات, قياس, ابعاد
```

#### Couleurs
```
✅ Reconnu : colors, color, couleurs, couleur, teintes, teinte,
              coloris, variante_couleur, available_colors
              لون, اللون, الوان, الالوان, لون متاح, الوان متاحة
```

#### Image
```
✅ Reconnu : image_url, image, photo, img, picture, url,
              image_link, thumbnail, miniature, visual, visuel
              صورة, الصورة, صور, رابط الصورة, صورة المنتج
```

#### Catégorie
```
✅ Reconnu : category, categorie, type, famille, family,
              groupe, group, section, rayon, department
              فئة, الفئة, نوع, النوع, صنف, التصنيف, قسم
```

---

## 📝 Formats de fichiers acceptés

### 1. CSV (Comma-Separated Values)

**Exemple simple :**
```csv
Nom,Prix,Stock
T-shirt Basic,29.99,150
Jean Slim,59.99,80
```

**Avec plus de détails :**
```csv
Nom du Produit,Prix TTC,Stock Disponible,Tailles,Couleurs,Description
T-shirt Basic,29.99,150,S|M|L|XL,Noir|Blanc|Gris,Coton bio 100%
Jean Slim,59.99,80,38|40|42|44,Bleu|Noir,Denim stretch confortable
```

**💡 Conseils CSV :**
- Séparateurs acceptés : `,` (virgule), `;` (point-virgule)
- Encodage recommandé : UTF-8
- Première ligne = en-têtes de colonnes
- Listes multiples séparées par `|` ou `,`

### 2. JSON (JavaScript Object Notation)

**Format simple :**
```json
[
  {
    "nom": "T-shirt Basic",
    "prix": 29.99,
    "stock": 150
  },
  {
    "nom": "Jean Slim",
    "prix": 59.99,
    "stock": 80
  }
]
```

**Format détaillé :**
```json
[
  {
    "product_name": "T-shirt Basic",
    "price": 29.99,
    "stock_quantity": 150,
    "sizes": ["S", "M", "L", "XL"],
    "colors": ["Noir", "Blanc", "Gris"],
    "description": "Coton bio 100%",
    "image_url": "https://example.com/tshirt.jpg"
  }
]
```

**⚠️ Important JSON :**
- Doit être un **tableau d'objets** `[ {...}, {...} ]`
- Structure **plate** (pas d'objets imbriqués)
- Nombres sans guillemets, textes avec guillemets

### 3. Google Sheets

**Configuration requise :**
1. Partagez votre Sheet en **public** (lecture seule)
   - Fichier → Partager → Modifier en "Tous les utilisateurs disposant du lien peuvent consulter"
2. Copiez l'URL complète
3. Collez dans le champ d'import

**Format recommandé :**

| Nom Produit | Prix | Stock | Tailles | Couleurs | Description |
|-------------|------|-------|---------|----------|-------------|
| T-shirt Basic | 29.99 | 150 | S, M, L | Noir, Blanc | Coton bio |
| Jean Slim | 59.99 | 80 | 38, 40, 42 | Bleu, Noir | Denim stretch |

**💡 Avantages Google Sheets :**
- Modification en temps réel
- Synchronisation facile
- Collaboration d'équipe
- Pas de limite de taille

---

## 🎨 Exemples de noms de colonnes acceptés

### ✅ Tous ces formats fonctionnent :

#### Pour le nom :
```
Nom ✓
nom ✓
Name ✓
Nom du Produit ✓
Désignation ✓
Libellé ✓
Article ✓
Product Name ✓
Title ✓
```

#### Pour le prix :
```
Prix ✓
price ✓
Prix TTC ✓
Prix HT ✓
Tarif ✓
Montant ✓
Unit Price ✓
Cost ✓
```

#### Pour le stock :
```
Stock ✓
Quantité ✓
Quantity ✓
Qté ✓
Stock Disponible ✓
Inventaire ✓
Available ✓
Qty ✓
مخزون ✓
الكمية ✓
متوفر ✓
```

### 🌍 Support multilingue complet

Le système détecte automatiquement les colonnes en **français**, **anglais** et **arabe** !

#### Exemple en arabe :
```csv
اسم المنتج,السعر,المخزون,المقاسات,الالوان
تيشرت,2999,150,S|M|L,أسود|أبيض
```

✅ **Détection parfaite !** Tous les champs sont reconnus automatiquement.

### 🤖 Le système gère aussi les fautes !

```
"Pric" (au lieu de Price) → Détecté comme "prix" (80%)
"Stok" (au lieu de Stock) → Détecté comme "stock" (85%)
"Nom Produit" → Détecté comme "name" (100%)
```

---

## 🎯 Scénarios d'utilisation

### Scénario 1 : Import depuis Excel

1. Dans Excel, **Fichier → Enregistrer sous → CSV UTF-8**
2. Importez le fichier CSV
3. ✅ Format européen géré (virgule décimale, séparateur `;`)

### Scénario 2 : Copier-coller depuis Google Sheets

1. Sélectionnez vos données dans Sheets
2. **Fichier → Télécharger → CSV**
3. Importez le fichier téléchargé

### Scénario 3 : Export depuis autre plateforme

**Shopify, WooCommerce, PrestaShop, etc.**
1. Exportez votre catalogue au format CSV
2. Importez directement, le système détectera les colonnes !
3. Ajustez le mapping si nécessaire

### Scénario 4 : Mise à jour partielle

**Problème :** Vous voulez mettre à jour uniquement les prix

**Solution :**
1. Exportez votre catalogue actuel
2. Modifiez uniquement la colonne "Prix"
3. Ré-importez : les produits existants (même nom) seront mis à jour

---

## 🔧 Résolution de problèmes

### ❌ "Aucune donnée trouvée"

**Causes possibles :**
- Fichier vide
- Aucune ligne après les en-têtes
- Format de fichier incorrect

**Solution :** Vérifiez que votre fichier contient au moins 2 lignes (en-têtes + données)

### ❌ "Champs requis manquants"

**Causes :**
- Aucune colonne détectée comme "nom" ou "prix"

**Solutions :**
1. Renommez vos colonnes avec des noms plus standards
2. OU utilisez le mapping manuel dans le dialogue

### ⚠️ "Confiance moyenne" (badge jaune)

**Signification :** Le système a détecté une correspondance mais n'est pas 100% sûr

**Action recommandée :**
1. Vérifiez l'aperçu des données
2. Si correct, acceptez
3. Sinon, changez manuellement dans le menu déroulant

### ❌ "Google Sheet inaccessible"

**Causes :**
- Sheet pas partagé en public
- URL invalide

**Solution :**
1. Ouvrez votre Sheet
2. Clic sur "Partager" (en haut à droite)
3. Changez en "Tous les utilisateurs disposant du lien peuvent consulter"
4. Copiez le nouveau lien

---

## 💡 Conseils pro

### 1. Préparez vos données

✅ **Bon format :**
```csv
Nom,Prix,Stock,Tailles,Couleurs
T-shirt,29.99,150,S|M|L,Rouge|Bleu
```

❌ **Mauvais format :**
```csv
,,,
T-shirt Basic,€29,99,Environ 150 unités,S M L disponibles,Rouge ou Bleu
```

### 2. Testez avec un petit fichier

Avant d'importer 1000 produits :
1. Créez un fichier de test avec 3-5 produits
2. Importez pour vérifier le mapping
3. Une fois validé, importez le fichier complet

### 3. Sauvegardez votre mapping

Si vous importez régulièrement le même format :
- Notez les correspondances détectées
- Utilisez toujours les mêmes noms de colonnes
- Le système se souviendra du format

### 4. Utilisez Google Sheets pour la flexibilité

**Avantages :**
- Modifications en temps réel
- Pas besoin de re-télécharger/re-uploader
- Synchronisation en un clic
- Idéal pour mise à jour de stock régulière

### 5. Nettoyez vos données

Avant import :
- ✅ Supprimez les colonnes vides
- ✅ Vérifiez les prix (format numérique)
- ✅ Supprimez les lignes vides
- ✅ Un produit = une ligne

---

## 📊 Limites et capacités

| Élément | Limite |
|---------|--------|
| Taille fichier CSV/JSON | 5 Mo max |
| Nombre de lignes | 5000 max |
| Google Sheets | Illimité |
| Formats acceptés | .csv, .json, Google Sheets |
| Colonnes reconnues | 117+ variantes |
| Langues supportées | Français, Anglais |

---

## 🆘 Besoin d'aide ?

### Ressources :

1. **Exemples de fichiers** : Consultez `EXAMPLES.md` pour 8 exemples détaillés
2. **Documentation technique** : Voir `lib/import/README.md`
3. **Tests** : Essayez avec un petit fichier d'abord

### Support :

Si vous rencontrez un problème :
1. Vérifiez que vos colonnes "nom" et "prix" sont présentes
2. Consultez l'aperçu dans le dialogue de mapping
3. Essayez le mapping manuel si l'auto-détection échoue
4. Simplifiez les noms de colonnes si nécessaire

---

## 🎉 Fonctionnalités avancées

### Import avec images

Ajoutez une colonne "image_url" avec des URLs complètes :
```csv
Nom,Prix,Image
T-shirt,29.99,https://cdn.example.com/tshirt.jpg
```

### Variantes multiples

Utilisez le séparateur `|` :
```csv
Nom,Tailles,Couleurs
T-shirt,S|M|L|XL,Noir|Blanc|Gris|Rouge
```

### Catégories

Organisez vos produits :
```csv
Nom,Prix,Catégorie
T-shirt,29.99,Vêtements
Bracelet,15.99,Accessoires
```

---

**Version :** 1.0.0  
**Dernière mise à jour :** Aujourd'hui  
**Compatible avec :** Tous navigateurs modernes

🚀 **Bon import !**
