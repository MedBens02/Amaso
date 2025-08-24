import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus, FileText, Users, Heart, Download } from "lucide-react"

export function QuickActions() {
  const actions = [
    {
      title: "إضافة أرملة",
      description: "تسجيل أرملة جديدة في النظام",
      icon: Plus,
      color: "bg-blue-500 hover:bg-blue-600",
    },
    {
      title: "إضافة يتيم",
      description: "تسجيل يتيم جديد",
      icon: Heart,
      color: "bg-pink-500 hover:bg-pink-600",
    },
    {
      title: "إنشاء تقرير",
      description: "إنشاء تقرير جديد",
      icon: FileText,
      color: "bg-green-500 hover:bg-green-600",
    },
    {
      title: "إدارة الكفلاء",
      description: "عرض وإدارة الكفلاء",
      icon: Users,
      color: "bg-purple-500 hover:bg-purple-600",
    },
    {
      title: "تصدير البيانات",
      description: "تصدير البيانات إلى Excel",
      icon: Download,
      color: "bg-orange-500 hover:bg-orange-600",
    },
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle>الإجراءات السريعة</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {actions.map((action, index) => (
            <Button key={index} variant="outline" className="w-full justify-start h-auto p-4 bg-transparent">
              <div className={`p-2 rounded-lg ${action.color} mr-3`}>
                <action.icon className="h-4 w-4 text-white" />
              </div>
              <div className="text-right">
                <div className="font-medium">{action.title}</div>
                <div className="text-sm text-gray-600">{action.description}</div>
              </div>
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
