<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('widows', function (Blueprint $table) {
            // Relationship of the registered guardian to the orphans
            // (the "widow" record may actually be an aunt, grandmother, ...).
            $table->string('family_liaison', 100)->nullable()->after('marital_status');

            // Set when the family leaves the association (archive flow).
            $table->date('leaving_date')->nullable()->after('disability_type');
            $table->string('leaving_reason', 20)->nullable()->after('leaving_date'); // graduated | removed
            $table->text('leaving_details')->nullable()->after('leaving_reason');

            $table->softDeletes();
        });
    }

    public function down(): void
    {
        Schema::table('widows', function (Blueprint $table) {
            $table->dropColumn(['family_liaison', 'leaving_date', 'leaving_reason', 'leaving_details', 'deleted_at']);
        });
    }
};
