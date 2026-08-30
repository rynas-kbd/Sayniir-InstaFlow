# Notes sur l'historique des migrations

## Warnings connus (peuvent être ignorés)

Le CLI Supabase peut afficher des warnings concernant les migrations `20260828`, `20260829`, `20260830`, `20260831` :

```
Remote migration versions not found in local migrations directory.
```

**Ces warnings sont normaux et peuvent être ignorés.** Ces migrations ont été créées/renommées différemment entre local et remote avant que le tracking soit complètement synchronisé.

## Vérifier qu'une migration est déployée

Pour confirmer qu'une migration spécifique est bien appliquée en production :

```bash
npx supabase migration list | grep "20260905"
```

Si la migration apparaît dans les colonnes Local ET Remote, elle est bien déployée.

## Migration multi-items (20260905000000)

✅ **Déployée avec succès** le 2026-09-05

Cette migration ajoute :
- Table `order_items` pour les lignes de commande
- Colonnes de remise sur `orders`
- Panier transitoire dans `order_sessions`
- RPC transactionnelles pour création/édition atomique

Voir `supabase/migrations/20260905000000_multi_item_orders.sql` pour les détails.
