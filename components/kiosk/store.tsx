"use client"

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react"
import { useSpeech, type UseSpeechResult } from "@/hooks/use-speech"
import type { CategoryId, MenuItem } from "@/lib/menu"

export type Step =
  | "home"
  | "browse"
  | "recommend"
  | "options"
  | "cart"
  | "points"
  | "payment"
  | "confirm"
  | "done"

export type Temp = "hot" | "ice"
export type Size = "small" | "large"
export type PaymentMethod = "card" | "mobile" | "gift"

export interface CartLine {
  lineId: string
  item: MenuItem
  temperature: Temp | null
  size: Size | null
  quantity: number
  unitPrice: number
}

interface KioskState {
  step: Step
  voiceMode: boolean
  cart: CartLine[]
  recommendations: MenuItem[]
  heardKeywords: string[]
  selectedItem: MenuItem | null
  optionsReturnTo: Step
  browseCategory: CategoryId
  phone: string
  pointsEarned: number
  payment: PaymentMethod | null
  speech: UseSpeechResult

  go: (step: Step) => void
  setVoiceMode: (on: boolean) => void
  setRecommendations: (items: MenuItem[], keywords?: string[]) => void
  setBrowseCategory: (c: CategoryId) => void
  beginOptions: (item: MenuItem, returnTo: Step) => void
  addToCart: (line: Omit<CartLine, "lineId">) => void
  removeLine: (lineId: string) => void
  changeQuantity: (lineId: string, delta: number) => void
  clearCart: () => void
  setPhone: (phone: string) => void
  setPointsEarned: (n: number) => void
  setPayment: (p: PaymentMethod | null) => void
  cartTotal: number
  cartCount: number
  reset: () => void
  /** speak only when voice mode is active */
  say: (text: string) => Promise<void>
}

const KioskContext = createContext<KioskState | null>(null)

const SIZE_UPCHARGE = 500

export function KioskProvider({ children }: { children: ReactNode }) {
  const speech = useSpeech()
  const [step, setStep] = useState<Step>("home")
  const [voiceMode, setVoiceModeState] = useState(false)
  const [cart, setCart] = useState<CartLine[]>([])
  const [recommendations, setRecommendationsState] = useState<MenuItem[]>([])
  const [heardKeywords, setHeardKeywords] = useState<string[]>([])
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null)
  const [optionsReturnTo, setOptionsReturnTo] = useState<Step>("browse")
  const [browseCategory, setBrowseCategoryState] = useState<CategoryId>("coffee")
  const [phone, setPhoneState] = useState("")
  const [pointsEarned, setPointsEarnedState] = useState(0)
  const [payment, setPaymentState] = useState<PaymentMethod | null>(null)

  const go = useCallback(
    (next: Step) => {
      speech.cancelAll()
      setStep(next)
    },
    [speech],
  )

  const setVoiceMode = useCallback(
    (on: boolean) => {
      if (!on) speech.cancelAll()
      setVoiceModeState(on)
    },
    [speech],
  )

  const setRecommendations = useCallback((items: MenuItem[], keywords: string[] = []) => {
    setRecommendationsState(items)
    setHeardKeywords(keywords)
  }, [])

  const setBrowseCategory = useCallback((c: CategoryId) => {
    setBrowseCategoryState(c)
  }, [])

  const beginOptions = useCallback(
    (item: MenuItem, returnTo: Step) => {
      setSelectedItem(item)
      setOptionsReturnTo(returnTo)
      speech.cancelAll()
      setStep("options")
    },
    [speech],
  )

  const addToCart = useCallback((line: Omit<CartLine, "lineId">) => {
    setCart((prev) => [...prev, { ...line, lineId: `${Date.now()}-${Math.random()}` }])
  }, [])

  const removeLine = useCallback((lineId: string) => {
    setCart((prev) => prev.filter((l) => l.lineId !== lineId))
  }, [])

  const changeQuantity = useCallback((lineId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((l) =>
          l.lineId === lineId ? { ...l, quantity: Math.max(0, l.quantity + delta) } : l,
        )
        .filter((l) => l.quantity > 0),
    )
  }, [])

  const clearCart = useCallback(() => setCart([]), [])
  const setPhone = useCallback((p: string) => setPhoneState(p), [])
  const setPointsEarned = useCallback((n: number) => setPointsEarnedState(n), [])
  const setPayment = useCallback((p: PaymentMethod | null) => setPaymentState(p), [])

  const reset = useCallback(() => {
    speech.cancelAll()
    setCart([])
    setRecommendationsState([])
    setHeardKeywords([])
    setSelectedItem(null)
    setPhoneState("")
    setPointsEarnedState(0)
    setPaymentState(null)
    setVoiceModeState(false)
    setStep("home")
  }, [speech])

  const cartTotal = useMemo(
    () => cart.reduce((sum, l) => sum + l.unitPrice * l.quantity, 0),
    [cart],
  )
  const cartCount = useMemo(
    () => cart.reduce((sum, l) => sum + l.quantity, 0),
    [cart],
  )

  const say = useCallback(
    (text: string) => (voiceMode ? speech.speak(text) : Promise.resolve()),
    [voiceMode, speech],
  )

  const value: KioskState = {
    step,
    voiceMode,
    cart,
    recommendations,
    heardKeywords,
    selectedItem,
    optionsReturnTo,
    browseCategory,
    phone,
    pointsEarned,
    payment,
    speech,
    go,
    setVoiceMode,
    setRecommendations,
    setBrowseCategory,
    beginOptions,
    addToCart,
    removeLine,
    changeQuantity,
    clearCart,
    setPhone,
    setPointsEarned,
    setPayment,
    cartTotal,
    cartCount,
    reset,
    say,
  }

  return <KioskContext.Provider value={value}>{children}</KioskContext.Provider>
}

export function useKiosk() {
  const ctx = useContext(KioskContext)
  if (!ctx) throw new Error("useKiosk must be used within KioskProvider")
  return ctx
}

export function computeUnitPrice(item: MenuItem, size: Size | null): number {
  return item.price + (size === "large" ? SIZE_UPCHARGE : 0)
}

export { SIZE_UPCHARGE }
