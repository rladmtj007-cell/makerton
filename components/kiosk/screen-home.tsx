"use client"

import { useState } from "react"
import Image from "next/image"
import { Mic, Hand } from "lucide-react"
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
    <div className="mx-auto flex min-h-dvh w-full max-w-4xl flex-col items-center justify-center gap-8 px-6 py-10">
      {/* Brand logo with team name baked in */}
      <div className="flex flex-col items-center gap-4 text-center">
        <Image
          src="/malhaeduo-logo.png"
          alt="말해듀오 - 어르신과 함께하는 음성 주문 도우미"
          width={300}
          height={300}
          priority
          className="h-auto w-56 sm:w-64"
        />
        <p className="text-pretty text-3xl font-bold leading-relaxed text-foreground">
          메뉴 이름을 몰라도 괜찮아요.
          <br />
          말로 설명하면 제가 찾아 드릴게요.
        </p>
      </div>

      {/* Two clear ways to start */}
      <div className="flex w-full max-w-2xl flex-col gap-4">
        <button
          type="button"
          onClick={startVoice}
          className="animate-pulse-ring flex w-full items-center justify-center gap-5 rounded-[2rem] bg-primary px-8 py-9 text-primary-foreground shadow-xl transition hover:brightness-105 focus:outline-none focus-visible:ring-4 focus-visible:ring-ring"
        >
          <span className="flex h-20 w-20 items-center justify-center rounded-full bg-primary-foreground/20">
            <Mic className="h-12 w-12" aria-hidden="true" />
          </span>
          <span className="text-balance text-left text-4xl font-black leading-tight">
            음성 주문하기
          </span>
        </button>

        <button
          type="button"
          onClick={browse}
          className="flex w-full items-center justify-center gap-5 rounded-[2rem] border-4 border-primary bg-card px-8 py-9 text-card-foreground shadow-sm transition hover:bg-secondary focus:outline-none focus-visible:ring-4 focus-visible:ring-ring"
        >
          <span className="flex h-20 w-20 items-center justify-center rounded-full bg-secondary">
            <Hand className="h-12 w-12 text-primary" aria-hidden="true" />
          </span>
          <span className="text-4xl font-black leading-tight">직접 주문하기</span>
        </button>
      </div>

      {/* keyword hints: short words, not a fixed sentence to recite */}
      <div className="flex w-full max-w-2xl flex-col items-center gap-3">
        <p className="text-xl font-bold text-muted-foreground">
          이렇게 편하게 말씀하셔도 돼요
        </p>
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
      </div>

      {error && (
        <p
          role="alert"
          className="max-w-2xl rounded-2xl bg-muted px-5 py-4 text-center text-xl font-bold text-danger"
        >
          {error}
        </p>
      )}

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

      <p className="text-lg font-bold text-muted-foreground">
        주문은 천천히 하셔도 괜찮습니다
      </p>
    </div>
  )
}
