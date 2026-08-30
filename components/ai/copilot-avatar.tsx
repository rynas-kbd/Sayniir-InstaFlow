'use client'

import { createAvatar } from '@bible-strong/avatar-react'
import avatarJson from './copilot-avatar.json'


// Create typed concrete avatar component using @bible-strong/avatar-react
const StrobiAvatar = createAvatar(avatarJson as any)

export function CopilotAvatar({
  size = 36,
  animation = 'idle',
  expression,
  className,
}: {
  size?: number | string
  animation?: 'idle' | 'thinking' | 'talking'
  expression?: 'neutral' | 'thinking' | 'talking' | 'happy'
  className?: string
}) {
  return (
    <div className={className} style={{ width: size, height: size }}>
      <StrobiAvatar
        size={size}
        {...(expression ? { expression } : { animation })}
        ariaLabel="Strobi Copilot Procedural Avatar"
      />
    </div>
  )
}
