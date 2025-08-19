import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { 
  Bot, 
  Send, 
  User, 
  Sparkles, 
  CheckCircle2, 
  Calendar, 
  DollarSign, 
  List, 
  BookOpen,
  Lightbulb,
  Clock
} from "lucide-react";

interface ChatMessage {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  actions?: Array<{
    type: string;
    data: any;
    description: string;
    executed?: boolean;
  }>;
  suggestions?: string[];
}

interface AssistantResponse {
  message: string;
  actions?: Array<{
    type: string;
    data: any;
    description: string;
  }>;
  suggestions?: string[];
}

export default function AssistantPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: user } = useQuery({
    queryKey: ['/api/auth/me'],
  });

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Send message to AI assistant
  const sendMessage = useMutation<AssistantResponse, Error, string>({
    mutationFn: async (message: string) => {
      const response = await apiRequest('POST', '/api/ai/assistant', { message });
      return await response.json();
    },
    onSuccess: (response, userMessage) => {
      // Add user message
      const userMsg: ChatMessage = {
        id: `user-${Date.now()}`,
        type: 'user',
        content: userMessage,
        timestamp: new Date()
      };

      // Add assistant response
      const assistantMsg: ChatMessage = {
        id: `assistant-${Date.now()}`,
        type: 'assistant',
        content: response.message,
        timestamp: new Date(),
        actions: response.actions,
        suggestions: response.suggestions
      };

      setMessages(prev => [...prev, userMsg, assistantMsg]);
      setIsTyping(false);
    },
    onError: (error) => {
      toast({
        title: "Assistant Error",
        description: "Failed to get response from AI assistant. Please try again.",
        variant: "destructive",
      });
      setIsTyping(false);
    },
  });

  // Execute assistant action
  const executeAction = useMutation({
    mutationFn: async (action: any) => {
      const response = await apiRequest('POST', '/api/ai/assistant/execute', { action });
      return await response.json();
    },
    onSuccess: (result, action) => {
      // Mark action as executed
      setMessages(prev => prev.map(msg => {
        if (msg.actions) {
          return {
            ...msg,
            actions: msg.actions.map(a => 
              a === action ? { ...a, executed: true } : a
            )
          };
        }
        return msg;
      }));

      // Invalidate relevant queries
      if (action.type === 'create_task') {
        queryClient.invalidateQueries({ queryKey: ['/api/tasks'] });
      } else if (action.type === 'create_event') {
        queryClient.invalidateQueries({ queryKey: ['/api/calendar/events'] });
      } else if (action.type === 'add_budget_transaction') {
        queryClient.invalidateQueries({ queryKey: ['/api/budget/transactions'] });
      } else if (action.type === 'create_list') {
        queryClient.invalidateQueries({ queryKey: ['/api/lists'] });
      }

      toast({
        title: "Action Completed",
        description: action.description,
      });
    },
    onError: () => {
      toast({
        title: "Action Failed",
        description: "Failed to execute the requested action.",
        variant: "destructive",
      });
    },
  });

  const handleSendMessage = () => {
    if (!inputMessage.trim()) return;

    setIsTyping(true);
    sendMessage.mutate(inputMessage);
    setInputMessage("");
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleQuickSuggestion = (suggestion: string) => {
    setInputMessage(suggestion);
  };

  const getActionIcon = (type: string) => {
    switch (type) {
      case 'create_task': return <CheckCircle2 className="h-4 w-4" />;
      case 'create_event': return <Calendar className="h-4 w-4" />;
      case 'add_budget_transaction': return <DollarSign className="h-4 w-4" />;
      case 'create_list': return <List className="h-4 w-4" />;
      case 'generate_devotional': return <BookOpen className="h-4 w-4" />;
      default: return <Sparkles className="h-4 w-4" />;
    }
  };

  const quickSuggestions = [
    "What tasks should I focus on today?",
    "Help me plan dinner for this week",
    "Add groceries to my shopping list",
    "Schedule family time this weekend",
    "How are we doing with our budget this month?",
    "Generate a devotional for our family",
    "What's coming up on our calendar?",
    "Create a task to call mom"
  ];

  return (
    <div className="container mx-auto p-4 max-w-4xl h-screen flex flex-col">
      <Card className="flex-1 flex flex-col">
        <CardHeader className="pb-3">
          <CardTitle className="text-xl flex items-center space-x-2">
            <Bot className="h-6 w-6 text-blue-600" />
            <span>AI Family Assistant</span>
            {isTyping && (
              <div className="flex space-x-1">
                <div className="h-2 w-2 bg-blue-500 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                <div className="h-2 w-2 bg-blue-500 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                <div className="h-2 w-2 bg-blue-500 rounded-full animate-bounce"></div>
              </div>
            )}
          </CardTitle>
        </CardHeader>

        <CardContent className="flex-1 flex flex-col p-4">
          {/* Quick Suggestions */}
          {messages.length === 0 && (
            <div className="mb-4">
              <div className="flex items-center space-x-2 mb-3">
                <Lightbulb className="h-4 w-4 text-yellow-500" />
                <span className="text-sm font-medium">Quick Suggestions:</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {quickSuggestions.map((suggestion, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    size="sm"
                    className="text-left justify-start h-auto py-2 px-3"
                    onClick={() => handleQuickSuggestion(suggestion)}
                    data-testid={`suggestion-${index}`}
                  >
                    <span className="text-xs">{suggestion}</span>
                  </Button>
                ))}
              </div>
              <Separator className="mt-4" />
            </div>
          )}

          {/* Messages */}
          <ScrollArea className="flex-1 pr-4">
            <div className="space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] rounded-lg p-3 ${
                      message.type === 'user'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 dark:bg-gray-800'
                    }`}
                  >
                    <div className="flex items-start space-x-2">
                      {message.type === 'assistant' && (
                        <Bot className="h-4 w-4 mt-0.5 text-blue-600" />
                      )}
                      {message.type === 'user' && (
                        <User className="h-4 w-4 mt-0.5" />
                      )}
                      <div className="flex-1">
                        <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                        
                        {/* Actions */}
                        {message.actions && message.actions.length > 0 && (
                          <div className="mt-3 space-y-2">
                            <p className="text-xs font-medium">Suggested Actions:</p>
                            {message.actions.map((action, index) => (
                              <div key={index} className="flex items-center space-x-2">
                                <Button
                                  size="sm"
                                  variant={action.executed ? "secondary" : "outline"}
                                  onClick={() => !action.executed && executeAction.mutate(action)}
                                  disabled={action.executed || executeAction.isPending}
                                  className="text-xs h-7"
                                  data-testid={`action-${action.type}-${index}`}
                                >
                                  {getActionIcon(action.type)}
                                  <span className="ml-1">
                                    {action.executed ? 'Completed' : action.description}
                                  </span>
                                </Button>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Suggestions */}
                        {message.suggestions && message.suggestions.length > 0 && (
                          <div className="mt-3">
                            <p className="text-xs font-medium mb-2">You might also ask:</p>
                            <div className="flex flex-wrap gap-1">
                              {message.suggestions.map((suggestion, index) => (
                                <Badge
                                  key={index}
                                  variant="secondary"
                                  className="text-xs cursor-pointer hover:bg-blue-100"
                                  onClick={() => handleQuickSuggestion(suggestion)}
                                  data-testid={`message-suggestion-${index}`}
                                >
                                  {suggestion}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}

                        <div className="flex items-center space-x-1 mt-2">
                          <Clock className="h-3 w-3 opacity-50" />
                          <span className="text-xs opacity-50">
                            {message.timestamp.toLocaleTimeString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div ref={messagesEndRef} />
          </ScrollArea>

          {/* Input */}
          <div className="mt-4 flex space-x-2">
            <Input
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask me anything about managing your family..."
              disabled={sendMessage.isPending}
              className="flex-1"
              data-testid="assistant-input"
            />
            <Button
              onClick={handleSendMessage}
              disabled={!inputMessage.trim() || sendMessage.isPending}
              data-testid="send-message-button"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>

          {user?.user && (
            <p className="text-xs text-gray-500 mt-2">
              Connected as {user.user.name} • AI Assistant powered by Gemini
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}