#!/usr/bin/env bash
# Recrée la base de test puis exécute les tests pgTAP. Échoue au moindre test en échec.
# Prérequis : PostgreSQL 16 + PostGIS + pgTAP accessibles via PGHOST/PGPORT/PGUSER.
set -euo pipefail
DIR="$(cd "$(dirname "$0")/.." && pwd)"
DB="${1:-water_finder_test}"
"$DIR/local/reset-db.sh" "$DB" >/dev/null
status=0
for t in "$DIR"/tests/*.test.sql; do
  out="$(psql -X -q -tA -d "$DB" -f "$t" 2>&1)" || true
  passed=$(grep -cE '^ok ' <<<"$out" || true)
  if grep -qE '^not ok|ERROR|Looks like' <<<"$out"; then
    echo "✗ $(basename "$t")"; grep -E '^not ok|^#|ERROR' <<<"$out" | head -40; status=1
  else
    echo "✓ $(basename "$t") : $passed tests"
  fi
done
exit $status
