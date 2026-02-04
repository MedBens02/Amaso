"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { FileDown, FileText, Printer, Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

/**
 * Export format options
 */
export type ExportFormat = 'pdf' | 'csv' | 'print'

/**
 * Statistic item for preview section
 */
export interface StatisticItem {
  label: string
  value: string | number
  format?: 'number' | 'currency' | 'percentage' | 'text'
  color?: string
}

/**
 * Props for ReportDialog component
 */
export interface ReportDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description?: string
  children?: React.ReactNode // Filter form content
  statistics?: StatisticItem[]
  onGenerate: (format: ExportFormat) => Promise<void>
  loading?: boolean
  showPdfExport?: boolean
  showCsvExport?: boolean
  showPrintExport?: boolean
}

/**
 * Formats a statistic value based on its format type
 */
function formatStatValue(value: string | number, format?: string): string {
  if (typeof value === 'string') return value

  switch (format) {
    case 'number':
      return value.toLocaleString('ar-MA')
    case 'currency':
      return `${value.toFixed(2)} د.م`
    case 'percentage':
      return `${value.toFixed(1)}%`
    default:
      return String(value)
  }
}

/**
 * Reusable Report Dialog Component
 * Provides a consistent UI for report generation with filters and export options
 */
export function ReportDialog({
  open,
  onOpenChange,
  title,
  description,
  children,
  statistics = [],
  onGenerate,
  loading = false,
  showPdfExport = true,
  showCsvExport = true,
  showPrintExport = true
}: ReportDialogProps) {
  const { toast } = useToast()
  const [generatingFormat, setGeneratingFormat] = useState<ExportFormat | null>(null)

  const handleGenerate = async (format: ExportFormat) => {
    setGeneratingFormat(format)
    try {
      await onGenerate(format)
      toast({
        title: "تم بنجاح",
        description: `تم إنشاء التقرير بنجاح`,
      })
    } catch (error) {
      console.error('Report generation error:', error)
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء إنشاء التقرير",
        variant: "destructive",
      })
    } finally {
      setGeneratingFormat(null)
    }
  }

  const isGenerating = generatingFormat !== null || loading

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">{title}</DialogTitle>
          {description && (
            <DialogDescription>{description}</DialogDescription>
          )}
        </DialogHeader>

        <div className="space-y-6">
          {/* Filter Section */}
          {children && (
            <div>
              {children}
            </div>
          )}

          {/* Statistics Preview Section */}
          {statistics.length > 0 && (
            <>
              <Separator />
              <div>
                <h3 className="text-sm font-semibold mb-3">إحصائيات سريعة</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {statistics.map((stat, index) => (
                    <Card key={index} className={stat.color}>
                      <CardContent className="p-3">
                        <p className="text-xs text-muted-foreground mb-1">
                          {stat.label}
                        </p>
                        <p className="text-lg font-bold">
                          {formatStatValue(stat.value, stat.format)}
                        </p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Export Options Section */}
          <Separator />
          <div>
            <h3 className="text-sm font-semibold mb-3">تصدير التقرير</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {showPdfExport && (
                <Button
                  variant="outline"
                  className="flex flex-col items-center justify-center h-24 gap-2"
                  onClick={() => handleGenerate('pdf')}
                  disabled={isGenerating}
                >
                  {generatingFormat === 'pdf' ? (
                    <Loader2 className="h-6 w-6 animate-spin" />
                  ) : (
                    <FileDown className="h-6 w-6" />
                  )}
                  <span className="text-sm">تصدير PDF</span>
                </Button>
              )}

              {showCsvExport && (
                <Button
                  variant="outline"
                  className="flex flex-col items-center justify-center h-24 gap-2"
                  onClick={() => handleGenerate('csv')}
                  disabled={isGenerating}
                >
                  {generatingFormat === 'csv' ? (
                    <Loader2 className="h-6 w-6 animate-spin" />
                  ) : (
                    <FileText className="h-6 w-6" />
                  )}
                  <span className="text-sm">تصدير CSV</span>
                </Button>
              )}

              {showPrintExport && (
                <Button
                  variant="outline"
                  className="flex flex-col items-center justify-center h-24 gap-2"
                  onClick={() => handleGenerate('print')}
                  disabled={isGenerating}
                >
                  {generatingFormat === 'print' ? (
                    <Loader2 className="h-6 w-6 animate-spin" />
                  ) : (
                    <Printer className="h-6 w-6" />
                  )}
                  <span className="text-sm">طباعة</span>
                </Button>
              )}
            </div>
          </div>

          {/* Loading message */}
          {isGenerating && (
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>جاري إنشاء التقرير...</span>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

/**
 * Hook to manage report dialog state
 */
export function useReportDialog() {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  const openDialog = () => setOpen(true)
  const closeDialog = () => setOpen(false)
  const toggleDialog = () => setOpen(prev => !prev)

  return {
    open,
    loading,
    setLoading,
    openDialog,
    closeDialog,
    toggleDialog,
    setOpen
  }
}

/**
 * Compact version of ReportDialog for inline use
 */
export function CompactReportExport({
  onGenerate,
  loading = false,
  showPdfExport = true,
  showCsvExport = true,
  showPrintExport = true,
  className
}: {
  onGenerate: (format: ExportFormat) => Promise<void>
  loading?: boolean
  showPdfExport?: boolean
  showCsvExport?: boolean
  showPrintExport?: boolean
  className?: string
}) {
  const { toast } = useToast()
  const [generatingFormat, setGeneratingFormat] = useState<ExportFormat | null>(null)

  const handleGenerate = async (format: ExportFormat) => {
    setGeneratingFormat(format)
    try {
      await onGenerate(format)
      toast({
        title: "تم بنجاح",
        description: "تم إنشاء التقرير بنجاح",
      })
    } catch (error) {
      console.error('Report generation error:', error)
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء إنشاء التقرير",
        variant: "destructive",
      })
    } finally {
      setGeneratingFormat(null)
    }
  }

  const isGenerating = generatingFormat !== null || loading

  return (
    <div className={className}>
      <div className="flex gap-2">
        {showCsvExport && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleGenerate('csv')}
            disabled={isGenerating}
          >
            {generatingFormat === 'csv' ? (
              <Loader2 className="ml-2 h-4 w-4 animate-spin" />
            ) : (
              <FileText className="ml-2 h-4 w-4" />
            )}
            تصدير CSV
          </Button>
        )}

        {showPrintExport && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleGenerate('print')}
            disabled={isGenerating}
          >
            {generatingFormat === 'print' ? (
              <Loader2 className="ml-2 h-4 w-4 animate-spin" />
            ) : (
              <Printer className="ml-2 h-4 w-4" />
            )}
            طباعة
          </Button>
        )}

        {showPdfExport && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleGenerate('pdf')}
            disabled={isGenerating}
          >
            {generatingFormat === 'pdf' ? (
              <Loader2 className="ml-2 h-4 w-4 animate-spin" />
            ) : (
              <FileDown className="ml-2 h-4 w-4" />
            )}
            PDF
          </Button>
        )}
      </div>
    </div>
  )
}
