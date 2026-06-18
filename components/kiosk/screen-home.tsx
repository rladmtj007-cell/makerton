"use client"

import { useState } from "react"
import { Mic, ShoppingBag, Hand } from "lucide-react"
import { categories } from "@/lib/menu"
import { extractKeywords, matchCategory, matchMenu } from "@/lib/intent"
import { useKiosk } from "./store"
import { MenuIcon } from "./icon"

const GREETING =
  "안녕하세요. 무엇을 드시고 싶으세요? 편하게 말씀해 주세요. 제가 알아듣고 찾아 드릴게요."

export function ScreenHome() {
  const {
    speech,
    setVoiceMode,
    setRecommendations,
    setBrowseCategory,
    go,
  } = useKiosk()
  const [error, setError] = useState("")

  function handleUtterance(text: string) {
    // pull keywords out of whatever the user said, then match menus by them
    const heard = extractKeywords(text)
    const results = matchMenu(text)
    if (results.length > 0) {
      setRecommendations(
        results.map((r) => r.item),
        heard,
      )
      go("recommend")
      return
    }
    const cat = matchCategory(text)
    if (cat) {
      setBrowseCategory(cat)
      go("browse")
      return
    }
    // nothing recognized: invite them to try again in their own words
    speech
      .speak("죄송해요. 잘 못 들었어요. 드시고 싶은 맛이나 종류를 다시 한 번 말씀해 주세요.")
      .then(() => {
        speech.listen(handleUtterance)
      })
  }

  async function startVoice() {
    if (!speech.supported) {
      setError("이 기기에서는 음성 인식을 사용할 수 없어요. 아래에서 메뉴를 직접 골라 주세요.")
      return
    }
    setError("")
    setVoiceMode(true)
    await speech.speak(GREETING)
    speech.listen(handleUtterance)
  }

  function browse() {
    setVoiceMode(false)
    go("browse")
  }

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-4xl flex-col items-center justify-center gap-8 px-6 py-12">
      <div className="flex flex-col items-center gap-3 text-center">
        <span className="rounded-full bg-secondary px-5 py-2 text-xl font-bold text-secondary-foreground">
          말로 주문하는 키오스크
        </span>
        <h1 className="text-balance text-6xl font-black leading-tight text-foreground">
          Vorder
        </h1>
        <p className="text-pretty text-3xl font-bold leading-relaxed text-foreground">
          메뉴 이름을 몰라도 괜찮아요.
          <br />
          말로 설명하면 제가 찾아 드릴게요.
        </p>
      </div>

      {/* Primary voice CTA */}
      <button
        type="button"
        onClick={startVoice}
        className="animate-pulse-ring flex w-full max-w-2xl flex-col items-center gap-4 rounded-[2rem] bg-primary px-8 py-10 text-primary-foreground shadow-xl transition hover:brightness-105 focus:outline-none focus-visible:ring-4 focus-visible:ring-ring"
      >
        <span className="flex h-24 w-24 items-center justify-center rounded-full bg-primary-foreground/20">
          <Mic className="h-14 w-14" aria-hidden="true" />
        </span>
        <span className="text-balance text-center text-4xl font-black leading-tight">
          음성으로 도와드릴까요?
        </span>
        <span className="text-2xl font-bold opacity-90">눌러서 말씀하세요</span>
      </button>

      {/* keyword hints: short words, not a fixed sentence to recite */}
      <div className="flex w-full max-w-2xl flex-col items-center gap-3">
        <p className="text-xl font-bold text-muted-foreground">
          이렇게 편하게 말씀하셔도 돼요
        </p>
        <div className="flex flex-wrap items-center justify-center gap-2">
          {["시원한 거", "따뜻한 거", "단 거", "커피", "초코", "과일"].map((w) => (
            <span
              key={w}
              className="rounded-full bg-secondary px-4 py-2 text-xl font-bold text-secondary-foreground"
            >
              {`"${w}"`}
            </span>
          ))}
        </div>
      </div>

      {error && (
        <p
          role="alert"
          className="max-w-2xl rounded-2xl bg-muted px-5 py-4 text-center text-xl font-bold text-danger"
        >
          {error}
        </p>
      )}

      {/* Direct touch path */}
      <button
        type="button"
        onClick={browse}
        className="flex w-full max-w-2xl items-center justify-center gap-4 rounded-3xl border-2 border-border bg-card px-8 py-7 text-card-foreground shadow-sm transition hover:bg-secondary focus:outline-none focus-visible:ring-4 focus-visible:ring-ring"
      >
        <Hand className="h-10 w-10 text-primary" aria-hidden="true" />
        <span className="text-3xl font-extrabold">직접 손으로 메뉴 보기</span>
      </button>

      {/* Quick category chips */}
      <div className="flex w-full max-w-2xl flex-wrap items-center justify-center gap-3">
        {categories.map((c) => (
          <button
            key={c.id}
            type="button"
            onClick={() => {
              setVoiceMode(false)
              setBrowseCategory(c.id)
              go("browse")
            }}
            className="flex items-center gap-2 rounded-full border-2 border-border bg-card px-5 py-3 text-xl font-bold text-card-foreground transition hover:border-primary hover:text-primary"
          >
            <MenuIcon name={c.icon} className="h-6 w-6" />
            {c.name}
          </button>
        ))}
      </div>

      <p className="flex items-center gap-2 text-lg font-bold text-muted-foreground">
        <ShoppingBag className="h-5 w-5" aria-hidden="true" />
        주문은 천천히 하셔도 괜찮습니다
      </p>
    </div>
  )
}
