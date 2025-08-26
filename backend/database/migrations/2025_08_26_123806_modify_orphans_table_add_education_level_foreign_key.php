<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('orphans', function (Blueprint $table) {
            // Add the new foreign key column
            $table->unsignedBigInteger('education_level_id')->nullable()->after('education_level');
            
            // Create foreign key constraint
            $table->foreign('education_level_id')->references('id')->on('orphans_education_level')->onDelete('set null');
        });
        
        // Migrate existing data: map old string values to new IDs
        $this->migrateExistingData();
        
        // Remove the old education_level column
        Schema::table('orphans', function (Blueprint $table) {
            $table->dropColumn('education_level');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('orphans', function (Blueprint $table) {
            // Add back the old education_level column
            $table->string('education_level', 50)->nullable()->after('education_level_id');
        });
        
        // Migrate data back from foreign key to string
        $this->migrateDataBack();
        
        // Remove foreign key and column
        Schema::table('orphans', function (Blueprint $table) {
            $table->dropForeign(['education_level_id']);
            $table->dropColumn('education_level_id');
        });
    }
    
    private function migrateExistingData(): void
    {
        // Get mapping of old string values to new IDs
        $mappings = [
            'ابتدائي' => 'الصف الأول الابتدائي',
            'إعدادي' => 'الصف الأول الإعدادي', 
            'ثانوي' => 'الصف الأول الثانوي',
            'جامعي' => 'جامعي',
            'لم يلتحق بالمدرسة' => 'لم يلتحق بالمدرسة',
            'روضة' => 'روضة أطفال',
        ];
        
        foreach ($mappings as $oldValue => $newValue) {
            $educationLevel = \DB::table('orphans_education_level')
                ->where('name_ar', $newValue)
                ->first();
                
            if ($educationLevel) {
                \DB::table('orphans')
                    ->where('education_level', $oldValue)
                    ->update(['education_level_id' => $educationLevel->id]);
            }
        }
        
        // Handle any orphans with null or unmatched education levels
        \DB::table('orphans')
            ->whereNull('education_level_id')
            ->whereNotNull('education_level')
            ->update(['education_level_id' => null]);
    }
    
    private function migrateDataBack(): void
    {
        // Update orphans table with education level names for rollback
        \DB::statement("
            UPDATE orphans o 
            JOIN orphans_education_level el ON o.education_level_id = el.id 
            SET o.education_level = el.name_ar
        ");
    }
};
