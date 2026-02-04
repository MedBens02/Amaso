/**
 * Reports Components Index
 * Central export point for all report-related components
 */

// Filter components
export { ReportFilters, useReportFilters } from './report-filters'
export type { FilterOption, FilterOptionType, ReportFiltersProps } from './report-filters'

// Dialog components
export { ReportDialog, CompactReportExport, useReportDialog } from './report-dialog'
export type { ReportDialogProps, ExportFormat, StatisticItem } from './report-dialog'

// PDF Template components
export {
  PDFCardTemplate,
  HiddenPDFWrapper,
  InfoGrid,
  PDFTable,
  PDFBadge,
  SectionLayouts,
  Users,
  Home,
  Activity,
  Heart,
  GraduationCap,
  DollarSign,
  FileText,
  Phone,
  MapPin
} from './pdf-card-template'
export type {
  PDFCardTemplateProps,
  PDFCardSection,
  PDFCardHeader,
  PDFCardFooter,
  InfoItem
} from './pdf-card-template'
