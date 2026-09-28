"use client"

import { useEffect, useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import api from "@/lib/api"

interface BankAccountDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** null to create one. */
  account: any | null
  onSaved: () => void
}

const EMPTY = { label: "", bank_name: "", account_number: "", opening_balance: "0", notes: "" }

/**
 * Adding or correcting a bank account.
 *
 * The balance is not a field here, deliberately. It is the opening figure
 * plus every recorded movement, and a box that let somebody type over it
 * would break the one check the statement screen exists to make. Correcting
 * the opening figure is allowed and moves the balance by the same amount,
 * which is the honest way to fix a starting amount entered wrongly.
 */
export function BankAccountDialog({ open, onOpenChange, account, onSaved }: BankAccountDialogProps) {
  const [form, setForm] = useState(EMPTY)
  const [saving, setSaving] = useState(false)
  const { toast } = useToast()
  const isEdit = Boolean(account)

  useEffect(() => {
    if (!open) return

    setForm(
      account
        ? {
            label: account.label ?? "",
            bank_name: account.bank_name ?? "",
            account_number: account.account_number ?? "",
            opening_balance: String(account.opening_balance ?? 0),
            notes: account.notes ?? "",
          }
        : EMPTY,
    )
  }, [open, account])

  const set = (key: keyof typeof EMPTY, value: string) => setForm((prev) => ({ ...prev, [key]: value }))

  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    setSaving(true)

    const payload = {
      label: form.label.trim(),
      bank_name: form.bank_name.trim() || undefined,
      account_number: form.account_number.trim() || undefined,
      opening_balance: Number(form.opening_balance) || 0,
      notes: form.notes.trim() || undefined,
    }

    try {
      const res = isEdit
        ? await api.updateBankAccount(account.id, payload)
        : await api.createBankAccount(payload)
      toast({ title: "تم", description: res.message })
      onSaved()
      onOpenChange(false)
    } catch (error) {
      toast({
        title: isEdit ? "تعذر تحديث الحساب" : "تعذر إنشاء الحساب",
        description: error instanceof Error ? error.message : undefined,
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={submit}>
          <DialogHeader>
            <DialogTitle>{isEdit ? "تعديل الحساب البنكي" : "حساب بنكي جديد"}</DialogTitle>
            <DialogDescription>
              {isEdit
                ? "تغيير الرصيد الافتتاحي ينقل الرصيد الحالي بنفس الفارق."
                : "يبدأ الحساب برصيده الافتتاحي، ثم تُضاف إليه الحركات المسجَّلة."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="account-label">اسم الحساب *</Label>
              <Input
                id="account-label"
                value={form.label}
                onChange={(e) => set("label", e.target.value)}
                placeholder="مثال: الحساب الرئيسي"
                required
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="account-bank">البنك</Label>
                <Input
                  id="account-bank"
                  value={form.bank_name}
                  onChange={(e) => set("bank_name", e.target.value)}
                  placeholder="اختياري"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="account-number">رقم الحساب</Label>
                <Input
                  id="account-number"
                  dir="ltr"
                  className="text-left"
                  value={form.account_number}
                  onChange={(e) => set("account_number", e.target.value)}
                  placeholder="اختياري"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="account-opening">الرصيد الافتتاحي</Label>
              <Input
                id="account-opening"
                type="number"
                step="0.01"
                dir="ltr"
                className="text-left"
                value={form.opening_balance}
                onChange={(e) => set("opening_balance", e.target.value)}
              />
              <p className="text-xs text-muted-foreground">ما كان في الحساب قبل تسجيله في النظام.</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="account-notes">ملاحظات</Label>
              <Textarea
                id="account-notes"
                value={form.notes}
                onChange={(e) => set("notes", e.target.value)}
                rows={2}
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
              إلغاء
            </Button>
            <Button type="submit" disabled={saving || !form.label.trim()}>
              {saving && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
              {isEdit ? "حفظ" : "إنشاء"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
