"use client"

import { Ear, Volume2 } from "lucide-react"
import { useKiosk } from "./store"

/**
 * Persistent bar shown while voice mode is on, telling the user whether the
 * kiosk is currently talking or listening. Large, high-contrast, fixed position.
 */
export function VoiceIndicator() {
  const { voiceMode, speech, setVoiceMode } = useKiosk()
  if (!voiceMode) return null

  const listening = speech.listening
  const speaking = speech.speaking

  return (
    <div className="pointer-events-none fixed inset-x-0 top-0 z-50 flex justify-center px-4 pt-4">
      <div className="pointer-events-auto flex w-full max-w-3xl items-center gap-4 rounded-3xl border-2 border-primary bg-primary px-6 py-4 text-primary-foreground shadow-xl">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-primary-foreground/20">
          {listening ? (
            <div className="flex items-end gap-1" aria-hidden="true">
              <span className="sound-bar h-6 w-2 rounded-full bg-primary-foreground" style={{ animationDelay: "0ms" }} />
              <span className="sound-bar h-8 w-2 rounded-full bg-primary-foreground" style={{ animationDelay: "150ms" }} />
              <span className="sound-bar h-5 w-2 rounded-full bg-primary-foreground" style={{ animationDelay: "300ms" }} />
            </div>
          ) : speaking ? (
            <Volume2 className="h-8 w-8" aria-hidden="true" />
          ) : (
            <Ear className="h-8 w-8" aria-hidden="true" />
          )}
        </div>
        <p className="flex-1 text-2xl font-bold leading-tight">
          {listening
            ? "지금 말씀하세요. 듣고 있어요"
            : speaking
              ? "안내 중이에요"
              : "음성 도우미가 켜져 있어요"}
        </p>
        <button
          type="button"
          onClick={() => setVoiceMode(false)}
          className="shrink-0 rounded-2xl bg-primary-foreground/15 px-5 py-3 text-xl font-bold underline-offset-2 hover:bg-primary-foreground/25"
        >
          음성 끄기
        </button>
      </div>
    </div>
  )
}
