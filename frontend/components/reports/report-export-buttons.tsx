"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { FileDown, Loader2, Sheet } from "lucide-react"
import api from "@/lib/api"

/**
 * The two ways a list leaves the app: a PDF to read or hand over, and a
 * workbook to work in.
 *
 * Both are generated server-side from the same report the reports page uses,
 * which is what replaced the per-screen exporters. Each of those built its own
 * CSV column mapping and its own print stylesheet from whatever rows the table
 * happened to be holding, so the same list came out differently depending on
 * which screen you left from, and the printable version could not be saved.
 */
export function ReportExportButtons({
  endpoint,
  params,
  label,
  disabled,
}: {
  /** Report path without its extension, e.g. "/reports/widows". */
  endpoint: string
  params?: Record<string, any>
  /** Named in the confirmation toast, e.g. "قائمة الأرامل". */
  label: string
  disabled?: boolean
}) {
  const { toast } = useToast()
  const [busy, setBusy] = useState<"pdf" | "xlsx" | null>(null)

  const run = async (format: "pdf" | "xlsx") => {
    setBusy(format)
    try {
      const download = format === "pdf" ? api.downloadPdf : api.downloadExcel
      await download.call(api, `${endpoint}.${format}`, params)
      toast({ title: `تم تحميل ${label}` })
    } catch (error: any) {
      toast({
        title: "تعذر إنشاء الملف",
        description: error?.message || "حدث خطأ أثناء التصدير",
        variant: "destructive",
      })
    } finally {
      setBusy(null)
    }
  }

  return (
    <div className="flex gap-2">
      <Button variant="outline" size="sm" onClick={() => run("pdf")} disabled={disabled || busy !== null}>
        {busy === "pdf" ? <Loader2 className="ml-2 h-4 w-4 animate-spin" /> : <FileDown className="ml-2 h-4 w-4" />}
        تصدير PDF
      </Button>
      <Button variant="outline" size="sm" onClick={() => run("xlsx")} disabled={disabled || busy !== null}>
        {busy === "xlsx" ? <Loader2 className="ml-2 h-4 w-4 animate-spin" /> : <Sheet className="ml-2 h-4 w-4" />}
        تصدير Excel
      </Button>
    </div>
  )
}
