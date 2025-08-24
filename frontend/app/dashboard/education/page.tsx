"use client"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { School, Users, BookOpen, Bus } from "lucide-react"
import { InstitutionsTab } from "@/components/education/institutions-tab"
import { StudentsTab } from "@/components/education/students-tab"
import { ResultsTab } from "@/components/education/results-tab"
import { TransportTab } from "@/components/education/transport-tab"

export default function EducationPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">النظام التعليمي</h1>
        <p className="text-gray-600 mt-2">إدارة المؤسسات التعليمية والطلاب والنتائج</p>
      </div>

      <Tabs defaultValue="institutions" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="institutions" className="flex items-center gap-2">
            <School className="h-4 w-4" />
            المؤسسات
          </TabsTrigger>
          <TabsTrigger value="students" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            الطلاب
          </TabsTrigger>
          <TabsTrigger value="results" className="flex items-center gap-2">
            <BookOpen className="h-4 w-4" />
            النتائج
          </TabsTrigger>
          <TabsTrigger value="transport" className="flex items-center gap-2">
            <Bus className="h-4 w-4" />
            النقل المدرسي
          </TabsTrigger>
        </TabsList>

        <TabsContent value="institutions">
          <InstitutionsTab />
        </TabsContent>

        <TabsContent value="students">
          <StudentsTab />
        </TabsContent>

        <TabsContent value="results">
          <ResultsTab />
        </TabsContent>

        <TabsContent value="transport">
          <TransportTab />
        </TabsContent>
      </Tabs>
    </div>
  )
}
