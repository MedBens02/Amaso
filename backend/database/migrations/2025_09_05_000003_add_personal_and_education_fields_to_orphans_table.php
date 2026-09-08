<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('orphans', function (Blueprint $table) {
            $table->string('phone', 30)->nullable()->after('health_status');
            $table->string('cin', 30)->nullable()->after('phone');

            $table->boolean('is_working')->default(false)->after('cin');
            $table->string('work_type', 120)->nullable()->after('is_working');
            $table->boolean('is_work_permanent')->default(false)->after('work_type');
            $table->boolean('is_married')->default(false)->after('is_work_permanent');

            // Education tracking flags
            $table->boolean('is_schooled')->default(true)->after('is_married');
            $table->string('masar_code', 30)->nullable()->after('is_schooled'); // Moroccan national student code
            $table->boolean('is_not_interested')->default(false)->after('masar_code');
            $table->boolean('is_inactive')->default(false)->after('is_not_interested'); // registered but not attending

            $table->softDeletes();
        });
    }

    public function down(): void
    {
        Schema::table('orphans', function (Blueprint $table) {
            $table->dropColumn([
                'phone', 'cin', 'is_working', 'work_type', 'is_work_permanent', 'is_married',
                'is_schooled', 'masar_code', 'is_not_interested', 'is_inactive', 'deleted_at',
            ]);
        });
    }
};
