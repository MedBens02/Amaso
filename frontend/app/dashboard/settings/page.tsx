"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Settings, Building, Bell, Shield, Database } from "lucide-react"

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
          <Settings className="h-8 w-8" />
          الإعدادات
        </h1>
        <p className="text-gray-600 mt-2">إعدادات النظام والجمعية</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Organization Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building className="h-5 w-5" />
              معلومات الجمعية
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="org-name">اسم الجمعية</Label>
              <Input id="org-name" defaultValue="جمعية أماسو الخيرية" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="org-address">العنوان</Label>
              <Textarea id="org-address" defaultValue="غزة - فلسطين" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="org-phone">رقم الهاتف</Label>
              <Input id="org-phone" defaultValue="+970 8 123 4567" />
            </div>
            <Button>حفظ التغييرات</Button>
          </CardContent>
        </Card>

        {/* Notification Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              إعدادات الإشعارات
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="email-notifications">إشعارات البريد الإلكتروني</Label>
              <Switch id="email-notifications" defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="sms-notifications">إشعارات الرسائل النصية</Label>
              <Switch id="sms-notifications" />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="monthly-reports">التقارير الشهرية</Label>
              <Switch id="monthly-reports" defaultChecked />
            </div>
            <Button>حفظ الإعدادات</Button>
          </CardContent>
        </Card>

        {/* Security Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              الأمان والخصوصية
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="current-password">كلمة المرور الحالية</Label>
              <Input id="current-password" type="password" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-password">كلمة المرور الجديدة</Label>
              <Input id="new-password" type="password" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-password">تأكيد كلمة المرور</Label>
              <Input id="confirm-password" type="password" />
            </div>
            <Button>تغيير كلمة المرور</Button>
          </CardContent>
        </Card>

        {/* System Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              إعدادات النظام
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="auto-backup">النسخ الاحتياطي التلقائي</Label>
              <Switch id="auto-backup" defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="data-validation">التحقق من صحة البيانات</Label>
              <Switch id="data-validation" defaultChecked />
            </div>
            <div className="space-y-2">
              <Label htmlFor="backup-frequency">تكرار النسخ الاحتياطي</Label>
              <select className="w-full p-2 border rounded-md">
                <option>يومي</option>
                <option>أسبوعي</option>
                <option>شهري</option>
              </select>
            </div>
            <Button>حفظ الإعدادات</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
