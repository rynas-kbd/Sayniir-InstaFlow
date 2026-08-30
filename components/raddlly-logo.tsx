import Image from 'next/image'
import { cn } from '@/lib/utils'

interface RaddllyLogoProps {
  /** Size of the icon in px */
  iconSize?: number
  /** Show the wordmark "Raddlly" next to the icon */
  showWordmark?: boolean
  className?: string
  wordmarkClassName?: string
}

/** Raddlly icon using the official PNG logo mark */
export function RaddllyIcon({ size = 32, className }: { size?: number; className?: string }) {
  return (
    <Image
      src="/raddlly-logo.png"
      alt="Raddlly"
      width={size}
      height={size}
      style={{ width: 'auto', height: 'auto' }}
      className={cn('object-contain', className)}
      priority
    />
  )
}

/** Full brand lockup: icon + optional wordmark */
export function RaddllyLogo({
  iconSize = 28,
  showWordmark = true,
  className,
  wordmarkClassName,
}: RaddllyLogoProps) {
  return (
    <span className={cn('inline-flex items-center gap-2', className)}>
      <RaddllyIcon size={iconSize} />
      {showWordmark && (
        <span
          className={cn(
            'font-heading text-xl font-bold tracking-tight leading-none',
            wordmarkClassName,
          )}
        >
          Raddlly
        </span>
      )}
    </span>
  )
}
