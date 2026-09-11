#!/usr/bin/env bash
#
# Rebuild ../amaso.sql from the migrations and the seeders.
#
#     cd backend
#     ./regenerate-demo-sql.sh
#
# The file exists for people who have phpMyAdmin and no PHP toolchain. It has
# to be regenerated whenever a migration or the demo seeder changes, or the
# two ways of getting a database stop agreeing - which is the whole reason it
# is built from `migrate:fresh` plus the seeders rather than hand-edited.
#
# It wipes the database named in .env and refills it. That database must be a
# scratch one: the script refuses to touch anything that does not look like
# demo data.
#
# Two things in a mysqldump break the import elsewhere and are stripped:
#   - MariaDB's "sandbox" marker on line 1, which MySQL rejects outright
#   - the DEFINER clause on the view, which names a user the target server
#     almost certainly does not have

set -euo pipefail

cd "$(dirname "$0")"

OUTPUT="../amaso.sql"

env_value() {
    # Reads one key out of .env without sourcing it, so a value containing
    # spaces or shell metacharacters cannot be executed.
    sed -n "s/^$1=//p" .env | tail -n1 | tr -d '"' | tr -d "'"
}

DB_DATABASE="$(env_value DB_DATABASE)"
DB_USERNAME="$(env_value DB_USERNAME)"
DB_PASSWORD="$(env_value DB_PASSWORD)"
DB_HOST="$(env_value DB_HOST)"
DB_PORT="$(env_value DB_PORT)"
DB_HOST="${DB_HOST:-127.0.0.1}"
DB_PORT="${DB_PORT:-3306}"

if [ -z "$DB_DATABASE" ]; then
    echo "Could not read DB_DATABASE from .env" >&2
    exit 1
fi

mysql_args=(-h "$DB_HOST" -P "$DB_PORT" -u "$DB_USERNAME")
[ -n "$DB_PASSWORD" ] && mysql_args+=("-p$DB_PASSWORD")

real_rows=$(mysql "${mysql_args[@]}" -N -s -e \
    "SELECT COUNT(*) FROM widows WHERE national_id NOT LIKE 'DEMO%'" "$DB_DATABASE" 2>/dev/null || echo 0)

if [ "${real_rows:-0}" -gt 0 ]; then
    echo "Refusing to run: '$DB_DATABASE' holds $real_rows widow(s) that are not demo records." >&2
    echo "Point DB_DATABASE at a scratch database first - this script wipes it." >&2
    exit 2
fi

echo "Rebuilding $DB_DATABASE from migrations and seeders..."
php artisan migrate:fresh --force >/dev/null
php artisan db:seed --force >/dev/null
php artisan db:seed --class=DemoDataSeeder --force

count() {
    mysql "${mysql_args[@]}" -N -s -e "SELECT COUNT(*) FROM $1" "$DB_DATABASE"
}

tables=$(mysql "${mysql_args[@]}" -N -s -e \
    "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='$DB_DATABASE' AND table_type='BASE TABLE'" )
widows=$(count widows)
orphans=$(count orphans)
donors=$(count donors)
kafils=$(count kafils)
fiscal_years=$(count fiscal_years)
academic_years=$(count academic_years)
enrollments=$(count orphan_enrollments)

echo "Dumping..."
tmp="$(mktemp)"
trap 'rm -f "$tmp"' EXIT

cat > "$tmp" <<HEADER
-- AMASO - قاعدة بيانات تجريبية / Demo database
-- جمعية المنصور لكفالة اليتيم
--
-- Generated: $(date +%Y-%m-%d)  (by backend/regenerate-demo-sql.sh)
-- Charset:   utf8mb4 / utf8mb4_unicode_ci
--
-- ماذا يحتوي هذا الملف / What this file contains
--   Schema for all $tables tables and the v_current_cash view, plus reference
--   data (categories, budgets, aid types, education levels, kafala chamila
--   split rules) and a full set of FICTIONAL demo records:
--   $widows families, $orphans orphans, $donors donors, $kafils sponsors,
--   $fiscal_years fiscal years of income and expenses, and
--   $academic_years academic years covering $enrollments school enrollments with grades.
--
--   Every name, national ID, phone number and amount in here is invented.
--   There is no real beneficiary data in this file.
--
-- كيفية الاستيراد / How to import
--   phpMyAdmin : create an empty database (utf8mb4_unicode_ci), select it,
--                then Import > choose this file > Go.
--   Command line:
--                mysql -u root -p amaso < amaso.sql
--
--   The file drops and recreates each table, so importing it twice is safe -
--   it always ends with exactly this data. Anything already in those tables
--   is lost, so do not run it against a database holding real records.
--
-- بديل / Alternative
--   The same data can be built from the code instead, which is preferable
--   during development because it always matches the current migrations:
--       php artisan migrate:fresh
--       php artisan db:seed
--       php artisan db:seed --class=DemoDataSeeder
--
-- حسابات الدخول / Login accounts (password for all three: password)
--   admin@amaso.org       مدير            admin
--   accountant@amaso.org  محاسب           accountant
--   social@amaso.org      أخصائي اجتماعي  social_worker
--
--   Change these before the application is used for anything real.

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;
SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";

HEADER

mysqldump "${mysql_args[@]}" \
    --default-character-set=utf8mb4 \
    --add-drop-table \
    --single-transaction \
    --skip-comments \
    --skip-set-charset \
    --routines=FALSE \
    --events=FALSE \
    "$DB_DATABASE" \
    | sed -e '/^\/\*!999999.*SANDBOX/d' \
          -e 's/DEFINER=[^ ]*@[^ ]* SQL SECURITY DEFINER //' \
          -e 's/ALGORITHM=UNDEFINED /ALGORITHM=UNDEFINED SQL SECURITY INVOKER /' \
    >> "$tmp"

printf '\nSET FOREIGN_KEY_CHECKS = 1;\n' >> "$tmp"

mv "$tmp" "$OUTPUT"
trap - EXIT

echo "Wrote $OUTPUT ($(wc -l < "$OUTPUT") lines, $(du -h "$OUTPUT" | cut -f1))"

if grep -qi 'DEFINER=' "$OUTPUT"; then
    echo "WARNING: a DEFINER clause survived - the import will fail on another server." >&2
    exit 1
fi
