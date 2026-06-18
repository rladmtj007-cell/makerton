"use client"

import { formatWon, type MenuItem } from "@/lib/menu"
import { MenuIcon } from "./icon"

export function MenuCard({
  item,
  onSelect,
  highlight = false,
}: {
  item: MenuItem
  onSelect: (item: MenuItem) => void
  highlight?: boolean
}) {
  return (
    <button
      type="button"
      onClick={() => onSelect(item)}
      className={`group flex w-full flex-col overflow-hidden rounded-3xl border-2 bg-card text-left shadow-sm transition hover:-translate-y-1 hover:shadow-lg focus:outline-none focus-visible:ring-4 focus-visible:ring-ring ${
        highlight ? "border-primary ring-4 ring-primary/30" : "border-border"
      }`}
    >
      <div className="relative flex aspect-[4/3] items-center justify-center overflow-hidden bg-secondary">
        {item.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={item.image || "/placeholder.svg"}
            alt={item.name}
            className="h-full w-full object-cover"
          />
        ) : (
          <MenuIcon name={item.icon} className="h-20 w-20 text-secondary-foreground/70" />
        )}
      </div>
      <div className="flex flex-1 flex-col gap-1 p-4">
        <h3 className="text-2xl font-bold leading-tight text-card-foreground">{item.name}</h3>
        <p className="line-clamp-2 text-base text-muted-foreground">{item.description}</p>
        <p className="mt-auto pt-2 text-2xl font-extrabold text-primary">
          {formatWon(item.price)}
        </p>
      </div>
    </button>
  )
}
