import type { OperationalReportSpec } from "./operational-report-dialog"

const money = (value: any) =>
  `${Number(value || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} د.م`

const percent = (value: any) => (value === null || value === undefined ? "—" : `${Number(value).toFixed(1)}%`)

/** Which families nobody is paying for, and by how much they fall short. */
export const SPONSORSHIP_GAPS: OperationalReportSpec = {
  endpoint: "sponsorship-gaps",
  title: "تقرير نقص الكفالة",
  description: "الأسر غير المكفولة والأسر ذات التغطية الناقصة، مرتّبة بالأكثر حاجة أولاً",
  rowsKey: "families",
  usesPeriod: false,
  emptyMessage: "كل الأسر مغطاة بالكامل.",
  stats: [
    { key: "families_with_gap", label: "أسر بها نقص" },
    { key: "unsponsored", label: "بدون أي كفيل" },
    { key: "orphans_affected", label: "أيتام معنيون" },
    { key: "total_shortfall", label: "مجموع النقص", format: money },
  ],
  columns: [
    { key: "full_name", label: "الأسرة" },
    { key: "phone", label: "الهاتف" },
    { key: "neighborhood", label: "الحي" },
    { key: "orphans_count", label: "الأيتام", align: "center" },
    { key: "kafils_count", label: "الكفلاء", align: "center", format: (v) => (v ? String(v) : "—") },
    { key: "covered", label: "المغطّى", align: "center", format: money },
    {
      key: "shortfall",
      label: "النقص",
      align: "center",
      format: money,
      emphasis: () => "text-red-600 font-semibold",
    },
  ],
}

/** Standing commitments against what actually arrived. */
export const KAFIL_FOLLOW_UP: OperationalReportSpec = {
  endpoint: "kafil-follow-up",
  title: "متابعة التزامات الكفلاء",
  description: "المتوقّع مقابل المحصّل خلال الفترة — الأكثر تأخراً أولاً",
  rowsKey: "kafils",
  emptyMessage: "لا يوجد كفلاء مسجلون.",
  stats: [
    { key: "kafils", label: "الكفلاء" },
    { key: "behind", label: "متأخرون" },
    { key: "never_paid", label: "لم يدفعوا" },
    { key: "expected", label: "المتوقّع", format: money },
    { key: "paid", label: "المحصّل", format: money },
  ],
  columns: [
    { key: "full_name", label: "الكفيل" },
    { key: "phone", label: "الهاتف" },
    { key: "families", label: "الأسر", align: "center" },
    { key: "expected", label: "المتوقّع", align: "center", format: money },
    { key: "paid", label: "المحصّل", align: "center", format: money },
    {
      key: "coverage",
      label: "التغطية",
      align: "center",
      format: percent,
      emphasis: (row) => ((row.coverage ?? 0) >= 99 ? "text-green-700 font-semibold" : "text-red-600 font-semibold"),
    },
    { key: "last_payment", label: "آخر دفعة", format: (v) => (v ? String(v).slice(0, 10) : "—") },
  ],
}

/** What went into each fund, what came out, and what is left. */
export const BUDGET_UTILIZATION: OperationalReportSpec = {
  endpoint: "budget-utilization",
  title: "تقرير استعمال الميزانيات",
  description: "الوارد والمصروف والمتبقي في كل ميزانية خلال الفترة",
  rowsKey: "budgets",
  emptyMessage: "لا توجد ميزانيات.",
  stats: [
    { key: "income", label: "الإيرادات", format: money },
    { key: "expense", label: "المصروفات", format: money },
    { key: "remaining", label: "المتبقي", format: money },
    { key: "overspent", label: "ميزانيات متجاوزة" },
  ],
  columns: [
    { key: "label", label: "الميزانية" },
    { key: "income", label: "الإيرادات", align: "center", format: money },
    { key: "expense", label: "المصروفات", align: "center", format: money },
    {
      key: "remaining",
      label: "المتبقي",
      align: "center",
      format: money,
      emphasis: (row) => (row.remaining >= 0 ? "text-green-700 font-semibold" : "text-red-600 font-semibold"),
    },
    { key: "utilization", label: "نسبة الصرف", align: "center", format: percent },
  ],
}
