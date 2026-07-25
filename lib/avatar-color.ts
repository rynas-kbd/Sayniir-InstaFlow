const AVATAR_PALETTE = [
  'bg-terracotta-100 text-terracotta-700',
  'bg-sage-100 text-sage-700',
  'bg-sand-300 text-sand-800',
  'bg-terracotta-200 text-terracotta-800',
  'bg-sage-200 text-sage-800',
  'bg-sand-400 text-sand-900',
]

export function getAvatarColor(id: string): string {
  let hash = 0
  for (let i = 0; i < id.length; i++) {
    hash = id.charCodeAt(i) + ((hash << 5) - hash)
  }
  const index = Math.abs(hash) % AVATAR_PALETTE.length
  return AVATAR_PALETTE[index]
}

export function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[1][0]).toUpperCase()
}
