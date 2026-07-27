# Design System Reference - Organic

Ce fichier documente les tokens et patterns du design system "Organic" utilisés dans Manychats, pour garantir la cohérence visuelle lors de l'implémentation de nouveaux composants.

## 🎨 Palette de Couleurs

### Couleurs Primaires

- **Terracotta** (Brand / Primary) : `#c67139` (light) / `#e2884d` (dark)
  - Utilisé pour : actions principales, FAB, liens importants, focus rings
  - Variable CSS : `--organic-terracotta` / `--color-primary`
  - Classe Tailwind : `bg-primary`, `text-primary`, `border-primary`

- **Sage** (Accent secondaire) : `#7a8a5e` (light) / `#9ab27a` (dark)
  - Utilisé pour : success states, tags secondaires
  - Variable CSS : `--organic-sage`
  - Classe Tailwind : `bg-sage-600`, `text-sage-600`

- **Sand** (Neutrals) : rampe de 100 à 900
  - Utilisé pour : surfaces, textes, borders
  - Variables CSS : `--organic-sand-100` à `--organic-sand-900`
  - Classes Tailwind : `bg-sand-200`, `text-sand-700`, etc.

### Couleurs Sémantiques

- **Background** : `#f5ead8` (light) / `#1b1714` (dark)
  - Variable : `--background`
  - Classe : `bg-background`

- **Foreground** (Text) : `#201e1d` (light) / `#f3e8da` (dark)
  - Variable : `--foreground`
  - Classe : `text-foreground`

- **Surface** (Cards, panels) : `#ebddc5` (light) / `#241e19` (dark)
  - Variable : `--organic-surface`
  - Classe : `bg-card`

- **Destructive** : `#b23a2e` (light) / `#d9695a` (dark)
  - Variable : `--destructive`
  - Classe : `bg-destructive`, `text-destructive`

- **Success** : `--organic-sage-600`
  - Classe : `bg-success`, `text-success`

- **Warning** : `--organic-terracotta-600`
  - Classe : `bg-warning`, `text-warning`

### Rampes Tonales

**Terracotta** :
- 100: `#fff2eb` (light) / `#3a2416` (dark) - Backgrounds très légers
- 300: `#ffc6a5` (light) / `#653c1f` (dark) - Backgrounds légers
- 500: `#d67f48` (light) / `#a8672e` (dark) - Base
- 600: `#b2622d` (light) / `#cf8442` (dark) - Hover states
- 800: `#643312` (light) / `#f0c199` (dark) - Text on light bg

**Sage** :
- 100: `#f0fae1` (light) / `#1a2213` (dark)
- 400: `#aebf92` (light) / `#3d502a` (dark)
- 600: `#728157` (light) / `#698249` (dark) - Success color
- 800: `#3d472b` (light) / `#b3c890` (dark)

**Sand** :
- 100: `#f9f4ed` (light) / `#17130f` (dark) - Lightest surface
- 200: `#eee7db` (light) / `#1f1a15` (dark) - Secondary/Muted bg
- 400: `#c0b6a5` (light) / `#3c342b` (dark) - Disabled states
- 700: `#645c50` (light) / `#93816a` (dark) - Secondary text
- 900: `#2e2b25` (light) / `#e8dcc6` (dark) - Darkest

## 📐 Border Radius

Le système "Organic" utilise des coins très arrondis :

- **sm** : `8px` - Petits éléments, chips
- **md** : `16px` - Inputs, badges, base buttons
- **lg** : `28px` - Cards, dialogs, popovers
- **xl** : `34px` - Large cards
- **pill** : `999px` - Buttons, tabs (appliqué automatiquement via data-slot)

### Application automatique (via data-slot)

Les éléments avec `data-slot="button"`, `data-slot="input"`, etc. ont automatiquement `border-radius: 999px`.

Les cards, dialogs, popovers ont automatiquement `border-radius: calc(var(--radius-lg) * 1.15)` ≈ `32px`.

## 🌊 Shadows

- **sm** : `0 1px 2px color-mix(in srgb, #2e2b25 14%, transparent)`
  - Utilisé pour : subtle elevation, badges
  - Variable : `--organic-shadow-sm`

- **md** : `0 3px 10px color-mix(in srgb, #2e2b25 16%, transparent)`
  - Utilisé pour : cards, dropdowns
  - Variable : `--organic-shadow-md`

- **lg** : `0 12px 32px color-mix(in srgb, #2e2b25 22%, transparent)`
  - Utilisé pour : modals, FAB, floating elements
  - Variable : `--organic-shadow-lg`
  - Classe Tailwind : `shadow-lg`

En mode dark, les ombres incluent une subtile border ring pour la définition.

## 🔤 Typography

### Fonts

- **Heading** : Caprasimo (via `var(--font-caprasimo)`)
  - Weight : 400 uniquement (pas de bold disponible)
  - Usage : `font-heading`
  
- **Body** : Outfit (via `var(--font-outfit)`)
  - Usage : `font-sans` (appliqué par défaut)

- **Mono** : JetBrains Mono
  - Usage : `font-mono`

### Tailles de Headings

- h1 : `42px` / line-height `1.12`
- h2 : `32px`
- h3 : `25px`
- h4 : `20px`
- h5 : `16px`
- h6 : `13px` (uppercase, tracking `0.08em`)

### Body

- Base : `15px` / line-height `1.55`
- Small : `13px` (buttons, labels)

## 🎭 Glassmorphism Classes

Trois niveaux de glass effect disponibles :

1. **`.glass-card`** - Panels de contenu principaux
   - `background: color-mix(in srgb, var(--organic-bg) 52%, transparent)`
   - `backdrop-filter: blur(24px) saturate(1.8)`
   - Border subtle avec highlight inset

2. **`.glass-stat`** - Cards de statistiques (plus légères)
   - `background: color-mix(in srgb, var(--organic-bg) 45%, transparent)`
   - `backdrop-filter: blur(20px) saturate(1.6)`

3. **`.glass-banner`** - Hero banners (plus opaques)
   - `background: color-mix(in srgb, var(--organic-bg) 65%, transparent)`
   - `backdrop-filter: blur(32px) saturate(1.9)`

## 🔘 Button Variants

Du composant `components/ui/button.tsx` :

### Variants

- **default** : `bg-primary text-primary-foreground hover:bg-primary/80`
  - Terracotta filled, pour actions principales

- **outline** : `border-border bg-background hover:bg-muted`
  - Transparent avec border, actions secondaires

- **secondary** : `bg-secondary text-secondary-foreground`
  - Sand-200 filled, actions tertiaires

- **ghost** : `hover:bg-muted`
  - Transparent, hover seulement, actions subtiles

- **destructive** : `bg-destructive/10 text-destructive hover:bg-destructive/20`
  - Rouge warmed, actions dangereuses

- **link** : `text-primary underline-offset-4 hover:underline`
  - Texte terracotta avec underline

### Sizes

- **icon** : `size-9 sm:size-8` - Bouton carré icon-only
- **icon-sm** : `size-8 sm:size-7` - Icon bouton petit
- **icon-lg** : `size-9` - Icon bouton grand
- **default** : `h-9 sm:h-8` - Hauteur standard avec padding
- **sm** : `h-8 sm:h-7` - Petit bouton
- **lg** : `h-9` - Grand bouton

### Notes

- Tous les boutons ont automatiquement `border-radius: 999px` via data-slot
- Focus ring : terracotta 2px offset
- Active state : `translate-y-px` (enfonce légèrement)
- Disabled : `opacity-50` + `pointer-events-none`

## ✨ Animations

### Transitions Globales

Appliquées automatiquement sur tous les éléments interactifs (buttons, links, inputs) :

```css
transition-property: color, background-color, border-color, opacity, box-shadow, transform;
transition-duration: 180ms;
transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
```

### Framer Motion

Le projet utilise `framer-motion` pour les animations complexes.

Exemples d'animations existantes :
- Fade in/out
- Scale transforms
- Slide in from edges
- Stagger children

### Patterns Communs

**Hover lift** :
```tsx
whileHover={{ y: -2, scale: 1.02 }}
transition={{ duration: 0.2 }}
```

**Pulse animation** :
```tsx
animate={{ scale: [1, 1.05, 1] }}
transition={{ repeat: Infinity, duration: 2 }}
```

**Fade in** :
```tsx
initial={{ opacity: 0 }}
animate={{ opacity: 1 }}
transition={{ duration: 0.3 }}
```

## 📱 Mobile Considerations

### Safe Areas

Classes disponibles :
- `.pb-safe` : `padding-bottom: env(safe-area-inset-bottom)`
- `.pt-safe` : `padding-top: env(safe-area-inset-top)`

Utiliser pour les éléments en bas d'écran (FAB, bottom nav) sur iOS.

### Touch Optimization

- Tap highlight désactivé : `-webkit-tap-highlight-color: transparent`
- Smooth scrolling : `-webkit-overflow-scrolling: touch`
- Tailles de tap target : minimum 44x44px recommandé (size-11 ou h-11)

### Breakpoints

Tailwind default :
- `sm:` 640px
- `md:` 768px
- `lg:` 1024px
- `xl:` 1280px

Le mobile FAB du flow canvas utilise `md:hidden` (masqué au-dessus de 768px).

## 🎯 Z-Index Layers

Hiérarchie utilisée dans l'app :

- Base content : `z-0`
- Sticky headers : `z-10`
- Dropdowns/Popovers : `z-20`
- FAB : `z-40` (proposé pour le copilot FAB)
- Sheets/Dialogs : `z-50`
- Toasts : `z-100`

## 🧩 Composant FAB de Référence

Le FAB mobile du flow canvas (`components/flows/builder/flow-canvas.tsx`) :

```tsx
<Button
  size="icon"
  onClick={() => setPaletteOpen(true)}
  className="absolute bottom-4 right-4 z-10 size-12 rounded-full shadow-lg md:hidden"
  aria-label="Ajouter un nœud"
>
  <Plus className="size-5" />
</Button>
```

### Caractéristiques

- Taille : `size-12` (48x48px)
- Position : `absolute bottom-4 right-4`
- Shadow : `shadow-lg` pour l'élévation
- Rounded : `rounded-full` (circle parfait)
- Z-index : `z-10` (peut être augmenté pour le copilot à `z-40`)
- Mobile-only : `md:hidden` (masqué sur desktop)
- Accessibility : `aria-label` pour screen readers

## 💡 Guidelines pour le Copilot FAB

Sur base de ce design system :

1. **Couleur** : `bg-primary` (terracotta) avec `hover:bg-primary/90`
2. **Taille** : `size-14` (56x56px) pour plus de présence que le FAB flow
3. **Shadow** : `shadow-lg` pour l'élévation maximale
4. **Icon** : Sparkles de lucide-react, `size-6`
5. **Animation** : Pulse subtil avec framer-motion
6. **Position** : `fixed bottom-6 right-6` avec `z-40`
7. **Mobile** : Ajuster la position pour éviter la bottom nav (`pb-safe` + offset)
8. **Hover** : Scale légèrement + brightness increase
9. **Tooltip** : Afficher "Copilote IA (Ctrl+I)" au hover (desktop seulement)
10. **Focus** : Ring terracotta automatique via focus-visible

### Gestion du conflit avec le FAB du flow canvas

Sur la page `/flows/[id]` (flow builder), deux options :

**Option A** : Détecter la route et ajuster la position
```tsx
const isFlowBuilder = pathname?.startsWith('/flows/') && pathname !== '/flows'
const positionClass = isFlowBuilder ? 'bottom-20 right-6' : 'bottom-6 right-6'
```

**Option B** : Masquer temporairement le FAB du copilot sur le flow builder
```tsx
const hideOnFlowBuilder = pathname?.match(/^\/flows\/[^/]+$/)
if (hideOnFlowBuilder) return null
```

**Recommandation** : Option A pour maintenir l'accès au copilote partout.

## 📝 Exemples de Code Réutilisables

### Button Primary avec Icon

```tsx
<Button size="icon" aria-label="Action">
  <Icon className="size-5" />
</Button>
```

### Card avec Glassmorphism

```tsx
<div className="glass-card rounded-lg p-6">
  {/* content */}
</div>
```

### Hover Animation (framer-motion)

```tsx
<motion.div
  whileHover={{ scale: 1.02, y: -2 }}
  transition={{ duration: 0.2 }}
>
  {/* content */}
</motion.div>
```

### Focus Ring Custom

```tsx
className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
```

---

**Dernière mise à jour** : Task #1 - Audit du design system
**Fichier source** : `app/globals.css`, `components/ui/button.tsx`
