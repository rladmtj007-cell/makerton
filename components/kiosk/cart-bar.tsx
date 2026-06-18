"use client"

import { ShoppingCart } from "lucide-react"
import { formatWon } from "@/lib/menu"
import { useKiosk } from "./store"

export function CartBar() {
  const { cartCount, cartTotal, go } = useKiosk()
  if (cartCount === 0) return null

  return (
    <div className="sticky bottom-0 z-30 border-t-2 border-border bg-background/95 px-5 py-4 backdrop-blur">
      <button
        type="button"
        onClick={() => go("cart")}
        className="mx-auto flex w-full max-w-3xl items-center justify-between gap-4 rounded-3xl bg-accent px-7 py-6 text-accent-foreground shadow-lg transition hover:brightness-105 focus:outline-none focus-visible:ring-4 focus-visible:ring-ring"
      >
        <span className="flex items-center gap-3 text-2xl font-extrabold">
          <span className="relative">
            <ShoppingCart className="h-9 w-9" aria-hidden="true" />
            <span className="absolute -right-3 -top-3 flex h-7 w-7 items-center justify-center rounded-full bg-primary text-base font-black text-primary-foreground">
              {cartCount}
            </span>
          </span>
          담은 메뉴 보기
        </span>
        <span className="text-3xl font-black">{formatWon(cartTotal)}</span>
      </button>
    </div>
  )
}
