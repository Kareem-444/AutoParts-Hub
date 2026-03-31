"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { usePathname } from "next/navigation";

/* ──────────────────────────────────────────────────────────────────────────────
   Types
   ────────────────────────────────────────────────────────────────────────────── */
interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  isError?: boolean;
}

interface AIAssistantWidgetProps {
  locale: "en" | "ar";
}

/* ──────────────────────────────────────────────────────────────────────────────
   Constants
   ────────────────────────────────────────────────────────────────────────────── */
const STORAGE_KEY = "aria_chat_history";
const MAX_CHARS = 500;
const CHAR_WARN = 400;

const EN_QUICK_REPLIES = [
  "How to buy?",
  "Search tips",
  "Become a seller",
  "Track order",
  "Return policy",
];
const AR_QUICK_REPLIES = [
  "كيف أشتري؟",
  "نصائح البحث",
  "كيف أصبح بائعاً؟",
  "تتبع طلبي",
  "سياسة الإرجاع",
];

/* ──────────────────────────────────────────────────────────────────────────────
   System Prompt Builder
   ────────────────────────────────────────────────────────────────────────────── */
function buildSystemPrompt(currentPage: string): string {
  return `You are Aria — the intelligent support assistant for AutoParts Hub,
a multilingual marketplace dedicated to automotive spare parts.

YOUR KNOWLEDGE:
- Full platform features: search, filters, product listings, cart, checkout, order tracking, reviews
- User roles: Buyers browse & purchase. Sellers (is_seller=true) list parts and manage their storefront
- Auth: Email/password + Google OAuth with profile completion flow
- Search works via URL filters: make, model, year, condition, page
- Returns accepted within 7 days. Images served from Cloudinary CDN
- Pages: Home, Search, Product Details, Cart/Checkout, Profile, Seller Dashboard, Admin (staff only)
- Language toggle in navbar switches between English (LTR) and Arabic (RTL)

CURRENT PAGE CONTEXT: ${currentPage}
(Use this to give context-aware, page-specific guidance)

BEHAVIOR RULES:
1. Detect the user's language from their message and ALWAYS reply in the SAME language (Arabic or English). Never switch languages unless the user does first.
2. Be concise, warm, and professional. Use markdown (bold, bullets) for clarity.
3. For personal account questions (specific orders, personal data, account balance): say "Please visit your Profile page for personal account details" — do NOT attempt to fetch live data.
4. Never invent product prices, stock levels, or inventory data.
5. If you cannot help: say "Let me connect you with our support team" and show: support@autopartshub.com
6. Keep responses under 120 words unless a detailed step-by-step is explicitly needed.
7. After answering, suggest 1-2 relevant follow-up quick replies.`;
}

/* ──────────────────────────────────────────────────────────────────────────────
   Markdown-like text formatting
   ────────────────────────────────────────────────────────────────────────────── */
function formatMarkdown(text: string): React.ReactNode {
  // Convert **bold**, *italic*, bullet lists, and newlines
  let html = text;
  // Bold
  html = html.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
  // Italic (single * not preceded/followed by space for safe matching)
  html = html.replace(/(?<!\*)\*(?!\*)(.*?)(?<!\*)\*(?!\*)/g, "<em>$1</em>");
  // Bullet points: lines starting with - or •
  html = html.replace(
    /^[\-•]\s+(.+)$/gm,
    '<div style="display:flex;gap:6px;align-items:baseline"><span style="color:var(--aria-accent-light)">•</span><span>$1</span></div>'
  );
  // Newlines
  html = html.replace(/\n/g, "<br />");
  return <span dangerouslySetInnerHTML={{ __html: html }} />;
}

/* ══════════════════════════════════════════════════════════════════════════════
   AIAssistantWidget Component
   ══════════════════════════════════════════════════════════════════════════════ */
export default function AIAssistantWidget({ locale }: AIAssistantWidgetProps) {
  /* ── State ──────────────────────────────────────────────────────────────── */
  const [messages, setMessages] = useState<Message[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [unreadCount, setUnreadCount] = useState(0);
  const [hasMounted, setHasMounted] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  const pathname = usePathname();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const isRtl = locale === "ar";
  const quickReplies = isRtl ? AR_QUICK_REPLIES : EN_QUICK_REPLIES;

  /* ── Initializer ────────────────────────────────────────────────────────── */
  const initChat = useCallback(() => {
    const greeting: Message = {
      id: crypto.randomUUID(),
      role: "assistant",
      content: isRtl
        ? "مرحباً! أنا **آريا**، مساعدتك الذكية في AutoParts Hub 🚗\nكيف يمكنني مساعدتك اليوم؟"
        : "Hello! I'm **Aria**, your intelligent assistant at AutoParts Hub 🚗\nHow can I help you today?",
      timestamp: new Date(),
    };
    setMessages([greeting]);
    setUnreadCount(1);
  }, [isRtl]);

  /* ── Mount & restore from sessionStorage ────────────────────────────────── */
  useEffect(() => {
    setHasMounted(true);
    try {
      const saved = sessionStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed: Message[] = JSON.parse(saved).map((m: any) => ({
          ...m,
          timestamp: new Date(m.timestamp),
        }));
        if (parsed.length > 0) {
          setMessages(parsed);
          return;
        }
      }
    } catch {
      /* corrupted — fall through */
    }
    initChat();
  }, [initChat]);

  /* ── Persist to sessionStorage ──────────────────────────────────────────── */
  useEffect(() => {
    if (hasMounted && messages.length > 0) {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
    }
  }, [messages, hasMounted]);

  /* ── Auto-scroll ────────────────────────────────────────────────────────── */
  useEffect(() => {
    if (isOpen && !isMinimized) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen, isMinimized, isLoading]);

  /* ── Focus textarea when panel opens ────────────────────────────────────── */
  useEffect(() => {
    if (isOpen && !isMinimized) {
      setTimeout(() => textareaRef.current?.focus(), 350);
      if (unreadCount > 0) setUnreadCount(0);
    }
  }, [isOpen, isMinimized]);

  /* ── Auto-grow textarea ─────────────────────────────────────────────────── */
  useEffect(() => {
    const ta = textareaRef.current;
    if (ta) {
      ta.style.height = "auto";
      ta.style.height = `${Math.min(ta.scrollHeight, 96)}px`;
    }
  }, [inputValue]);

  /* ── Clear chat ─────────────────────────────────────────────────────────── */
  const clearChat = () => {
    sessionStorage.removeItem(STORAGE_KEY);
    initChat();
  };

  /* ── Close with animation ───────────────────────────────────────────────── */
  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      setIsOpen(false);
      setIsClosing(false);
    }, 200);
  };

  /* ── Send message (with retry for rate-limits) ──────────────────────────── */
  const sendMessage = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || isLoading) return;

    const userMsg: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content: trimmed,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputValue("");
    setIsLoading(true);

    try {
      // Build conversation history (OpenAI-compatible format for Groq)
      const chatMessages = [
        { role: "system" as const, content: buildSystemPrompt(pathname) },
        ...[...messages, userMsg]
          .filter((m) => m.role === "user" || m.role === "assistant")
          .map((m) => ({
            role: m.role as "user" | "assistant",
            content: m.content,
          })),
      ];

      const groqApiKey = process.env.NEXT_PUBLIC_GROQ_API_KEY || "";
      const requestUrl = "https://api.groq.com/openai/v1/chat/completions";
      const requestBody = JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: chatMessages,
        max_tokens: 500,
        temperature: 0.7,
      });

      // Retry with exponential backoff for 429 rate-limit errors
      const MAX_RETRIES = 3;
      let lastError: Error | null = null;
      let wasRateLimited = false;

      for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
        try {
          const response = await fetch(requestUrl, {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${groqApiKey}`,
              "Content-Type": "application/json",
            },
            body: requestBody,
          });

          if (response.status === 429) {
            wasRateLimited = true;
            const backoffMs = Math.pow(2, attempt + 1) * 1000; // 2s, 4s, 8s
            console.warn(`Aria: rate-limited (429), retrying in ${backoffMs}ms (attempt ${attempt + 1}/${MAX_RETRIES})`);
            await new Promise((resolve) => setTimeout(resolve, backoffMs));
            continue;
          }

          if (!response.ok) throw new Error(`API ${response.status}`);

          const data = await response.json();
          const assistantContent =
            data.choices?.[0]?.message?.content ??
            "I couldn't generate a response.";

          const assistantMsg: Message = {
            id: crypto.randomUUID(),
            role: "assistant",
            content: assistantContent,
            timestamp: new Date(),
          };

          setMessages((prev) => [...prev, assistantMsg]);

          // Increment unread if panel is closed
          if (!isOpen || isMinimized) {
            setUnreadCount((c) => c + 1);
          }
          return; // Success — exit early
        } catch (innerErr) {
          lastError = innerErr instanceof Error ? innerErr : new Error(String(innerErr));
          // Only retry on 429 (handled via continue above); all other errors break immediately
          if (!wasRateLimited) break;
        }
      }

      // All retries exhausted or non-retryable error
      throw lastError ?? new Error("Request failed");
    } catch (err) {
      console.error("Aria chat error:", err);

      const isRateLimit = err instanceof Error && err.message?.includes("429");
      // If we got here after retries exhausted, wasRateLimited context is lost,
      // so also check if the error string mentions 429 or we simply show a rate-limit message
      const errorMsg: Message = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: isRateLimit || (err instanceof Error && /rate/i.test(err.message))
          ? isRtl
            ? "⏳ لقد تجاوزت حد الطلبات المسموح به. يرجى الانتظار بضع ثوانٍ ثم المحاولة مرة أخرى."
            : "⏳ Rate limit reached. Please wait a few seconds and try again."
          : isRtl
            ? "عذراً، أواجه مشكلة في الاتصال. يرجى المحاولة مرة أخرى."
            : "Sorry, I'm having trouble connecting. Please try again.",
        timestamp: new Date(),
        isError: true,
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  /* ── Keyboard handling ──────────────────────────────────────────────────── */
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(inputValue);
    }
  };

  /* ── Don't render until client-side hydration ───────────────────────────── */
  if (!hasMounted) return null;

  /* ══════════════════════════════════════════════════════════════════════════
     RENDER
     ══════════════════════════════════════════════════════════════════════════ */
  return (
    <div
      className="aria-root"
      dir={isRtl ? "rtl" : "ltr"}
      style={{
        position: "fixed",
        bottom: "24px",
        insetInlineEnd: "24px",
        zIndex: 9999,
      }}
    >
      {/* ─── Scoped Styles ─────────────────────────────────────────────────── */}
      <style>{`
        .aria-root {
          --aria-bg: #080d1a;
          --aria-surface: rgba(14, 22, 45, 0.97);
          --aria-glass: rgba(255, 255, 255, 0.04);
          --aria-border: rgba(255, 255, 255, 0.08);
          --aria-accent: #2563eb;
          --aria-accent-light: #3b82f6;
          --aria-glow: rgba(37, 99, 235, 0.35);
          --aria-text: #f1f5f9;
          --aria-subtext: #64748b;
          --aria-user-msg: linear-gradient(135deg, #1e40af, #2563eb);
          --aria-bot-msg: rgba(255, 255, 255, 0.05);
          --aria-online: #22c55e;
          font-family: "Inter", ui-sans-serif, system-ui, -apple-system, sans-serif;
        }

        /* ── Keyframes ─────────────────────────────────────────────────────── */
        @keyframes aria-pulse {
          0%   { box-shadow: 0 0 0 0 var(--aria-glow); }
          70%  { box-shadow: 0 0 0 14px rgba(37, 99, 235, 0); }
          100% { box-shadow: 0 0 0 0 rgba(37, 99, 235, 0); }
        }

        @keyframes aria-bounce-in {
          0%   { transform: scale(0); }
          50%  { transform: scale(1.25); }
          100% { transform: scale(1); }
        }

        @keyframes aria-panel-open {
          from {
            opacity: 0;
            transform: translateY(16px) scale(0.97);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        @keyframes aria-panel-close {
          from {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
          to {
            opacity: 0;
            transform: translateY(16px) scale(0.97);
          }
        }

        @keyframes aria-msg-in {
          from {
            opacity: 0;
            transform: translateY(8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes aria-typing {
          0%, 100% { transform: translateY(0); }
          50%      { transform: translateY(-4px); }
        }

        @keyframes aria-online-pulse {
          0%, 100% { opacity: 1; }
          50%      { opacity: 0.5; }
        }

        @keyframes aria-icon-spin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(180deg); }
        }

        /* ── Animation classes ─────────────────────────────────────────────── */
        .aria-fab-pulse {
          animation: aria-pulse 2.2s infinite;
        }

        .aria-badge-pop {
          animation: aria-bounce-in 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
        }

        .aria-panel-in {
          animation: aria-panel-open 320ms cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
        }

        .aria-panel-out {
          animation: aria-panel-close 200ms ease-in forwards;
        }

        .aria-msg-appear {
          animation: aria-msg-in 220ms ease-out forwards;
        }

        .aria-online-dot {
          animation: aria-online-pulse 2s ease-in-out infinite;
        }

        /* ── Typing dots ───────────────────────────────────────────────────── */
        .aria-dot {
          animation: aria-typing 1.4s ease-in-out infinite;
        }
        .aria-dot:nth-child(2) { animation-delay: 0.2s; }
        .aria-dot:nth-child(3) { animation-delay: 0.4s; }

        /* ── Custom scrollbar ──────────────────────────────────────────────── */
        .aria-scroll::-webkit-scrollbar {
          width: 3px;
          height: 0;
        }
        .aria-scroll::-webkit-scrollbar-track {
          background: transparent;
        }
        .aria-scroll::-webkit-scrollbar-thumb {
          background: var(--aria-accent);
          border-radius: 4px;
        }
        .aria-scroll {
          scrollbar-width: thin;
          scrollbar-color: var(--aria-accent) transparent;
        }

        /* ── Chip row scrollbar hide ───────────────────────────────────────── */
        .aria-chips-row::-webkit-scrollbar { display: none; }
        .aria-chips-row { scrollbar-width: none; }

        /* ── Reduced motion ────────────────────────────────────────────────── */
        @media (prefers-reduced-motion: reduce) {
          .aria-fab-pulse,
          .aria-badge-pop,
          .aria-panel-in,
          .aria-panel-out,
          .aria-msg-appear,
          .aria-online-dot,
          .aria-dot {
            animation: none !important;
            transform: none !important;
            opacity: 1 !important;
          }
        }

        /* ── Mobile full-screen bottom sheet ───────────────────────────────── */
        @media (max-width: 767px) {
          .aria-panel {
            position: fixed !important;
            inset-inline-start: 0 !important;
            inset-inline-end: 0 !important;
            bottom: 0 !important;
            width: 100vw !important;
            height: 80vh !important;
            max-height: 80vh !important;
            border-radius: 20px 20px 0 0 !important;
          }
        }
      `}</style>

      {/* ═══════════════════════════════════════════════════════════════════════
         Floating Action Button
         ═══════════════════════════════════════════════════════════════════════ */}
      {!isOpen && (
        <button
          onClick={() => {
            setIsOpen(true);
            setIsMinimized(false);
          }}
          className="aria-fab-pulse"
          style={{
            position: "relative",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 56,
            height: 56,
            borderRadius: "50%",
            border: "none",
            cursor: "pointer",
            color: "#fff",
            background: "linear-gradient(135deg, #1e3a8a, #2563eb)",
            boxShadow: "0 4px 20px rgba(37, 99, 235, 0.4)",
            transition: "transform 200ms ease, box-shadow 200ms ease",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = "scale(1.08)";
            e.currentTarget.style.boxShadow =
              "0 6px 28px rgba(37, 99, 235, 0.55)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "scale(1)";
            e.currentTarget.style.boxShadow =
              "0 4px 20px rgba(37, 99, 235, 0.4)";
          }}
          onMouseDown={(e) => {
            e.currentTarget.style.transform = "scale(0.94)";
          }}
          onMouseUp={(e) => {
            e.currentTarget.style.transform = "scale(1.08)";
          }}
          aria-label={isRtl ? "فتح المساعد الذكي" : "Open AI Assistant"}
        >
          {/* Unread badge */}
          {unreadCount > 0 && (
            <span
              className="aria-badge-pop"
              style={{
                position: "absolute",
                top: -2,
                insetInlineEnd: -2,
                width: 18,
                height: 18,
                borderRadius: "50%",
                backgroundColor: "#ef4444",
                color: "#fff",
                fontSize: 10,
                fontWeight: 700,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                border: "2px solid var(--aria-bg)",
                lineHeight: 1,
              }}
            >
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}

          {/* Steering-wheel + chat-bubble SVG icon */}
          <svg
            width="26"
            height="26"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            {/* Chat bubble outline */}
            <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 13.5997 2.37562 15.1116 3.04346 16.4525C3.22094 16.8088 3.28001 17.2161 3.17712 17.6006L2.58151 19.8267C2.32295 20.793 3.20701 21.677 4.17335 21.4185L6.39939 20.8229C6.78393 20.72 7.19121 20.7791 7.54753 20.9565C8.88837 21.6244 10.4003 22 12 22Z" />
            {/* Steering wheel inner */}
            <circle cx="12" cy="12" r="4" />
            <path d="M16 12H18" />
            <path d="M6 12H8" />
            <path d="M12 6V8" />
            <path d="M12 16V18" />
          </svg>
        </button>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════
         Chat Panel
         ═══════════════════════════════════════════════════════════════════════ */}
      {isOpen && (
        <div
          ref={panelRef}
          className={`aria-panel ${isClosing ? "aria-panel-out" : "aria-panel-in"}`}
          style={{
            position: "absolute",
            bottom: 72,
            insetInlineEnd: 0,
            width: 380,
            height: 560,
            maxHeight: "calc(100vh - 120px)",
            borderRadius: 16,
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            background: "var(--aria-surface)",
            border: "1px solid var(--aria-border)",
            boxShadow:
              "0 25px 60px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255,255,255,0.04)",
            color: "var(--aria-text)",
          }}
        >
          {/* ── Header ─────────────────────────────────────────────────────── */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              paddingInlineStart: 16,
              paddingInlineEnd: 8,
              height: 56,
              flexShrink: 0,
              background: "linear-gradient(135deg, #0f172a, #1e3a8a)",
              borderBottom: "1px solid var(--aria-border)",
            }}
          >
            {/* Left: avatar + title */}
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div
                style={{
                  position: "relative",
                  width: 36,
                  height: 36,
                  borderRadius: "50%",
                  background: "linear-gradient(135deg, #60a5fa, #1e40af)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: 700,
                  fontSize: 16,
                  color: "#fff",
                  flexShrink: 0,
                }}
              >
                A
                <span
                  className="aria-online-dot"
                  style={{
                    position: "absolute",
                    bottom: 0,
                    insetInlineEnd: 0,
                    width: 10,
                    height: 10,
                    borderRadius: "50%",
                    backgroundColor: "var(--aria-online)",
                    border: "2px solid #1e3a8a",
                    boxShadow: "0 0 6px var(--aria-online)",
                  }}
                />
              </div>
              <div style={{ display: "flex", flexDirection: "column" }}>
                <span
                  style={{
                    fontWeight: 700,
                    fontSize: 15,
                    lineHeight: 1.2,
                    color: "#fff",
                  }}
                >
                  Aria
                </span>
                <span
                  style={{
                    fontSize: 11,
                    color: "var(--aria-subtext)",
                    lineHeight: 1.3,
                  }}
                >
                  {isRtl ? "مساعد AutoParts" : "AutoParts Assistant"}
                </span>
              </div>
            </div>

            {/* Right: action buttons */}
            <div style={{ display: "flex", alignItems: "center", gap: 2 }}>
              {/* Clear chat */}
              <HeaderButton
                onClick={clearChat}
                label={isRtl ? "مسح المحادثة" : "Clear chat"}
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M3 6h18" />
                  <path d="M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                  <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" />
                </svg>
              </HeaderButton>
              {/* Minimize */}
              <HeaderButton
                onClick={() => setIsMinimized(!isMinimized)}
                label={isRtl ? "تصغير" : "Minimize"}
              >
                <svg
                  width="14"
                  height="2"
                  viewBox="0 0 14 2"
                  fill="currentColor"
                >
                  <rect x="0" y="0" width="14" height="2" rx="1" />
                </svg>
              </HeaderButton>
              {/* Close */}
              <HeaderButton
                onClick={handleClose}
                label={isRtl ? "إغلاق" : "Close"}
              >
                <svg
                  width="13"
                  height="13"
                  viewBox="0 0 14 14"
                  fill="currentColor"
                >
                  <path d="M13.7071 1.70711C14.0976 1.31658 14.0976 0.683417 13.7071 0.292893C13.3166 -0.0976311 12.6834 -0.0976311 12.2929 0.292893L7 5.58579L1.70711 0.292893C1.31658 -0.0976311 0.683417 -0.0976311 0.292893 0.292893C-0.0976311 0.683417 -0.0976311 1.31658 0.292893 1.70711L5.58579 7L0.292893 12.2929C-0.0976311 12.6834 -0.0976311 13.3166 0.292893 13.7071C0.683417 14.0976 1.31658 14.0976 1.70711 13.7071L7 8.41421L12.2929 13.7071C12.6834 14.0976 13.3166 14.0976 13.7071 13.7071C14.0976 13.3166 14.0976 12.6834 13.7071 12.2929L8.41421 7L13.7071 1.70711Z" />
                </svg>
              </HeaderButton>
            </div>
          </div>

          {/* ── Body (hidden when minimized) ───────────────────────────────── */}
          {!isMinimized && (
            <>
              {/* ── Messages Area ──────────────────────────────────────────── */}
              <div
                className="aria-scroll"
                style={{
                  flex: 1,
                  overflowY: "auto",
                  padding: 16,
                  display: "flex",
                  flexDirection: "column",
                  gap: 12,
                }}
              >
                {messages.map((msg, idx) => {
                  const isUser = msg.role === "user";
                  const showAvatar =
                    !isUser &&
                    (idx === 0 || messages[idx - 1].role !== "assistant");

                  return (
                    <div
                      key={msg.id}
                      className="aria-msg-appear"
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        maxWidth: "85%",
                        alignSelf: isUser ? "flex-end" : "flex-start",
                        alignItems: isUser ? "flex-end" : "flex-start",
                        animationDelay: `${Math.min(idx * 40, 200)}ms`,
                      }}
                    >
                      {/* Bot avatar label */}
                      {showAvatar && (
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 6,
                            marginBottom: 4,
                            pointerEvents: "none",
                          }}
                        >
                          <div
                            style={{
                              width: 20,
                              height: 20,
                              borderRadius: "50%",
                              background:
                                "linear-gradient(135deg, #60a5fa, #1e40af)",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontSize: 9,
                              fontWeight: 700,
                              color: "#fff",
                            }}
                          >
                            A
                          </div>
                          <span
                            style={{
                              fontSize: 10,
                              color: "var(--aria-subtext)",
                            }}
                          >
                            Aria
                          </span>
                        </div>
                      )}

                      {/* Message bubble */}
                      <div
                        style={{
                          position: "relative",
                          paddingInline: 16,
                          paddingBlock: 10,
                          fontSize: 14,
                          lineHeight: 1.6,
                          wordBreak: "break-word",
                          borderRadius: isUser
                            ? "18px 18px 4px 18px"
                            : "18px 18px 18px 4px",
                          background: isUser
                            ? "var(--aria-user-msg)"
                            : "var(--aria-bot-msg)",
                          color: isUser ? "#fff" : "var(--aria-text)",
                          border: isUser
                            ? "none"
                            : `1px solid ${msg.isError ? "rgba(239,68,68,0.4)" : "var(--aria-border)"}`,
                        }}
                      >
                        {formatMarkdown(msg.content)}

                        {/* Timestamp on hover */}
                        <span
                          className="aria-ts"
                          style={{
                            position: "absolute",
                            bottom: -18,
                            insetInlineEnd: 0,
                            fontSize: 10,
                            color: "var(--aria-subtext)",
                            whiteSpace: "nowrap",
                            opacity: 0,
                            transition: "opacity 150ms",
                            pointerEvents: "none",
                          }}
                        >
                          {msg.timestamp.toLocaleTimeString(locale, {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                    </div>
                  );
                })}

                {/* Typing indicator */}
                {isLoading && (
                  <div
                    className="aria-msg-appear"
                    style={{
                      alignSelf: "flex-start",
                      maxWidth: "85%",
                    }}
                  >
                    <div
                      style={{
                        paddingInline: 16,
                        paddingBlock: 12,
                        borderRadius: "18px 18px 18px 4px",
                        background: "var(--aria-bot-msg)",
                        border: "1px solid var(--aria-border)",
                        display: "flex",
                        alignItems: "center",
                        gap: 5,
                        height: 36,
                      }}
                    >
                      <span
                        className="aria-dot"
                        style={{
                          width: 7,
                          height: 7,
                          borderRadius: "50%",
                          backgroundColor: "var(--aria-subtext)",
                          display: "block",
                        }}
                      />
                      <span
                        className="aria-dot"
                        style={{
                          width: 7,
                          height: 7,
                          borderRadius: "50%",
                          backgroundColor: "var(--aria-subtext)",
                          display: "block",
                        }}
                      />
                      <span
                        className="aria-dot"
                        style={{
                          width: 7,
                          height: 7,
                          borderRadius: "50%",
                          backgroundColor: "var(--aria-subtext)",
                          display: "block",
                        }}
                      />
                    </div>
                  </div>
                )}

                {/* Quick reply chips (shown only when just the greeting exists) */}
                {messages.length === 1 &&
                  messages[0].role === "assistant" &&
                  !isLoading && (
                    <div
                      className="aria-chips-row aria-msg-appear"
                      style={{
                        display: "flex",
                        gap: 8,
                        overflowX: "auto",
                        paddingBlock: 4,
                        marginBlockStart: 4,
                      }}
                    >
                      {quickReplies.map((chip, i) => (
                        <button
                          key={i}
                          onClick={() => sendMessage(chip)}
                          style={{
                            flexShrink: 0,
                            paddingInline: 12,
                            paddingBlock: 6,
                            fontSize: 12,
                            whiteSpace: "nowrap",
                            borderRadius: 20,
                            background: "var(--aria-glass)",
                            border: "1px solid var(--aria-border)",
                            color: "var(--aria-text)",
                            cursor: "pointer",
                            transition:
                              "border-color 200ms, color 200ms, background 200ms",
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.borderColor =
                              "var(--aria-accent)";
                            e.currentTarget.style.color =
                              "var(--aria-accent-light)";
                            e.currentTarget.style.background =
                              "rgba(37, 99, 235, 0.08)";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.borderColor =
                              "var(--aria-border)";
                            e.currentTarget.style.color = "var(--aria-text)";
                            e.currentTarget.style.background =
                              "var(--aria-glass)";
                          }}
                        >
                          {chip}
                        </button>
                      ))}
                    </div>
                  )}

                {/* Scroll anchor */}
                <div ref={messagesEndRef} style={{ height: 1 }} />
              </div>

              {/* ── Input Area ─────────────────────────────────────────────── */}
              <div
                style={{
                  flexShrink: 0,
                  padding: 12,
                  borderTop: "1px solid var(--aria-border)",
                  background: "rgba(0, 0, 0, 0.3)",
                  display: "flex",
                  flexDirection: "column",
                  gap: 4,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "flex-end",
                    gap: 8,
                  }}
                >
                  <textarea
                    ref={textareaRef}
                    value={inputValue}
                    onChange={(e) => {
                      if (e.target.value.length <= MAX_CHARS) {
                        setInputValue(e.target.value);
                      }
                    }}
                    onKeyDown={handleKeyDown}
                    placeholder={
                      isRtl ? "اكتب رسالتك هنا..." : "Type your message..."
                    }
                    rows={1}
                    style={{
                      flex: 1,
                      minHeight: 40,
                      maxHeight: 96,
                      paddingInline: 14,
                      paddingBlock: 10,
                      background: "transparent",
                      color: "var(--aria-text)",
                      fontSize: 14,
                      lineHeight: 1.5,
                      border: "1px solid var(--aria-border)",
                      borderRadius: 12,
                      outline: "none",
                      resize: "none",
                      transition: "border-color 200ms",
                      fontFamily: "inherit",
                    }}
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = "var(--aria-accent)";
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = "var(--aria-border)";
                    }}
                  />

                  {/* Send button */}
                  <button
                    onClick={() => sendMessage(inputValue)}
                    disabled={!inputValue.trim() || isLoading}
                    style={{
                      width: 38,
                      height: 38,
                      flexShrink: 0,
                      borderRadius: "50%",
                      border: "none",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      cursor:
                        inputValue.trim() && !isLoading
                          ? "pointer"
                          : "not-allowed",
                      background:
                        inputValue.trim() && !isLoading
                          ? "linear-gradient(135deg, #1e40af, #2563eb)"
                          : "var(--aria-glass)",
                      color:
                        inputValue.trim() && !isLoading
                          ? "#fff"
                          : "var(--aria-subtext)",
                      boxShadow:
                        inputValue.trim() && !isLoading
                          ? "0 0 12px var(--aria-glow)"
                          : "none",
                      transition:
                        "background 200ms, box-shadow 200ms, transform 150ms",
                    }}
                    onMouseDown={(e) => {
                      if (inputValue.trim() && !isLoading)
                        e.currentTarget.style.transform = "scale(0.9)";
                    }}
                    onMouseUp={(e) => {
                      e.currentTarget.style.transform = "scale(1)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = "scale(1)";
                    }}
                    aria-label={isRtl ? "إرسال" : "Send"}
                  >
                    <svg
                      viewBox="0 0 24 24"
                      width="18"
                      height="18"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      style={{
                        transform: isRtl ? "scaleX(-1)" : undefined,
                      }}
                    >
                      <line x1="22" y1="2" x2="11" y2="13" />
                      <polygon points="22 2 15 22 11 13 2 9 22 2" />
                    </svg>
                  </button>
                </div>

                {/* Character counter */}
                {inputValue.length > CHAR_WARN && (
                  <div
                    style={{
                      fontSize: 10,
                      textAlign: "end",
                      paddingInlineEnd: 4,
                      color:
                        inputValue.length >= MAX_CHARS
                          ? "#ef4444"
                          : "var(--aria-subtext)",
                    }}
                  >
                    {inputValue.length} / {MAX_CHARS}
                  </div>
                )}
              </div>

              {/* Mobile drag indicator */}
              <div
                style={{
                  position: "absolute",
                  top: 8,
                  insetInlineStart: "50%",
                  transform: "translateX(-50%)",
                  width: 40,
                  height: 4,
                  borderRadius: 4,
                  background: "var(--aria-subtext)",
                  opacity: 0.3,
                  pointerEvents: "none",
                }}
                className="aria-mobile-indicator"
              />
            </>
          )}
        </div>
      )}

      {/* Hide mobile indicator on desktop */}
      <style>{`
        @media (min-width: 768px) {
          .aria-mobile-indicator { display: none; }
        }
        /* Timestamp reveal on hover */
        .aria-msg-appear:hover .aria-ts {
          opacity: 1 !important;
        }
      `}</style>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────────────────────
   HeaderButton – small utility sub-component (stays in same file)
   ────────────────────────────────────────────────────────────────────────────── */
function HeaderButton({
  onClick,
  label,
  children,
}: {
  onClick: () => void;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      title={label}
      style={{
        width: 28,
        height: 28,
        borderRadius: 6,
        border: "none",
        background: "transparent",
        color: "var(--aria-subtext)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: "pointer",
        transition: "color 200ms, background 200ms",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.color = "#fff";
        e.currentTarget.style.background = "var(--aria-glass)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.color = "var(--aria-subtext)";
        e.currentTarget.style.background = "transparent";
      }}
    >
      {children}
    </button>
  );
}
