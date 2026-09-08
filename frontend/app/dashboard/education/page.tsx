"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { School, CalendarDays, GraduationCap } from "lucide-react"
import { SchoolsTab } from "@/components/education/schools-tab"
import { AcademicYearsTab } from "@/components/education/academic-years-tab"
import { EnrollmentsTab } from "@/components/education/enrollments-tab"

export default function EducationPage() {
  // Bumped when academic years change (creation/rollover) so the
  // enrollments tab reloads its year list and data.
  const [refreshKey, setRefreshKey] = useState(0)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">التتبع الدراسي</h1>
        <p className="text-gray-600 mt-2">
          تتبع مسار الأيتام الدراسي سنة بسنة، من التمدرس الأول إلى التخرج من الجامعة
        </p>
      </div>

      <Tabs defaultValue="enrollments" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="enrollments" className="flex items-center gap-2">
            <GraduationCap className="h-4 w-4" />
            التسجيلات
          </TabsTrigger>
          <TabsTrigger value="schools" className="flex items-center gap-2">
            <School className="h-4 w-4" />
            المؤسسات
          </TabsTrigger>
          <TabsTrigger value="years" className="flex items-center gap-2">
            <CalendarDays className="h-4 w-4" />
            السنوات الدراسية
          </TabsTrigger>
        </TabsList>

        <TabsContent value="enrollments">
          <EnrollmentsTab refreshKey={refreshKey} />
        </TabsContent>

        <TabsContent value="schools">
          <SchoolsTab />
        </TabsContent>

        <TabsContent value="years">
          <AcademicYearsTab onChanged={() => setRefreshKey((k) => k + 1)} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
