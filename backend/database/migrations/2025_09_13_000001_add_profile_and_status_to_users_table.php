<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('phone', 30)->nullable()->after('role');
            $table->string('address', 255)->nullable()->after('phone');

            // Deactivating keeps the account (and everything it authored)
            // while denying login - deleting a user who approved expenses
            // would orphan that history.
            $table->boolean('is_active')->default(true)->after('address');
            $table->timestamp('last_login_at')->nullable()->after('is_active');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['phone', 'address', 'is_active', 'last_login_at']);
        });
    }
};
