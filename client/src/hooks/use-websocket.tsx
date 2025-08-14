import { useEffect, useRef, useState } from "react";
import { useAuth } from "./use-auth";

interface ChatMessage {
  id: string;
  message: string;
  userId: string;
  familyId: string;
  createdAt: Date | string;
  user?: {
    id: string;
    name: string;
  };
}

interface WebSocketMessage {
  type: 'chat_message' | 'online_count' | 'join';
  message?: ChatMessage;
  count?: number;
  content?: string;
  userId?: string;
  familyId?: string;
}

export function useWebSocket() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [onlineCount, setOnlineCount] = useState(0);
  const [connected, setConnected] = useState(false);
  const ws = useRef<WebSocket | null>(null);

  useEffect(() => {
    if (!user?.familyId) return;

    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    
    ws.current = new WebSocket(wsUrl);

    ws.current.onopen = () => {
      setConnected(true);
      // Join family room
      ws.current?.send(JSON.stringify({
        type: 'join',
        familyId: user.familyId
      }));
    };

    ws.current.onmessage = (event) => {
      try {
        const data: WebSocketMessage = JSON.parse(event.data);
        
        if (data.type === 'chat_message' && data.message) {
          setMessages(prev => [...prev, data.message!]);
        } else if (data.type === 'online_count') {
          setOnlineCount(data.count || 0);
        }
      } catch (error) {
        console.error('WebSocket message parse error:', error);
      }
    };

    ws.current.onclose = () => {
      setConnected(false);
    };

    ws.current.onerror = (error) => {
      console.error('WebSocket error:', error);
      setConnected(false);
    };

    return () => {
      ws.current?.close();
    };
  }, [user?.familyId]);

  const sendMessage = (content: string) => {
    if (ws.current?.readyState === WebSocket.OPEN && user) {
      ws.current.send(JSON.stringify({
        type: 'chat_message',
        content,
        userId: user.id
      }));
    }
  };

  const setInitialMessages = (initialMessages: ChatMessage[]) => {
    setMessages(initialMessages);
  };

  return {
    messages,
    onlineCount,
    connected,
    sendMessage,
    setInitialMessages
  };
}
