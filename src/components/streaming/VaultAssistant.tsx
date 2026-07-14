import React, { useState, useEffect, useRef } from "react";
import { MessageSquare, Send, X, Bot, User, Sparkles, Loader2 } from "lucide-react";
import { useAuth } from "@/lib/auth";
import apiClient from "@/services/api";

interface ChatMessage {
  sender: "user" | "bot";
  text: string;
  timestamp: Date;
}

export function VaultAssistant() {
  const { isAuthenticated } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputVal, setInputVal] = useState("");
  const [loading, setLoading] = useState(false);
  const [hasNewMsg, setHasNewMsg] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initialize with a greeting message
  useEffect(() => {
    if (messages.length === 0) {
      setMessages([
        {
          sender: "bot",
          text: "Hello! I am **VaultAssistant**, your personal guide for StreamVault. \n\nI can help you with:\n* **Suggestions**: Ask *'Recommend a horror movie'* or *'What is a show similar to Stranger Things?'*\n* **Plot Summaries**: Ask *'What is Inception about?'*\n* **Support**: Ask *'How do I change my parental PIN?'* or *'What subscription plans are available?'*\n\nHow can I assist you today?",
          timestamp: new Date(),
        },
      ]);
    }
  }, [messages]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  if (!isAuthenticated) return null;

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const message = inputVal.trim();
    if (!message || loading) return;

    // Add user message
    const userMsg: ChatMessage = {
      sender: "user",
      text: message,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInputVal("");
    setLoading(true);

    try {
      const response = await apiClient.post("/interactions/chat", { message });
      const botReply = response.data?.data?.response || "I couldn't fetch a reply. Please try again.";
      setMessages((prev) => [
        ...prev,
        {
          sender: "bot",
          text: botReply,
          timestamp: new Date(),
        },
      ]);
    } catch (err: any) {
      console.error("VaultAssistant chat error:", err);
      setMessages((prev) => [
        ...prev,
        {
          sender: "bot",
          text: "Sorry, I am having trouble connecting to the server. Please try again later.",
          timestamp: new Date(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const renderMessageContent = (content: string) => {
    const lines = content.split("\n");
    return lines.map((line, index) => {
      // Heading level 3 / h4
      if (line.startsWith("### ")) {
        return (
          <h4 key={index} className="text-sm font-bold text-white mt-3 mb-1 first:mt-0">
            {line.replace("### ", "")}
          </h4>
        );
      }

      // Check for bullet lists
      let isBullet = false;
      let lineContent = line;
      if (line.trim().startsWith("* ") || line.trim().startsWith("- ")) {
        isBullet = true;
        lineContent = line.trim().substring(2);
      }

      // Parser for **bold** and [label](url)
      const parts: React.ReactNode[] = [];
      let cursor = 0;
      const regex = /(\*\*.*?\*\*|\[.*?\]\(.*?\))/g;
      let match;

      while ((match = regex.exec(lineContent)) !== null) {
        const matchIndex = match.index;
        if (matchIndex > cursor) {
          parts.push(lineContent.substring(cursor, matchIndex));
        }

        const matchedText = match[0];
        if (matchedText.startsWith("**") && matchedText.endsWith("**")) {
          parts.push(
            <strong key={matchIndex} className="font-extrabold text-white">
              {matchedText.slice(2, -2)}
            </strong>
          );
        } else {
          const linkMatch = matchedText.match(/\[(.*?)\]\((.*?)\)/);
          if (linkMatch) {
            const label = linkMatch[1];
            const url = linkMatch[2];
            const isExternal = url.startsWith("http");
            if (isExternal) {
              parts.push(
                <a
                  key={matchIndex}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline font-bold"
                >
                  {label}
                </a>
              );
            } else {
              parts.push(
                <span
                  key={matchIndex}
                  onClick={() => {
                    setIsOpen(false);
                    window.location.href = url;
                  }}
                  className="text-primary hover:underline font-bold cursor-pointer"
                >
                  {label}
                </span>
              );
            }
          } else {
            parts.push(matchedText);
          }
        }
        cursor = regex.lastIndex;
      }

      if (cursor < lineContent.length) {
        parts.push(lineContent.substring(cursor));
      }

      if (isBullet) {
        return (
          <li key={index} className="ml-4 list-disc text-white/90 my-0.5 text-[13px]">
            {parts.length > 0 ? parts : lineContent}
          </li>
        );
      }

      return (
        <p key={index} className="text-white/85 my-1 text-[13px] leading-relaxed min-h-[1.25rem]">
          {parts.length > 0 ? parts : lineContent}
        </p>
      );
    });
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      {/* ── Chat Window ── */}
      {isOpen && (
        <div className="mb-4 flex h-[480px] w-[340px] sm:w-[380px] flex-col overflow-hidden rounded-2xl border border-white/[0.08] bg-[oklch(0.095_0.014_258)] shadow-panel animate-in slide-in-from-bottom-5 duration-200">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-white/[0.08] bg-white/[0.03] px-4 py-3">
            <div className="flex items-center gap-2.5">
              <div className="relative flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Bot className="size-5" />
                <span className="absolute bottom-0 right-0 size-2.5 rounded-full border-2 border-[oklch(0.095_0.014_258)] bg-emerald-500" />
              </div>
              <div>
                <p className="text-[13px] font-bold text-white flex items-center gap-1.5">
                  VaultAssistant <Sparkles className="size-3 text-primary animate-pulse" />
                </p>
                <p className="text-[10px] text-white/45">StreamVault Guide</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="inline-flex size-8 items-center justify-center rounded-lg hover:bg-white/[0.08] text-white/60 hover:text-white transition-colors cursor-pointer"
            >
              <X className="size-4" />
            </button>
          </div>

          {/* Messages area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((msg, i) => {
              const isBot = msg.sender === "bot";
              return (
                <div key={i} className={`flex gap-2.5 ${isBot ? "justify-start" : "justify-end"}`}>
                  {isBot && (
                    <div className="flex size-7.5 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <Bot className="size-4" />
                    </div>
                  )}
                  <div
                    className={`max-w-[80%] rounded-2xl px-3.5 py-2.5 ${
                      isBot
                        ? "bg-white/[0.04] text-white/90 rounded-tl-sm border border-white/[0.04]"
                        : "bg-primary text-white rounded-tr-sm shadow-glow-sm"
                    }`}
                  >
                    {isBot ? (
                      <div>{renderMessageContent(msg.text)}</div>
                    ) : (
                      <p className="text-[13px] leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                    )}
                  </div>
                  {!isBot && (
                    <div className="flex size-7.5 shrink-0 items-center justify-center rounded-lg bg-white/10 text-white">
                      <User className="size-4" />
                    </div>
                  )}
                </div>
              );
            })}

            {/* Thinking / Loading Spinner */}
            {loading && (
              <div className="flex gap-2.5 justify-start">
                <div className="flex size-7.5 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Bot className="size-4" />
                </div>
                <div className="flex items-center gap-1.5 max-w-[80%] rounded-2xl bg-white/[0.04] px-4 py-3 text-white/60 text-xs border border-white/[0.04]">
                  <Loader2 className="size-3.5 animate-spin text-primary" />
                  VaultAssistant is thinking...
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input form */}
          <form onSubmit={handleSend} className="border-t border-white/[0.08] bg-white/[0.02] p-3 flex gap-2">
            <input
              type="text"
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              placeholder="Ask VaultAssistant..."
              className="h-10 flex-1 rounded-xl border border-white/8 bg-white/4 px-3.5 text-[13px] text-white placeholder:text-white/30 outline-none focus:border-primary/50 focus:bg-white/8 transition-all"
            />
            <button
              type="submit"
              disabled={loading || !inputVal.trim()}
              className="inline-flex size-10 items-center justify-center rounded-xl bg-primary hover:bg-primary/95 text-white disabled:opacity-50 transition-colors shadow-glow-sm cursor-pointer shrink-0"
            >
              <Send className="size-4.5" />
            </button>
          </form>
        </div>
      )}

      {/* ── Float Button ── */}
      <button
        onClick={() => {
          setIsOpen(!isOpen);
          setHasNewMsg(false);
        }}
        className="group relative flex size-13 items-center justify-center rounded-full bg-primary text-white hover:bg-primary/95 shadow-glow hover:scale-105 active:scale-95 transition-all duration-200 cursor-pointer"
        aria-label="VaultAssistant Chat"
      >
        {isOpen ? (
          <X className="size-5.5" />
        ) : (
          <>
            <MessageSquare className="size-5.5 group-hover:rotate-6 transition-transform" />
            {hasNewMsg && (
              <span className="absolute -top-0.5 -right-0.5 size-3.5 rounded-full border-2 border-[oklch(0.095_0.014_258)] bg-red-500" />
            )}
          </>
        )}
      </button>
    </div>
  );
}
