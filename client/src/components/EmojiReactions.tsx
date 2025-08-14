import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useAuth } from "@/hooks/use-auth";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Plus, Smile } from "lucide-react";

interface EmojiReactionsProps {
  targetType: string;
  targetId: string;
  className?: string;
}

// Common emojis for family interactions
const EMOJI_OPTIONS = [
  '❤️', '👍', '👎', '😊', '😂', '😮', '😢', '😡', 
  '🙏', '👏', '🎉', '🔥', '💯', '✨', '🤔', '👀'
];

export function EmojiReactions({ targetType, targetId, className = "" }: EmojiReactionsProps) {
  const { user } = useAuth();
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  const { data: reactions = {} } = useQuery<Record<string, { count: number; userReacted: boolean }>>({
    queryKey: ['reactions', targetType, targetId],
    enabled: !!user
  });

  const addReactionMutation = useMutation({
    mutationFn: async (emoji: string) => {
      return apiRequest('/api/reactions', {
        method: 'POST',
        body: JSON.stringify({
          emoji,
          targetType,
          targetId
        })
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reactions', targetType, targetId] });
      setShowEmojiPicker(false);
    }
  });

  const removeReactionMutation = useMutation({
    mutationFn: async (emoji: string) => {
      return apiRequest(`/api/reactions/${targetType}/${targetId}/${encodeURIComponent(emoji)}`, {
        method: 'DELETE',
        body: JSON.stringify({})
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reactions', targetType, targetId] });
    }
  });

  const handleEmojiClick = (emoji: string) => {
    const reactionData = reactions[emoji];
    if (reactionData?.userReacted) {
      removeReactionMutation.mutate(emoji);
    } else {
      addReactionMutation.mutate(emoji);
    }
  };

  const reactionEntries = Object.entries(reactions).filter(([_, data]) => data.count > 0);

  return (
    <div className={`flex items-center gap-2 flex-wrap ${className}`} data-testid={`reactions-${targetType}-${targetId}`}>
      {/* Existing reactions */}
      {reactionEntries.map(([emoji, data]) => (
        <Button
          key={emoji}
          variant={data.userReacted ? "default" : "outline"}
          size="sm"
          className="h-8 px-2 py-1 text-sm"
          onClick={() => handleEmojiClick(emoji)}
          data-testid={`reaction-${emoji.codePointAt(0)}`}
        >
          <span className="mr-1">{emoji}</span>
          <span>{data.count}</span>
        </Button>
      ))}

      {/* Add reaction button */}
      <Popover open={showEmojiPicker} onOpenChange={setShowEmojiPicker}>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 text-gray-500 hover:text-gray-700"
            data-testid="button-add-reaction"
          >
            <Plus className="w-4 h-4" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-64 p-3" align="start">
          <div className="grid grid-cols-8 gap-1">
            {EMOJI_OPTIONS.map((emoji) => (
              <Button
                key={emoji}
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 text-lg hover:bg-gray-100"
                onClick={() => handleEmojiClick(emoji)}
                data-testid={`emoji-option-${emoji.codePointAt(0)}`}
              >
                {emoji}
              </Button>
            ))}
          </div>
          <div className="mt-2 text-xs text-gray-500 text-center">
            Click an emoji to react
          </div>
        </PopoverContent>
      </Popover>

      {/* Reaction count summary for screen readers */}
      {reactionEntries.length > 0 && (
        <span className="sr-only">
          {reactionEntries.length} reaction{reactionEntries.length !== 1 ? 's' : ''} total
        </span>
      )}
    </div>
  );
}