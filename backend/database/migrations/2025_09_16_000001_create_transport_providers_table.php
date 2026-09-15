<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Who carries the children.
 *
 * A reference table rather than a name typed onto each record, for the
 * reason `tutoring_provider` is a plain varchar and should not have been:
 * a name written out per row drifts. "نقل الأمل" and "نقل الامل" become two
 * transporters, the roster splits between them, and nobody can answer what
 * the association pays that one operator.
 *
 * The type says who is actually running the vehicle, which changes what the
 * association is paying for and who to call when a child is not collected:
 * its own van and driver, an outside operator under contract, or the
 * school's own bus that it merely subscribes to.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('transport_providers', function (Blueprint $table) {
            $table->id();
            $table->string('name', 150)->unique();
            $table->string('type', 20)->default('contractor'); // association | contractor | school | other
            $table->string('contact_name', 150)->nullable();   // the driver, usually
            $table->string('phone', 30)->nullable();
            $table->boolean('is_active')->default(true);
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->index('is_active');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('transport_providers');
    }
};
