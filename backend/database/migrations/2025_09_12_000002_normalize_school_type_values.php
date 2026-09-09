<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * `schools.type` is the education stage (school vs. university) - public
     * vs. private is a separate flag. Some rows were written with the
     * public/private wording instead, which made "higher education" filters
     * silently match nothing. Anything that is not a university is a school.
     */
    public function up(): void
    {
        DB::table('schools')->where('type', '!=', 'university')->update(['type' => 'school']);
    }

    public function down(): void
    {
        // The original values carried no information the flag does not already hold.
    }
};
