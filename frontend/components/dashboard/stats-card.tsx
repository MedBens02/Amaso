import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"

interface StatsCardProps {
  title: string
  value: string
  change: string
  changeType: "increase" | "decrease" | "neutral"
  icon: LucideIcon
  color: "blue" | "pink" | "green" | "purple" | "orange" | "indigo"
}

const colorClasses = {
  blue: "bg-blue-500 text-blue-50",
  pink: "bg-pink-500 text-pink-50",
  green: "bg-green-500 text-green-50",
  purple: "bg-purple-500 text-purple-50",
  orange: "bg-orange-500 text-orange-50",
  indigo: "bg-indigo-500 text-indigo-50",
}

export function StatsCard({ title, value, change, changeType, icon: Icon, color }: StatsCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-gray-600">{title}</CardTitle>
        <div className={cn("p-2 rounded-lg", colorClasses[color])}>
          <Icon className="h-4 w-4" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-gray-900">{value}</div>
        {change && (
          <p className={cn(
            "text-xs mt-1",
            changeType === "increase" ? "text-green-600" : 
            changeType === "decrease" ? "text-red-600" : 
            "text-gray-600"
          )}>
            {change} من الشهر الماضي
          </p>
        )}
      </CardContent>
    </Card>
  )
}
