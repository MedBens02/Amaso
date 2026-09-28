<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

/**
 * Drop "كوخ" from the housing types.
 *
 * It was seeded with the other four and does not describe anywhere the
 * association's families actually live, so it sat in the widow form as a
 * choice nobody would ever pick. Taking it out of the seeder is not enough:
 * the seeder upserts by label, so a server that has already run it keeps the
 * row forever.
 *
 * If a family is on it, the row stays. The column is not nullable and the
 * foreign key is a restrict, so there is no correct value to move them to
 * from here - that is a decision about those families. The type is editable
 * in the references screen now, so whoever knows can move them and delete
 * it there.
 */
return new class extends Migration
{
    private const LABEL = 'كوخ';

    public function up(): void
    {
        $id = DB::table('housing_types')->where('label', self::LABEL)->value('id');

        if ($id === null) {
            return;
        }

        if (DB::table('widow_social')->where('housing_type_id', $id)->exists()) {
            return;
        }

        DB::table('housing_types')->where('id', $id)->delete();
    }

    /**
     * Putting it back is harmless - it is one unused row in a lookup table -
     * and it makes the migration reversible on a server that rolls back.
     */
    public function down(): void
    {
        DB::table('housing_types')->updateOrInsert(
            ['label' => self::LABEL],
            ['created_at' => now(), 'updated_at' => now()],
        );
    }
};
