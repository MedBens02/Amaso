"use client"

import { useState } from "react"
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { DateField } from "@/components/ui/date-field"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { FileDown, FileSpreadsheet, Loader2, Search } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { AsyncSelectRS, type AsyncOption } from "@/components/common/AsyncSelectRS"
import api from "@/lib/api"

export interface ReportColumn {
  key: string
  label: string
  align?: "right" | "center" | "left"
  format?: (value: any, row: any) => string
  emphasis?: (row: any) => string | undefined
}

export interface OperationalReportSpec {
  /** Endpoint stem: the JSON form is `/reports/<endpoint>`, the PDF `<endpoint>.pdf`. */
  endpoint: string
  title: string
  description: string
  /** Key under `data` holding the row list. */
  rowsKey: string
  columns: ReportColumn[]
  stats: Array<{ key: string; label: string; format?: (value: any) => string }>
  /** Hidden when the report is not period-scoped. */
  usesPeriod?: boolean
  /**
   * Which query parameters the two dates map to. Most of these reports
   * measure a window of money and use from/to; the kafala shortfall is not
   * about a window at all, so its dates narrow the families by when they
   * joined instead.
   */
  periodParams?: { from: string; to: string }
  periodLabels?: { from: string; to: string }
  /** An optional extra picker, e.g. one sponsor's families. */
  picker?: {
    param: string
    label: string
    placeholder: string
    load: (query: string) => Promise<AsyncOption[]>
  }
  emptyMessage?: string
}

interface OperationalReportDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  spec: OperationalReportSpec
}

/**
 * The operational reports share one shape - a few headline figures over a
 * single ranked table - so they share one dialog rather than three
 * near-identical files. The PDF is rendered server-side from the same filters.
 */
export function OperationalReportDialog({ open, onOpenChange, spec }: OperationalReportDialogProps) {
  const { toast } = useToast()
  const year = new Date().getFullYear()

  const [from, setFrom] = useState(`${year}-01-01`)
  const [to, setTo] = useState(`${year}-12-31`)
  const [report, setReport] = useState<any | null>(null)
  const [loading, setLoading] = useState(false)
  const [isGenerating, setIsGenerating] = useState<"pdf" | "xlsx" | null>(null)
  const [picked, setPicked] = useState<string | null>(null)

  const periodParams = spec.periodParams ?? { from: "from", to: "to" }

  /** One place building the query, so the table and both files agree. */
  const params = () => {
    const query: Record<string, string> = {}

    if (spec.usesPeriod !== false) {
      query[periodParams.from] = from
      query[periodParams.to] = to
    }

    if (spec.picker && picked) query[spec.picker.param] = picked

    return query
  }

  const queryString = () => {
    const query = new URLSearchParams(params()).toString()

    return query ? `?${query}` : ""
  }

  const load = async () => {
    setLoading(true)
    try {
      const res = await api.request<any>(`/reports/${spec.endpoint}${queryString()}`)
      setReport(res.data)
    } catch (error: any) {
      toast({
        title: "خطأ في إنشاء التقرير",
        description: error?.message || "حدث خطأ أثناء تحميل البيانات",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const download = async (format: "pdf" | "xlsx") => {
    setIsGenerating(format)
    try {
      format === "pdf"
        ? await api.downloadPdf(`/reports/${spec.endpoint}.pdf`, params())
        : await api.downloadExcel(`/reports/${spec.endpoint}.xlsx`, params())
      toast({ title: format === "pdf" ? "تم تحميل التقرير" : "تم تحميل ملف Excel" })
    } catch (error: any) {
      toast({
        title: "خطأ في إنشاء الملف",
        description: error?.message || "حدث خطأ أثناء إنشاء الملف",
        variant: "destructive",
      })
    } finally {
      setIsGenerating(null)
    }
  }

  const rows: any[] = report?.[spec.rowsKey] ?? []

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{spec.title}</DialogTitle>
          <DialogDescription>{spec.description}</DialogDescription>
        </DialogHeader>

        {spec.usesPeriod !== false && (
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">{spec.periodLabels?.from ?? "من تاريخ"}</Label>
              <DateField value={from} onChange={setFrom} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">{spec.periodLabels?.to ?? "إلى تاريخ"}</Label>
              <DateField value={to} onChange={setTo} />
            </div>
          </div>
        )}

        {spec.picker && (
          <div className="space-y-1">
            <Label className="text-xs">{spec.picker.label}</Label>
            <AsyncSelectRS
              loadOptions={spec.picker.load}
              value={picked ?? undefined}
              onChange={setPicked}
              placeholder={spec.picker.placeholder}
            />
          </div>
        )}

        <Button onClick={load} disabled={loading} className="w-full">
          {loading ? <Loader2 className="h-4 w-4 ml-2 animate-spin" /> : <Search className="h-4 w-4 ml-2" />}
          عرض النتائج
        </Button>

        {report && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              {spec.stats.map((stat) => (
                <Card key={stat.key}>
                  <CardContent className="p-3 text-center">
                    <p className="text-xs text-muted-foreground">{stat.label}</p>
                    <p className="text-lg font-bold">
                      {stat.format ? stat.format(report.totals?.[stat.key]) : report.totals?.[stat.key] ?? "—"}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="border rounded-lg overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    {spec.columns.map((column) => (
                      <TableHead key={column.key} className={`text-${column.align ?? "right"}`}>
                        {column.label}
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={spec.columns.length} className="text-center text-muted-foreground py-6">
                        {spec.emptyMessage ?? "لا توجد نتائج."}
                      </TableCell>
                    </TableRow>
                  ) : (
                    rows.map((row, index) => (
                      <TableRow key={index}>
                        {spec.columns.map((column) => (
                          <TableCell
                            key={column.key}
                            className={`text-${column.align ?? "right"} ${column.emphasis?.(row) ?? ""}`}
                          >
                            {column.format ? column.format(row[column.key], row) : row[column.key] ?? "—"}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        )}

        <DialogFooter className="gap-2 sm:gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>إغلاق</Button>
          <Button variant="outline" onClick={() => download("xlsx")} disabled={isGenerating !== null}>
            {isGenerating === "xlsx" ? (
              <Loader2 className="h-4 w-4 ml-2 animate-spin" />
            ) : (
              <FileSpreadsheet className="h-4 w-4 ml-2" />
            )}
            تصدير Excel
          </Button>
          <Button onClick={() => download("pdf")} disabled={isGenerating !== null}>
            {isGenerating === "pdf" ? (
              <Loader2 className="h-4 w-4 ml-2 animate-spin" />
            ) : (
              <FileDown className="h-4 w-4 ml-2" />
            )}
            تصدير PDF
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
