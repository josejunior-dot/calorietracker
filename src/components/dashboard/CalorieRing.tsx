"use client"

import { useEffect, useState } from "react"

interface CalorieRingProps {
  consumed: number
  burned: number
  target: number
}

export function CalorieRing({ consumed, burned, target }: CalorieRingProps) {
  const [animatedProgress, setAnimatedProgress] = useState(0)
  const netConsumed = consumed - burned
  const remaining = Math.max(target - netConsumed, 0)
  const progress = Math.min(Math.max(netConsumed / target, 0), 1.15)

  useEffect(() => {
    const timer = setTimeout(() => setAnimatedProgress(progress), 100)
    return () => clearTimeout(timer)
  }, [progress])

  const radius = 85
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference * (1 - Math.min(animatedProgress, 1))

  const getColor = () => {
    if (netConsumed > target) return "#ef4444"
    if (progress > 0.8) return "#eab308"
    return "#22c55e"
  }

  const getGlowColor = () => {
    if (netConsumed > target) return "rgba(239, 68, 68, 0.3)"
    if (progress > 0.8) return "rgba(234, 179, 8, 0.3)"
    return "rgba(34, 197, 94, 0.3)"
  }

  return (
    <div className="relative flex items-center justify-center" style={{ width: 200, height: 200 }}>
      <svg width="200" height="200" className="transform -rotate-90">
        <defs>
          <filter id="glow">
            <feGaussianBlur stdDeviation="3" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        {/* Background ring */}
        <circle
          cx="100"
          cy="100"
          r={radius}
          fill="none"
          stroke="var(--muted)"
          strokeWidth="12"
          opacity="0.5"
        />
        {/* Progress ring */}
        <circle
          cx="100"
          cy="100"
          r={radius}
          fill="none"
          stroke={getColor()}
          strokeWidth="12"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          filter="url(#glow)"
          className="transition-all duration-1000 ease-out"
          style={{
            filter: `drop-shadow(0 0 6px ${getGlowColor()})`,
          }}
        />
      </svg>
      {/* Center text overlay */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span
          className="text-4xl font-bold tracking-tight"
          style={{ color: netConsumed > target ? "#ef4444" : "var(--foreground)" }}
        >
          {Math.round(remaining)}
        </span>
        <span className="text-sm text-muted-foreground mt-0.5">
          {netConsumed > target ? "excedido" : "restantes"}
        </span>
      </div>
    </div>
  )
}
