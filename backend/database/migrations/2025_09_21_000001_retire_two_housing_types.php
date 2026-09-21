<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

/**
 * Retire "كوخ" and "بيت شعبي", moving the families on them somewhere real.
 *
 * The previous migration removed the hut only where no family was recorded
 * under it, because moving a family's housing is a statement about that
 * family and not something a migration should invent. It is a decision
 * somebody has now made: the hut becomes a flat, the traditional house
 * becomes a room. With that answered there is nothing left to guess, and
 * doing it here rather than by hand means every installation ends up in the
 * same state.
 *
 * The moves come first and the deletes second, so the foreign key is never
 * left pointing at a row that is going away - and if the delete fails, the
 * families are still on a type that exists.
 */
return new class extends Migration
{
    /** Retired type => the type its families move to. */
    private const MOVES = [
        'كوخ' => 'شقة',
        'بيت شعبي' => 'غرفة',
    ];

    public function up(): void
    {
        foreach (self::MOVES as $from => $to) {
            $fromId = DB::table('housing_types')->where('label', $from)->value('id');
            $toId = DB::table('housing_types')->where('label', $to)->value('id');

            if ($fromId === null) {
                continue;
            }

            // No destination means this installation never had the standard
            // list. Leaving the families where they are beats moving them
            // onto a type picked at random.
            if ($toId === null) {
                continue;
            }

            DB::table('widow_social')->where('housing_type_id', $fromId)->update(['housing_type_id' => $toId]);
            DB::table('housing_types')->where('id', $fromId)->delete();
        }
    }

    /**
     * The types come back empty. Which families were on them is not
     * recorded anywhere once they have moved, and inventing a split on the
     * way back would be worse than leaving them where they now are.
     */
    public function down(): void
    {
        foreach (array_keys(self::MOVES) as $label) {
            DB::table('housing_types')->updateOrInsert(
                ['label' => $label],
                ['created_at' => now(), 'updated_at' => now()],
            );
        }
    }
};
