<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Widow;
use App\Models\WidowFiles;
use App\Models\WidowSocial;
use App\Models\WidowSocialIncome;
use App\Models\WidowSocialExpense;
use App\Models\WidowMaouna;
use App\Models\Orphan;
use App\Models\Skill;
use App\Models\Illness;
use App\Models\AidType;
use App\Models\HousingType;
use App\Models\WidowIncomeCategory;
use App\Models\WidowExpenseCategory;
use App\Models\Partner;

class CompleteWidowSeeder extends Seeder
{
    public function run(): void
    {
        // Create comprehensive widow data with all features
        $this->createWidow1();
        $this->createWidow2();
        $this->createWidow3();
    }

    private function createWidow1(): void
    {
        // Create widow
        $widow = Widow::create([
            'first_name' => 'خديجة',
            'last_name' => 'الزهراء',
            'phone' => '0599111222',
            'email' => 'khadija.zahra@example.com',
            'address' => 'شارع الكرامة، حي الزهراء',
            'neighborhood' => 'حي الزهراء',
            'admission_date' => '2024-01-15',
            'national_id' => 'W001234567',
            'birth_date' => '1975-08-12',
            'marital_status' => 'Widowed',
            'education_level' => 'ثانوي',
            'disability_flag' => true,
            'disability_type' => 'إعاقة حركية في الساق اليمنى'
        ]);

        // Create widow files
        WidowFiles::create([
            'widow_id' => $widow->id,
            'social_situation' => 'widow',
            'has_chronic_disease' => true,
        ]);

        // Create widow social data
        WidowSocial::create([
            'widow_id' => $widow->id,
            'housing_type_id' => HousingType::where('label', 'شقة')->first()->id,
            'housing_status' => 'rented',
            'has_water' => true,
            'has_electricity' => true,
            'has_furniture' => 3,
        ]);

        // Add children (orphans)
        Orphan::create([
            'widow_id' => $widow->id,
            'first_name' => 'محمد',
            'last_name' => 'الزهراء',
            'birth_date' => '2010-03-15',
            'gender' => 'male',
            'education_level' => 'الصف الثامن',
            'health_status' => 'سليم'
        ]);

        Orphan::create([
            'widow_id' => $widow->id,
            'first_name' => 'فاطمة',
            'last_name' => 'الزهراء',
            'birth_date' => '2012-07-22',
            'gender' => 'female',
            'education_level' => 'الصف السادس',
            'health_status' => 'سليمة'
        ]);

        // Add income sources
        WidowSocialIncome::create([
            'widow_id' => $widow->id,
            'income_category_id' => WidowIncomeCategory::where('name', 'معاش')->first()->id,
            'amount' => 800.00,
            'remarks' => 'معاش الضمان الاجتماعي'
        ]);

        WidowSocialIncome::create([
            'widow_id' => $widow->id,
            'income_category_id' => WidowIncomeCategory::where('name', 'عمل حر')->first()->id,
            'amount' => 300.00,
            'remarks' => 'خياطة في المنزل'
        ]);

        // Add expenses
        WidowSocialExpense::create([
            'widow_id' => $widow->id,
            'expense_category_id' => WidowExpenseCategory::where('name', 'إيجار')->first()->id,
            'amount' => 400.00,
            'remarks' => 'إيجار شهري'
        ]);

        WidowSocialExpense::create([
            'widow_id' => $widow->id,
            'expense_category_id' => WidowExpenseCategory::where('name', 'طعام')->first()->id,
            'amount' => 250.00,
            'remarks' => 'مصاريف طعام شهرية'
        ]);

        WidowSocialExpense::create([
            'widow_id' => $widow->id,
            'expense_category_id' => WidowExpenseCategory::where('name', 'دواء')->first()->id,
            'amount' => 150.00,
            'remarks' => 'أدوية للمرض المزمن'
        ]);

        // Attach skills
        $skills = Skill::whereIn('label', ['خياطة', 'طبخ', 'تطريز'])->get();
        $widow->skills()->attach($skills->pluck('id'));

        // Attach illnesses
        $illnesses = Illness::whereIn('label', ['سكري', 'ضغط دم'])->get();
        $widow->illnesses()->attach($illnesses->pluck('id'));

        // Attach aid types
        $aidTypes = AidType::whereIn('label', ['مساعدة شهرية', 'مساعدة طبية', 'مساعدة غذائية'])->get();
        $widow->aidTypes()->attach($aidTypes->pluck('id'));

        // Add maouna
        WidowMaouna::create([
            'widow_id' => $widow->id,
            'partner_id' => Partner::where('name', 'وزارة التنمية الاجتماعية')->first()->id,
            'amount' => 500.00,
            'is_active' => true,
        ]);
    }

    private function createWidow2(): void
    {
        // Create widow
        $widow = Widow::create([
            'first_name' => 'أمينة',
            'last_name' => 'النور',
            'phone' => '0599333444',
            'email' => 'amina.noor@example.com',
            'address' => 'شارع الجلاء، حي النور',
            'neighborhood' => 'حي النور',
            'admission_date' => '2024-03-10',
            'national_id' => 'W002345678',
            'birth_date' => '1982-11-28',
            'marital_status' => 'Widowed',
            'education_level' => 'جامعي',
            'disability_flag' => false,
            'disability_type' => null
        ]);

        // Create widow files
        WidowFiles::create([
            'widow_id' => $widow->id,
            'social_situation' => 'widow',
            'has_chronic_disease' => false,
        ]);

        // Create widow social data
        WidowSocial::create([
            'widow_id' => $widow->id,
            'housing_type_id' => HousingType::where('label', 'منزل')->first()->id,
            'housing_status' => 'owned',
            'has_water' => true,
            'has_electricity' => true,
            'has_furniture' => 4,
        ]);

        // Add children (orphans)
        Orphan::create([
            'widow_id' => $widow->id,
            'first_name' => 'عائشة',
            'last_name' => 'النور',
            'birth_date' => '2008-05-10',
            'gender' => 'female',
            'education_level' => 'الصف العاشر',
            'health_status' => 'سليمة'
        ]);

        Orphan::create([
            'widow_id' => $widow->id,
            'first_name' => 'عمر',
            'last_name' => 'النور',
            'birth_date' => '2011-09-18',
            'gender' => 'male',
            'education_level' => 'الصف السابع',
            'health_status' => 'يعاني من ربو خفيف'
        ]);

        Orphan::create([
            'widow_id' => $widow->id,
            'first_name' => 'زينب',
            'last_name' => 'النور',
            'birth_date' => '2014-12-05',
            'gender' => 'female',
            'education_level' => 'الصف الرابع',
            'health_status' => 'سليمة'
        ]);

        // Add income sources
        WidowSocialIncome::create([
            'widow_id' => $widow->id,
            'income_category_id' => WidowIncomeCategory::where('name', 'تدريس')->first() ? WidowIncomeCategory::where('name', 'تدريس')->first()->id : WidowIncomeCategory::where('name', 'عمل حر')->first()->id,
            'amount' => 1200.00,
            'remarks' => 'دروس خصوصية'
        ]);

        WidowSocialIncome::create([
            'widow_id' => $widow->id,
            'income_category_id' => WidowIncomeCategory::where('name', 'تبرعات')->first()->id,
            'amount' => 200.00,
            'remarks' => 'تبرعات من الأقارب'
        ]);

        // Add expenses
        WidowSocialExpense::create([
            'widow_id' => $widow->id,
            'expense_category_id' => WidowExpenseCategory::where('name', 'طعام')->first()->id,
            'amount' => 350.00,
            'remarks' => 'مصاريف طعام للعائلة'
        ]);

        WidowSocialExpense::create([
            'widow_id' => $widow->id,
            'expense_category_id' => WidowExpenseCategory::where('name', 'تعليم')->first()->id,
            'amount' => 200.00,
            'remarks' => 'رسوم مدرسية وقرطاسية'
        ]);

        WidowSocialExpense::create([
            'widow_id' => $widow->id,
            'expense_category_id' => WidowExpenseCategory::where('name', 'فواتير')->first()->id,
            'amount' => 180.00,
            'remarks' => 'كهرباء وماء'
        ]);

        // Attach skills
        $skills = Skill::whereIn('label', ['تدريس', 'حاسوب', 'طبخ'])->get();
        $widow->skills()->attach($skills->pluck('id'));

        // Attach illnesses (none for this widow)
        
        // Attach aid types
        $aidTypes = AidType::whereIn('label', ['مساعدة تعليمية', 'مساعدة غذائية'])->get();
        $widow->aidTypes()->attach($aidTypes->pluck('id'));

        // Add maouna
        WidowMaouna::create([
            'widow_id' => $widow->id,
            'partner_id' => Partner::where('name', 'الأونروا')->first()->id,
            'amount' => 300.00,
            'is_active' => true,
        ]);
    }

    private function createWidow3(): void
    {
        // Create widow
        $widow = Widow::create([
            'first_name' => 'مريم',
            'last_name' => 'السلام',
            'phone' => '0599555666',
            'email' => null, // No email for this widow
            'address' => 'شارع المجد، حي السلام',
            'neighborhood' => 'حي السلام',
            'admission_date' => '2024-06-20',
            'national_id' => 'W003456789',
            'birth_date' => '1978-02-14',
            'marital_status' => 'Widowed',
            'education_level' => 'ابتدائي',
            'disability_flag' => false,
            'disability_type' => null
        ]);

        // Create widow files
        WidowFiles::create([
            'widow_id' => $widow->id,
            'social_situation' => 'widow',
            'has_chronic_disease' => true,
        ]);

        // Create widow social data
        WidowSocial::create([
            'widow_id' => $widow->id,
            'housing_type_id' => HousingType::where('label', 'غرفة')->first()->id,
            'housing_status' => 'free',
            'has_water' => false,
            'has_electricity' => true,
            'has_furniture' => 1,
        ]);

        // Add one child
        Orphan::create([
            'widow_id' => $widow->id,
            'first_name' => 'أحمد',
            'last_name' => 'السلام',
            'birth_date' => '2015-08-30',
            'gender' => 'male',
            'education_level' => 'الصف الثالث',
            'health_status' => 'سليم'
        ]);

        // Add income sources
        WidowSocialIncome::create([
            'widow_id' => $widow->id,
            'income_category_id' => WidowIncomeCategory::where('name', 'مساعدة')->first()->id,
            'amount' => 600.00,
            'remarks' => 'مساعدة من الجمعيات الخيرية'
        ]);

        // Add expenses
        WidowSocialExpense::create([
            'widow_id' => $widow->id,
            'expense_category_id' => WidowExpenseCategory::where('name', 'طعام')->first()->id,
            'amount' => 200.00,
            'remarks' => 'مصاريف طعام أساسية'
        ]);

        WidowSocialExpense::create([
            'widow_id' => $widow->id,
            'expense_category_id' => WidowExpenseCategory::where('name', 'دواء')->first()->id,
            'amount' => 100.00,
            'remarks' => 'أدوية للقلب'
        ]);

        WidowSocialExpense::create([
            'widow_id' => $widow->id,
            'expense_category_id' => WidowExpenseCategory::where('name', 'مواصلات')->first()->id,
            'amount' => 50.00,
            'remarks' => 'مواصلات للمستشفى'
        ]);

        // Attach skills
        $skills = Skill::whereIn('label', ['أشغال يدوية', 'تنظيف'])->get();
        $widow->skills()->attach($skills->pluck('id'));

        // Attach illnesses
        $illnesses = Illness::whereIn('label', ['قلب', 'التهاب مفاصل'])->get();
        $widow->illnesses()->attach($illnesses->pluck('id'));

        // Attach aid types
        $aidTypes = AidType::whereIn('label', ['مساعدة شهرية', 'مساعدة طبية', 'مساعدة غذائية', 'مساعدة كسوة'])->get();
        $widow->aidTypes()->attach($aidTypes->pluck('id'));

        // Add maouna
        WidowMaouna::create([
            'widow_id' => $widow->id,
            'partner_id' => Partner::where('name', 'جمعية خيرية محلية')->first()->id,
            'amount' => 250.00,
            'is_active' => true,
        ]);
    }
}