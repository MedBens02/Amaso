<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * The card number of a donor or sponsor.
 *
 * Families have carried theirs since the beginning; the people paying for
 * them had a name and a phone number and nothing that identifies them. Two
 * donors with the same common name are not an unusual thing in a register
 * this size, and a receipt for a donation is a document about a person.
 *
 * Nullable and not unique: most of the records already entered do not have
 * one, and this is not a field anybody should be blocked on.
 */
return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasColumn('donors', 'national_id')) {
            return;
        }

        Schema::table('donors', function (Blueprint $table) {
            $table->string('national_id', 30)->nullable()->after('last_name');
            $table->index('national_id', 'donors_national_id_index');
        });
    }

    public function down(): void
    {
        Schema::table('donors', function (Blueprint $table) {
            $table->dropIndex('donors_national_id_index');
            $table->dropColumn('national_id');
        });
    }
};
