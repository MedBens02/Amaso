"use client"

import { Fragment, useCallback, useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { DateField } from "@/components/ui/date-field"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { History, Search, ShieldAlert, Loader2, ChevronDown, ChevronLeft, RotateCcw } from "lucide-react"
import api from "@/lib/api"
import { isCurrentUserSuperuser } from "@/lib/roles"
import { cn } from "@/lib/utils"

type Change = {
  field: string
  field_label: string
  redacted: boolean
  from: string | number | boolean | null
  to: string | number | boolean | null
}

type LogRow = {
  id: number
  created_at: string
  user_id: number | null
  user_name: string
  action: string
  action_label: string
  entity_type: string
  entity_label: string
  entity_id: number | null
  entity_name: string | null
  ip_address: string | null
  changes: Change[]
  changes_count: number
}

type Option = { value: string | number; label: string }

const ANY = "all"

/**
 * Colour carries the weight of the action, not the kind of record: on a page
 * that is mostly scanned rather than read, "something was deleted" and
 * "money was approved" are what need to catch the eye.
 */
const ACTION_TONE: Record<string, string> = {
  created: "bg-green-100 text-green-800 dark:bg-green-950/50 dark:text-green-400",
  updated: "bg-blue-100 text-blue-800 dark:bg-blue-950/50 dark:text-blue-400",
  deleted: "bg-red-100 text-red-800 dark:bg-red-950/50 dark:text-red-400",
  force_deleted: "bg-red-100 text-red-800 dark:bg-red-950/50 dark:text-red-400",
  approved: "bg-teal-100 text-teal-800 dark:bg-teal-950/50 dark:text-teal-300",
  rejected: "bg-red-100 text-red-800 dark:bg-red-950/50 dark:text-red-400",
  transferred: "bg-amber-100 text-amber-900 dark:bg-amber-950/50 dark:text-amber-300",
  closed: "bg-purple-100 text-purple-800 dark:bg-purple-950/50 dark:text-purple-300",
  reopened: "bg-purple-100 text-purple-800 dark:bg-purple-950/50 dark:text-purple-300",
  logged_in: "bg-muted text-muted-foreground",
  password_changed: "bg-amber-100 text-amber-900 dark:bg-amber-950/50 dark:text-amber-300",
  activated: "bg-green-100 text-green-800 dark:bg-green-950/50 dark:text-green-400",
  deactivated: "bg-red-100 text-red-800 dark:bg-red-950/50 dark:text-red-400",
  restored: "bg-green-100 text-green-800 dark:bg-green-950/50 dark:text-green-400",
}

/** Dates and times read left to right even inside Arabic. */
function Stamp({ value }: { value: string }) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return <span className="text-muted-foreground">—</span>

  return (
    <span dir="ltr" className="inline-block whitespace-nowrap tabular-nums">
      {date.toLocaleDateString("fr-MA")} {date.toLocaleTimeString("fr-MA", { hour: "2-digit", minute: "2-digit" })}
    </span>
  )
}

/** An empty value has to look different from the string "empty". */
function Value({ value }: { value: Change["from"] }) {
  if (value === null || value === "" || value === undefined) {
    return <span className="text-muted-foreground">—</span>
  }
  if (typeof value === "boolean") {
    return <span>{value ? "نعم" : "لا"}</span>
  }
  return <span className="break-words">{String(value)}</span>
}

export default function AuditLogPage() {
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null)
  const [rows, setRows] = useState<LogRow[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [lastPage, setLastPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [expanded, setExpanded] = useState<number | null>(null)

  const [search, setSearch] = useState("")
  const [userId, setUserId] = useState(ANY)
  const [action, setAction] = useState(ANY)
  const [entityType, setEntityType] = useState(ANY)
  const [fromDate, setFromDate] = useState("")
  const [toDate, setToDate] = useState("")

  const [users, setUsers] = useState<Option[]>([])
  const [actions, setActions] = useState<Option[]>([])
  const [entityTypes, setEntityTypes] = useState<Option[]>([])

  const { toast } = useToast()

  // Read after mount: the role lives in localStorage, which the server does
  // not have during the first render.
  useEffect(() => {
    setIsAdmin(isCurrentUserSuperuser())
  }, [])

  useEffect(() => {
    if (!isAdmin) return
    api
      .getAuditLogFilters()
      .then((response) => {
        const data = response.data || {}
        setUsers(data.users || [])
        setActions(data.actions || [])
        setEntityTypes(data.entity_types || [])
      })
      .catch(() => {
        // A filter bar that failed to load is not worth a toast on top of
        // the one the list itself will raise.
      })
  }, [isAdmin])

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const response = await api.getAuditLogs({
        page,
        per_page: 30,
        search: search.trim() || undefined,
        user_id: userId === ANY ? undefined : Number(userId),
        action: action === ANY ? undefined : action,
        entity_type: entityType === ANY ? undefined : entityType,
        from_date: fromDate || undefined,
        to_date: toDate || undefined,
      })
      setRows((response.data as unknown as LogRow[]) || [])
      const meta = response.meta as any
      setLastPage(meta?.last_page || 1)
      setTotal(meta?.total || 0)
    } catch (error: any) {
      toast({
        title: "تعذر تحميل سجل النشاط",
        description: error?.message,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }, [page, search, userId, action, entityType, fromDate, toDate, toast])

  useEffect(() => {
    if (isAdmin) load()
  }, [isAdmin, load])

  // Any change to what is being asked for invalidates whichever page is held.
  useEffect(() => {
    setPage(1)
  }, [search, userId, action, entityType, fromDate, toDate])

  const filtered = userId !== ANY || action !== ANY || entityType !== ANY || fromDate || toDate || search.trim()

  const reset = () => {
    setSearch("")
    setUserId(ANY)
    setAction(ANY)
    setEntityType(ANY)
    setFromDate("")
    setToDate("")
  }

  if (isAdmin === false) {
    return (
      <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4 text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-200">
        <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0" />
        <div>
          <p className="font-medium">هذه الصفحة للمستخدم الأعلى</p>
          <p className="text-sm">سجل النشاط متاح للمستخدم الأعلى وحده — مدير النظام لا يصل إليه.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-3xl font-bold text-foreground">
          <History className="h-8 w-8 shrink-0" />
          سجل النشاط
        </h1>
        <p className="mt-2 text-muted-foreground">
          كل تغيير في النظام: من قام به، وعلى أي سجل، ومتى
        </p>
      </div>

      <Card>
        <CardContent className="space-y-4 p-4">
          <div className="relative">
            <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="ابحث باسم السجل أو اسم المستخدم..."
              className="pr-9"
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            <div className="space-y-1.5">
              <Label className="text-xs">المستخدم</Label>
              <Select value={userId} onValueChange={setUserId}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent searchable>
                  <SelectItem value={ANY}>الجميع</SelectItem>
                  {users.map((option) => (
                    <SelectItem key={option.value} value={String(option.value)}>{option.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">نوع العملية</Label>
              <Select value={action} onValueChange={setAction}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent searchable>
                  <SelectItem value={ANY}>كل العمليات</SelectItem>
                  {actions.map((option) => (
                    <SelectItem key={option.value} value={String(option.value)}>{option.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">نوع السجل</Label>
              <Select value={entityType} onValueChange={setEntityType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent searchable>
                  <SelectItem value={ANY}>كل السجلات</SelectItem>
                  {entityTypes.map((option) => (
                    <SelectItem key={option.value} value={String(option.value)}>{option.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">من تاريخ</Label>
              <DateField value={fromDate} onChange={setFromDate} />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">إلى تاريخ</Label>
              <DateField value={toDate} onChange={setToDate} />
            </div>
          </div>

          {filtered && (
            <Button variant="ghost" size="sm" className="gap-2" onClick={reset}>
              <RotateCcw className="h-4 w-4" />
              إعادة تعيين الفلاتر
            </Button>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10" />
                <TableHead className="text-right">التاريخ والوقت</TableHead>
                <TableHead className="text-right">المستخدم</TableHead>
                <TableHead className="text-right">العملية</TableHead>
                <TableHead className="text-right">نوع السجل</TableHead>
                <TableHead className="text-right">السجل</TableHead>
                <TableHead className="text-right">التغييرات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="py-10 text-center text-muted-foreground">
                    <Loader2 className="mx-auto h-5 w-5 animate-spin" />
                  </TableCell>
                </TableRow>
              ) : rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="py-10 text-center text-muted-foreground">
                    {filtered ? "لا توجد عمليات تطابق البحث" : "لم تُسجَّل أي عملية بعد"}
                  </TableCell>
                </TableRow>
              ) : (
                rows.map((row) => {
                  const open = expanded === row.id
                  const hasDetail = row.changes.length > 0

                  return (
                    <Fragment key={row.id}>
                      <TableRow
                        className={cn(hasDetail && "cursor-pointer")}
                        onClick={() => hasDetail && setExpanded(open ? null : row.id)}
                      >
                        <TableCell className="text-center">
                          {hasDetail && (
                            open
                              ? <ChevronDown className="h-4 w-4 text-muted-foreground" />
                              : <ChevronLeft className="h-4 w-4 text-muted-foreground" />
                          )}
                        </TableCell>
                        <TableCell className="text-right text-sm">
                          <Stamp value={row.created_at} />
                        </TableCell>
                        <TableCell className="text-right font-medium">{row.user_name}</TableCell>
                        <TableCell className="text-right">
                          <Badge variant="secondary" className={cn("font-normal", ACTION_TONE[row.action])}>
                            {row.action_label}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right text-sm text-muted-foreground">
                          {row.entity_label}
                        </TableCell>
                        <TableCell className="text-right">
                          {row.entity_name || <span className="text-muted-foreground">—</span>}
                        </TableCell>
                        <TableCell className="text-right text-sm text-muted-foreground">
                          {hasDetail ? `${row.changes_count} حقل` : "—"}
                        </TableCell>
                      </TableRow>

                      {open && (
                        <TableRow className="bg-muted/30 hover:bg-muted/30">
                          <TableCell />
                          <TableCell colSpan={6} className="py-3">
                            <div className="space-y-2">
                              {row.changes.map((change) => (
                                <div
                                  key={change.field}
                                  className="grid gap-1 text-sm sm:grid-cols-[10rem_1fr] sm:gap-3"
                                >
                                  <div className="font-medium text-muted-foreground">{change.field_label}</div>
                                  {change.redacted ? (
                                    <div className="text-muted-foreground">
                                      تم تغييرها (القيمة غير مسجَّلة)
                                    </div>
                                  ) : (
                                    <div className="flex flex-wrap items-center gap-2">
                                      <span className="rounded bg-red-50 px-1.5 py-0.5 text-red-800 line-through decoration-red-300 dark:bg-red-950/40 dark:text-red-300">
                                        <Value value={change.from} />
                                      </span>
                                      <span className="text-muted-foreground">←</span>
                                      <span className="rounded bg-green-50 px-1.5 py-0.5 text-green-800 dark:bg-green-950/40 dark:text-green-300">
                                        <Value value={change.to} />
                                      </span>
                                    </div>
                                  )}
                                </div>
                              ))}

                              {row.ip_address && (
                                <p className="pt-1 text-xs text-muted-foreground">
                                  عنوان الشبكة: <span dir="ltr" className="tabular-nums">{row.ip_address}</span>
                                </p>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </Fragment>
                  )
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {lastPage > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            صفحة {page} من {lastPage} — {total} عملية
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page === 1 || loading}
              onClick={() => setPage((current) => Math.max(1, current - 1))}
            >
              السابق
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= lastPage || loading}
              onClick={() => setPage((current) => Math.min(lastPage, current + 1))}
            >
              التالي
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
