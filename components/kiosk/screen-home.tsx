"use client"

import { useState } from "react"
import { Mic, Hand } from "lucide-react"
import { extractKeywords, matchCategory, matchMenu } from "@/lib/intent"
import { useKiosk } from "./store"

const GREETING =
  "안녕하세요. 무엇을 드시고 싶으세요? 편하게 말씀해 주세요. 제가 알아듣고 찾아 드릴게요."

export function ScreenHome() {
  const { speech, setVoiceMode, setRecommendations, setBrowseCategory, go } = useKiosk()
  const [error, setError] = useState("")

  function handleUtterance(text: string) {
    // pull keywords out of whatever the user said, then match menus by them.
    // we surface the top 2 so the recommend screen can show big photo cards.
    const heard = extractKeywords(text)
    const results = matchMenu(text, 2)
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
    <div className="mx-auto flex min-h-dvh w-full max-w-3xl flex-col px-5 py-6">
      {/* HERO: simple text-only greeting */}
      <section className="flex flex-1 flex-col items-center justify-center gap-5 text-center">
        <h1 className="text-balance text-5xl font-black leading-tight text-foreground">
          말로 주문하는 키오스크
        </h1>
        <p className="text-pretty text-2xl font-bold leading-relaxed text-muted-foreground sm:text-3xl">
          메뉴 이름을 몰라도 괜찮아요.
          <br />
          말로 설명하면 제가 찾아 드릴게요.
        </p>
      </section>

      {/* Two big tiles, stacked vertically */}
      <section className="mt-6 flex flex-col gap-4">
        <button
          type="button"
          onClick={startVoice}
          className="animate-pulse-ring flex items-center justify-center gap-6 rounded-[2rem] bg-primary px-8 py-8 text-primary-foreground shadow-xl transition hover:brightness-105 focus:outline-none focus-visible:ring-4 focus-visible:ring-ring"
        >
          <span className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-primary-foreground/20">
            <Mic className="h-12 w-12" aria-hidden="true" />
          </span>
          <span className="flex flex-col items-start">
            <span className="text-4xl font-black leading-tight">음성 주문하기</span>
            <span className="text-xl font-bold opacity-90">눌러서 말씀하세요</span>
          </span>
        </button>

        <button
          type="button"
          onClick={browse}
          className="flex items-center justify-center gap-6 rounded-[2rem] border-4 border-primary bg-card px-8 py-8 text-card-foreground shadow-sm transition hover:bg-secondary focus:outline-none focus-visible:ring-4 focus-visible:ring-ring"
        >
          <span className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-secondary">
            <Hand className="h-12 w-12 text-primary" aria-hidden="true" />
          </span>
          <span className="flex flex-col items-start">
            <span className="text-4xl font-black leading-tight text-primary">직접 주문하기</span>
            <span className="text-xl font-bold text-muted-foreground">손으로 골라 보세요</span>
          </span>
        </button>
      </section>

      {/* keyword hints: short words, not a fixed sentence to recite */}
      <section className="mt-6 flex flex-col items-center gap-3">
        <p className="text-xl font-bold text-muted-foreground">이렇게 편하게 말씀하셔도 돼요</p>
        <div className="flex flex-wrap items-center justify-center gap-2">
          {["시원한 거", "따뜻한 거", "단 거", "커피", "초코", "과일"].map((w) => (
            <span
              key={w}
              className="rounded-full bg-pink px-4 py-2 text-xl font-bold text-pink-foreground"
            >
              {`"${w}"`}
            </span>
          ))}
        </div>
      </section>

      {error && (
        <p
          role="alert"
          className="mt-5 rounded-2xl bg-muted px-5 py-4 text-center text-xl font-bold text-danger"
        >
          {error}
        </p>
      )}

      <p className="mt-6 text-center text-lg font-bold text-muted-foreground">
        주문은 천천히 하셔도 괜찮습니다
      </p>
    </div>
  )
}
