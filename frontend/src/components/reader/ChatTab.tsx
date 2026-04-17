"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Brain, Send, ThumbsUp, ThumbsDown, Copy } from "lucide-react";
import { STATUS_CONFIG } from "@/config/documents";
import { inferRisk } from "@/lib/inference";
import type { Document, ChatMessage } from "@/types/documents";

interface Props {
  doc: Document;
}

export function ChatTab({ doc }: Props) {
  const [messages, setMessages]   = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [isTyping, setIsTyping]   = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Reset and seed a welcome message whenever a new document is opened.
  // Dep on doc.documentId means this only fires on a new doc, not on
  // partial → full detail updates for the same document.
  useEffect(() => {
    setChatInput("");
    setIsTyping(false);
    setMessages([
      {
        id: Date.now(),
        role: "assistant",
        content: `I've analyzed **${doc.filename}**. Here are the key highlights:`,
        cards: [
          { label: "Status",    value: STATUS_CONFIG[doc.status]?.label ?? doc.status },
          { label: "Entities",  value: String(doc.entityCount ?? 0)                   },
          { label: "Sentiment", value: doc.sentiment?.overall ?? "—"                  },
          { label: "Risk",      value: inferRisk(doc).toUpperCase()                   },
        ],
      },
    ]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [doc.documentId]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  const sendMessage = useCallback(() => {
    if (!chatInput.trim()) return;
    const userMsg: ChatMessage = { id: Date.now(), role: "user", content: chatInput };
    setMessages((prev) => [...prev, userMsg]);
    setChatInput("");
    setIsTyping(true);

    // Stub — replace with POST /api/documents/{id}/chat backed by Bedrock
    setTimeout(() => {
      setIsTyping(false);
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          role: "assistant",
          content: doc.extractedText
            ? `Based on the extracted content of **${doc.filename}**, the document contains ${doc.entityCount ?? 0} entities with ${doc.sentiment?.overall ?? "neutral"} overall sentiment. Wire this panel to a Bedrock endpoint passing the extracted text as context for fully AI-powered answers.`
            : "This document is still being processed. Please check back once analysis is complete.",
        },
      ]);
    }, 1600);
  }, [chatInput, doc]);

  return (
    <>
      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {messages.map((msg) => (
          <div key={msg.id} className="chat-bubble">
            {msg.role === "assistant" ? (
              <div className="flex items-start gap-2.5">
                <div className="w-6 h-6 rounded-lg bg-teal-600 flex items-center justify-center shrink-0 mt-0.5">
                  <Brain size={12} className="text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] font-semibold text-slate-500 mb-1">DocuMind AI</p>
                  <div className="text-sm text-slate-700 leading-relaxed">
                    {msg.content.split(/(\*\*[^*]+\*\*)/).map((part, i) =>
                      part.startsWith("**") ? (
                        <strong key={i} className="font-semibold text-slate-900">
                          {part.slice(2, -2)}
                        </strong>
                      ) : (
                        part
                      )
                    )}
                  </div>
                  {msg.cards && (
                    <div className="grid grid-cols-2 gap-2 mt-3">
                      {msg.cards.map((c) => (
                        <div key={c.label} className="bg-slate-50 border border-slate-200 rounded-lg p-2.5">
                          <p className="text-[10px] text-slate-500 mb-0.5">{c.label}</p>
                          <p className="text-sm font-semibold text-slate-800">{c.value}</p>
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="flex items-center gap-2 mt-2">
                    <button className="p-1 text-slate-300 hover:text-slate-500 rounded transition-colors"><ThumbsUp size={11} /></button>
                    <button className="p-1 text-slate-300 hover:text-slate-500 rounded transition-colors"><ThumbsDown size={11} /></button>
                    <button className="p-1 text-slate-300 hover:text-slate-500 rounded transition-colors"><Copy size={11} /></button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex justify-end">
                <div className="bg-slate-800 text-white text-sm px-4 py-2.5 rounded-2xl rounded-tr-sm max-w-[80%] leading-relaxed">
                  {msg.content}
                </div>
              </div>
            )}
          </div>
        ))}

        {isTyping && (
          <div className="flex items-start gap-2.5 chat-bubble">
            <div className="w-6 h-6 rounded-lg bg-teal-600 flex items-center justify-center shrink-0">
              <Brain size={12} className="text-white" />
            </div>
            <div className="bg-slate-100 rounded-xl px-3 py-2.5 flex gap-1.5 items-center">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce"
                  style={{ animationDelay: `${i * 0.15}s` }}
                />
              ))}
            </div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Suggested prompts */}
      <div className="px-4 pb-2 flex gap-2 overflow-x-auto">
        {["Summarize this document", "What entities were found?", "What is the sentiment?", "Key numbers?"].map((p) => (
          <button
            key={p}
            onClick={() => setChatInput(p)}
            className="flex-shrink-0 text-[11px] px-3 py-1.5 bg-slate-100 hover:bg-teal-50 hover:text-teal-700 hover:border-teal-300 text-slate-600 rounded-full border border-slate-200 transition-all"
          >
            {p}
          </button>
        ))}
      </div>

      {/* Input */}
      <div className="px-4 pb-4">
        <div className="flex gap-2 items-end bg-slate-50 border border-slate-200 rounded-xl p-2 focus-within:border-teal-400 focus-within:ring-2 focus-within:ring-teal-500/20 transition-all">
          <textarea
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
            placeholder="Ask anything about this document…"
            rows={2}
            className="flex-1 bg-transparent text-sm text-slate-700 placeholder-slate-400 resize-none focus:outline-none leading-relaxed"
          />
          <button
            onClick={sendMessage}
            className={`p-2 rounded-lg transition-all ${
              chatInput.trim()
                ? "bg-teal-600 text-white hover:bg-teal-500"
                : "bg-slate-200 text-slate-400 cursor-not-allowed"
            }`}
          >
            <Send size={13} />
          </button>
        </div>
      </div>
    </>
  );
}