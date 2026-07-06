/**
 * Avatar display helpers — pure presentation, not business logic. Shared by
 * PlayerCard and PlayerProfilePage (previously duplicated in both; Sprint H1).
 */

const AVATAR_COLORS = [
  'bg-red-500', 'bg-orange-500', 'bg-amber-500', 'bg-green-600',
  'bg-teal-500', 'bg-blue-500', 'bg-indigo-500', 'bg-purple-500',
  'bg-pink-500', 'bg-rose-500',
]

export function getAvatarColor(name: string): string {
  const index = (name.codePointAt(0) ?? 0) % AVATAR_COLORS.length
  return AVATAR_COLORS[index] ?? 'bg-gray-500'
}

export function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) return (parts[0]?.[0] ?? '').toUpperCase()
  return ((parts[0]?.[0] ?? '') + (parts[parts.length - 1]?.[0] ?? '')).toUpperCase()
}
