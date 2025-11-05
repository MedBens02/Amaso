"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Heart, Users, GraduationCap, HandHeart } from "lucide-react"

export default function HomePage() {
  const router = useRouter()

  useEffect(() => {
    const user = localStorage.getItem("user")
    if (user) {
      router.push("/dashboard")
    }
  }, [router])

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 transition-colors">
      {/* Header */}
      <header className="bg-background/80 backdrop-blur-sm border-b border-border sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center">
                <Image src="/favicon.ico" alt="AMASO Logo" width={40} height={40} className="rounded-lg" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground">جمعية أماسو الخيرية</h1>
                <p className="text-sm text-muted-foreground">نظام إدارة شامل</p>
              </div>
            </div>
            <Button onClick={() => router.push("/login")} className="bg-primary hover:bg-primary/90">
              تسجيل الدخول
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-6">نظام إدارة شامل للجمعيات الخيرية</h2>
            <p className="text-xl text-muted-foreground mb-8 leading-relaxed">
              منصة متكاملة لإدارة الأرامل والأيتام والخدمات التعليمية والمالية بكفاءة وشفافية عالية
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                size="lg"
                onClick={() => router.push("/login")}
                className="bg-primary hover:bg-primary/90 text-lg px-8 py-3"
              >
                ابدأ الآن
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="text-lg px-8 py-3 border-border hover:bg-accent bg-transparent"
              >
                تعرف على المزيد
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h3 className="text-3xl font-bold text-foreground mb-4">خدماتنا</h3>
            <p className="text-muted-foreground text-lg">نوفر حلولاً شاملة لإدارة جميع جوانب العمل الخيري</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="text-center hover:shadow-lg transition-all duration-300 border-border bg-card">
              <CardHeader>
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Users className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
                <CardTitle className="text-foreground">إدارة الأرامل</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-muted-foreground">
                  نظام شامل لتسجيل ومتابعة أحوال الأرامل وتقديم الدعم المناسب
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="text-center hover:shadow-lg transition-all duration-300 border-border bg-card">
              <CardHeader>
                <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Heart className="w-6 h-6 text-green-600 dark:text-green-400" />
                </div>
                <CardTitle className="text-foreground">رعاية الأيتام</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-muted-foreground">
                  متابعة شاملة للأيتام وتوفير الرعاية الصحية والتعليمية
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="text-center hover:shadow-lg transition-all duration-300 border-border bg-card">
              <CardHeader>
                <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <GraduationCap className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                </div>
                <CardTitle className="text-foreground">الخدمات التعليمية</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-muted-foreground">
                  إدارة المؤسسات التعليمية والطلاب والنتائج الأكاديمية
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="text-center hover:shadow-lg transition-all duration-300 border-border bg-card">
              <CardHeader>
                <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/30 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <HandHeart className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                </div>
                <CardTitle className="text-foreground">الإدارة المالية</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-muted-foreground">
                  نظام محاسبي متكامل لإدارة التبرعات والمصروفات والتقارير
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-background border-t border-border py-8">
        <div className="container mx-auto px-4 text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center">
              <Image src="/favicon.ico" alt="AMASO Logo" width={32} height={32} className="rounded-lg" />
            </div>
            <span className="text-lg font-semibold text-foreground">جمعية أماسو الخيرية</span>
          </div>
          <p className="text-muted-foreground">© 2025 جمعية أماسو الخيرية. جميع الحقوق محفوظة.</p>
        </div>
      </footer>
    </div>
  )
}
