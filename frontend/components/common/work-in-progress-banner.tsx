import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Construction } from "lucide-react"

/**
 * Banner shown on pages that are UI mockups only: no backend exists yet
 * and the data displayed is sample data.
 */
export function WorkInProgressBanner() {
  return (
    <Alert className="border-amber-400 bg-amber-50 text-amber-900 dark:border-amber-600 dark:bg-amber-950 dark:text-amber-200 [&>svg]:text-amber-600 dark:[&>svg]:text-amber-400">
      <Construction className="h-5 w-5" />
      <AlertTitle className="font-bold">قيد التطوير</AlertTitle>
      <AlertDescription>
        هذه الصفحة قيد التطوير ولم تُربط بالنظام بعد — البيانات المعروضة تجريبية ولا يتم حفظ أي تغييرات.
      </AlertDescription>
    </Alert>
  )
}
