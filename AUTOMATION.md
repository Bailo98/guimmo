# BienLoger — Automatisations Edge Functions

BienLoger utilise 5 Supabase Edge Functions pour tourner sans intervention humaine.

---

## Fonctions

| Fonction | Cron | Description |
|---|---|---|
| `expire-listings` | `0 6 * * *` | Met en pause les annonces expirées, envoie un rappel J-3 |
| `notify-saved-searches` | `0 * * * *` | Alerte les utilisateurs quand une annonce correspond à leur recherche sauvegardée |
| `monthly-report` | `0 9 1 * *` | Rapport mensuel WhatsApp aux propriétaires (vues, contacts) |
| `auto-moderate` | `0 * * * *` | Auto-approuve les annonces complètes > 72h, rejette les incomplètes > 7j |
| `cleanup` | `0 3 * * 0` | Supprime les vieux logs, rapports résolus, annonces rejetées |

---

## Déploiement initial

### 1. Authentification Supabase CLI

```bash
npx supabase login
```

### 2. Configurer les secrets

```bash
npx supabase secrets set CALLMEBOT_API_KEY=<votre_clé> --project-ref kqshknfrtlbjaufkdeeg
npx supabase secrets set APP_URL=https://guimmo-orcin.vercel.app --project-ref kqshknfrtlbjaufkdeeg
```

`SUPABASE_URL` et `SUPABASE_SERVICE_ROLE_KEY` sont injectés automatiquement par Supabase.

### 3. Déployer toutes les fonctions

```bash
bash scripts/deploy-functions.sh
```

Ou manuellement :

```bash
npx supabase functions deploy expire-listings        --project-ref kqshknfrtlbjaufkdeeg --no-verify-jwt
npx supabase functions deploy notify-saved-searches  --project-ref kqshknfrtlbjaufkdeeg --no-verify-jwt
npx supabase functions deploy monthly-report         --project-ref kqshknfrtlbjaufkdeeg --no-verify-jwt
npx supabase functions deploy auto-moderate          --project-ref kqshknfrtlbjaufkdeeg --no-verify-jwt
npx supabase functions deploy cleanup                --project-ref kqshknfrtlbjaufkdeeg --no-verify-jwt
```

### 4. Appliquer la migration SQL

Dans Supabase Dashboard → SQL Editor, exécuter :
`supabase/migrations/009_automation.sql`

### 5. Planifier les crons

**Option A — Dashboard Supabase (recommandé)**

Dashboard → Edge Functions → sélectionner la fonction → onglet "Schedule" → ajouter le cron.

**Option B — pg_cron**

Activer l'extension `pg_cron` dans Dashboard → Database → Extensions, puis exécuter les commandes commentées en bas de `009_automation.sql`.

---

## WhatsApp (CallMeBot)

Les notifications sont envoyées via [CallMeBot](https://www.callmebot.com/blog/free-api-whatsapp-messages/) (gratuit).

Pour obtenir une clé API :
1. Ajouter `+34 644 61 57 23` dans vos contacts WhatsApp sous le nom "CallMeBot"
2. Envoyer `I allow callmebot to send me messages` à ce numéro
3. Vous recevrez votre `apikey` par retour de message

---

## Tables créées

| Table | Usage |
|---|---|
| `notifications_sent` | Déduplication des alertes de recherches sauvegardées |
| `cleanup_logs` | Journal des opérations de nettoyage hebdomadaires |

Colonnes ajoutées sur `properties` :
- `expires_at TIMESTAMPTZ` — date d'expiration de l'annonce (migration 008)
- `reminder_sent boolean DEFAULT false` — rappel J-3 déjà envoyé
- `moderated_at TIMESTAMPTZ` — date de modération (auto ou manuelle)

---

## Variables d'environnement

| Variable | Source | Description |
|---|---|---|
| `SUPABASE_URL` | Auto (Supabase) | URL du projet |
| `SUPABASE_SERVICE_ROLE_KEY` | Auto (Supabase) | Clé service (bypass RLS) |
| `CALLMEBOT_API_KEY` | `supabase secrets set` | Clé CallMeBot WhatsApp |
| `APP_URL` | `supabase secrets set` | URL publique de l'app |

---

## Structure des fichiers

```
supabase/
├── config.toml                          # Configuration projet + fonctions
├── functions/
│   ├── _shared/
│   │   └── whatsapp.ts                  # Utilitaire sendWhatsApp() partagé
│   ├── expire-listings/index.ts
│   ├── notify-saved-searches/index.ts
│   ├── monthly-report/index.ts
│   ├── auto-moderate/index.ts
│   └── cleanup/index.ts
└── migrations/
    ├── 008_security_fixes.sql
    └── 009_automation.sql               # Tables + colonnes pour l'automation
scripts/
└── deploy-functions.sh                  # Script de déploiement tout-en-un
```
