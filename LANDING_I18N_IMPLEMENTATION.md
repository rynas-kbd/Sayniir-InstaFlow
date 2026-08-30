# Implémentation i18n de la Landing Page

## ✅ Terminé

### Dictionnaires créés
- ✅ `lib/i18n/dictionaries/fr/landing.ts` (FR - source de vérité)
- ✅ `lib/i18n/dictionaries/en/landing.ts` (EN - traduit)
- ✅ `lib/i18n/dictionaries/ar/landing.ts` (AR - traduit)
- ✅ Exports ajoutés dans les 3 index.ts

### Composants traduits
- ✅ `PageIntro` - Animation d'intro avec tagline
- ✅ `Hero` - Section hero avec canaux rotatifs et CTAs
- ✅ `InteractiveStudio` - Studio interactif complet avec 3 scénarios

### Infrastructure
- ✅ `LanguageSwitcher` déjà présent dans la nav
- ✅ Hook `useT()` fonctionnel
- ✅ Pas d'erreurs TypeScript

## 🚧 À faire (optionnel)

Pour compléter la traduction, il reste ces composants (suivre le même pattern) :

### 1. Ajouter l'import et le hook
```typescript
import { useT } from '@/components/i18n-provider'

export function MonComposant() {
  const t = useT()
  // ...
}
```

### 2. Remplacer les textes hardcodés
```typescript
// Avant
<h2>Testez la voix de votre IA</h2>

// Après  
<h2>{t('landing.interactiveStudio.title')}</h2>
```

### Composants à traduire (dans l'ordre de priorité)

1. **`interactive-studio.tsx`** (Studio temps réel)
   - Section tag, titre, sous-titre
   - Labels des scénarios
   - Tous les textes des nodes
   - Messages utilisateur et IA

2. **`sections.tsx`** (Toutes les sections)
   - `CommandCenterTrust`
   - `FeaturesGrid` 
   - `ComparisonTable`
   - `Faq`
   - `ClosingCta`

3. **`chrome.tsx`** (Nav et Footer)
   - `LandingNav` (liens de navigation)
   - `LandingFooter` (liens + copyright)

4. **`pricing.tsx`**
   - Tags, titres, labels
   - Textes des boutons

5. **`flow-demo.tsx`** (si nécessaire)

### Clés de dictionnaire déjà disponibles

Toutes les clés sont documentées dans `lib/i18n/dictionaries/fr/landing.ts`.

Structure :
```typescript
landing.pageIntro.*
landing.hero.*
landing.channels.*
landing.interactiveStudio.*
landing.scenarios.*
landing.commandCenter.*
landing.features.*
landing.comparison.*
landing.pricing.*
landing.faq.*
landing.closingCta.*
landing.footer.*
```

### Test rapide

1. Lancer le dev server : `npm run dev`
2. Aller sur la landing : `http://localhost:3000`
3. Tester le changement de langue dans le LanguagePicker (si disponible)
4. Vérifier que tous les textes changent

### Notes importantes

- **Tous les composants clients** doivent utiliser `useT()` (et non `useTranslation`)
- **Composants serveur** : utiliser `await getT()` de `@/lib/i18n/server`
- Les **noms de marques** (Raddlly, Instagram, WhatsApp) restent identiques dans toutes les langues
- Les **emojis et icônes** sont universels
- Les **nombres et devises** peuvent rester en format européen (€)

### Pattern pour les scenarios (plus complexe)

```typescript
const t = useT()

const SCENARIOS = [
  {
    id: 'ecommerce',
    label: t('landing.scenarios.ecommerce.label'),
    userMessage: t('landing.scenarios.ecommerce.userMessage'),
    nodes: [
      {
        label: t('landing.scenarios.ecommerce.nodes.intentDetection.label'),
        hint: t('landing.scenarios.ecommerce.nodes.intentDetection.hint'),
        status: t('landing.scenarios.ecommerce.nodes.intentDetection.status'),
      },
      // ... autres nodes
    ],
    extractedData: [
      {
        key: t('landing.scenarios.ecommerce.extractedData.product.key'),
        value: t('landing.scenarios.ecommerce.extractedData.product.value'),
      },
      // ... autres data
    ],
    aiResponse: t('landing.scenarios.ecommerce.aiResponse'),
  },
  // ... autres scénarios
]
```

## Commandes utiles

```bash
# Vérifier TypeScript
npx tsc --noEmit

# Voir les erreurs de dictionnaires manquants
npx tsc --noEmit 2>&1 | grep -i "landing\|dictionary"

# Lancer le dev
npm run dev
```

## Résultat attendu

Une fois terminé :
- ✅ 3 langues complètes (FR, EN, AR)
- ✅ Changement de langue dynamique via le LanguagePicker
- ✅ Toutes les pages landing traduites
- ✅ TypeScript garantit la complétude des traductions
