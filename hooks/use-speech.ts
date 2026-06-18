"use client"

import { useCallback, useEffect, useRef, useState } from "react"

type SpeechRecognitionType = any

export interface UseSpeechResult {
  supported: boolean
  listening: boolean
  speaking: boolean
  transcript: string
  /** Speak text aloud (Korean). Resolves when finished. */
  speak: (text: string) => Promise<void>
  /** Start listening once; calls onResult with the final transcript. */
  listen: (onResult: (text: string) => void) => void
  stopListening: () => void
  stopSpeaking: () => void
  cancelAll: () => void
}

export function useSpeech(): UseSpeechResult {
  const [supported, setSupported] = useState(false)
  const [listening, setListening] = useState(false)
  const [speaking, setSpeaking] = useState(false)
  const [transcript, setTranscript] = useState("")

  const recognitionRef = useRef<SpeechRecognitionType | null>(null)
  const onResultRef = useRef<((text: string) => void) | null>(null)
  const koVoiceRef = useRef<SpeechSynthesisVoice | null>(null)

  useEffect(() => {
    if (typeof window === "undefined") return
    const SR =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    const hasSynth = "speechSynthesis" in window
    setSupported(Boolean(SR) && hasSynth)

    if (SR) {
      const recognition = new SR()
      recognition.lang = "ko-KR"
      recognition.continuous = false
      recognition.interimResults = false
      recognition.maxAlternatives = 1

      recognition.onresult = (event: any) => {
        const text = event.results[0][0].transcript as string
        setTranscript(text)
        onResultRef.current?.(text)
      }
      recognition.onend = () => setListening(false)
      recognition.onerror = () => setListening(false)
      recognitionRef.current = recognition
    }

    if (hasSynth) {
      const pickVoice = () => {
        const voices = window.speechSynthesis.getVoices()
        koVoiceRef.current =
          voices.find((v) => v.lang === "ko-KR") ||
          voices.find((v) => v.lang.startsWith("ko")) ||
          null
      }
      pickVoice()
      window.speechSynthesis.onvoiceschanged = pickVoice
    }

    return () => {
      try {
        recognitionRef.current?.abort?.()
        window.speechSynthesis?.cancel()
      } catch {
        /* noop */
      }
    }
  }, [])

  const stopSpeaking = useCallback(() => {
    if (typeof window === "undefined") return
    window.speechSynthesis?.cancel()
    setSpeaking(false)
  }, [])

  const speak = useCallback((text: string) => {
    return new Promise<void>((resolve) => {
      if (typeof window === "undefined" || !("speechSynthesis" in window)) {
        resolve()
        return
      }
      window.speechSynthesis.cancel()
      const utter = new SpeechSynthesisUtterance(text)
      utter.lang = "ko-KR"
      if (koVoiceRef.current) utter.voice = koVoiceRef.current
      utter.rate = 0.95
      utter.pitch = 1
      utter.onstart = () => setSpeaking(true)
      utter.onend = () => {
        setSpeaking(false)
        resolve()
      }
      utter.onerror = () => {
        setSpeaking(false)
        resolve()
      }
      window.speechSynthesis.speak(utter)
    })
  }, [])

  const stopListening = useCallback(() => {
    try {
      recognitionRef.current?.stop?.()
    } catch {
      /* noop */
    }
    setListening(false)
  }, [])

  const listen = useCallback(
    (onResult: (text: string) => void) => {
      const recognition = recognitionRef.current
      if (!recognition) return
      onResultRef.current = onResult
      setTranscript("")
      try {
        window.speechSynthesis?.cancel()
        recognition.start()
        setListening(true)
      } catch {
        // start() throws if already running; restart cleanly
        try {
          recognition.stop()
          setTimeout(() => {
            recognition.start()
            setListening(true)
          }, 250)
        } catch {
          /* noop */
        }
      }
    },
    [],
  )

  const cancelAll = useCallback(() => {
    stopListening()
    stopSpeaking()
  }, [stopListening, stopSpeaking])

  return {
    supported,
    listening,
    speaking,
    transcript,
    speak,
    listen,
    stopListening,
    stopSpeaking,
    cancelAll,
  }
}
