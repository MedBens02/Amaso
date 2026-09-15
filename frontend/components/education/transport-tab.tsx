"use client"

import { useCallback, useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { RowActions } from "@/components/ui/row-actions"
import { useToast } from "@/hooks/use-toast"
import {
  Bus, Plus, Search, Loader2, Edit, Trash2, Users, Route as RouteIcon,
  Wallet, Armchair, Filter, UserPlus,
} from "lucide-react"
import api from "@/lib/api"
import { TransportProvidersDialog, type TransportProvider } from "./transport-providers-dialog"
import { TransportRouteDialog, type TransportRoute, DESTINATIONS } from "./transport-route-dialog"
import {
  TransportRiderDialog, type TransportSubscription, PURPOSES, STATUSES, PAYERS,
} from "./transport-rider-dialog"

interface AcademicYear {
  id: number
  label: string
  is_current: boolean
}

interface Summary {
  routes_total: number
  routes_active: number
  riders_active: number
  riders_total: number
  seats_total: number
  monthly_cost_routes: number
  monthly_cost_standalone: number
  monthly_cost_total: number
  by_purpose: Record<string, number>
}

const dirham = (value: number | null | undefined) =>
  value == null ? "—" : `${Number(value).toLocaleString("en-US")} د.م.`

export function TransportTab({ refreshKey }: { refreshKey?: number }) {
  const [years, setYears] = useState<AcademicYear[]>([])
  const [yearId, setYearId] = useState<number | null>(null)
  const [routes, setRoutes] = useState<TransportRoute[]>([])
  const [providers, setProviders] = useState<TransportProvider[]>([])
  const [schools, setSchools] = useState<Array<{ id: number; name: string }>>([])
  const [riders, setRiders] = useState<TransportSubscription[]>([])
  const [summary, setSummary] = useState<Summary | null>(null)
  const [loading, setLoading] = useState(true)
  const [ridersLoading, setRidersLoading] = useState(false)

  // rider filters
  const [search, setSearch] = useState("")
  const [routeFilter, setRouteFilter] = useState("all")
  const [purposeFilter, setPurposeFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("active")

  const [providersOpen, setProvidersOpen] = useState(false)
  const [routeDialog, setRouteDialog] = useState<{ open: boolean; route: TransportRoute | null }>(
    { open: false, route: null },
  )
  const [riderDialog, setRiderDialog] = useState<{
    open: boolean
    subscription: TransportSubscription | null
    defaultRouteId: number | null
  }>({ open: false, subscription: null, defaultRouteId: null })

  const { toast } = useToast()

  // The year list and the reference lists, once.
  useEffect(() => {
    ;(async () => {
      try {
        const [yearsRes, providersRes, schoolsRes] = await Promise.all([
          api.getAcademicYears(),
          api.getTransportProviders(),
          api.getSchools(),
        ])
        const yearList: AcademicYear[] = yearsRes.data || []
        setYears(yearList)
        setProviders(providersRes.data || [])
        setSchools(schoolsRes.data || [])
        setYearId((current) => current ?? (yearList.find((y) => y.is_current)?.id ?? yearList[0]?.id ?? null))
      } catch (error: any) {
        toast({ title: "خطأ", description: error.message || "فشل في تحميل البيانات", variant: "destructive" })
      }
    })()
  }, [refreshKey])

  const loadRoutes = useCallback(async () => {
    if (!yearId) return
    try {
      setLoading(true)
      const [routesRes, summaryRes] = await Promise.all([
        api.getTransportRoutes({ academic_year_id: yearId }),
        api.getTransportSummary(yearId),
      ])
      setRoutes(routesRes.data || [])
      setSummary((summaryRes as any).data || null)
    } catch (error: any) {
      toast({ title: "خطأ", description: error.message || "فشل في تحميل المسارات", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }, [yearId])

  const loadRiders = useCallback(async () => {
    if (!yearId) return
    try {
      setRidersLoading(true)
      const response = await api.getTransportSubscriptions({
        academic_year_id: yearId,
        route_id: routeFilter !== "all" && routeFilter !== "standalone" ? Number(routeFilter) : undefined,
        standalone_only: routeFilter === "standalone",
        purpose: purposeFilter === "all" ? undefined : purposeFilter,
        status: statusFilter === "all" ? undefined : statusFilter,
        search: search.trim() || undefined,
        per_page: 100,
      })
      setRiders(response.data || [])
    } catch (error: any) {
      toast({ title: "خطأ", description: error.message || "فشل في تحميل المستفيدين", variant: "destructive" })
    } finally {
      setRidersLoading(false)
    }
  }, [yearId, routeFilter, purposeFilter, statusFilter, search])

  useEffect(() => { loadRoutes() }, [loadRoutes])

  useEffect(() => {
    const timer = setTimeout(loadRiders, search ? 300 : 0)
    return () => clearTimeout(timer)
  }, [loadRiders])

  const reloadAll = () => { loadRoutes(); loadRiders() }

  const removeRoute = async (route: TransportRoute) => {
    try {
      const response = await api.deleteTransportRoute(route.id)
      toast({ title: "تم", description: (response as any).message })
      reloadAll()
    } catch (error: any) {
      toast({ title: "تعذر الحذف", description: error.message, variant: "destructive" })
    }
  }

  const removeRider = async (rider: TransportSubscription) => {
    try {
      const response = await api.deleteTransportSubscription(rider.id)
      toast({ title: "تم", description: (response as any).message })
      reloadAll()
    } catch (error: any) {
      toast({ title: "تعذر الحذف", description: error.message, variant: "destructive" })
    }
  }

  const statusBadge = (status: string) => {
    const label = STATUSES[status] || status
    if (status === "active") return <Badge className="bg-green-600 hover:bg-green-600">{label}</Badge>
    if (status === "suspended") return <Badge variant="secondary">{label}</Badge>
    return <Badge variant="outline">{label}</Badge>
  }

  const tiles = summary ? [
    { icon: Users, label: "مستفيدون منقولون", value: String(summary.riders_active), hint: `${summary.riders_total} سجلاً إجمالاً` },
    { icon: RouteIcon, label: "مسارات نشطة", value: String(summary.routes_active), hint: `${summary.routes_total} مساراً إجمالاً` },
    { icon: Armchair, label: "مقاعد متاحة", value: String(Math.max(0, summary.seats_total - summary.riders_active)), hint: `${summary.seats_total} مقعداً إجمالاً` },
    { icon: Wallet, label: "الكلفة الشهرية التقديرية", value: dirham(summary.monthly_cost_total), hint: "للتخطيط فقط — المصاريف الفعلية في «نقل مدرسي»" },
  ] : []

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="space-y-2">
          <Label>السنة الدراسية</Label>
          <Select value={yearId ? String(yearId) : ""} onValueChange={(v) => setYearId(Number(v))}>
            <SelectTrigger className="w-56"><SelectValue placeholder="اختر السنة" /></SelectTrigger>
            <SelectContent>
              {years.map((year) => (
                <SelectItem key={year.id} value={String(year.id)}>
                  {year.label}{year.is_current ? " (الحالية)" : ""}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => setProvidersOpen(true)}>
            <Bus className="h-4 w-4 ml-1" />
            الناقلون
          </Button>
          <Button variant="outline" onClick={() => setRouteDialog({ open: true, route: null })} disabled={!yearId}>
            <RouteIcon className="h-4 w-4 ml-1" />
            مسار جديد
          </Button>
          <Button
            onClick={() => setRiderDialog({ open: true, subscription: null, defaultRouteId: null })}
            disabled={!yearId}
          >
            <UserPlus className="h-4 w-4 ml-1" />
            تسجيل مستفيد
          </Button>
        </div>
      </div>

      {summary && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {tiles.map((tile) => (
            <Card key={tile.label}>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-sm text-muted-foreground">{tile.label}</p>
                    <p className="text-2xl font-bold mt-1">{tile.value}</p>
                    <p className="text-xs text-muted-foreground mt-1">{tile.hint}</p>
                  </div>
                  <tile.icon className="h-5 w-5 text-muted-foreground shrink-0" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RouteIcon className="h-5 w-5" />
            مسارات النقل
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin" /></div>
          ) : routes.length === 0 ? (
            <div className="text-center py-10 space-y-3">
              <p className="text-muted-foreground">لا توجد مسارات نقل في هذه السنة الدراسية</p>
              <Button variant="outline" onClick={() => setRouteDialog({ open: true, route: null })}>
                <Plus className="h-4 w-4 ml-1" />
                إنشاء أول مسار
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {routes.map((route) => {
                const ridersOn = route.active_riders_count ?? 0
                const fill = route.capacity ? Math.min(100, (ridersOn / route.capacity) * 100) : 0
                return (
                  <div
                    key={route.id}
                    className={`rounded-lg border p-4 space-y-3 ${route.is_active ? "" : "opacity-60"}`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-semibold truncate">{route.name}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {route.destination_label || DESTINATIONS[route.destination_type]}
                          {route.school?.name ? ` — ${route.school.name}` : ""}
                        </p>
                      </div>
                      <RowActions
                        actions={[
                          {
                            label: "تسجيل مستفيد في هذا المسار",
                            icon: UserPlus,
                            onSelect: () => setRiderDialog({ open: true, subscription: null, defaultRouteId: route.id }),
                          },
                          {
                            label: "عرض المسجلين",
                            icon: Users,
                            onSelect: () => { setRouteFilter(String(route.id)); setStatusFilter("all") },
                          },
                          { label: "تعديل", icon: Edit, onSelect: () => setRouteDialog({ open: true, route }) },
                          { label: "حذف", icon: Trash2, onSelect: () => removeRoute(route), destructive: true },
                        ]}
                      />
                    </div>

                    <div className="flex flex-wrap gap-2 text-xs">
                      {route.provider?.name && <Badge variant="secondary">{route.provider.name}</Badge>}
                      {route.pickup_area && <Badge variant="outline">{route.pickup_area}</Badge>}
                      {!route.is_active && <Badge variant="outline">غير نشط</Badge>}
                    </div>

                    {route.schedule && (
                      <p className="text-xs text-muted-foreground">{route.schedule}</p>
                    )}

                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">المقاعد</span>
                        <span>
                          {ridersOn}
                          {route.capacity ? ` / ${route.capacity}` : " مسجلاً"}
                          {route.seats_left != null && ` — ${route.seats_left} متبقٍ`}
                        </span>
                      </div>
                      {route.capacity ? <Progress value={fill} className="h-2" /> : null}
                    </div>

                    <div className="flex items-center justify-between text-xs pt-1 border-t">
                      <span className="text-muted-foreground">الكلفة الشهرية</span>
                      <span>
                        {dirham(route.monthly_cost == null ? null : Number(route.monthly_cost))}
                        {/* A free run - the school's own bus, usually - has
                            nothing to divide, and "0 د.م. للمستفيد" is noise. */}
                        {route.cost_per_rider != null && route.cost_per_rider > 0 && ridersOn > 0 && (
                          <span className="text-muted-foreground"> — {dirham(route.cost_per_rider)} للمستفيد</span>
                        )}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ------------------------------------------------------------- */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            المستفيدون من النقل
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div className="relative md:col-span-2">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                className="pr-9"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="ابحث باسم المستفيد..."
              />
            </div>
            <Select value={routeFilter} onValueChange={setRouteFilter}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">كل المسارات</SelectItem>
                <SelectItem value="standalone">ترتيبات خاصة فقط</SelectItem>
                {routes.map((route) => (
                  <SelectItem key={route.id} value={String(route.id)}>{route.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">كل الحالات</SelectItem>
                {Object.entries(STATUSES).map(([value, label]) => (
                  <SelectItem key={value} value={value}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <Button
              variant={purposeFilter === "all" ? "default" : "outline"}
              size="sm"
              onClick={() => setPurposeFilter("all")}
            >
              الكل
            </Button>
            {Object.entries(PURPOSES).map(([value, label]) => (
              <Button
                key={value}
                variant={purposeFilter === value ? "default" : "outline"}
                size="sm"
                onClick={() => setPurposeFilter(value)}
              >
                {label}
                {summary?.by_purpose?.[value] ? ` (${summary.by_purpose[value]})` : ""}
              </Button>
            ))}
          </div>

          {ridersLoading ? (
            <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin" /></div>
          ) : riders.length === 0 ? (
            <p className="text-center text-muted-foreground py-10">لا يوجد مستفيدون مطابقون</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>المستفيد</TableHead>
                    <TableHead>الوجهة</TableHead>
                    <TableHead>المسار / الناقل</TableHead>
                    <TableHead>نقطة الالتقاء</TableHead>
                    <TableHead>الكلفة</TableHead>
                    <TableHead>يتحملها</TableHead>
                    <TableHead>الحالة</TableHead>
                    <TableHead className="w-12"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {riders.map((rider) => {
                    const orphan = rider.enrollment?.orphan
                    const carrier = rider.route?.provider?.name || rider.provider?.name
                    return (
                      <TableRow key={rider.id}>
                        <TableCell className="font-medium">
                          {orphan ? `${orphan.first_name} ${orphan.last_name}` : "—"}
                          {rider.enrollment?.school?.name && (
                            <p className="text-xs text-muted-foreground font-normal">
                              {rider.enrollment.school.name}
                            </p>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{rider.purpose_label || PURPOSES[rider.purpose]}</Badge>
                        </TableCell>
                        <TableCell>
                          {rider.route ? (
                            <>
                              <span>{rider.route.name}</span>
                              {carrier && <p className="text-xs text-muted-foreground">{carrier}</p>}
                            </>
                          ) : (
                            <>
                              <Badge variant="secondary">ترتيب خاص</Badge>
                              {carrier && <p className="text-xs text-muted-foreground mt-1">{carrier}</p>}
                            </>
                          )}
                        </TableCell>
                        <TableCell className="text-sm">{rider.pickup_point || "—"}</TableCell>
                        <TableCell className="text-sm">
                          {rider.monthly_cost != null
                            ? dirham(rider.monthly_cost)
                            : <span className="text-muted-foreground">ضمن كلفة المسار</span>}
                        </TableCell>
                        <TableCell className="text-sm">{rider.paid_by_label || PAYERS[rider.paid_by]}</TableCell>
                        <TableCell>{statusBadge(rider.status)}</TableCell>
                        <TableCell>
                          <RowActions
                            actions={[
                              {
                                label: "تعديل",
                                icon: Edit,
                                onSelect: () => setRiderDialog({ open: true, subscription: rider, defaultRouteId: null }),
                              },
                              {
                                label: "حذف",
                                icon: Trash2,
                                onSelect: () => removeRider(rider),
                                destructive: true,
                              },
                            ]}
                          />
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

      <TransportProvidersDialog
        open={providersOpen}
        onOpenChange={setProvidersOpen}
        onChanged={async () => {
          const response = await api.getTransportProviders()
          setProviders(response.data || [])
          loadRoutes()
        }}
      />

      {yearId && (
        <>
          <TransportRouteDialog
            open={routeDialog.open}
            onOpenChange={(open) => setRouteDialog((s) => ({ ...s, open }))}
            academicYearId={yearId}
            route={routeDialog.route}
            providers={providers}
            schools={schools}
            onSaved={reloadAll}
          />
          <TransportRiderDialog
            open={riderDialog.open}
            onOpenChange={(open) => setRiderDialog((s) => ({ ...s, open }))}
            academicYearId={yearId}
            subscription={riderDialog.subscription}
            defaultRouteId={riderDialog.defaultRouteId}
            routes={routes}
            providers={providers}
            onSaved={reloadAll}
          />
        </>
      )}
    </div>
  )
}
