<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * The activity log, admin only (see the `role:admin` middleware on the route).
 *
 * Read-only by design: there is no store, update or destroy here and no
 * route to one. A log the people it records can edit is not a log.
 */
class AuditLogController extends Controller
{
    /**
     * What each action reads as on screen. Kept here rather than in the
     * browser so the filter list and the rows are labelled from one place,
     * and a new action cannot appear in the log with no name for it.
     */
    private const ACTION_LABELS = [
        'created' => 'إضافة',
        'updated' => 'تعديل',
        'deleted' => 'حذف',
        'restored' => 'استرجاع',
        'force_deleted' => 'حذف نهائي',
        'approved' => 'اعتماد',
        'rejected' => 'رفض',
        'transferred' => 'تحويل للبنك',
        'closed' => 'إغلاق',
        'reopened' => 'إعادة فتح',
        'activated' => 'تفعيل',
        'deactivated' => 'إيقاف',
        'password_changed' => 'تغيير كلمة المرور',
        'logged_in' => 'تسجيل دخول',
    ];

    /** The Arabic name of each kind of record the log follows. */
    private const ENTITY_LABELS = [
        'Income' => 'إيراد',
        'Expense' => 'مصروف',
        'Transfer' => 'تحويل',
        'BankAccount' => 'حساب بنكي',
        'FiscalYear' => 'سنة مالية',
        'Budget' => 'ميزانية',
        'IncomeCategory' => 'فئة إيراد',
        'ExpenseCategory' => 'فئة مصروف',
        'KafalaChamilaSplit' => 'توزيع الكفالة الشاملة',
        'Widow' => 'أرملة',
        'Orphan' => 'يتيم',
        'Donor' => 'متبرع',
        'Kafil' => 'كفيل',
        'KafilSponsorship' => 'كفالة',
        'BeneficiaryGroup' => 'مجموعة مستفيدين',
        'School' => 'مؤسسة تعليمية',
        'AcademicYear' => 'سنة دراسية',
        'OrphanEnrollment' => 'تسجيل دراسي',
        'OrphansEducationLevel' => 'مستوى دراسي',
        'AidType' => 'نوع مساعدة',
        'Illness' => 'مرض',
        'Skill' => 'مهارة',
        'HousingType' => 'نوع سكن',
        'Partner' => 'شريك',
        'PartnerField' => 'مجال شراكة',
        'PartnerSubfield' => 'تخصص شراكة',
        'WidowIncomeCategory' => 'فئة مدخول اجتماعي',
        'WidowExpenseCategory' => 'فئة مصروف اجتماعي',
        'User' => 'حساب مستخدم',
        'Setting' => 'إعداد',
    ];

    /**
     * Field names as the forms call them, so a diff reads in the same words
     * as the screen the change was made on. Anything missing falls through
     * to the column name, which is still readable and never wrong.
     */
    private const FIELD_LABELS = [
        'amount' => 'المبلغ',
        'status' => 'الحالة',
        'label' => 'التسمية',
        'name' => 'الاسم',
        'name_ar' => 'الاسم',
        'first_name' => 'الاسم الشخصي',
        'last_name' => 'الاسم العائلي',
        'phone' => 'الهاتف',
        'email' => 'البريد الإلكتروني',
        'address' => 'العنوان',
        'neighborhood' => 'الحي',
        'national_id' => 'رقم البطاقة الوطنية',
        'birth_date' => 'تاريخ الميلاد',
        'admission_date' => 'تاريخ الانخراط',
        'income_date' => 'تاريخ الإيراد',
        'expense_date' => 'تاريخ المصروف',
        'payment_method' => 'طريقة الدفع',
        'cheque_number' => 'رقم الشيك',
        'receipt_number' => 'رقم الإيصال',
        'remarks' => 'ملاحظات',
        'notes' => 'ملاحظات',
        'budget_id' => 'الميزانية',
        'income_category_id' => 'فئة الإيراد',
        'expense_category_id' => 'فئة المصروف',
        'bank_account_id' => 'الحساب البنكي',
        'fiscal_year_id' => 'السنة المالية',
        'donor_id' => 'المتبرع',
        'kafil_id' => 'الكفيل',
        'widow_id' => 'الأسرة',
        'orphan_id' => 'اليتيم',
        'partner_id' => 'الشريك',
        'school_id' => 'المؤسسة',
        'academic_year_id' => 'السنة الدراسية',
        'education_level_id' => 'المستوى الدراسي',
        'approved_by' => 'اعتمده',
        'approved_at' => 'تاريخ الاعتماد',
        'transferred_at' => 'تاريخ التحويل',
        'created_by' => 'أنشأه',
        'is_active' => 'مفعّل',
        'role' => 'الدور',
        'percentage' => 'النسبة',
        'monthly_pledge' => 'التعهد الشهري',
        'deleted_at' => 'تاريخ الأرشفة',
        'is_chronic' => 'مرض مزمن',
        'gender' => 'الجنس',
        'marital_status' => 'الحالة العائلية',
        'disability_flag' => 'إعاقة',
        'disability_type' => 'نوع الإعاقة',
        'health_status' => 'الحالة الصحية',
        'is_schooled' => 'متمدرس',
        'masar_code' => 'رمز مسار',
        'cin' => 'رقم البطاقة الوطنية',
        'is_working' => 'يعمل',
        'work_type' => 'نوع العمل',
        'specialty' => 'التخصص',
        'grade_scale' => 'سلم التنقيط',
        'has_tutoring' => 'دعم دراسي',
        'opening_balance' => 'الرصيد الافتتاحي',
        'bank_name' => 'اسم البنك',
        'account_number' => 'رقم الحساب',
        'is_current' => 'السنة الحالية',
        'family_liaison' => 'مسؤول الأسرة',
        'leaving_date' => 'تاريخ المغادرة',
        'leaving_reason' => 'سبب المغادرة',
        'label' => 'اسم النقطة',
        'mark' => 'النقطة',
        'weight' => 'المعامل',
        'value' => 'القيمة',
    ];

    public function index(Request $request): JsonResponse
    {
        $logs = AuditLog::query()
            ->when($request->user_id, fn ($q, $id) => $q->where('user_id', $id))
            ->when($request->action, fn ($q, $action) => $q->where('action', $action))
            ->when($request->entity_type, fn ($q, $type) => $q->where('entity_type', $type))
            ->when($request->entity_id, fn ($q, $id) => $q->where('entity_id', $id))
            ->when($request->from_date, fn ($q, $from) => $q->whereDate('created_at', '>=', $from))
            ->when($request->to_date, fn ($q, $to) => $q->whereDate('created_at', '<=', $to))
            // Free text runs over what a person would actually remember: the
            // name of the record, and who touched it.
            ->when($request->search, function ($q, $search) {
                $q->where(function ($inner) use ($search) {
                    $inner->where('entity_label', 'like', "%{$search}%")
                        ->orWhere('user_name', 'like', "%{$search}%");
                });
            })
            ->orderByDesc('id')
            ->paginate(min((int) $request->get('per_page', 30), 100));

        return response()->json([
            'data' => collect($logs->items())->map(fn (AuditLog $log) => $this->present($log))->all(),
            'meta' => [
                'current_page' => $logs->currentPage(),
                'last_page' => $logs->lastPage(),
                'per_page' => $logs->perPage(),
                'total' => $logs->total(),
            ],
        ]);
    }

    /**
     * Everything the filter bar needs, in one request.
     *
     * Only the actions and record types that actually appear in this
     * database are offered: a filter that can only ever return nothing is
     * worse than no filter.
     */
    public function filters(): JsonResponse
    {
        $actions = AuditLog::query()->distinct()->orderBy('action')->pluck('action');
        $entities = AuditLog::query()->distinct()->orderBy('entity_type')->pluck('entity_type');

        return response()->json([
            'data' => [
                'actions' => $actions
                    ->map(fn ($action) => [
                        'value' => $action,
                        'label' => self::ACTION_LABELS[$action] ?? $action,
                    ])->values(),
                'entity_types' => $entities
                    ->map(fn ($entity) => [
                        'value' => $entity,
                        'label' => self::ENTITY_LABELS[$entity] ?? $entity,
                    ])->values(),
                'users' => User::query()
                    ->orderBy('name')
                    ->get(['id', 'name'])
                    ->map(fn (User $user) => ['value' => $user->id, 'label' => $user->name])
                    ->values(),
            ],
        ]);
    }

    /** One row, with everything already named the way the screen shows it. */
    private function present(AuditLog $log): array
    {
        return [
            'id' => $log->id,
            'created_at' => $log->created_at?->toISOString(),
            'user_id' => $log->user_id,
            // Accounts can be deleted; the trail they left cannot.
            'user_name' => $log->user_name ?? 'النظام',
            'action' => $log->action,
            'action_label' => self::ACTION_LABELS[$log->action] ?? $log->action,
            'entity_type' => $log->entity_type,
            'entity_label' => self::ENTITY_LABELS[$log->entity_type] ?? $log->entity_type,
            'entity_id' => $log->entity_id,
            'entity_name' => $log->entity_label,
            'ip_address' => $log->ip_address,
            'changes' => $this->presentChanges($log->changes),
            'changes_count' => is_array($log->changes) ? count($log->changes) : 0,
        ];
    }

    /** @return array<int, array<string, mixed>> */
    private function presentChanges(?array $changes): array
    {
        if (!is_array($changes)) {
            return [];
        }

        $rows = [];

        foreach ($changes as $field => $change) {
            $rows[] = [
                'field' => $field,
                'field_label' => self::FIELD_LABELS[$field] ?? $field,
                'redacted' => (bool) ($change['redacted'] ?? false),
                'from' => $change['from'] ?? null,
                'to' => $change['to'] ?? null,
            ];
        }

        return $rows;
    }
}
