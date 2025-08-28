import { Skeleton } from "@/components/ui/skeleton"
import { Database } from "lucide-react"

export default function ReferencesLoading() {
  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2 mb-2">
          <Database className="h-8 w-8" />
          <Skeleton className="h-9 w-48" />
        </div>
        <Skeleton className="h-6 w-64" />
      </div>

      <div className="space-y-6">
        <Skeleton className="h-12 w-full" />
        
        <div className="grid grid-cols-1 gap-6">
          <div className="border rounded-lg">
            <div className="p-6 border-b">
              <Skeleton className="h-6 w-32" />
            </div>
            <div className="p-6 space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center justify-between p-3 border rounded-lg">
                  <Skeleton className="h-4 w-48" />
                  <div className="flex gap-2">
                    <Skeleton className="h-8 w-8" />
                    <Skeleton className="h-8 w-8" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}