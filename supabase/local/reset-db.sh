#!/usr/bin/env bash
# Recrée une base de test locale (PostgreSQL + PostGIS) et y applique shim + migrations.
# Usage : PGHOST=localhost PGPORT=54329 PGUSER=postgres supabase/local/reset-db.sh [nom_base]
set -euo pipefail
DB="${1:-water_finder_test}"
DIR="$(cd "$(dirname "$0")/.." && pwd)"
psql -X -q -v ON_ERROR_STOP=1 -d postgres -c "drop database if exists $DB with (force);" -c "create database $DB;"
psql -X -q -v ON_ERROR_STOP=1 -d "$DB" -f "$DIR/local/supabase-shim.sql"
for f in "$DIR"/migrations/*.sql; do
  psql -X -q -v ON_ERROR_STOP=1 -d "$DB" -f "$f"
done
echo "✓ base $DB prête ($(ls "$DIR"/migrations/*.sql | wc -l) migrations)"
