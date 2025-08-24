"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { toast } from "sonner"
import { User, Mail, Phone, MapPin, Calendar, Edit, Save, X, Camera, Shield, Key } from "lucide-react"

interface UserProfile {
  id: string
  name: string
  email: string
  role: string
  phone?: string
  address?: string
  bio?: string
  joinDate: string
  avatar?: string
}

export default function ProfilePage() {
  const [user, setUser] = useState<UserProfile | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState<UserProfile | null>(null)

  useEffect(() => {
    // Load user data from localStorage
    const userData = localStorage.getItem("user")
    if (userData) {
      const parsedUser = JSON.parse(userData)
      const fullUser: UserProfile = {
        ...parsedUser,
        phone: parsedUser.phone || "",
        address: parsedUser.address || "",
        bio: parsedUser.bio || "",
        joinDate: parsedUser.joinDate || "2024-01-01",
        avatar: parsedUser.avatar || "",
      }
      setUser(fullUser)
      setFormData(fullUser)
    }
  }, [])

  const handleSave = () => {
    if (formData) {
      setUser(formData)
      localStorage.setItem("user", JSON.stringify(formData))
      setIsEditing(false)
      toast.success("تم حفظ التغييرات بنجاح")
    }
  }

  const handleCancel = () => {
    setFormData(user)
    setIsEditing(false)
    toast.info("تم إلغاء التغييرات")
  }

  if (!user) {
    return <div>جاري التحميل...</div>
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">الملف الشخصي</h1>
          <p className="text-muted-foreground">إدارة معلوماتك الشخصية وإعدادات الحساب</p>
        </div>
        {!isEditing ? (
          <Button onClick={() => setIsEditing(true)} className="gap-2">
            <Edit className="h-4 w-4" />
            تعديل الملف
          </Button>
        ) : (
          <div className="flex gap-2">
            <Button onClick={handleSave} className="gap-2">
              <Save className="h-4 w-4" />
              حفظ
            </Button>
            <Button variant="outline" onClick={handleCancel} className="gap-2 bg-transparent">
              <X className="h-4 w-4" />
              إلغاء
            </Button>
          </div>
        )}
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Profile Overview */}
        <Card className="md:col-span-1">
          <CardHeader className="text-center">
            <div className="relative mx-auto">
              <Avatar className="h-24 w-24 mx-auto">
                <AvatarImage src={user.avatar || "/placeholder-user.jpg"} alt={user.name} />
                <AvatarFallback className="bg-primary text-primary-foreground text-xl">
                  {user.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")}
                </AvatarFallback>
              </Avatar>
              {isEditing && (
                <Button size="sm" variant="secondary" className="absolute -bottom-2 -right-2 h-8 w-8 rounded-full p-0">
                  <Camera className="h-4 w-4" />
                </Button>
              )}
            </div>
            <CardTitle className="text-xl">{user.name}</CardTitle>
            <Badge variant="secondary" className="w-fit mx-auto">
              {user.role}
            </Badge>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3 text-sm">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span>انضم في {new Date(user.joinDate).toLocaleDateString("ar-SA", { numberingSystem: "latn" })}</span>
            </div>
            <Separator />
            <div className="space-y-2">
              <h4 className="font-medium">إعدادات الأمان</h4>
              <Button variant="outline" size="sm" className="w-full justify-start gap-2 bg-transparent">
                <Key className="h-4 w-4" />
                تغيير كلمة المرور
              </Button>
              <Button variant="outline" size="sm" className="w-full justify-start gap-2 bg-transparent">
                <Shield className="h-4 w-4" />
                المصادقة الثنائية
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Profile Details */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>المعلومات الشخصية</CardTitle>
            <CardDescription>قم بتحديث معلوماتك الشخصية وتفاصيل الاتصال</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">الاسم الكامل</Label>
                {isEditing ? (
                  <Input
                    id="name"
                    value={formData?.name || ""}
                    onChange={(e) => setFormData((prev) => (prev ? { ...prev, name: e.target.value } : null))}
                  />
                ) : (
                  <div className="flex items-center gap-2 p-2 bg-muted rounded-md">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span>{user.name}</span>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">البريد الإلكتروني</Label>
                {isEditing ? (
                  <Input
                    id="email"
                    type="email"
                    value={formData?.email || ""}
                    onChange={(e) => setFormData((prev) => (prev ? { ...prev, email: e.target.value } : null))}
                  />
                ) : (
                  <div className="flex items-center gap-2 p-2 bg-muted rounded-md">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span>{user.email}</span>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">رقم الهاتف</Label>
                {isEditing ? (
                  <Input
                    id="phone"
                    value={formData?.phone || ""}
                    onChange={(e) => setFormData((prev) => (prev ? { ...prev, phone: e.target.value } : null))}
                    placeholder="أدخل رقم الهاتف"
                  />
                ) : (
                  <div className="flex items-center gap-2 p-2 bg-muted rounded-md">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span>{user.phone || "غير محدد"}</span>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">العنوان</Label>
                {isEditing ? (
                  <Input
                    id="address"
                    value={formData?.address || ""}
                    onChange={(e) => setFormData((prev) => (prev ? { ...prev, address: e.target.value } : null))}
                    placeholder="أدخل العنوان"
                  />
                ) : (
                  <div className="flex items-center gap-2 p-2 bg-muted rounded-md">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span>{user.address || "غير محدد"}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="bio">نبذة شخصية</Label>
              {isEditing ? (
                <Textarea
                  id="bio"
                  value={formData?.bio || ""}
                  onChange={(e) => setFormData((prev) => (prev ? { ...prev, bio: e.target.value } : null))}
                  placeholder="اكتب نبذة مختصرة عنك..."
                  rows={4}
                />
              ) : (
                <div className="p-3 bg-muted rounded-md min-h-[100px]">
                  <p className="text-sm">{user.bio || "لم يتم إضافة نبذة شخصية بعد"}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
