"use client"

import { useEffect, useState } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { RefreshCw } from "lucide-react"
import { splitByWeights } from "@/lib/utils"
import api from "@/lib/api"

export interface KafalaChamilaSplitValue {
  split_id: number
  amount: number
}

interface KafalaChamilaSplitRule {
  id: number
  key: string
  label: string
  percentage: string | number
  sub_budget: { id: number; label: string }
  income_category: { id: number; label: string }
}

interface KafalaChamilaSplitEditorProps {
  /** The target total driving the default split - typically 800, editable. */
  totalAmount: number
  value: KafalaChamilaSplitValue[]
  onChange: (splits: KafalaChamilaSplitValue[]) => void
}

/**
 * Live-editable preview of how a kafala chamila payment is distributed
 * across the 7 fixed parts. Recomputes a cent-safe default split from the
 * target total whenever it changes; each part stays manually editable
 * afterwards. What actually gets submitted is the sum of the parts below,
 * not the target total itself.
 */
export function KafalaChamilaSplitEditor({ totalAmount, value, onChange }: KafalaChamilaSplitEditorProps) {
  const [rules, setRules] = useState<KafalaChamilaSplitRule[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api
      .getKafalaChamilaSplits()
      .then((res) => setRules(res.data || []))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (rules.length === 0) return
    const amounts = splitByWeights(totalAmount || 0, rules.map((r) => parseFloat(String(r.percentage))))
    onChange(rules.map((rule, i) => ({ split_id: rule.id, amount: amounts[i] })))
    // Only recompute when the target total or the rule set changes - not on `onChange` identity.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [totalAmount, rules])

  const handlePartChange = (splitId: number, amount: number) => {
    onChange(value.map((s) => (s.split_id === splitId ? { ...s, amount } : s)))
  }

  const handleReset = () => {
    if (rules.length === 0) return
    const amounts = splitByWeights(totalAmount || 0, rules.map((r) => parseFloat(String(r.percentage))))
    onChange(rules.map((rule, i) => ({ split_id: rule.id, amount: amounts[i] })))
  }

  const recordedTotal = value.reduce((sum, s) => sum + (s.amount || 0), 0)
  const isMismatched = Math.abs(recordedTotal - (totalAmount || 0)) > 0.01

  if (loading) {
    return <div className="text-sm text-gray-500">جاري تحميل بنود توزيع الكفالة الشاملة...</div>
  }

  return (
    <div className="space-y-3 border rounded-lg p-4 bg-gray-50">
      <div className="flex items-center justify-between">
        <Label className="text-base font-semibold">توزيع الكفالة الشاملة</Label>
        <Button type="button" variant="ghost" size="sm" onClick={handleReset} className="gap-1 text-xs">
          <RefreshCw className="h-3 w-3" />
          إعادة التوزيع حسب النسب
        </Button>
      </div>

      <div className="space-y-2">
        {rules.map((rule) => {
          const part = value.find((s) => s.split_id === rule.id)
          return (
            <div
              key={rule.id}
              className="grid grid-cols-[1fr_auto_140px] items-center gap-3 bg-white rounded-md border p-2"
            >
              <div>
                <p className="text-sm font-medium">{rule.label}</p>
                <p className="text-xs text-gray-500">{rule.sub_budget.label}</p>
              </div>
              <span className="text-xs text-gray-500 w-12 text-left">
                {parseFloat(String(rule.percentage))}%
              </span>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={part?.amount ?? 0}
                onChange={(e) => handlePartChange(rule.id, parseFloat(e.target.value) || 0)}
                className="text-left"
              />
            </div>
          )
        })}
      </div>

      <div className="flex items-center justify-between pt-2 border-t text-sm">
        <span className="text-gray-600">الإجمالي الذي سيتم تسجيله:</span>
        <span className={`font-bold ${isMismatched ? "text-orange-600" : "text-green-600"}`}>
          {recordedTotal.toFixed(2)} د.م
        </span>
      </div>
      {isMismatched && (
        <p className="text-xs text-orange-600">
          يختلف هذا الإجمالي عن المبلغ المستهدف ({(totalAmount || 0).toFixed(2)} د.م). سيتم تسجيل المبالغ المدخلة أعلاه فقط.
        </p>
      )}
    </div>
  )
}
