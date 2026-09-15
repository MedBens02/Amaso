<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

/**
 * Keep the access that existing administrators already had.
 *
 * Until now "admin" meant full access, account management and the activity
 * log included. Splitting a superuser off the top would quietly take both
 * away from everybody who had them - and worse, leave an installation with
 * no superuser at all, so that nobody could grant the role to anyone, the
 * users screen being the only place it can be granted from. The way back
 * would have been a database console.
 *
 * So every existing admin becomes a superuser: that is what their account
 * could already do, and changing what a role means is not the same as
 * deciding somebody should lose access. Admins created after this migration
 * get the narrower role, which is the point of having it.
 *
 * Nothing happens on a fresh install - there are no users yet when the
 * migrations run, and the seeder creates superusers directly.
 */
return new class extends Migration
{
    public function up(): void
    {
        DB::table('users')->where('role', 'admin')->update(['role' => 'superuser']);
    }

    /**
     * Rolling back puts them where they were: before this migration existed,
     * "superuser" was not a role any code understood, and leaving accounts
     * holding it would lock them out of everything an admin can do.
     */
    public function down(): void
    {
        DB::table('users')->where('role', 'superuser')->update(['role' => 'admin']);
    }
};
