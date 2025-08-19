import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Bot, Send, Lightbulb } from "lucide-react";

export default function AssistantPage() {
  const [message, setMessage] = useState("");
  const [response, setResponse] = useState("");
  const [loading, setLoading] = useState(false);

  const quickSuggestions = [
    "What tasks should I focus on today?",
    "Help me plan dinner for this week",
    "Add groceries to my shopping list",
    "Schedule family time this weekend",
    "How are we doing with our budget this month?",
    "Generate a devotional for our family"
  ];

  const handleSend = async () => {
    if (!message.trim()) return;
    
    setLoading(true);
    try {
      const response = await fetch('/api/ai/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ message })
      });
      
      if (response.ok) {
        const data = await response.json();
        setResponse(data.message || "I received your message!");
      } else {
        setResponse("Sorry, I'm having trouble responding right now.");
      }
    } catch (error) {
      setResponse("Sorry, I'm having trouble responding right now.");
    }
    setLoading(false);
  };

  return (
    <div className="container mx-auto p-4 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Bot className="h-6 w-6 text-blue-600" />
            <span>AI Family Assistant</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Quick Suggestions */}
          <div>
            <div className="flex items-center space-x-2 mb-3">
              <Lightbulb className="h-4 w-4 text-yellow-500" />
              <span className="text-sm font-medium">Quick Suggestions:</span>
            </div>
            <div className="grid grid-cols-1 gap-2">
              {quickSuggestions.map((suggestion, index) => (
                <Button
                  key={index}
                  variant="outline"
                  size="sm"
                  className="text-left justify-start h-auto py-2 px-3"
                  onClick={() => setMessage(suggestion)}
                  data-testid={`suggestion-${index}`}
                >
                  <span className="text-xs">{suggestion}</span>
                </Button>
              ))}
            </div>
          </div>

          {/* Response */}
          {response && (
            <Card className="bg-gray-50 dark:bg-gray-800">
              <CardContent className="pt-4">
                <div className="flex items-start space-x-2">
                  <Bot className="h-4 w-4 mt-0.5 text-blue-600" />
                  <p className="text-sm">{response}</p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Input */}
          <div className="flex space-x-2">
            <Input
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Ask me anything about managing your family..."
              disabled={loading}
              data-testid="assistant-input"
            />
            <Button
              onClick={handleSend}
              disabled={!message.trim() || loading}
              data-testid="send-message-button"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}