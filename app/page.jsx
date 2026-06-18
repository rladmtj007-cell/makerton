"use client";

import { useEffect, useRef, useState } from "react";
import { getNextOptionQuestion } from "@/lib/menuOptions";

// 브라우저 음성 인식
function recognizeSpeech() {
  return new Promise((resolve, reject) => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      reject(new Error("이 브라우저는 음성 인식을 지원하지 않아요. 크롬을 써주세요."));
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.lang = "ko-KR";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    let settled = false;
    const timer = setTimeout(() => {
      if (!settled) {
        settled = true;
        recognition.stop();
        reject(new Error("말씀이 인식되지 않았어요. 다시 말씀해 주세요."));
      }
    }, 8000);

    recognition.onresult = (e) => {
      settled = true;
      clearTimeout(timer);
      resolve(e.results[0][0].transcript);
    };
    recognition.onerror = (e) => {
      settled = true;
      clearTimeout(timer);
      reject(new Error(`음성 인식 오류: ${e.error}`));
    };
    recognition.onend = () => {
      if (!settled) {
        clearTimeout(timer);
        reject(new Error("음성을 듣지 못했어요. 다시 시도해 주세요."));
      }
    };
    recognition.start();
  });
}

const MAX_QUANTITY = 10;

export default function Home() {
  const [loading, setLoading] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [recommendations, setRecommendations] = useState([]);
  const [error, setError] = useState("");

  // 메뉴 선택 + 옵션 단계
  const [selectedMenu, setSelectedMenu] = useState(null); // 메뉴 객체 { name, price, ... }
  const [answered, setAnswered] = useState({});
  const [optionStep, setOptionStep] = useState(null);
  const [quantity, setQuantity] = useState(1);

  // 장바구니 / 주문
  const [cart, setCart] = useState([]);
  const [reviewing, setReviewing] = useState(false); // 최종 확인 화면
  const [orderPlaced, setOrderPlaced] = useState(false);

  // 음성 출력(TTS)
  const [muted, setMuted] = useState(false);
  const mutedRef = useRef(false);
  const voiceRef = useRef(null); // 가장 자연스러운 한국어 음성

  // 사용 가능한 음성 중 가장 자연스러운 한국어 음성 선택
  useEffect(() => {
    if (typeof window === "undefined") return;
    const synth = window.speechSynthesis;
    if (!synth) return;
    const pickVoice = () => {
      const koVoices = synth
        .getVoices()
        .filter((v) => v.lang.toLowerCase().startsWith("ko"));
      // 온라인/구글/자연(neural) 음성을 우선, 없으면 첫 한국어 음성
      voiceRef.current =
        koVoices.find((v) => /google|natural|online|neural/i.test(v.name)) ||
        koVoices[0] ||
        null;
    };
    pickVoice();
    synth.addEventListener("voiceschanged", pickVoice);
    return () => synth.removeEventListener("voiceschanged", pickVoice);
  }, []);

  // 브라우저 내장 음성 합성으로 안내 문구 읽어주기
  function say(text) {
    if (mutedRef.current || typeof window === "undefined") return;
    const synth = window.speechSynthesis;
    if (!synth) return;
    synth.cancel(); // 이전 안내가 남아 있으면 끊고 새로 읽기
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "ko-KR";
    if (voiceRef.current) utterance.voice = voiceRef.current;
    utterance.rate = 0.95; // 어르신을 위해 살짝 천천히
    synth.speak(utterance);
  }

  function toggleMute() {
    const next = !muted;
    setMuted(next);
    mutedRef.current = next;
    if (next && typeof window !== "undefined") {
      window.speechSynthesis?.cancel();
    }
  }

  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const cartTotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  async function handleVoiceOrder() {
    setError("");
    setTranscript("");
    setRecommendations([]);
    setSelectedMenu(null);
    setOptionStep(null);
    setLoading(true);
    try {
      const text = await recognizeSpeech();
      setTranscript(text);

      // ★ 프론트엔드 ↔ 백엔드 연동 지점
      const res = await fetch("/api/recommend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userInput: text }),
      });
      const data = await res.json();

      if (!data.success) {
        const msg = data.error || "추천을 가져오지 못했어요.";
        setError(msg);
        say(msg);
      } else if (data.recommendations.length === 0) {
        const msg = "조건에 맞는 메뉴를 찾지 못했어요. 다시 말씀해 주세요.";
        setError(msg);
        say(msg);
      } else {
        setRecommendations(data.recommendations);
        const names = data.recommendations
          .map((m, i) => `${i + 1}번 ${m.name} ${m.price}원`)
          .join(", ");
        say(`추천 메뉴입니다. ${names}. 원하시는 메뉴를 눌러 주세요.`);
      }
    } catch (e) {
      setError(e.message);
      say(e.message);
    } finally {
      setLoading(false);
    }
  }

  function selectMenu(menu) {
    setSelectedMenu(menu);
    setAnswered({});
    setQuantity(1);
    const next = getNextOptionQuestion(menu.name, {});
    setOptionStep(next.done ? null : next);
    say(next.done ? `${menu.name}. 몇 잔 드릴까요?` : `${menu.name}. ${next.question}`);
  }

  function chooseOption(value) {
    const updated = { ...answered, [optionStep.optionId]: value };
    setAnswered(updated);
    const next = getNextOptionQuestion(selectedMenu.name, updated);
    setOptionStep(next.done ? null : next);
    say(next.done ? "몇 잔 드릴까요?" : next.question);
  }

  function addToCart() {
    say(`${selectedMenu.name} ${quantity}개를 담았어요. 더 주문하시거나 주문 완료를 눌러 주세요.`);
    setCart((prev) => [
      ...prev,
      {
        name: selectedMenu.name,
        price: selectedMenu.price,
        options: answered,
        quantity,
      },
    ]);
    // 메뉴 담은 뒤 추천 화면 초기화
    setSelectedMenu(null);
    setOptionStep(null);
    setAnswered({});
    setQuantity(1);
    setRecommendations([]);
    setTranscript("");
  }

  function removeCartItem(index) {
    setCart((prev) => prev.filter((_, i) => i !== index));
  }

  function goToReview() {
    setReviewing(true);
    say(`주문 내역입니다. 모두 ${cartCount}개, ${cartTotal}원입니다. 맞으면 주문하기를 눌러 주세요.`);
  }

  function placeOrder() {
    setOrderPlaced(true);
    setReviewing(false);
    say("주문이 완료되었습니다. 잠시만 기다려 주세요.");
  }

  function startOver() {
    setCart([]);
    setReviewing(false);
    setOrderPlaced(false);
    setSelectedMenu(null);
    setOptionStep(null);
    setAnswered({});
    setQuantity(1);
    setRecommendations([]);
    setTranscript("");
    setError("");
  }

  // 장바구니 한 줄 표시용 텍스트
  function cartItemLabel(item) {
    const opts = Object.values(item.options || {});
    return opts.length > 0 ? `${item.name} (${opts.join(", ")})` : item.name;
  }

  // 화면 어디서나 음성 켜기/끄기 버튼
  const muteButton = (
    <button
      onClick={toggleMute}
      aria-label={muted ? "음성 안내 켜기" : "음성 안내 끄기"}
      className="fixed top-4 right-4 text-3xl bg-gray-200 text-gray-800 rounded-2xl px-5 py-3 shadow"
    >
      {muted ? "🔇" : "🔊"}
    </button>
  );

  // ── 주문 완료 화면 ────────────────────────────────
  if (orderPlaced) {
    return (
      <main className="min-h-screen bg-white text-gray-900 flex flex-col items-center justify-center p-8 gap-6">
        {muteButton}
        <p className="text-5xl font-bold">✅ 주문이 완료되었습니다!</p>
        <p className="text-3xl">잠시만 기다려 주세요.</p>
        <p className="text-3xl mt-4">결제 금액: {cartTotal.toLocaleString()}원</p>
        <button
          onClick={startOver}
          className="text-3xl bg-blue-600 text-white rounded-2xl px-10 py-6 mt-6"
        >
          처음으로
        </button>
      </main>
    );
  }

  // ── 최종 확인(주문서) 화면 ─────────────────────────
  if (reviewing) {
    return (
      <main className="min-h-screen bg-white text-gray-900 flex flex-col items-center p-8 gap-6">
        {muteButton}
        <h1 className="text-4xl font-bold mt-4">주문 내역을 확인해 주세요</h1>

        <div className="w-full max-w-xl flex flex-col gap-3">
          {cart.map((item, i) => (
            <div
              key={i}
              className="flex items-center justify-between border-2 border-gray-300 rounded-2xl p-5"
            >
              <div>
                <div className="text-2xl font-bold">{cartItemLabel(item)}</div>
                <div className="text-xl text-gray-600">
                  {item.price.toLocaleString()}원 × {item.quantity}개
                </div>
              </div>
              <div className="text-2xl font-bold">
                {(item.price * item.quantity).toLocaleString()}원
              </div>
            </div>
          ))}
        </div>

        <div className="w-full max-w-xl flex items-center justify-between border-t-2 border-gray-300 pt-4">
          <span className="text-3xl font-bold">총 {cartCount}개</span>
          <span className="text-3xl font-bold">{cartTotal.toLocaleString()}원</span>
        </div>

        <div className="w-full max-w-xl flex flex-col gap-4 mt-2">
          <button
            onClick={placeOrder}
            className="text-3xl font-bold bg-green-600 text-white rounded-2xl px-8 py-6"
          >
            주문하기
          </button>
          <button
            onClick={() => setReviewing(false)}
            className="text-2xl bg-gray-200 text-gray-800 rounded-2xl px-8 py-5"
          >
            뒤로 가기
          </button>
        </div>
      </main>
    );
  }

  // ── 메인 화면 ──────────────────────────────────────
  const inSelection = selectedMenu !== null;

  return (
    <main className="min-h-screen bg-white text-gray-900 flex flex-col items-center p-8 gap-6 pb-40">
      {muteButton}
      <h1 className="text-4xl font-bold mt-4">무엇을 드시겠어요?</h1>

      {!inSelection && (
        <>
          <button
            onClick={handleVoiceOrder}
            disabled={loading}
            className="text-3xl font-bold bg-blue-600 text-white rounded-2xl px-12 py-8 shadow-lg disabled:opacity-50"
          >
            {loading ? "듣고 있어요…" : "🎤 말하기"}
          </button>

          {transcript && (
            <p className="text-2xl">말씀하신 내용: “{transcript}”</p>
          )}

          {error && <p className="text-2xl text-red-600">{error}</p>}
        </>
      )}

      {/* 추천 결과 */}
      {!inSelection && recommendations.length > 0 && (
        <div className="w-full max-w-xl flex flex-col gap-4">
          {recommendations.map((menu) => (
            <button
              key={menu.name}
              onClick={() => selectMenu(menu)}
              className="text-left border-2 border-gray-300 rounded-2xl p-6 hover:border-blue-500"
            >
              <div className="text-3xl font-bold">{menu.name}</div>
              <div className="text-xl text-gray-600">{menu.description}</div>
              <div className="text-2xl mt-2">{menu.price.toLocaleString()}원</div>
              {menu.reason && (
                <div className="text-lg text-blue-600 mt-1">💡 {menu.reason}</div>
              )}
            </button>
          ))}
        </div>
      )}

      {/* 옵션 질문 */}
      {inSelection && optionStep && (
        <div className="w-full max-w-xl flex flex-col gap-4 items-center">
          <p className="text-3xl font-bold">{selectedMenu.name}</p>
          <p className="text-2xl">{optionStep.question}</p>
          <div className="flex gap-4 flex-wrap justify-center">
            {optionStep.options.map((opt) => (
              <button
                key={opt}
                onClick={() => chooseOption(opt)}
                className="text-2xl bg-green-600 text-white rounded-2xl px-8 py-5"
              >
                {opt}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 수량 선택 */}
      {inSelection && !optionStep && (
        <div className="w-full max-w-xl flex flex-col gap-5 items-center">
          <p className="text-3xl font-bold">{selectedMenu.name}</p>
          {Object.values(answered).length > 0 && (
            <p className="text-2xl text-gray-600">
              옵션: {Object.values(answered).join(", ")}
            </p>
          )}
          <p className="text-2xl">몇 잔 드릴까요?</p>
          <div className="flex items-center gap-6">
            <button
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              className="text-4xl font-bold bg-gray-200 text-gray-800 rounded-2xl w-20 h-20"
            >
              −
            </button>
            <span className="text-5xl font-bold w-20 text-center">{quantity}</span>
            <button
              onClick={() => setQuantity((q) => Math.min(MAX_QUANTITY, q + 1))}
              className="text-4xl font-bold bg-gray-200 text-gray-800 rounded-2xl w-20 h-20"
            >
              +
            </button>
          </div>
          <p className="text-2xl">
            합계: {(selectedMenu.price * quantity).toLocaleString()}원
          </p>
          <div className="flex flex-col gap-3 w-full max-w-md">
            <button
              onClick={addToCart}
              className="text-3xl font-bold bg-blue-600 text-white rounded-2xl px-8 py-6"
            >
              🛒 장바구니에 담기
            </button>
            <button
              onClick={() => {
                setSelectedMenu(null);
                setOptionStep(null);
                setAnswered({});
              }}
              className="text-2xl bg-gray-200 text-gray-800 rounded-2xl px-8 py-5"
            >
              뒤로 가기
            </button>
          </div>
        </div>
      )}

      {/* 하단 장바구니 바 */}
      {!inSelection && cart.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t-2 border-gray-300 p-5 flex flex-col items-center gap-3 shadow-lg">
          <div className="w-full max-w-xl flex items-center justify-between">
            <span className="text-2xl font-bold">
              🛒 장바구니 {cartCount}개
            </span>
            <span className="text-2xl font-bold">
              {cartTotal.toLocaleString()}원
            </span>
          </div>
          <div className="w-full max-w-xl flex flex-col gap-1">
            {cart.map((item, i) => (
              <div key={i} className="flex items-center justify-between text-xl">
                <span>
                  {cartItemLabel(item)} × {item.quantity}
                </span>
                <button
                  onClick={() => removeCartItem(i)}
                  className="text-lg text-red-600 underline"
                >
                  빼기
                </button>
              </div>
            ))}
          </div>
          <div className="w-full max-w-xl flex gap-3">
            <button
              onClick={handleVoiceOrder}
              disabled={loading}
              className="flex-1 text-2xl bg-gray-200 text-gray-800 rounded-2xl px-6 py-5 disabled:opacity-50"
            >
              + 메뉴 더 담기
            </button>
            <button
              onClick={goToReview}
              className="flex-1 text-2xl font-bold bg-green-600 text-white rounded-2xl px-6 py-5"
            >
              주문 완료하기
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
