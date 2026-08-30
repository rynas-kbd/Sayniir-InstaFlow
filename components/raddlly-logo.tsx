import Image from 'next/image'
import { cn } from '@/lib/utils'

interface RaddllyLogoProps {
  /** Size of the icon in px */
  iconSize?: number
  /** Show the wordmark next to the icon */
  showWordmark?: boolean
  /** Custom text for wordmark */
  text?: string
  className?: string
  wordmarkClassName?: string
}

/** Raddlly icon using the official PNG logo mark */
export function RaddllyIcon({ size = 34, className }: { size?: number; className?: string }) {
  return (
    <Image
      src="/raddlly-logo.png"
      alt="Raddlly"
      width={size}
      height={size}
      style={{ width: `${size}px`, height: `${size}px` }}
      className={cn('object-contain shrink-0', className)}
      priority
    />
  )
}

/** Full brand lockup: icon + optional wordmark */
export function RaddllyLogo({
  iconSize = 34,
  showWordmark = true,
  text = 'Raddlly',
  className,
  wordmarkClassName,
}: RaddllyLogoProps) {
  return (
    <span className={cn('inline-flex items-center gap-2.5', className)}>
      <RaddllyIcon size={iconSize} />
      {showWordmark && (
        <span
          className={cn(
            'font-heading text-[22px] sm:text-2xl font-extrabold tracking-tight leading-none text-[var(--organic-text)]',
            wordmarkClassName,
          )}
        >
          {text}
        </span>
      )}
    </span>
  )
}
