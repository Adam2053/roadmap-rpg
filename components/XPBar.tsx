'use client'

import { useEffect, useState } from 'react'

interface XPBarProps {
  label: string
  current?: number
  max?: number
  colorClass: string
  icon: string
}

export default function XPBar({
  label,
  current = 0,
  max = 1000,
  colorClass,
  icon,
}: XPBarProps) {
  const safeCurrent = typeof current === 'number' ? current : 0
  const safeMax = typeof max === 'number' && max > 0 ? max : 1

  const pct = Math.min(100, (safeCurrent / safeMax) * 100)

  const [width, setWidth] = useState(0)

  useEffect(() => {
    const t = setTimeout(() => setWidth(pct), 100)
    return () => clearTimeout(t)
  }, [pct])

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-2">
          <span>{icon}</span>
          <span className="font-medium text-foreground/80">
            {label}
          </span>
        </div>

        <span className="text-muted-foreground font-mono text-xs">
          {safeCurrent.toLocaleString()} XP
        </span>
      </div>

      <div className="h-2 bg-white/5 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-1000 ease-out ${colorClass}`}
          style={{ width: `${width}%` }}
        />
      </div>
    </div>
  )
}