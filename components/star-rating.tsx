'use client'

import { StarIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

interface StarRatingProps {
  rating: number
  onChange?: (rating: number) => void
  readonly?: boolean
  size?: 'sm' | 'md' | 'lg'
}

export function StarRating({
  rating,
  onChange,
  readonly = false,
  size = 'md',
}: StarRatingProps) {
  const sizeClasses = {
    sm: 'size-4',
    md: 'size-5',
    lg: 'size-6',
  }

  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={readonly}
          onClick={() => onChange?.(star)}
          className={cn(
            'transition-all duration-200 ease-out',
            readonly ? 'cursor-default' : 'cursor-pointer hover:scale-125 active:scale-110'
          )}
          aria-label={`Rate ${star} star${star !== 1 ? 's' : ''}`}
        >
          <StarIcon
            className={cn(
              sizeClasses[size],
              'transition-colors duration-200',
              star <= rating
                ? 'fill-accent text-accent'
                : 'fill-transparent text-muted-foreground/40'
            )}
          />
        </button>
      ))}
    </div>
  )
}
