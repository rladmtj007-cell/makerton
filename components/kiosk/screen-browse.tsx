"use client"

import { categories, getItemsByCategory, type MenuItem } from "@/lib/menu"
import { useKiosk } from "./store"
import { MenuIcon } from "./icon"
import { MenuCard } from "./menu-card"
import { TopBar } from "./top-bar"
import { CartBar } from "./cart-bar"

export function ScreenBrowse() {
  const { browseCategory, setBrowseCategory, beginOptions } = useKiosk()
  const items = getItemsByCategory(browseCategory)

  function onSelect(item: MenuItem) {
    beginOptions(item, "browse")
  }

  return (
    <div className="flex min-h-dvh flex-col">
      <TopBar title="메뉴 고르기" />

      <div className="mx-auto flex w-full max-w-6xl flex-1 gap-4 px-4 py-5">
        {/* Category rail */}
        <nav
          aria-label="메뉴 종류"
          className="flex w-32 shrink-0 flex-col gap-3 sm:w-40"
        >
          {categories.map((c) => {
            const active = c.id === browseCategory
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => setBrowseCategory(c.id)}
                aria-pressed={active}
                className={`flex flex-col items-center gap-2 rounded-3xl border-2 px-2 py-4 text-center transition focus:outline-none focus-visible:ring-4 focus-visible:ring-ring ${
                  active
                    ? "border-primary bg-primary text-primary-foreground shadow-md"
                    : "border-border bg-card text-card-foreground hover:bg-secondary"
                }`}
              >
                <MenuIcon name={c.icon} className="h-9 w-9" />
                <span className="text-lg font-extrabold leading-tight">{c.name}</span>
              </button>
            )
          })}
        </nav>

        {/* Items grid */}
        <div className="grid flex-1 auto-rows-max grid-cols-2 gap-4 lg:grid-cols-3">
          {items.map((item) => (
            <MenuCard key={item.id} item={item} onSelect={onSelect} />
          ))}
        </div>
      </div>

      <CartBar />
    </div>
  )
}
