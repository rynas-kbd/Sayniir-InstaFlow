# Guide d'import de catalogue

## Formats supportés

### 1. CSV (Comma-Separated Values)

**Format attendu:**
```csv
name,description,price,sizes,colors,image_url,stock_quantity
T-shirt Premium,Coton bio 100%,2900,"S,M,L,XL","Noir,Blanc,Bleu",https://example.com/tshirt.jpg,50
Jeans Slim,Denim stretch confortable,5900,"28,30,32,34,36","Bleu,Noir",https://example.com/jeans.jpg,30
```

**Colonnes obligatoires:**
- `name` - Nom du produit
- `price` - Prix en DA (nombre décimal)

**Colonnes optionnelles:**
- `description` - Description détaillée
- `sizes` - Tailles séparées par des virgules
- `colors` - Couleurs séparées par des virgules
- `image_url` - URL de l'image produit
- `stock_quantity` - Quantité en stock (défaut: 0)

### 2. JSON (JavaScript Object Notation)

**Format attendu:**
```json
[
  {
    "name": "T-shirt Premium",
    "description": "Coton bio 100%",
    "price": 2900,
    "sizes": ["S", "M", "L", "XL"],
    "colors": ["Noir", "Blanc", "Bleu"],
    "image_url": "https://example.com/tshirt.jpg",
    "stock_quantity": 50
  },
  {
    "name": "Jeans Slim",
    "description": "Denim stretch confortable",
    "price": 5900,
    "sizes": ["28", "30", "32", "34", "36"],
    "colors": ["Bleu", "Noir"],
    "image_url": "https://example.com/jeans.jpg",
    "stock_quantity": 30
  }
]
```

### 3. Google Sheets

**Configuration:**
1. Créez un Google Sheet avec les mêmes colonnes que le CSV
2. Partagez-le en mode "Lecture pour tous ceux qui ont le lien"
3. Copiez l'URL complète (ex: `https://docs.google.com/spreadsheets/d/VOTRE_ID/edit`)
4. Collez l'URL dans le champ "Synchroniser depuis Google Sheets"

**Exemple de structure Google Sheets:**
| name | description | price | sizes | colors | image_url | stock_quantity |
|------|-------------|-------|-------|--------|-----------|----------------|
| T-shirt Premium | Coton bio 100% | 2900 | S,M,L,XL | Noir,Blanc,Bleu | https://... | 50 |
| Jeans Slim | Denim stretch | 5900 | 28,30,32,34,36 | Bleu,Noir | https://... | 30 |

## Conseils d'import

### ✅ Bonnes pratiques

1. **Préparez vos données**
   - Vérifiez l'orthographe des noms de produits
   - Assurez-vous que les prix sont corrects (en DA, sans espaces)
   - Utilisez des URLs d'images accessibles publiquement

2. **Images**
   - Format recommandé: JPEG ou PNG
   - Taille recommandée: 800x800px minimum
   - Hébergement: Imgur, Cloudinary, ou votre propre serveur
   - Les URLs doivent commencer par `https://`

3. **Tailles et couleurs**
   - Séparez par des virgules sans espaces inutiles
   - Exemple correct: `S,M,L,XL`
   - Exemple incorrect: `S, M , L , XL` (espaces en trop)

4. **Prix**
   - Format: nombre décimal (ex: `2900` ou `2900.50`)
   - Pas de symbole DA, pas d'espaces
   - Virgule ou point comme séparateur décimal

### ❌ Erreurs courantes

- **Colonnes mal nommées** → Utilisez exactement les noms indiqués
- **Encodage CSV** → Utilisez UTF-8 pour les caractères accentués
- **URLs invalides** → Vérifiez que les images sont accessibles
- **Virgules dans les descriptions** → Entourez le texte de guillemets en CSV
- **Prix négatifs** → Tous les prix doivent être positifs

## Exemples de fichiers

### Télécharger des modèles

- [Modèle CSV](./templates/catalogue-template.csv)
- [Modèle JSON](./templates/catalogue-template.json)
- [Modèle Google Sheets](https://docs.google.com/spreadsheets/d/TEMPLATE_ID/copy)

## Questions fréquentes

**Q: Puis-je importer des milliers de produits ?**  
R: Oui, mais nous recommandons de le faire par lots de 500 produits maximum pour des performances optimales.

**Q: Que se passe-t-il si un produit existe déjà ?**  
R: L'import crée uniquement de nouveaux produits. Les produits existants ne sont pas modifiés.

**Q: Puis-je importer sans images ?**  
R: Oui, laissez simplement la colonne `image_url` vide. Vous pourrez ajouter les images plus tard.

**Q: Comment mettre à jour mes produits existants ?**  
R: Utilisez l'édition manuelle pour le moment. L'import par mise à jour sera disponible prochainement.

**Q: La synchronisation Google Sheets est-elle en temps réel ?**  
R: Non, vous devez cliquer sur "Synchroniser" pour mettre à jour le catalogue depuis votre feuille.

## Support

Besoin d'aide ? Contactez-nous sur support@instaflow.com ou consultez notre [documentation complète](https://docs.instaflow.com).
