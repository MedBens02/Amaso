"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import {
  Users,
  UserPlus,
  Search,
  MoreHorizontal,
  Pencil,
  Key,
  Ban,
  CheckCircle2,
  Trash2,
  Loader2,
  ShieldAlert,
} from "lucide-react"
import { getRoleLabel, ROLE_LABELS, getCurrentUser } from "@/lib/roles"
import { UserFormDialog } from "@/components/account/user-form-dialog"
import { ResetPasswordDialog } from "@/components/account/reset-password-dialog"
import type { ManagedUser } from "@/components/account/types"
import api from "@/lib/api"

const ALL = "all"

function formatDate(value: string | null): string {
  if (!value) return "—"
  const date = new Date(value)
  return Number.isNaN(date.getTime())
    ? "—"
    : date.toLocaleDateString("ar-MA", {
        year: "numeric",
        month: "short",
        day: "numeric",
        numberingSystem: "latn",
      })
}

/**
 * Account management, admins only.
 *
 * The gate here is presentation - the API returns 403 for anyone else
 * regardless - but showing a wall of actions that all fail is worse than
 * saying plainly that the page is not for you.
 */
export default function UsersPage() {
  const { toast } = useToast()
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null)
  const [currentUserId, setCurrentUserId] = useState<number | null>(null)
  const [users, setUsers] = useState<ManagedUser[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [roleFilter, setRoleFilter] = useState<string>(ALL)
  const [statusFilter, setStatusFilter] = useState<string>(ALL)

  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<ManagedUser | null>(null)
  const [resetting, setResetting] = useState<ManagedUser | null>(null)
  const [deleting, setDeleting] = useState<ManagedUser | null>(null)
  const [busyId, setBusyId] = useState<number | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const response = await api.getUsers()
      setUsers(response.data as ManagedUser[])
    } catch {
      toast({
        title: "تعذر تحميل الحسابات",
        description: "تحقق من الاتصال بالخادم",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => {
    const current = getCurrentUser()
    setIsAdmin(current?.role === "admin")
    setCurrentUserId(current?.id ?? null)

    if (current?.role === "admin") {
      load()
    } else {
      setLoading(false)
    }
  }, [load])

  // Filtering client-side: the whole staff list is a handful of rows, so a
  // round trip per keystroke would only add latency.
  const visible = useMemo(() => {
    const term = search.trim().toLowerCase()
    return users.filter((user) => {
      if (term && !user.name.toLowerCase().includes(term) && !user.email.toLowerCase().includes(term)) {
        return false
      }
      if (roleFilter !== ALL && user.role !== roleFilter) return false
      if (statusFilter !== ALL && user.is_active !== (statusFilter === "active")) return false
      return true
    })
  }, [users, search, roleFilter, statusFilter])

  const toggleActive = async (user: ManagedUser) => {
    setBusyId(user.id)
    try {
      const response = await api.setUserActive(user.id, !user.is_active)
      setUsers((prev) => prev.map((row) => (row.id === user.id ? (response.data as ManagedUser) : row)))
      toast({
        title: user.is_active ? "تم إيقاف الحساب" : "تم تفعيل الحساب",
        description: user.is_active ? "تم تسجيل خروجه من كل الأجهزة" : undefined,
      })
    } catch (error) {
      toast({
        title: "تعذر تغيير حالة الحساب",
        description: error instanceof Error ? error.message : undefined,
        variant: "destructive",
      })
    } finally {
      setBusyId(null)
    }
  }

  const confirmDelete = async () => {
    if (!deleting) return
    setBusyId(deleting.id)
    try {
      await api.deleteUser(deleting.id)
      setUsers((prev) => prev.filter((row) => row.id !== deleting.id))
      toast({ title: "تم حذف الحساب بنجاح" })
      setDeleting(null)
    } catch (error) {
      toast({
        title: "تعذر حذف الحساب",
        description: error instanceof Error ? error.message : undefined,
        variant: "destructive",
      })
    } finally {
      setBusyId(null)
    }
  }

  if (isAdmin === false) {
    return (
      <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4 text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-200">
        <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0" />
        <div>
          <p className="font-medium">هذه الصفحة لمدير النظام</p>
          <p className="text-sm">إدارة الحسابات متاحة لمدير النظام وحده.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-2 text-3xl font-bold text-foreground">
            <Users className="h-8 w-8" />
            إدارة الحسابات
          </h1>
          <p className="mt-2 text-muted-foreground">
            حسابات العاملين بالجمعية وصلاحياتهم على النظام
          </p>
        </div>
        <Button
          className="gap-2"
          onClick={() => {
            setEditing(null)
            setFormOpen(true)
          }}
        >
          <UserPlus className="h-4 w-4" />
          حساب جديد
        </Button>
      </div>

      <Card>
        <CardHeader className="gap-4">
          <CardTitle className="text-lg">
            الحسابات
            <span className="mr-2 text-sm font-normal text-muted-foreground">
              ({visible.length} من {users.length})
            </span>
          </CardTitle>
          <div className="flex flex-wrap gap-3">
            <div className="relative min-w-[220px] flex-1">
              <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="بحث بالاسم أو البريد الإلكتروني"
                className="pr-9"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-[170px]">
                <SelectValue placeholder="كل الصلاحيات" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>كل الصلاحيات</SelectItem>
                {Object.entries(ROLE_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="كل الحالات" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>كل الحالات</SelectItem>
                <SelectItem value="active">نشط</SelectItem>
                <SelectItem value="inactive">موقوف</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>

        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center gap-2 py-12 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" />
              جاري التحميل...
            </div>
          ) : visible.length === 0 ? (
            <p className="py-12 text-center text-muted-foreground">لا توجد حسابات مطابقة</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>الاسم</TableHead>
                    <TableHead>البريد الإلكتروني</TableHead>
                    <TableHead>الصلاحية</TableHead>
                    <TableHead>الهاتف</TableHead>
                    <TableHead>الحالة</TableHead>
                    <TableHead>آخر دخول</TableHead>
                    <TableHead className="w-12"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {visible.map((user) => {
                    const isSelf = user.id === currentUserId
                    return (
                      <TableRow key={user.id} className={user.is_active ? "" : "opacity-60"}>
                        <TableCell className="font-medium">
                          {user.name}
                          {isSelf && (
                            <Badge variant="outline" className="mr-2 text-xs">
                              أنت
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell dir="ltr" className="text-right">
                          {user.email}
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">{getRoleLabel(user.role)}</Badge>
                        </TableCell>
                        <TableCell dir="ltr" className="text-right">
                          {user.phone || "—"}
                        </TableCell>
                        <TableCell>
                          {user.is_active ? (
                            <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100 dark:bg-emerald-950 dark:text-emerald-300">
                              نشط
                            </Badge>
                          ) : (
                            <Badge variant="destructive">موقوف</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {formatDate(user.last_login_at)}
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" disabled={busyId === user.id}>
                                {busyId === user.id ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <MoreHorizontal className="h-4 w-4" />
                                )}
                                <span className="sr-only">إجراءات</span>
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={() => {
                                  setEditing(user)
                                  setFormOpen(true)
                                }}
                              >
                                <Pencil className="ml-2 h-4 w-4" />
                                تعديل
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => setResetting(user)}>
                                <Key className="ml-2 h-4 w-4" />
                                إعادة تعيين كلمة المرور
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              {/* Your own account is excluded from the
                                  destructive actions - the API refuses them
                                  anyway, and offering them invites a
                                  confusing error. */}
                              <DropdownMenuItem disabled={isSelf} onClick={() => toggleActive(user)}>
                                {user.is_active ? (
                                  <>
                                    <Ban className="ml-2 h-4 w-4" />
                                    إيقاف الحساب
                                  </>
                                ) : (
                                  <>
                                    <CheckCircle2 className="ml-2 h-4 w-4" />
                                    تفعيل الحساب
                                  </>
                                )}
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                disabled={isSelf}
                                className="text-destructive focus:text-destructive"
                                onClick={() => setDeleting(user)}
                              >
                                <Trash2 className="ml-2 h-4 w-4" />
                                حذف الحساب
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <UserFormDialog open={formOpen} onOpenChange={setFormOpen} user={editing} onSaved={load} />
      <ResetPasswordDialog
        open={Boolean(resetting)}
        onOpenChange={(open) => !open && setResetting(null)}
        user={resetting}
      />

      <AlertDialog open={Boolean(deleting)} onOpenChange={(open) => !open && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>حذف حساب {deleting?.name}؟</AlertDialogTitle>
            <AlertDialogDescription>
              لا يمكن التراجع عن هذا الإجراء. إذا كان صاحب الحساب قد سجّل عمليات في النظام فالأفضل
              إيقاف الحساب بدل حذفه، حتى يبقى اسمه على ما سجّله.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault()
                confirmDelete()
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              حذف الحساب
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
