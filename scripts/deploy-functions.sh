#!/usr/bin/env bash
# Deploy all BienLoger Edge Functions to Supabase
# Usage: bash scripts/deploy-functions.sh
# Prerequisites: npx supabase login  (first time only)

set -e

PROJECT_REF="kqshknfrtlbjaufkdeeg"

echo "==> Linking project $PROJECT_REF"
npx supabase link --project-ref "$PROJECT_REF"

echo ""
echo "==> Setting secrets (edit values before running)"
echo "    Run the following commands with your actual values:"
echo ""
echo "    npx supabase secrets set CALLMEBOT_API_KEY=YOUR_KEY --project-ref $PROJECT_REF"
echo "    npx supabase secrets set APP_URL=https://guimmo-orcin.vercel.app --project-ref $PROJECT_REF"
echo ""
echo "    SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are injected automatically."
echo ""

echo "==> Deploying Edge Functions"
FUNCTIONS=(expire-listings notify-saved-searches monthly-report auto-moderate cleanup)
for fn in "${FUNCTIONS[@]}"; do
  echo "    Deploying $fn..."
  npx supabase functions deploy "$fn" --project-ref "$PROJECT_REF" --no-verify-jwt
done

echo ""
echo "==> Done! Schedule the following crons in Supabase Dashboard"
echo "    Dashboard → Edge Functions → each function → Schedule"
echo ""
echo "    expire-listings        : 0 6 * * *      (every day at 06:00 UTC)"
echo "    notify-saved-searches  : 0 * * * *      (every hour)"
echo "    monthly-report         : 0 9 1 * *      (1st of each month at 09:00 UTC)"
echo "    auto-moderate          : 0 * * * *      (every hour)"
echo "    cleanup                : 0 3 * * 0      (every Sunday at 03:00 UTC)"
echo ""
echo "    Or use pg_cron in Supabase SQL Editor (see supabase/migrations/009_automation.sql)"
