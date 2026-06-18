"use client"

import { KioskProvider, useKiosk } from "./store"
import { ScreenHome } from "./screen-home"
import { ScreenBrowse } from "./screen-browse"
import { ScreenRecommend } from "./screen-recommend"
import { ScreenOptions } from "./screen-options"
import { ScreenCart } from "./screen-cart"
import { ScreenPoints } from "./screen-points"
import { ScreenPayment } from "./screen-payment"
import { ScreenConfirm } from "./screen-confirm"
import { ScreenDone } from "./screen-done"

function Router() {
  const { step } = useKiosk()
  switch (step) {
    case "home":
      return <ScreenHome />
    case "browse":
      return <ScreenBrowse />
    case "recommend":
      return <ScreenRecommend />
    case "options":
      return <ScreenOptions />
    case "cart":
      return <ScreenCart />
    case "points":
      return <ScreenPoints />
    case "payment":
      return <ScreenPayment />
    case "confirm":
      return <ScreenConfirm />
    case "done":
      return <ScreenDone />
    default:
      return <ScreenHome />
  }
}

export function KioskApp() {
  return (
    <KioskProvider>
      <main className="min-h-dvh">
        <Router />
      </main>
    </KioskProvider>
  )
}
