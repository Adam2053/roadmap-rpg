const CATEGORY_STYLES = {
  Body: 'bg-orange-500/20 text-orange-300 border-orange-500/30',
  Skills: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  Mindset: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
  Career: 'bg-green-500/20 text-green-300 border-green-500/30',
}

const CATEGORY_ICONS = {
  Body: '💪',
  Skills: '🧠',
  Mindset: '✨',
  Career: '🚀',
}

export default function CategoryBadge({ category }: { category: string }) {
  const style = CATEGORY_STYLES[category as keyof typeof CATEGORY_STYLES] || 'bg-white/10 text-white'
  const icon = CATEGORY_ICONS[category as keyof typeof CATEGORY_ICONS] || '📌'

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md border text-xs font-medium ${style}`}>
      {icon} {category}
    </span>
  )
}
