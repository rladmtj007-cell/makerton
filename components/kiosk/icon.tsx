"use client"

import {
  Blend,
  Cake,
  Coffee,
  Cookie,
  Croissant,
  CupSoda,
  Leaf,
  type LucideIcon,
} from "lucide-react"

const map: Record<string, LucideIcon> = {
  Coffee,
  CupSoda,
  Leaf,
  Blend,
  Cake,
  Cookie,
  Croissant,
}

export function MenuIcon({
  name,
  className,
}: {
  name: string
  className?: string
}) {
  const Cmp = map[name] ?? Coffee
  return <Cmp className={className} aria-hidden="true" />
}
