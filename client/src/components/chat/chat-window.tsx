import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Send } from "lucide-react";
import { useWebSocket } from "@/hooks/use-websocket";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { generateInitials, formatTime } from "@/lib/utils";
import { cn } from "@/lib/utils";

export function ChatWindow() {
  const { user } = useAuth();
  const [message, setMessage] = useState("");
  const { messages, onlineCount, connected, sendMessage, setInitialMessages } = useWebSocket();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load initial messages
  const { data: initialMessages } = useQuery({
    queryKey: ['/api/chat/messages'],
    enabled: !!user?.familyId,
  });

  useEffect(() => {
    if (initialMessages && Array.isArray(initialMessages)) {
      setInitialMessages(initialMessages);
    }
  }, [initialMessages, setInitialMessages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim() && connected) {
      sendMessage(message.trim());
      setMessage("");
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 h-full flex flex-col">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Family Chat</h3>
          <div className="flex items-center">
            <Badge 
              variant={connected ? "default" : "secondary"}
              className={cn("mr-2", connected ? "bg-green-100 text-green-700" : "")}
            >
              <span className={cn("w-2 h-2 rounded-full mr-2", connected ? "bg-green-500" : "bg-gray-400")}></span>
              {connected ? `${onlineCount} online` : "Offline"}
            </Badge>
          </div>
        </div>
      </div>
      
      {/* Messages */}
      <div className="flex-1 p-4 space-y-4 overflow-y-auto max-h-80" data-testid="chat-messages">
        {messages.map((msg) => {
          const isOwn = msg.userId === user?.id;
          const userName = msg.user?.name || "Unknown";
          
          return (
            <div 
              key={msg.id} 
              className={cn("flex items-start space-x-3", isOwn && "flex-row-reverse space-x-reverse")}
              data-testid={`chat-message-${msg.id}`}
            >
              {!isOwn && (
                <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white text-sm font-medium">
                  {generateInitials(userName)}
                </div>
              )}
              <div className={cn("flex-1", isOwn && "text-right")}>
                {!isOwn && (
                  <div className="flex items-center space-x-2 mb-1">
                    <span className="text-sm font-medium text-gray-900">{userName}</span>
                    <span className="text-xs text-gray-500">{formatTime(msg.createdAt)}</span>
                  </div>
                )}
                <div
                  className={cn(
                    "inline-block rounded-lg px-3 py-2 max-w-xs lg:max-w-md",
                    isOwn 
                      ? "bg-primary text-white" 
                      : "bg-gray-100 text-gray-900"
                  )}
                >
                  <p className="text-sm">{msg.message}</p>
                  {isOwn && (
                    <p className="text-xs text-primary-foreground/70 mt-1">
                      {formatTime(msg.createdAt)}
                    </p>
                  )}
                </div>
              </div>
              {isOwn && (
                <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white text-sm font-medium">
                  {generateInitials(user?.name || "You")}
                </div>
              )}
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t border-gray-200 p-4">
        <form onSubmit={handleSendMessage} className="flex items-center space-x-2">
          <Input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type a message..."
            disabled={!connected}
            className="flex-1"
            data-testid="input-chat-message"
          />
          <Button 
            type="submit" 
            disabled={!connected || !message.trim()}
            size="sm"
            data-testid="button-send-message"
          >
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </div>
  );
}
