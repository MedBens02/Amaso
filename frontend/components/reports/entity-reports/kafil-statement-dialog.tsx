"use client"

import { useEffect, useRef, useState } from "react"
import ReactSelect from "react-select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { FileDown, HandCoins, Loader2, Users } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import {
  PDFCardTemplate,
  HiddenPDFWrapper,
  PDFTable,
  type PDFCardSection,
} from "@/components/reports"
import { generatePDFFromHTML, generatePDFFilename } from "@/lib/pdf-generator"
import api from "@/lib/api"

/**
 * Contributions are pooled, so the statement never claims a kafil's money
 * paid for a particular expense. It reports two separate true figures - what
 * they gave, and what their families received - and says so in print.
 */
const DISCLOSURE =
  "تُجمع كل المساهمات في ميزانية الجمعية. المبالغ المذكورة كمساعدات تلقتها الأسرة تُصرف من موارد الجمعية الإجمالية، ولا تمثل بالضرورة صرفاً مباشراً لمساهمة هذا الكفيل."

interface KafilStatementDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const money = (value: number) => `${Number(value || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} د.م`

export function KafilStatementDialog({ open, onOpenChange }: KafilStatementDialogProps) {
  const { toast } = useToast()
  const printRef = useRef<HTMLDivElement>(null)

  const [kafils, setKafils] = useState<any[]>([])
  const [kafilId, setKafilId] = useState<string>("")
  const [from, setFrom] = useState<string>("")
  const [to, setTo] = useState<string>("")
  const [statement, setStatement] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)

  useEffect(() => {
    if (!open) return
    api
      .getKafilsForSponsorship()
      .then((res) => setKafils(res.data || []))
      .catch(() => toast({ title: "خطأ", description: "تعذر تحميل قائمة الكفلاء", variant: "destructive" }))
  }, [open])

  const loadStatement = async () => {
    if (!kafilId) {
      toast({ title: "اختر الكفيل أولاً", variant: "destructive" })
      return
    }

    setLoading(true)
    try {
      const res = await api.getKafilStatement(parseInt(kafilId), {
        ...(from ? { from } : {}),
        ...(to ? { to } : {}),
      })
      setStatement(res.data)
    } catch (error: any) {
      toast({
        title: "خطأ في إنشاء الكشف",
        description: error?.message || "حدث خطأ أثناء تحميل بيانات الكشف",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const generatePDF = async () => {
    if (!printRef.current || isGenerating || !statement) return

    setIsGenerating(true)
    try {
      toast({ title: "جاري إنشاء الـ PDF...", description: "يرجى الانتظار بينما يتم إعداد الكشف" })
      const result = await generatePDFFromHTML(
        printRef,
        generatePDFFilename("kafil-statement", statement.kafil.full_name),
        { scale: 2, multiPage: true },
      )
      if (!result.success) throw new Error(result.error)
      toast({ title: "تم إنشاء الـ PDF بنجاح" })
    } catch (error) {
      toast({
        title: "خطأ في إنشاء الـ PDF",
        description: "حدث خطأ أثناء إنشاء الملف. يرجى المحاولة مرة أخرى",
        variant: "destructive",
      })
    } finally {
      setIsGenerating(false)
    }
  }

  const pdfSections: PDFCardSection[] = statement
    ? [
        {
          title: "المساهمات المقدمة",
          icon: HandCoins,
          content: (
            <PDFTable
              headers={["البند", "المبلغ"]}
              rows={[
                ...statement.contributions.by_budget.map((row: any) => [row.label, money(row.amount)]),
                ["المجموع", money(statement.contributions.total)],
              ]}
            />
          ),
        },
        ...statement.families.map((family: any) => ({
          title: `الأسرة المكفولة: ${family.full_name}`,
          icon: Users,
          content: (
            <div className="space-y-2">
              <PDFTable
                headers={["نوع المساعدة", "المبلغ"]}
                rows={[
                  ...(family.received.by_category.length > 0
                    ? family.received.by_category.map((row: any) => [row.label, money(row.amount)])
                    : [["لا توجد مساعدات مسجلة في هذه الفترة", "—"]]),
                  ["مجموع ما تلقته الأسرة", money(family.received.total)],
                ]}
              />
              <p className="text-xs text-gray-600">
                عدد الأيتام: {family.orphans_count} — مبلغ الكفالة المتفق عليه: {money(family.sponsorship_amount)}
              </p>
            </div>
          ),
        })),
        {
          title: "ملاحظة",
          content: <p className="text-xs leading-relaxed text-gray-700">{DISCLOSURE}</p>,
        },
      ]
    : []

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <HandCoins className="h-5 w-5" />
              كشف الكفيل
            </DialogTitle>
            <DialogDescription>
              يعرض ما قدّمه الكفيل وكيف وُزّع، وما تلقّته الأسر المكفولة من الجمعية خلال الفترة المحددة
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2 md:col-span-3">
              <Label>الكفيل *</Label>
              <ReactSelect
                options={kafils.map((kafil) => ({
                  value: kafil.id.toString(),
                  label: `${kafil.first_name} ${kafil.last_name}`,
                }))}
                value={
                  kafils.find((k) => k.id.toString() === kafilId)
                    ? {
                        value: kafilId,
                        label: `${kafils.find((k) => k.id.toString() === kafilId)?.first_name} ${kafils.find((k) => k.id.toString() === kafilId)?.last_name}`,
                      }
                    : null
                }
                onChange={(option: any) => {
                  setKafilId(option?.value || "")
                  setStatement(null)
                }}
                placeholder="ابحث عن الكفيل..."
                isClearable
                isSearchable
                isRtl
              />
            </div>

            <div className="space-y-2">
              <Label>من تاريخ</Label>
              <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>إلى تاريخ</Label>
              <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
            </div>
            <div className="flex items-end">
              <Button onClick={loadStatement} disabled={loading} className="w-full">
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "عرض الكشف"}
              </Button>
            </div>
          </div>
          <p className="text-xs text-gray-500">اترك التواريخ فارغة لاستخدام السنة المالية النشطة</p>

          {statement && (
            <div className="space-y-4 mt-2">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <Card>
                  <CardContent className="p-4">
                    <p className="text-sm text-gray-600">إجمالي المساهمات</p>
                    <p className="text-2xl font-bold text-green-600">{money(statement.totals.contributed)}</p>
                    <p className="text-xs text-gray-500">{statement.contributions.payments_count} عملية</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <p className="text-sm text-gray-600">مخصّص لأسر محددة</p>
                    <p className="text-2xl font-bold text-blue-600">{money(statement.totals.designated)}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <p className="text-sm text-gray-600">ما تلقّته الأسر المكفولة</p>
                    <p className="text-2xl font-bold text-purple-600">{money(statement.totals.received_by_families)}</p>
                  </CardContent>
                </Card>
              </div>

              <div>
                <h3 className="font-semibold mb-2">توزيع المساهمات على الميزانيات</h3>
                <div className="space-y-1">
                  {statement.contributions.by_budget.map((row: any) => (
                    <div key={row.budget_id} className="flex justify-between p-2 border rounded text-sm">
                      <span>{row.label}</span>
                      <span className="font-semibold">{money(row.amount)}</span>
                    </div>
                  ))}
                  {statement.contributions.by_budget.length === 0 && (
                    <p className="text-sm text-gray-500 p-2">لا توجد مساهمات معتمدة في هذه الفترة</p>
                  )}
                </div>
              </div>

              <div>
                <h3 className="font-semibold mb-2">الأسر المكفولة وما تلقّته</h3>
                <div className="space-y-3">
                  {statement.families.map((family: any) => (
                    <div key={family.widow_id} className="border rounded p-3">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="font-medium">{family.full_name}</p>
                          <p className="text-xs text-gray-500">
                            {family.orphans_count} أيتام — كفالة متفق عليها: {money(family.sponsorship_amount)}
                          </p>
                        </div>
                        <div className="text-left">
                          <p className="text-xs text-gray-500">تلقّت</p>
                          <p className="font-bold text-purple-600">{money(family.received.total)}</p>
                        </div>
                      </div>
                      {family.received.by_category.length > 0 ? (
                        <div className="space-y-1">
                          {family.received.by_category.map((row: any, index: number) => (
                            <div key={index} className="flex justify-between text-sm text-gray-700">
                              <span>{row.label}</span>
                              <span>{money(row.amount)}</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-gray-500">لا توجد مساعدات مسجلة في هذه الفترة</p>
                      )}
                    </div>
                  ))}
                  {statement.families.length === 0 && (
                    <p className="text-sm text-gray-500">هذا الكفيل لا يكفل أي أسرة حالياً</p>
                  )}
                </div>
              </div>

              <p className="text-xs text-gray-600 bg-gray-50 border rounded p-3 leading-relaxed">{DISCLOSURE}</p>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              إغلاق
            </Button>
            <Button onClick={generatePDF} disabled={!statement || isGenerating}>
              {isGenerating ? (
                <Loader2 className="h-4 w-4 ml-2 animate-spin" />
              ) : (
                <FileDown className="h-4 w-4 ml-2" />
              )}
              تحميل PDF
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {statement && (
        <HiddenPDFWrapper>
          <div ref={printRef}>
            <PDFCardTemplate
              header={{
                title: "كشف الكفيل",
                subtitle: `الفترة: ${statement.period.from} إلى ${statement.period.to}`,
                entityName: statement.kafil.full_name,
                entityId: `#${statement.kafil.id}`,
              }}
              sections={pdfSections}
              footer={{
                leftContent: `إجمالي المساهمات: ${money(statement.totals.contributed)}`,
                rightContent: `ما تلقّته الأسر: ${money(statement.totals.received_by_families)}`,
              }}
            />
          </div>
        </HiddenPDFWrapper>
      )}
    </>
  )
}
