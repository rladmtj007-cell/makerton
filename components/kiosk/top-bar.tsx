"use client"

import { Home, Mic, MicOff } from "lucide-react"
import { useKiosk } from "./store"

export function TopBar({ title }: { title: string }) {
  const { go, reset, voiceMode, setVoiceMode, speech } = useKiosk()

  function toggleVoice() {
    if (voiceMode) {
      setVoiceMode(false)
    } else if (speech.supported) {
      setVoiceMode(true)
    }
  }

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between gap-4 border-b-2 border-border bg-background/95 px-5 py-4 backdrop-blur">
      <button
        type="button"
        onClick={reset}
        className="flex items-center gap-2 rounded-2xl border-2 border-border bg-card px-5 py-3 text-xl font-bold text-card-foreground transition hover:bg-secondary focus:outline-none focus-visible:ring-4 focus-visible:ring-ring"
      >
        <Home className="h-6 w-6" aria-hidden="true" />
        처음으로
      </button>

      <h1 className="truncate text-2xl font-black text-foreground">{title}</h1>

      <button
        type="button"
        onClick={toggleVoice}
        aria-pressed={voiceMode}
        className={`flex items-center gap-2 rounded-2xl border-2 px-5 py-3 text-xl font-bold transition focus:outline-none focus-visible:ring-4 focus-visible:ring-ring ${
          voiceMode
            ? "border-primary bg-primary text-primary-foreground"
            : "border-border bg-card text-card-foreground hover:bg-secondary"
        }`}
      >
        {voiceMode ? (
          <>
            <Mic className="h-6 w-6" aria-hidden="true" /> 음성 켜짐
          </>
        ) : (
          <>
            <MicOff className="h-6 w-6" aria-hidden="true" /> 음성 꺼짐
          </>
        )}
      </button>
    </header>
  )
}
