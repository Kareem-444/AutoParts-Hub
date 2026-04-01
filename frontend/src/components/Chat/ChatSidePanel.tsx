"use client";

import { useState, useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import { chat, getAuthToken } from "@/lib/api";
import { getImageUrl } from "@/lib/imageUtils";
import { useAuth } from "@/context/AuthContext";

export interface ChatSidePanelProps {
  isOpen: boolean;
  onClose: () => void;
  productId?: number;
  initialConversationId?: number;
  partnerName?: string;
  partnerAvatar?: string;
  productTitle?: string;
  productThumbnail?: string;
}

export default function ChatSidePanel({
  isOpen,
  onClose,
  productId,
  initialConversationId,
  partnerName,
  partnerAvatar,
  productTitle,
  productThumbnail,
}: ChatSidePanelProps) {
  const t = useTranslations("chat");
  const { user } = useAuth();
  
  const [conversationId, setConversationId] = useState<number | null>(initialConversationId || null);
  const [messages, setMessages] = useState<any[]>([]);
  const [inputText, setInputText] = useState("");
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const ws = useRef<WebSocket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const isRtl = typeof document !== 'undefined' && document.documentElement.dir === 'rtl';

  useEffect(() => {
    setConversationId(initialConversationId || null);
  }, [initialConversationId]);

  useEffect(() => {
    if (isOpen) {
      if (!conversationId && productId) {
        initConversation();
      } else if (conversationId) {
        loadHistory(conversationId);
        connectWs(conversationId);
      }
    } else {
      if (ws.current) {
        ws.current.close();
        ws.current = null;
      }
      setIsConnected(false);
    }
    
    return () => {
      if (ws.current) {
        ws.current.close();
      }
    };
  }, [isOpen, conversationId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const initConversation = async () => {
    if (!productId) return;
    setIsLoading(true);
    try {
      const conv = await chat.createConversation(productId);
      setConversationId(conv.id);
      loadHistory(conv.id);
      connectWs(conv.id);
    } catch (error) {
      console.error("Failed to init conversation:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadHistory = async (id: number) => {
    try {
      const history = await chat.getConversationMessages(id);
      setMessages(history);
    } catch (error) {
      console.error("Failed to load history:", error);
    }
  };

  const connectWs = (id: number) => {
    if (ws.current) {
      ws.current.close();
    }
    const token = getAuthToken();
    if (!token) return;

    const isSecure = window.location.protocol === "https:";
    const wsProtocol = isSecure ? "wss:" : "ws:";
    const host = process.env.NEXT_PUBLIC_API_URL 
      ? new URL(process.env.NEXT_PUBLIC_API_URL).host 
      : "localhost:8000";

    const wsUrl = `${wsProtocol}//${host}/ws/chat/${id}/?token=${token}`;
    
    const socket = new WebSocket(wsUrl);
    
    socket.onopen = () => {
      setIsConnected(true);
    };

    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      setMessages(prev => [...prev, data]);
    };

    socket.onclose = () => {
      setIsConnected(false);
    };

    ws.current = socket;
  };

  const sendMessage = () => {
    if (!inputText.trim() || !ws.current || !isConnected) return;
    
    ws.current.send(JSON.stringify({ message: inputText }));
    setInputText("");
  };

  return (
    <>
      {/* Backdrop */}
      <div 
        className={`fixed inset-0 bg-black/40 backdrop-blur-sm z-[100] transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
      />
      
      {/* Slide Panel */}
      <div 
        className={`fixed inset-y-0 ${isRtl ? 'left-0' : 'right-0'} w-full sm:w-[380px] bg-surface flex flex-col shadow-2xl z-[101] transition-transform duration-320 ease-out transform ${isOpen ? 'translate-x-0' : (isRtl ? '-translate-x-full' : 'translate-x-full')}`}
      >
        {/* Header */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-border bg-background shrink-0">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="relative">
              {partnerAvatar ? (
                <img src={partnerAvatar} alt="" className="w-10 h-10 rounded-full object-cover border border-border" />
              ) : (
                <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold border border-primary/20">
                  {partnerName ? partnerName.charAt(0).toUpperCase() : '?'}
                </div>
              )}
              {isConnected && (
                <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-[2px] border-background rounded-full"></div>
              )}
            </div>
            <div className="flex flex-col overflow-hidden">
              <span className="font-bold text-text truncate leading-tight">{partnerName || "Seller"}</span>
              <span className="text-xs text-text-muted truncate">
                {isConnected ? t("connected") : (isLoading ? t("connecting") : t("disconnected"))}
              </span>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-text-muted hover:text-text hover:bg-background-alt rounded-full transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        {/* Product ref snippet (Optional) */}
        {productTitle && (
          <div className="flex items-center gap-3 p-3 mx-4 mt-4 bg-background-alt border border-border rounded-xl">
             {productThumbnail ? (
                 <img src={productThumbnail} alt="" className="w-12 h-12 rounded-lg object-cover bg-white" />
             ) : (
                 <div className="w-12 h-12 rounded-lg bg-surface flex items-center justify-center text-text-light border border-border">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                 </div>
             )}
             <div className="flex flex-col flex-1 truncate">
                <span className="text-xs text-text-muted uppercase tracking-wider font-semibold">About Product</span>
                <span className="text-sm font-medium text-text truncate">{productTitle}</span>
             </div>
          </div>
        )}

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((msg, idx) => {
            const isMe = msg.sender === user?.id || msg.sender_id === user?.id; // API vs WS response difference
            return (
              <div key={idx} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                <div className={`max-w-[85%] rounded-2xl px-4 py-2 ${
                  isMe 
                    ? 'bg-primary text-white rounded-tr-sm' 
                    : 'bg-surface border border-border text-text rounded-tl-sm shadow-sm'
                }`}>
                  <p className="text-sm break-words whitespace-pre-wrap">{msg.content || msg.message}</p>
                </div>
                <span className="text-[10px] text-text-muted mt-1 px-1">
                  {msg.timestamp}
                </span>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-4 bg-background border-t border-border shrink-0">
          <div className="flex items-end gap-2 bg-surface border border-border rounded-xl p-1 shadow-sm focus-within:border-primary focus-within:ring-1 focus-within:ring-primary transition-all">
            <textarea 
              rows={1}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage();
                }
              }}
              placeholder={t("placeholder") || "Type a message..."}
              className="flex-1 max-h-32 min-h-[40px] bg-transparent text-sm p-3 focus:outline-none resize-none"
            />
            <button 
              onClick={sendMessage}
              disabled={!inputText.trim() || !isConnected}
              className={`p-2.5 rounded-lg mb-1 mr-1 shrink-0 transition-colors ${
                inputText.trim() && isConnected 
                  ? 'bg-primary text-white hover:bg-primary-dark shadow-sm' 
                  : 'bg-background-alt text-text-light cursor-not-allowed'
              }`}
            >
              <svg className="w-5 h-5 rtl:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
