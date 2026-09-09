"use client"

import { useState } from "react"
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { FileDown, Loader2, Search } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
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
  const [isGenerating, setIsGenerating] = useState(false)

  const params = () => (spec.usesPeriod === false ? {} : { from, to })

  const load = async () => {
    setLoading(true)
    try {
      const res = await api.request<any>(
        `/reports/${spec.endpoint}${spec.usesPeriod === false ? "" : `?from=${from}&to=${to}`}`,
      )
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

  const downloadPdf = async () => {
    setIsGenerating(true)
    try {
      await api.downloadPdf(`/reports/${spec.endpoint}.pdf`, params())
      toast({ title: "تم تحميل التقرير" })
    } catch (error: any) {
      toast({
        title: "خطأ في إنشاء الـ PDF",
        description: error?.message || "حدث خطأ أثناء إنشاء الملف",
        variant: "destructive",
      })
    } finally {
      setIsGenerating(false)
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
              <Label className="text-xs">من تاريخ</Label>
              <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">إلى تاريخ</Label>
              <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
            </div>
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
                    <p className="text-xs text-gray-500">{stat.label}</p>
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
                      <TableCell colSpan={spec.columns.length} className="text-center text-gray-500 py-6">
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

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>إغلاق</Button>
          <Button onClick={downloadPdf} disabled={isGenerating}>
            {isGenerating ? <Loader2 className="h-4 w-4 ml-2 animate-spin" /> : <FileDown className="h-4 w-4 ml-2" />}
            تصدير PDF
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
