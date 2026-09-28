"use client"

import { useCallback, useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Loader2, UserCheck, Archive, HeartHandshake } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { ArchiveWidowDialog } from "@/components/widows/archive-widow-dialog"
import { toDisplay } from "@/components/ui/date-field"
import api from "@/lib/api"

interface IddaBlock {
  status: "active" | "ended"
  end_date: string | null
  monthly_allowance: number
  months_elapsed: number
  extra_days: number
  amount_due: number
  months_total: number | null
  amount_total: number | null
  days_remaining: number
}

interface IddaCase {
  id: number
  full_name: string
  phone?: string | null
  neighborhood?: string | null
  admission_date?: string | null
  husband_death_date?: string | null
  idda: IddaBlock | null
}

const dirham = (value: number | null | undefined) =>
  value == null ? "—" : `${Number(value).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} د.م.`

/**
 * The يتيم جديد cases: families being supported through عدة.
 *
 * They are deliberately absent from every other screen - the widows list,
 * the counts, the reports, every beneficiary picker but the عدة fund's - so
 * this is the one place they exist. It has to say where each case stands and
 * what she is owed, because nothing else will.
 *
 * A case whose عدة has run out stays here rather than disappearing. The
 * allowance has stopped, but nobody has decided about the family yet, and
 * that decision is the point of the two buttons: take her on, or archive her
 * with a reason. A date is not allowed to make it.
 */
export function IddaCasesPanel({ refreshTrigger }: { refreshTrigger?: number }) {
  const [cases, setCases] = useState<IddaCase[]>([])
  const [loading, setLoading] = useState(true)
  const [busyId, setBusyId] = useState<number | null>(null)
  const [archiving, setArchiving] = useState<IddaCase | null>(null)
  const [reloads, setReloads] = useState(0)
  const { toast } = useToast()

  const load = useCallback(async () => {
    try {
      setLoading(true)
      const response = await api.getWidows({ idda: "only", per_page: 200 })
      setCases((response.data as any) || [])
    } catch (error: any) {
      toast({
        title: "خطأ",
        description: error?.message || "تعذر تحميل حالات يتيم جديد",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => { load() }, [load, refreshTrigger, reloads])

  const enrol = async (item: IddaCase) => {
    if (!window.confirm(`تسجيل أسرة "${item.full_name}" ضمن الأسر المكفولة؟ ستظهر بعدها في كل القوائم والإحصائيات.`)) {
      return
    }

    setBusyId(item.id)
    try {
      const response: any = await api.enrolWidow(item.id)
      toast({ title: "تم", description: response.message })
      setReloads((n) => n + 1)
    } catch (error: any) {
      toast({
        title: "تعذر التسجيل",
        description: error?.message,
        variant: "destructive",
      })
    } finally {
      setBusyId(null)
    }
  }

  const active = cases.filter((item) => item.idda?.status === "active")
  const ended = cases.filter((item) => item.idda?.status !== "active")
  const dueNow = active.reduce((sum, item) => sum + (item.idda?.amount_due ?? 0), 0)

  const row = (item: IddaCase) => {
    const idda = item.idda

    return (
      <TableRow key={item.id} className={idda?.status === "active" ? "" : "bg-muted/30"}>
        <TableCell className="font-medium">
          {item.full_name}
          {item.neighborhood && (
            <span className="block text-xs text-muted-foreground">{item.neighborhood}</span>
          )}
        </TableCell>
        <TableCell className="text-sm">{toDisplay(item.husband_death_date || "") || "—"}</TableCell>
        <TableCell className="text-sm">{toDisplay(item.admission_date || "") || "—"}</TableCell>
        <TableCell className="text-sm">
          {toDisplay(idda?.end_date || "") || "—"}
          {idda?.status === "active" && idda.days_remaining > 0 && (
            <span className="block text-xs text-muted-foreground">بقي {idda.days_remaining} يوماً</span>
          )}
        </TableCell>
        <TableCell className="text-sm">
          {idda ? `${idda.months_elapsed} ${idda.months_elapsed === 1 ? "شهر" : "أشهر"}` : "—"}
          {/* Days past the last whole month, shown and not priced: "400 a
              month" does not say what part of one is worth. */}
          {idda && idda.extra_days > 0 && (
            <span className="block text-xs text-muted-foreground">و{idda.extra_days} يوماً</span>
          )}
        </TableCell>
        <TableCell className="text-end font-medium">{dirham(idda?.amount_due)}</TableCell>
        <TableCell className="text-end text-sm text-muted-foreground">{dirham(idda?.amount_total)}</TableCell>
        <TableCell>
          {idda?.status === "active" ? (
            <Badge className="bg-amber-100 text-amber-900 hover:bg-amber-100 dark:bg-amber-950/50 dark:text-amber-300">
              في العدّة
            </Badge>
          ) : (
            <div className="flex flex-wrap gap-1">
              <Button
                size="sm"
                variant="outline"
                className="h-7 text-xs"
                disabled={busyId === item.id}
                onClick={() => enrol(item)}
              >
                {busyId === item.id
                  ? <Loader2 className="h-3 w-3 animate-spin ml-1" />
                  : <UserCheck className="h-3 w-3 ml-1" />}
                تسجيل كأسرة
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="h-7 text-xs text-muted-foreground"
                onClick={() => setArchiving(item)}
              >
                <Archive className="h-3 w-3 ml-1" />
                أرشفة
              </Button>
            </div>
          )}
        </TableCell>
      </TableRow>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <HeartHandshake className="h-5 w-5" />
          حالات يتيم جديد
          {!loading && (
            <span className="text-sm font-normal text-muted-foreground">
              ({active.length} في العدّة{ended.length > 0 ? ` — ${ended.length} بانتظار القرار` : ""})
            </span>
          )}
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          أسر في فترة العدّة، خارج قوائم المستفيدين والإحصائيات. تتقاضى منحة شهرية من ميزانية
          العدّة ابتداءً من تاريخ الانتساب، وبعد انتهاء العدّة تُسجَّل ضمن الأسر المكفولة أو تُؤرشف.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {active.length > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border bg-muted/40 p-3 text-sm">
            <span className="text-muted-foreground">
              مجموع المستحق للأسر التي ما تزال في العدّة
            </span>
            <span className="text-lg font-bold">{dirham(dueNow)}</span>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center p-8">
            <Loader2 className="h-6 w-6 animate-spin ml-2" />
            <span>جاري التحميل...</span>
          </div>
        ) : cases.length === 0 ? (
          <div className="py-10 text-center text-muted-foreground">
            لا توجد حالات يتيم جديد حالياً. تُسجَّل من زر "إضافة أرملة" بتفعيل خيار "حالة يتيم جديد".
          </div>
        ) : (
          <div className="overflow-x-auto rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-right">الأسرة</TableHead>
                  <TableHead className="text-right">وفاة الزوج</TableHead>
                  <TableHead className="text-right">الانتساب</TableHead>
                  <TableHead className="text-right">انتهاء العدّة</TableHead>
                  <TableHead className="text-right">المدة المستحقة</TableHead>
                  <TableHead className="text-end">المستحق</TableHead>
                  <TableHead className="text-end">إجمالي العدّة</TableHead>
                  <TableHead className="text-right">الحالة</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {active.map(row)}
                {ended.map(row)}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>

      <ArchiveWidowDialog
        open={archiving !== null}
        onOpenChange={(open) => !open && setArchiving(null)}
        widowId={archiving?.id ?? 0}
        widowName={archiving?.full_name ?? ""}
        onArchived={() => {
          setArchiving(null)
          setReloads((n) => n + 1)
        }}
      />
    </Card>
  )
}
