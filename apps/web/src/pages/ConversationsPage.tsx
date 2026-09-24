import React, { useState, useEffect, useRef } from "react";
import {
  Sparkles,
  Send,
  User,
  Radio,
  Search,
  MessageSquare,
  Clock,
  Loader2,
  Bot,
} from "lucide-react";
import { useMessages, useSendMessage } from "../lib/queries.js";

export const ConversationsPage: React.FC = () => {
  const { data: messagesData, isLoading } = useMessages();
  const sendMessage = useSendMessage();

  const [inputMessage, setInputMessage] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const messages = messagesData?.messages || [];

  const filteredMessages = messages.filter((m) =>
    m.content.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages.length]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim() || sendMessage.isPending) return;

    const content = inputMessage.trim();
    setInputMessage("");
    await sendMessage.mutateAsync(content);
  };

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden shadow-xl">
      {/* Header */}
      <div className="px-6 py-4 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900/90">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
            <MessageSquare className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-white">Conversations Archive</h2>
            <p className="text-xs text-slate-400">Live chat dialogue synced with Telegram</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Search bar */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search chat transcript..."
              className="pl-8 pr-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-indigo-500 w-44 sm:w-56"
            />
          </div>

          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-950/40 border border-emerald-800/40 text-[11px] text-emerald-300">
            <Radio className="w-3 h-3 text-emerald-400 animate-pulse" />
            <span>Live Sync</span>
          </div>
        </div>
      </div>

      {/* Message Stream */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
        {isLoading ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-400">
            <Loader2 className="w-6 h-6 animate-spin text-indigo-500 mb-2" />
            <p className="text-xs">Loading dialogue history...</p>
          </div>
        ) : filteredMessages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center text-slate-500 space-y-2">
            <Bot className="w-10 h-10 text-slate-600" />
            <p className="text-sm font-medium">No messages found</p>
            <p className="text-xs max-w-sm">
              Send a prompt below or message your Murmur Telegram bot to start a conversation!
            </p>
          </div>
        ) : (
          filteredMessages.map((msg) => {
            const isUser = msg.role === "user";
            return (
              <div
                key={msg.id}
                className={`flex items-start gap-3 ${isUser ? "flex-row-reverse" : "flex-row"}`}
              >
                {/* Avatar */}
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-xs ${
                    isUser
                      ? "bg-indigo-600 text-white"
                      : "bg-slate-800 border border-slate-700 text-indigo-400"
                  }`}
                >
                  {isUser ? <User className="w-4 h-4" /> : <Sparkles className="w-4 h-4" />}
                </div>

                {/* Bubble */}
                <div
                  className={`max-w-xl rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                    isUser
                      ? "bg-indigo-600 text-white rounded-tr-none shadow-md shadow-indigo-600/10"
                      : "bg-slate-800 text-slate-100 rounded-tl-none border border-slate-700/60"
                  }`}
                >
                  <p className="whitespace-pre-wrap">{msg.content}</p>
                  <div
                    className={`mt-1.5 flex items-center gap-1 text-[10px] ${
                      isUser ? "text-indigo-200 justify-end" : "text-slate-400"
                    }`}
                  >
                    <Clock className="w-3 h-3" />
                    <span>
                      {new Date(msg.createdAt).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <form onSubmit={handleSend} className="p-3 bg-slate-950 border-t border-slate-800">
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder="Type a message or reflection for Murmur..."
            className="flex-1 px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-sm text-white focus:outline-none focus:border-indigo-500"
          />
          <button
            type="submit"
            disabled={sendMessage.isPending || !inputMessage.trim()}
            className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-1.5 transition disabled:opacity-50"
          >
            {sendMessage.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <span>Send</span>
                <Send className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
