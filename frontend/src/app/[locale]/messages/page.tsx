"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { chat } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import ChatSidePanel from "@/components/Chat/ChatSidePanel";

export default function MessagesPage() {
  const t = useTranslations("chat");
  const { isAuthenticated, user, loading } = useAuth();
  const router = useRouter();

  const [conversations, setConversations] = useState<any[]>([]);
  const [activeConversation, setActiveConversation] = useState<any | null>(null);

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push("/auth/login?redirect=/messages");
    }
  }, [isAuthenticated, loading, router]);

  const loadConversations = async () => {
    if (!isAuthenticated) return;
    try {
      const data = await chat.getConversations();
      setConversations(data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadConversations();
    const interval = setInterval(loadConversations, 30000);
    return () => clearInterval(interval);
  }, [isAuthenticated]);

  if (loading || !isAuthenticated) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <h1 className="text-3xl font-extrabold text-text mb-8">{t("messages") || "Messages"}</h1>
      
      {conversations.length === 0 ? (
        <div className="bg-surface p-8 rounded-2xl border border-border text-center">
          <p className="text-text-muted">{t("no_conversations") || "No conversations yet"}</p>
        </div>
      ) : (
        <div className="bg-surface rounded-2xl border border-border overflow-hidden shadow-sm">
          {conversations.map((conv) => {
            const partner = conv.buyer.id === user?.id ? conv.seller : conv.buyer;
            const hasUnread = conv.unread_count > 0;

            return (
              <div 
                key={conv.id} 
                onClick={() => setActiveConversation(conv)}
                className="flex items-center gap-4 p-4 border-b border-border last:border-0 hover:bg-background-alt cursor-pointer transition-colors"
              >
                <div className="relative shrink-0">
                  {partner.avatar_url ? (
                    <img src={partner.avatar_url} alt="" className="w-12 h-12 rounded-full object-cover" />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold">
                      {partner.username.charAt(0).toUpperCase()}
                    </div>
                  )}
                  {hasUnread && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-error text-white text-[10px] font-bold flex items-center justify-center rounded-full border-2 border-surface">
                      {conv.unread_count}
                    </span>
                  )}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-baseline mb-1">
                    <h3 className={`text-sm truncate ${hasUnread ? 'font-bold text-text' : 'font-medium text-text'}`}>
                      {partner.username}
                    </h3>
                    <span className="text-xs text-text-light whitespace-nowrap ml-2">
                      {conv.last_message?.timestamp ? new Date(conv.last_message.timestamp).toLocaleDateString() : ""}
                    </span>
                  </div>
                  <p className={`text-sm truncate ${hasUnread ? 'text-text font-medium' : 'text-text-muted'}`}>
                    <span className="font-semibold text-text-light mr-1">[{conv.product_title}]</span>
                    {conv.last_message?.content || "No messages yet"}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {activeConversation && (
        <ChatSidePanel 
          isOpen={!!activeConversation}
          onClose={() => {
            setActiveConversation(null);
            loadConversations();
          }}
          initialConversationId={activeConversation.id}
          partnerName={activeConversation.buyer.id === user?.id ? activeConversation.seller.username : activeConversation.buyer.username}
          partnerAvatar={activeConversation.buyer.id === user?.id ? activeConversation.seller.avatar_url : activeConversation.buyer.avatar_url}
          productTitle={activeConversation.product_title}
        />
      )}
    </div>
  );
}
