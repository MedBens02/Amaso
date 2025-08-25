"use client"

import React from 'react'
import { Star } from 'lucide-react'
import { cn } from '@/lib/utils'

interface StarRatingProps {
  value: number
  onChange: (value: number) => void
  maxStars?: number
  size?: 'sm' | 'md' | 'lg'
  className?: string
  disabled?: boolean
  labels?: string[]
}

export function StarRating({
  value,
  onChange,
  maxStars = 5,
  size = 'md',
  className = '',
  disabled = false,
  labels = ['سيء جداً', 'سيء', 'متوسط', 'جيد', 'ممتاز']
}: StarRatingProps) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-5 w-5', 
    lg: 'h-6 w-6'
  }

  const handleStarClick = (starIndex: number) => {
    if (disabled) return
    const newValue = starIndex + 1
    onChange(newValue === value ? 0 : newValue) // Allow deselecting by clicking same star
  }

  const handleStarHover = (starIndex: number) => {
    if (disabled) return
    // You could add hover effects here if needed
  }

  return (
    <div className={cn('flex flex-col gap-2', className)}>
      <div className="flex gap-1">
        {Array.from({ length: maxStars }, (_, index) => (
          <button
            key={index}
            type="button"
            className={cn(
              'transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary/50 rounded',
              disabled && 'cursor-not-allowed opacity-50'
            )}
            onClick={() => handleStarClick(index)}
            onMouseEnter={() => handleStarHover(index)}
            disabled={disabled}
            aria-label={`${index + 1} من ${maxStars} نجوم`}
          >
            <Star
              className={cn(
                sizeClasses[size],
                'transition-colors duration-200',
                index < value 
                  ? 'fill-yellow-400 text-yellow-400' 
                  : 'text-gray-300 hover:text-gray-400'
              )}
            />
          </button>
        ))}
      </div>
      
      {/* Show label for current rating */}
      {labels && labels[value] && (
        <span className="text-sm text-muted-foreground text-right">
          {labels[value]}
        </span>
      )}
      
      {/* Show rating number */}
      <span className="text-xs text-muted-foreground text-right">
        {value > 0 ? `${value} من ${maxStars}` : 'لم يتم التقييم'}
      </span>
    </div>
  )
}