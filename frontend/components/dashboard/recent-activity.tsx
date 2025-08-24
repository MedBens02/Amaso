import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"

const activities = [
  {
    id: 1,
    type: "widow_added",
    title: "تم إضافة أرملة جديدة",
    description: "فاطمة أحمد - حي الزهراء",
    time: "منذ ساعتين",
    status: "جديد",
  },
  {
    id: 2,
    type: "aid_distributed",
    title: "توزيع مساعدة شهرية",
    description: "تم توزيع ₪ 500 لعائلة محمد علي",
    time: "منذ 4 ساعات",
    status: "مكتمل",
  },
  {
    id: 3,
    type: "orphan_enrolled",
    title: "تسجيل يتيم في المدرسة",
    description: "أحمد محمود - الصف الثالث الابتدائي",
    time: "منذ يوم",
    status: "معلق",
  },
  {
    id: 4,
    type: "sponsor_assigned",
    title: "تعيين كفيل جديد",
    description: "محمد السيد كفيل لعائلة أبو أحمد",
    time: "منذ يومين",
    status: "مكتمل",
  },
]

export function RecentActivity() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>النشاطات الأخيرة</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activities.map((activity) => (
            <div key={activity.id} className="flex items-start space-x-4 space-x-reverse">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="text-xs">
                  {activity.type === "widow_added"
                    ? "أ"
                    : activity.type === "aid_distributed"
                      ? "م"
                      : activity.type === "orphan_enrolled"
                        ? "ي"
                        : "ك"}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 space-y-1">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">{activity.title}</p>
                  <Badge
                    variant={
                      activity.status === "جديد" ? "default" : activity.status === "مكتمل" ? "secondary" : "outline"
                    }
                  >
                    {activity.status}
                  </Badge>
                </div>
                <p className="text-sm text-gray-600">{activity.description}</p>
                <p className="text-xs text-gray-500">{activity.time}</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
