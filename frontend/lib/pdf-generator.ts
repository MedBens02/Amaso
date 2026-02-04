/**
 * PDF Generation Utilities
 * Abstracts jspdf + html2canvas pattern from widow PDF for reuse
 */

import type jsPDF from 'jspdf'
import type html2canvas from 'html2canvas'

export interface PDFGenerationOptions {
  scale?: number
  orientation?: 'portrait' | 'landscape'
  format?: string
  margins?: {
    top: number
    right: number
    bottom: number
    left: number
  }
  multiPage?: boolean
  showProgress?: boolean
  watermark?: {
    text: string
    opacity?: number
    fontSize?: number
  }
  filename?: string
}

export interface PDFGenerationResult {
  success: boolean
  filename?: string
  error?: string
}

/**
 * Default PDF generation options
 */
const defaultOptions: PDFGenerationOptions = {
  scale: 2,
  orientation: 'portrait',
  format: 'a4',
  margins: {
    top: 10,
    right: 10,
    bottom: 10,
    left: 10
  },
  multiPage: true,
  showProgress: false
}

/**
 * Main function to generate PDF from HTML element
 * Handles dynamic imports, multi-page splitting, and error handling
 */
export async function generatePDFFromHTML(
  elementRef: React.RefObject<HTMLElement>,
  filename: string,
  options?: Partial<PDFGenerationOptions>
): Promise<PDFGenerationResult> {
  if (!elementRef.current) {
    return {
      success: false,
      error: 'Element reference is null'
    }
  }

  const opts = { ...defaultOptions, ...options }

  try {
    // Dynamically import PDF libraries (client-side only)
    const [{ default: jsPDF }, { default: html2canvas }] = await Promise.all([
      import('jspdf'),
      import('html2canvas')
    ])

    // Configure html2canvas for better Arabic text support
    const canvas = await html2canvas(elementRef.current, {
      scale: opts.scale,
      useCORS: true,
      backgroundColor: '#ffffff',
      letterRendering: true,
      allowTaint: true
    })

    // Create PDF document
    const pdf = new jsPDF({
      orientation: opts.orientation === 'landscape' ? 'l' : 'p',
      unit: 'mm',
      format: opts.format
    })

    const pageWidth = pdf.internal.pageSize.getWidth()
    const pageHeight = pdf.internal.pageSize.getHeight()

    // Calculate image dimensions with margins
    const margins = opts.margins!
    const imgWidth = pageWidth - margins.left - margins.right
    const imgHeight = (canvas.height * imgWidth) / canvas.width

    // Handle multi-page documents
    if (opts.multiPage && imgHeight > pageHeight - margins.top - margins.bottom) {
      await addMultiPageContent(pdf, canvas, imgWidth, pageHeight, margins)
    } else {
      // Single page
      const imgData = canvas.toDataURL('image/png')
      pdf.addImage(imgData, 'PNG', margins.left, margins.top, imgWidth, imgHeight)
    }

    // Add watermark if specified
    if (opts.watermark) {
      addWatermark(pdf, opts.watermark.text, {
        opacity: opts.watermark.opacity,
        fontSize: opts.watermark.fontSize
      })
    }

    // Save the PDF
    pdf.save(filename)

    return {
      success: true,
      filename
    }
  } catch (error) {
    console.error('PDF generation error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Adds multi-page content to PDF by slicing the canvas
 * Based on widow PDF implementation
 */
async function addMultiPageContent(
  pdf: jsPDF,
  canvas: HTMLCanvasElement,
  imgWidth: number,
  pageHeight: number,
  margins: { top: number; right: number; bottom: number; left: number }
): Promise<void> {
  const availableHeight = pageHeight - margins.top - margins.bottom
  const imgHeight = (canvas.height * imgWidth) / canvas.width

  let remainingHeight = imgHeight
  let yOffset = 0
  let yPosition = margins.top

  while (remainingHeight > 0) {
    const sliceHeight = Math.min(availableHeight, remainingHeight)
    const sliceCanvas = document.createElement('canvas')
    const sliceContext = sliceCanvas.getContext('2d')

    if (!sliceContext) {
      throw new Error('Failed to get canvas context')
    }

    sliceCanvas.width = canvas.width
    sliceCanvas.height = (sliceHeight * canvas.width) / imgWidth

    // Draw the slice from the main canvas
    sliceContext.drawImage(
      canvas,
      0, yOffset * canvas.width / imgWidth,
      canvas.width, sliceCanvas.height,
      0, 0,
      canvas.width, sliceCanvas.height
    )

    const sliceImgData = sliceCanvas.toDataURL('image/png')
    pdf.addImage(sliceImgData, 'PNG', margins.left, yPosition, imgWidth, sliceHeight)

    remainingHeight -= sliceHeight
    yOffset += sliceHeight

    // Add new page if more content remains
    if (remainingHeight > 0) {
      pdf.addPage()
      yPosition = margins.top
    }
  }
}

/**
 * Splits canvas into multiple pages
 * Returns array of canvas elements, one per page
 */
export function splitCanvasIntoPages(
  canvas: HTMLCanvasElement,
  pageHeight: number
): HTMLCanvasElement[] {
  const pages: HTMLCanvasElement[] = []
  const totalPages = Math.ceil(canvas.height / pageHeight)

  for (let i = 0; i < totalPages; i++) {
    const pageCanvas = document.createElement('canvas')
    const pageContext = pageCanvas.getContext('2d')

    if (!pageContext) continue

    const yStart = i * pageHeight
    const sliceHeight = Math.min(pageHeight, canvas.height - yStart)

    pageCanvas.width = canvas.width
    pageCanvas.height = sliceHeight

    pageContext.drawImage(
      canvas,
      0, yStart,
      canvas.width, sliceHeight,
      0, 0,
      canvas.width, sliceHeight
    )

    pages.push(pageCanvas)
  }

  return pages
}

/**
 * Adds watermark text to PDF
 * Can be used for "CONFIDENTIAL", "DRAFT", etc.
 */
export function addWatermark(
  pdf: jsPDF,
  text: string,
  options?: {
    opacity?: number
    fontSize?: number
    angle?: number
    color?: string
  }
): void {
  const opts = {
    opacity: options?.opacity ?? 0.3,
    fontSize: options?.fontSize ?? 50,
    angle: options?.angle ?? 45,
    color: options?.color ?? '#CCCCCC'
  }

  // Save current state
  pdf.saveGraphicsState()

  // Set watermark properties
  pdf.setGState(new pdf.GState({ opacity: opts.opacity }))
  pdf.setFontSize(opts.fontSize)
  pdf.setTextColor(opts.color)

  // Get page dimensions
  const pageWidth = pdf.internal.pageSize.getWidth()
  const pageHeight = pdf.internal.pageSize.getHeight()

  // Add watermark text at center, rotated
  const centerX = pageWidth / 2
  const centerY = pageHeight / 2

  pdf.text(text, centerX, centerY, {
    angle: opts.angle,
    align: 'center',
    baseline: 'middle'
  })

  // Restore state
  pdf.restoreGraphicsState()
}

/**
 * Generates a standardized PDF filename with date
 */
export function generatePDFFilename(
  entityType: string,
  entityName: string,
  suffix?: string
): string {
  const date = new Date().toISOString().split('T')[0]
  const safeName = entityName.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_\u0600-\u06FF]/g, '')
  const suffixPart = suffix ? `_${suffix}` : ''

  return `${entityType}_card_${safeName}_${date}${suffixPart}.pdf`
}

/**
 * Prepares HTML element for PDF generation
 * Sets proper positioning and visibility
 */
export function preparePDFElement(element: HTMLElement): void {
  // Store original styles
  const originalPosition = element.style.position
  const originalLeft = element.style.left
  const originalTop = element.style.top
  const originalVisibility = element.style.visibility

  // Store for restoration
  element.dataset.originalPosition = originalPosition
  element.dataset.originalLeft = originalLeft
  element.dataset.originalTop = originalTop
  element.dataset.originalVisibility = originalVisibility

  // Set PDF-friendly styles
  element.style.position = 'fixed'
  element.style.left = '-9999px'
  element.style.top = '0'
  element.style.visibility = 'visible'
}

/**
 * Restores HTML element after PDF generation
 */
export function cleanupPDFElement(element: HTMLElement): void {
  // Restore original styles
  if (element.dataset.originalPosition !== undefined) {
    element.style.position = element.dataset.originalPosition
  }
  if (element.dataset.originalLeft !== undefined) {
    element.style.left = element.dataset.originalLeft
  }
  if (element.dataset.originalTop !== undefined) {
    element.style.top = element.dataset.originalTop
  }
  if (element.dataset.originalVisibility !== undefined) {
    element.style.visibility = element.dataset.originalVisibility
  }

  // Clean up data attributes
  delete element.dataset.originalPosition
  delete element.dataset.originalLeft
  delete element.dataset.originalTop
  delete element.dataset.originalVisibility
}

/**
 * Utility function to wait for images to load before PDF generation
 * Useful for PDFs with external images
 */
export async function waitForImagesToLoad(element: HTMLElement): Promise<void> {
  const images = element.querySelectorAll('img')
  const imagePromises = Array.from(images).map(img => {
    if (img.complete) return Promise.resolve()

    return new Promise((resolve, reject) => {
      img.onload = resolve
      img.onerror = reject
      // Timeout after 5 seconds
      setTimeout(resolve, 5000)
    })
  })

  await Promise.all(imagePromises)
}

/**
 * Generates PDF with progress callback
 * Useful for showing progress indicators to users
 */
export async function generatePDFWithProgress(
  elementRef: React.RefObject<HTMLElement>,
  filename: string,
  onProgress: (progress: number, status: string) => void,
  options?: Partial<PDFGenerationOptions>
): Promise<PDFGenerationResult> {
  if (!elementRef.current) {
    return {
      success: false,
      error: 'Element reference is null'
    }
  }

  try {
    onProgress(10, 'جاري تحميل المكتبات...')

    const [{ default: jsPDF }, { default: html2canvas }] = await Promise.all([
      import('jspdf'),
      import('html2canvas')
    ])

    onProgress(30, 'جاري تحويل HTML إلى صورة...')

    const opts = { ...defaultOptions, ...options }
    const canvas = await html2canvas(elementRef.current, {
      scale: opts.scale,
      useCORS: true,
      backgroundColor: '#ffffff',
      letterRendering: true,
      allowTaint: true
    })

    onProgress(60, 'جاري إنشاء مستند PDF...')

    const pdf = new jsPDF({
      orientation: opts.orientation === 'landscape' ? 'l' : 'p',
      unit: 'mm',
      format: opts.format
    })

    const pageWidth = pdf.internal.pageSize.getWidth()
    const pageHeight = pdf.internal.pageSize.getHeight()
    const margins = opts.margins!
    const imgWidth = pageWidth - margins.left - margins.right
    const imgHeight = (canvas.height * imgWidth) / canvas.width

    onProgress(80, 'جاري إضافة المحتوى...')

    if (opts.multiPage && imgHeight > pageHeight - margins.top - margins.bottom) {
      await addMultiPageContent(pdf, canvas, imgWidth, pageHeight, margins)
    } else {
      const imgData = canvas.toDataURL('image/png')
      pdf.addImage(imgData, 'PNG', margins.left, margins.top, imgWidth, imgHeight)
    }

    if (opts.watermark) {
      addWatermark(pdf, opts.watermark.text, {
        opacity: opts.watermark.opacity,
        fontSize: opts.watermark.fontSize
      })
    }

    onProgress(95, 'جاري حفظ الملف...')

    pdf.save(filename)

    onProgress(100, 'تم بنجاح!')

    return {
      success: true,
      filename
    }
  } catch (error) {
    console.error('PDF generation error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}
