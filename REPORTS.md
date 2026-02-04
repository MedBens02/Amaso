# Reports System Documentation

## Overview

The Amaso application includes a comprehensive reporting system that enables users to generate, filter, and export data across all entities. The system provides both **entity-level exports** (from individual entity pages) and **centralized analytical reports** (from the dedicated Reports page).

## Architecture

### Core Components

#### 1. Shared Infrastructure (`frontend/lib/`)

**export-utils.ts**
- `exportDataToCSV()` - UTF-8 BOM CSV generation with Arabic support
- `formatDateForExport()` - Arabic date formatting
- `formatCurrency()` - Moroccan Dirham (د.م) formatting
- Arabic translation mappings for payment methods, statuses, marital status

**pdf-generator.ts**
- `generatePDFFromHTML()` - Abstract PDF generation from HTML elements
- Multi-page splitting algorithm for long documents
- Watermark support and progress callbacks

**report-utils.ts**
- `buildFilterQuery()` - Convert filter objects to API parameters
- `fetchReportData()` - Generic data fetching with filters
- `calculateStatistics()` - Compute aggregated metrics

#### 2. Reusable UI Components (`frontend/components/reports/`)

**report-filters.tsx**
- `<ReportFilters />` - Accordion-based filter UI
- Supports 6 filter types: dateRange, select, toggle, numberRange, search, multiSelect
- `useReportFilters()` hook for state management

**report-dialog.tsx**
- `<ReportDialog />` - Modal wrapper for report generation
- Displays filters, live statistics preview, export buttons
- `useReportDialog()` hook for dialog state
- `<CompactReportExport />` - Inline export button variant

**pdf-card-template.tsx**
- `<PDFCardTemplate />` - Standardized template for entity PDF cards
- Includes: header, footer, sections structure
- Sub-components: `<InfoGrid />`, `<PDFTable />`, `<PDFBadge />`

## Entity-Level Reports

### Donors & Kafils

**Location:** `frontend/components/donors/`

**Components:**
- `<PrintDonorPDF />` - Individual donor card with financial summary
- `<PrintKafilPDF />` - Extended kafil card with sponsorship breakdown
- `<DonationHistoryPrint />` - Printable donation statement
- `<ExportDonors />` - CSV export and print toolbar

**Features:**
- Personal information and contact details
- Financial summary (total donations, count, average, last donation)
- Kafil status with monthly pledge and sponsorship details
- Recent donation history (last 10 transactions)
- Utilization metrics with color-coded indicators

**Integration:**
```tsx
// In donors/page.tsx
<ExportDonors donors={allDonors} filters={filters} searchTerm={searchTerm} />

// In ViewDonorDialog
<PrintDonorPDF donor={donor} />
<DonationHistoryPrint donor={donor} incomes={incomes} />

// In ViewKafilDialog
<PrintKafilPDF kafil={kafil} />
```

### Orphans

**Location:** `frontend/components/orphans/`

**Components:**
- `<PrintOrphanPDF />` - Individual orphan card
- `<ExportOrphans />` - CSV export and print toolbar

**Features:**
- Personal information (name, age, gender, birth date)
- Education and health section
- Mother/widow information with contact details
- Gender-based badge coloring
- Family-grouped print reports

**Integration:**
```tsx
// In orphans/page.tsx
<ExportOrphans orphanGroups={allOrphanGroups} filters={filters} searchTerm={searchTerm} />

// In ViewOrphanDialog
<PrintOrphanPDF orphan={orphan} />
```

### Widows

**Location:** `frontend/components/widows/`

**Components:**
- `<PrintWidowPDF />` - Comprehensive widow card (pre-existing)
- `<ExportWidows />` - CSV export and print toolbar

**Features:**
- Complete personal and social information
- Orphan count and family composition
- Sponsorship status and amount
- Disability information
- Housing and utility status
- Neighborhood-based grouping in reports

**Integration:**
```tsx
// In widows/page.tsx
<ExportWidows widows={allWidows} filters={filters} searchTerm={searchTerm} />

// In ViewWidowDialog
<PrintWidowPDF widow={widow} />
```

### Financial (Expenses & Incomes)

**Location:** `frontend/components/expenses/` and `frontend/components/incomes/`

**Components:**
- `<ExportExpenses />` - CSV export and print toolbar
- `<ExportIncomes />` - CSV export and print toolbar

**Features:**
- Comprehensive transaction data export
- Category breakdown with percentages
- Payment method analysis
- Status-based filtering (Approved/Draft/Rejected)
- Beneficiary tracking for expenses
- Donor vs Kafil source tracking for incomes

**Integration:**
```tsx
// In expenses/page.tsx and incomes/page.tsx
// Currently using built-in dropdown export menus
// Can optionally integrate ExportExpenses/ExportIncomes components
```

## Centralized Reports

**Location:** `frontend/components/reports/entity-reports/`

Access via: Dashboard → Reports page (`/dashboard/reports`)

### 1. Widows & Orphans Report

**Component:** `<WidowsReportDialog />`

**Filters:**
- Date range (admission date)
- Neighborhood
- Marital status
- Disability flag
- Education level
- Age range
- Sponsorship status

**Statistics:**
- Total widows and orphans
- Number of families
- Average orphans per family
- Sponsorship coverage percentage
- Disability percentage

**Exports:**
- **CSV**: Two files (widows_report.csv, orphans_report.csv)
- **Print**: Comprehensive HTML report with statistics and tables

### 2. Financial Report

**Component:** `<FinancialReportDialog />`

**Filters:**
- Date range
- Fiscal year
- Payment method
- Transaction status

**Statistics:**
- Total income and expenses
- Net balance (color-coded)
- Donor vs Kafil contribution split
- Cash/Cheque/Bank transfer percentages

**Exports:**
- **CSV**: Three files (incomes.csv, expenses.csv, summary.csv)
- **Print**: Financial statement with income/expense breakdown by category

### 3. Donors & Kafils Report

**Component:** `<DonorsReportDialog />`

**Filters:**
- Registration date range
- Is Kafil toggle
- Monthly pledge range
- Utilization percentage range

**Statistics:**
- Total donors and kafils
- Total donations and average
- Total monthly pledges
- Average kafil utilization

**Exports:**
- **CSV**: Two files (donors_report.csv, kafils_detailed.csv)
- **Print**: Top 10 donors ranking + utilization analysis with color-coded badges

### 4. Annual Performance Report

**Component:** `<AnnualPerformanceReport />`

**Filters:**
- Fiscal year selection
- Quarter selection (optional)

**Statistics:**
- Financial performance (income, expenses, balance)
- Total beneficiaries served
- Active donor count
- Average donation amount

**Exports:**
- **CSV**: Four files (annual_financial_summary.csv, beneficiaries_stats.csv, donor_stats.csv)
- **Print**: Executive summary with multi-section analysis

## Usage Examples

### Entity Page Export Toolbar

```tsx
import { useState, useEffect } from 'react'
import { ExportDonors } from '@/components/donors/export-donors'
import api from '@/lib/api'

export default function DonorsPage() {
  const [allDonors, setAllDonors] = useState([])
  const [filters, setFilters] = useState({})
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    const fetchAllDonors = async () => {
      const response = await api.getDonors({
        per_page: 1000,
        search: searchTerm || undefined,
        ...filters
      })
      setAllDonors(response.data || [])
    }
    fetchAllDonors()
  }, [searchTerm, filters])

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>قائمة المتبرعين</CardTitle>
          <ExportDonors
            donors={allDonors}
            filters={filters}
            searchTerm={searchTerm}
          />
        </div>
      </CardHeader>
      <CardContent>
        {/* Table component */}
      </CardContent>
    </Card>
  )
}
```

### View Dialog Print Button

```tsx
import { PrintDonorPDF } from '@/components/donors/print-donor-pdf'

export function ViewDonorDialog({ donor, open, onOpenChange }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        {/* Dialog content */}
        <DialogFooter>
          <PrintDonorPDF donor={donor} />
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
```

### Centralized Report Integration

```tsx
import { useState } from 'react'
import { WidowsReportDialog } from '@/components/reports/entity-reports'

export default function ReportsPage() {
  const [openDialog, setOpenDialog] = useState<string | null>(null)

  return (
    <div>
      {/* Report cards */}
      <Card onClick={() => setOpenDialog('widows')}>
        <CardHeader>
          <CardTitle>تقرير الأرامل والأيتام</CardTitle>
        </CardHeader>
        <CardContent>
          <p>إحصائيات شاملة عن الأرامل والأيتام المسجلين</p>
        </CardContent>
      </Card>

      {/* Report dialog */}
      <WidowsReportDialog
        open={openDialog === 'widows'}
        onOpenChange={(open) => setOpenDialog(open ? 'widows' : null)}
      />
    </div>
  )
}
```

## CSV Export Format

All CSV exports include:
- **UTF-8 BOM** prefix for Excel Arabic support
- **Metadata headers** (export date, filters applied, record count)
- **Arabic column headers** with proper translations
- **Escaped special characters** for CSV safety
- **Formatted dates** (dd/MM/yyyy)
- **Formatted currency** with Moroccan Dirham symbol

Example CSV structure:
```csv
تقرير المتبرعين - تم التصدير في: 04/02/2026 14:30:00
كلمة البحث: محمد
الفلاتر: كافل: نعم

رقم المتبرع,الاسم الكامل,رقم الهاتف,البريد الإلكتروني,كافل,إجمالي التبرعات (د.م)
1,"محمد العلوي","0612345678","mohamed@example.com","نعم","5000.00"
2,"فاطمة الزهراء","0623456789","fatima@example.com","لا","2500.00"
```

## Print Report Format

All print reports include:
- **RTL (Right-to-Left)** layout for Arabic
- **Professional header** with organization name
- **Summary statistics** cards at the top
- **Applied filters** section (if any)
- **Detailed data tables** with proper formatting
- **Footer** with generation timestamp
- **Auto-print** on window load
- **Responsive design** for different paper sizes

## Best Practices

### Performance

1. **Limit data fetching**: Use `per_page: 1000` to avoid memory issues
2. **Client-side filtering**: Apply search terms after fetching for better UX
3. **Lazy loading**: Only fetch data when export dialog/toolbar is rendered
4. **Progress indicators**: Always show loading states during export operations

### User Experience

1. **Toast notifications**: Provide success/error feedback for all operations
2. **Disabled states**: Prevent duplicate requests during processing
3. **Descriptive filenames**: Include entity type and timestamp in filenames
4. **Clear labels**: Use Arabic labels consistently across all exports

### Error Handling

```tsx
try {
  await exportToCSV()
  toast({
    title: "تم التصدير بنجاح",
    description: `تم تصدير ${data.length} سجل`
  })
} catch (error) {
  console.error('Export error:', error)
  toast({
    title: "خطأ في التصدير",
    description: "حدث خطأ أثناء تصدير البيانات",
    variant: "destructive"
  })
}
```

## Future Enhancements

### Batch Export Capabilities (Deferred)

Potential implementation for selecting and exporting multiple entities:

1. **Table Selection UI**
   - Add checkboxes to entity tables
   - Show bulk action toolbar when items selected

2. **Batch Processing**
   - Generate multiple PDFs sequentially
   - Show progress bar (e.g., "Processing 5/10...")
   - Handle memory management for large batches

3. **ZIP Packaging**
   - Bundle multiple PDFs into a ZIP file
   - Include index/manifest file
   - Generate descriptive ZIP filename

4. **User Experience**
   - Limit batch size (e.g., max 25 items)
   - Provide cancel option during processing
   - Clear selection after successful export

### PDF Export for Centralized Reports

Currently, centralized reports have PDF placeholders. Future implementation would include:

1. **Multi-page PDF generation** using jspdf + html2canvas
2. **Executive summary pages** with charts and visualizations
3. **Detailed appendix sections** with full data tables
4. **Professional cover page** with organization branding
5. **Table of contents** for navigation

## Troubleshooting

### Issue: Arabic text appears garbled in CSV

**Solution**: Ensure UTF-8 BOM is included at the start of the file:
```typescript
const BOM = '\uFEFF'
const csvContent = BOM + headerRow + '\n' + dataRows.join('\n')
```

### Issue: PDF generation fails for large datasets

**Solution**: Implement pagination or limit the number of records:
```typescript
const maxRecords = 50
const limitedData = data.slice(0, maxRecords)
```

### Issue: Print window doesn't open

**Solution**: Check for popup blockers and add error handling:
```typescript
const printWindow = window.open('', '_blank')
if (!printWindow) {
  toast({
    title: "خطأ",
    description: "تعذر فتح نافذة الطباعة. تحقق من إعدادات المتصفح.",
    variant: "destructive"
  })
  return
}
```

## File Structure

```
frontend/
├── components/
│   ├── reports/
│   │   ├── entity-reports/
│   │   │   ├── widows-report-dialog.tsx
│   │   │   ├── financial-report-dialog.tsx
│   │   │   ├── donors-report-dialog.tsx
│   │   │   ├── annual-performance-report.tsx
│   │   │   └── index.ts
│   │   ├── report-filters.tsx
│   │   ├── report-dialog.tsx
│   │   └── pdf-card-template.tsx
│   ├── donors/
│   │   ├── print-donor-pdf.tsx
│   │   ├── print-kafil-pdf.tsx
│   │   ├── donation-history-print.tsx
│   │   └── export-donors.tsx
│   ├── orphans/
│   │   ├── print-orphan-pdf.tsx
│   │   └── export-orphans.tsx
│   ├── widows/
│   │   ├── print-widow-pdf.tsx
│   │   └── export-widows.tsx
│   ├── expenses/
│   │   └── export-expenses.tsx
│   └── incomes/
│       └── export-incomes.tsx
├── lib/
│   ├── export-utils.ts
│   ├── pdf-generator.ts
│   └── report-utils.ts
└── app/
    └── dashboard/
        └── reports/
            └── page.tsx
```

## Maintenance

### Adding a New Report

1. **Create report component** in appropriate directory
2. **Use shared utilities** from `lib/` for consistency
3. **Implement filters** using `<ReportFilters />` component
4. **Calculate statistics** using `report-utils.ts` helpers
5. **Handle all export formats** (CSV, Print, PDF placeholder)
6. **Add proper error handling** and loading states
7. **Update integration points** (page toolbars, view dialogs)
8. **Test with real data** including edge cases

### Updating Export Format

1. **Modify column mappings** in export component
2. **Update Arabic translations** in `export-utils.ts`
3. **Test CSV in Excel** to ensure proper rendering
4. **Update print template** HTML/CSS if needed
5. **Verify statistics calculations** remain accurate
6. **Update documentation** in this file

## Support

For issues or questions regarding the reporting system:
1. Check this documentation first
2. Review implementation in existing components
3. Test with sample data in development environment
4. Check browser console for error messages
5. Verify API endpoints are returning expected data format

---

**Last Updated:** 2026-02-04
**System Version:** Phase 4 Complete (78% overall)
**Status:** Functionally Complete - Ready for Production
