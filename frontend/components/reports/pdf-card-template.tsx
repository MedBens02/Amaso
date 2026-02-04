"use client"

import React from 'react'
import { formatDateArabic } from "@/lib/date-utils"

/**
 * Section configuration for PDF card
 */
export interface PDFCardSection {
  title: string
  icon?: React.ComponentType<{ className?: string }>
  content: React.ReactNode
  columns?: 1 | 2 | 3
  className?: string
}

/**
 * Info item for displaying key-value pairs
 */
export interface InfoItem {
  label: string
  value: string | number | React.ReactNode
  highlight?: boolean
  fullWidth?: boolean
}

/**
 * Header configuration
 */
export interface PDFCardHeader {
  organizationName?: string
  title: string
  subtitle?: string
  entityName: string
  entityId?: string
  badge?: {
    text: string
    color?: string
  }
}

/**
 * Footer configuration
 */
export interface PDFCardFooter {
  leftContent?: React.ReactNode
  rightContent?: React.ReactNode
}

/**
 * Props for PDFCardTemplate
 */
export interface PDFCardTemplateProps {
  header: PDFCardHeader
  sections: PDFCardSection[]
  footer?: PDFCardFooter
  className?: string
}

/**
 * Info grid component for displaying key-value pairs
 */
export function InfoGrid({ items, columns = 2 }: { items: InfoItem[]; columns?: 1 | 2 | 3 }) {
  const gridClass = {
    1: '',
    2: 'grid-cols-2',
    3: 'grid-cols-3'
  }[columns]

  return (
    <div className={`grid ${gridClass} gap-3`}>
      {items.map((item, index) => (
        <div
          key={index}
          className={`${item.fullWidth ? 'col-span-full' : ''} ${item.highlight ? 'bg-blue-50 p-2 rounded' : ''}`}
        >
          <p className="text-xs text-gray-600 mb-1">{item.label}</p>
          <p className={`text-sm ${item.highlight ? 'font-semibold' : ''}`}>
            {item.value || 'غير محدد'}
          </p>
        </div>
      ))}
    </div>
  )
}

/**
 * Table component for PDF cards
 */
export function PDFTable({
  headers,
  rows,
  className
}: {
  headers: string[]
  rows: (string | number | React.ReactNode)[][]
  className?: string
}) {
  return (
    <div className={`overflow-hidden border border-gray-300 rounded ${className}`}>
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-gray-100">
            {headers.map((header, index) => (
              <th key={index} className="p-2 text-right border-b border-gray-300 font-semibold">
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rowIndex) => (
            <tr key={rowIndex} className={rowIndex % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
              {row.map((cell, cellIndex) => (
                <td key={cellIndex} className="p-2 border-b border-gray-200">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

/**
 * Badge component for PDF cards
 */
export function PDFBadge({ text, color = 'blue' }: { text: string; color?: string }) {
  const colorClasses = {
    blue: 'bg-blue-100 text-blue-800',
    green: 'bg-green-100 text-green-800',
    red: 'bg-red-100 text-red-800',
    yellow: 'bg-yellow-100 text-yellow-800',
    gray: 'bg-gray-100 text-gray-800'
  }

  return (
    <span className={`inline-block px-2 py-1 text-xs font-medium rounded ${colorClasses[color as keyof typeof colorClasses] || colorClasses.blue}`}>
      {text}
    </span>
  )
}

/**
 * Base PDF Card Template Component
 * Provides a consistent structure for all entity PDF cards
 */
export function PDFCardTemplate({ header, sections, footer, className }: PDFCardTemplateProps) {
  const currentDate = new Date()

  return (
    <div className={`bg-white w-[750px] p-6 ${className}`} dir="rtl">
      {/* Header */}
      <div className="text-center mb-6 border-b-2 border-gray-300 pb-4">
        {header.organizationName && (
          <p className="text-sm text-gray-600 mb-1">{header.organizationName}</p>
        )}
        <h1 className="text-2xl font-bold mb-1">{header.title}</h1>
        {header.subtitle && (
          <h2 className="text-lg text-gray-600 mb-3">{header.subtitle}</h2>
        )}
        <div className="bg-blue-50 p-3 rounded-lg mt-3">
          <p className="text-lg font-semibold">{header.entityName}</p>
          {header.entityId && (
            <p className="text-sm text-gray-600">رقم التعريف: {header.entityId}</p>
          )}
          {header.badge && (
            <div className="mt-2">
              <PDFBadge text={header.badge.text} color={header.badge.color} />
            </div>
          )}
        </div>
      </div>

      {/* Sections */}
      <div className="space-y-5">
        {sections.map((section, idx) => (
          <div key={idx} className={`${section.className || ''}`}>
            <div className="flex items-center gap-2 mb-3 pb-2 border-b border-gray-200">
              {section.icon && <section.icon className="h-4 w-4" />}
              <h3 className="text-base font-bold">{section.title}</h3>
            </div>
            <div className={section.columns && section.columns > 1 ? `grid grid-cols-${section.columns} gap-3` : ''}>
              {section.content}
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="border-t-2 border-gray-300 pt-3 mt-6">
        <div className="flex justify-between text-xs text-gray-500">
          <div>
            {footer?.leftContent || (
              <>
                <p>تاريخ الطباعة: {formatDateArabic(currentDate, "PPP")}</p>
                <p>الوقت: {formatDateArabic(currentDate, "HH:mm")}</p>
              </>
            )}
          </div>
          <div className="text-left">
            {footer?.rightContent || (
              <>
                <p>جمعية أماسو الخيرية</p>
                <p>نظام إدارة الجمعية</p>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

/**
 * Wrapper component for hidden PDF rendering
 */
export function HiddenPDFWrapper({ children }: { children: React.ReactNode }) {
  return (
    <div className="fixed -left-[9999px] top-0">
      {children}
    </div>
  )
}

/**
 * Pre-built section layouts
 */
export const SectionLayouts = {
  /**
   * Two-column info grid
   */
  twoColumnInfo: (items: InfoItem[]): React.ReactNode => (
    <InfoGrid items={items} columns={2} />
  ),

  /**
   * Three-column info grid
   */
  threeColumnInfo: (items: InfoItem[]): React.ReactNode => (
    <InfoGrid items={items} columns={3} />
  ),

  /**
   * Single column info grid
   */
  singleColumnInfo: (items: InfoItem[]): React.ReactNode => (
    <InfoGrid items={items} columns={1} />
  ),

  /**
   * Highlighted metrics
   */
  metrics: (items: Array<{ label: string; value: string | number; color?: string }>): React.ReactNode => (
    <div className="grid grid-cols-3 gap-3">
      {items.map((item, index) => (
        <div
          key={index}
          className={`p-3 rounded text-center ${
            item.color === 'blue' ? 'bg-blue-50' :
            item.color === 'green' ? 'bg-green-50' :
            item.color === 'red' ? 'bg-red-50' :
            'bg-gray-50'
          }`}
        >
          <p className="text-xs text-gray-600 mb-1">{item.label}</p>
          <p className="text-lg font-bold">{item.value}</p>
        </div>
      ))}
    </div>
  ),

  /**
   * List with bullets
   */
  bulletList: (items: string[]): React.ReactNode => (
    <ul className="list-disc list-inside space-y-1">
      {items.map((item, index) => (
        <li key={index} className="text-sm">{item}</li>
      ))}
    </ul>
  ),

  /**
   * Numbered list
   */
  numberedList: (items: string[]): React.ReactNode => (
    <ol className="list-decimal list-inside space-y-1">
      {items.map((item, index) => (
        <li key={index} className="text-sm">{item}</li>
      ))}
    </ol>
  )
}

/**
 * Common icon imports for sections
 */
export { Users, Home, Activity, Heart, GraduationCap, DollarSign, FileText, Phone, MapPin } from "lucide-react"
