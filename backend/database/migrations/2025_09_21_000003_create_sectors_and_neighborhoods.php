<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Neighborhoods become a list, and sit under a sector.
 *
 * Until now a neighborhood was free text on the family record, and the
 * "list" offered by the form was whatever distinct values happened to be in
 * that column - which meant a typo became a neighborhood, and there was no
 * level above it to group the town into. Somebody looking after a part of
 * town had no way to ask the application about it.
 *
 * The existing names are imported as they stand, with no sector, because
 * which neighborhood belongs to which sector is local knowledge and not
 * something to invent here. They can be sorted out in the references
 * screen, a few clicks each.
 *
 * The family keeps its `neighborhood` text column. It is read by the widow
 * list, three reports, two exports, the audit log's field labels and the
 * printed card; swapping it for an id would be a large change with nothing
 * to show for it, since the name is what all of those want to print. What
 * this adds is a table saying which names are real and which sector each
 * one is in - and renaming one in the references screen updates the
 * families with it, in the same transaction.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('sectors', function (Blueprint $table) {
            $table->id();
            $table->string('label', 120)->unique();
            $table->timestamps();
        });

        Schema::create('neighborhoods', function (Blueprint $table) {
            $table->id();
            $table->string('label', 120)->unique();
            $table->foreignId('sector_id')->nullable()->constrained('sectors')->nullOnDelete();
            $table->timestamps();
        });

        $now = now();
        $existing = DB::table('widows')
            ->whereNotNull('neighborhood')
            ->where('neighborhood', '!=', '')
            ->distinct()
            ->orderBy('neighborhood')
            ->pluck('neighborhood');

        foreach ($existing as $label) {
            DB::table('neighborhoods')->insertOrIgnore([
                'label' => $label,
                'sector_id' => null,
                'created_at' => $now,
                'updated_at' => $now,
            ]);
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('neighborhoods');
        Schema::dropIfExists('sectors');
    }
};
