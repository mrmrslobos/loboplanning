import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { 
  MessageSquare, Reply, Edit3, Trash2, MoreHorizontal,
  ChevronDown, ChevronRight
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn, formatDateTime, generateInitials } from "@/lib/utils";
import type { DevotionalComment } from "@shared/schema";

interface ThreadedComment extends DevotionalComment {
  replies: DevotionalComment[];
}

interface ThreadedCommentsProps {
  comments: DevotionalComment[];
  currentUserId: string;
  onReply: (parentId: string) => void;
  onEdit: (comment: DevotionalComment) => void;
  onDelete: (commentId: string) => void;
  replyingTo: string | null;
  editingComment: string | null;
  commentForm: { comment: string };
  setCommentForm: (form: { comment: string }) => void;
  editCommentForm: { comment: string };
  setEditCommentForm: (form: { comment: string }) => void;
  onSubmitComment: (e: React.FormEvent) => void;
  onSubmitEdit: (e: React.FormEvent) => void;
  onCancelReply: () => void;
  onCancelEdit: () => void;
  expandedComments: Set<string>;
  onToggleExpansion: (commentId: string) => void;
}

function CommentItem({ 
  comment, 
  level = 0, 
  currentUserId,
  onReply,
  onEdit,
  onDelete,
  replyingTo,
  editingComment,
  commentForm,
  setCommentForm,
  editCommentForm,
  setEditCommentForm,
  onSubmitComment,
  onSubmitEdit,
  onCancelReply,
  onCancelEdit,
  expandedComments,
  onToggleExpansion
}: {
  comment: ThreadedComment;
  level?: number;
  currentUserId: string;
  onReply: (parentId: string) => void;
  onEdit: (comment: DevotionalComment) => void;
  onDelete: (commentId: string) => void;
  replyingTo: string | null;
  editingComment: string | null;
  commentForm: { comment: string };
  setCommentForm: (form: { comment: string }) => void;
  editCommentForm: { comment: string };
  setEditCommentForm: (form: { comment: string }) => void;
  onSubmitComment: (e: React.FormEvent) => void;
  onSubmitEdit: (e: React.FormEvent) => void;
  onCancelReply: () => void;
  onCancelEdit: () => void;
  expandedComments: Set<string>;
  onToggleExpansion: (commentId: string) => void;
}) {
  const isExpanded = expandedComments.has(comment.id);
  const hasReplies = comment.replies.length > 0;
  const isEditing = editingComment === comment.id;
  const isReplying = replyingTo === comment.id;
  const isOwner = comment.userId === currentUserId;

  return (
    <div className={cn("space-y-3", level > 0 && "ml-8 border-l-2 border-gray-100 pl-4")}>
      <div className="flex gap-3">
        <Avatar className="w-8 h-8 flex-shrink-0">
          <AvatarFallback className="text-xs">
            {generateInitials("User")}
          </AvatarFallback>
        </Avatar>
        
        <div className="flex-1 space-y-2">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <span className="font-medium">User</span>
            <span>•</span>
            <span>{formatDateTime(comment.createdAt)}</span>
            {comment.isEdited && (
              <>
                <span>•</span>
                <span className="text-xs italic">edited</span>
              </>
            )}
          </div>
          
          {isEditing ? (
            <form onSubmit={onSubmitEdit} className="space-y-2">
              <Textarea
                value={editCommentForm.comment}
                onChange={(e) => setEditCommentForm({ comment: e.target.value })}
                placeholder="Edit your comment..."
                className="min-h-[80px]"
                data-testid={`textarea-edit-comment-${comment.id}`}
              />
              <div className="flex gap-2">
                <Button 
                  type="submit" 
                  size="sm"
                  data-testid={`button-save-edit-${comment.id}`}
                >
                  Save
                </Button>
                <Button 
                  type="button" 
                  size="sm" 
                  variant="outline" 
                  onClick={onCancelEdit}
                  data-testid={`button-cancel-edit-${comment.id}`}
                >
                  Cancel
                </Button>
              </div>
            </form>
          ) : (
            <div className="prose prose-sm max-w-none">
              <p className="whitespace-pre-wrap">{comment.comment}</p>
            </div>
          )}
          
          {!isEditing && (
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onReply(comment.id)}
                className="h-7 px-2 text-xs"
                data-testid={`button-reply-${comment.id}`}
              >
                <Reply className="w-3 h-3 mr-1" />
                Reply
              </Button>
              
              {hasReplies && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onToggleExpansion(comment.id)}
                  className="h-7 px-2 text-xs"
                  data-testid={`button-toggle-replies-${comment.id}`}
                >
                  {isExpanded ? (
                    <ChevronDown className="w-3 h-3 mr-1" />
                  ) : (
                    <ChevronRight className="w-3 h-3 mr-1" />
                  )}
                  {comment.replies.length} {comment.replies.length === 1 ? 'reply' : 'replies'}
                </Button>
              )}
              
              {isOwner && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 px-2"
                      data-testid={`button-comment-menu-${comment.id}`}
                    >
                      <MoreHorizontal className="w-3 h-3" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem 
                      onClick={() => onEdit(comment)}
                      data-testid={`menu-edit-comment-${comment.id}`}
                    >
                      <Edit3 className="w-4 h-4 mr-2" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => onDelete(comment.id)}
                      className="text-red-600"
                      data-testid={`menu-delete-comment-${comment.id}`}
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          )}
          
          {/* Reply Form */}
          {isReplying && (
            <form onSubmit={onSubmitComment} className="space-y-2">
              <Textarea
                value={commentForm.comment}
                onChange={(e) => setCommentForm({ comment: e.target.value })}
                placeholder="Write a reply..."
                className="min-h-[80px]"
                data-testid={`textarea-reply-${comment.id}`}
              />
              <div className="flex gap-2">
                <Button 
                  type="submit" 
                  size="sm"
                  data-testid={`button-submit-reply-${comment.id}`}
                >
                  Reply
                </Button>
                <Button 
                  type="button" 
                  size="sm" 
                  variant="outline" 
                  onClick={onCancelReply}
                  data-testid={`button-cancel-reply-${comment.id}`}
                >
                  Cancel
                </Button>
              </div>
            </form>
          )}
        </div>
      </div>
      
      {/* Nested Replies */}
      {hasReplies && isExpanded && (
        <div className="space-y-3">
          {comment.replies.map((reply) => (
            <CommentItem
              key={reply.id}
              comment={{ ...reply, replies: [] }}
              level={level + 1}
              currentUserId={currentUserId}
              onReply={onReply}
              onEdit={onEdit}
              onDelete={onDelete}
              replyingTo={replyingTo}
              editingComment={editingComment}
              commentForm={commentForm}
              setCommentForm={setCommentForm}
              editCommentForm={editCommentForm}
              setEditCommentForm={setEditCommentForm}
              onSubmitComment={onSubmitComment}
              onSubmitEdit={onSubmitEdit}
              onCancelReply={onCancelReply}
              onCancelEdit={onCancelEdit}
              expandedComments={expandedComments}
              onToggleExpansion={onToggleExpansion}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function ThreadedComments(props: ThreadedCommentsProps) {
  // Organize comments into threads
  const organizeComments = (comments: DevotionalComment[]): ThreadedComment[] => {
    const topLevelComments = comments.filter(comment => !comment.parentId);
    const commentReplies = comments.filter(comment => comment.parentId);
    
    const buildThread = (parentComment: DevotionalComment): ThreadedComment => {
      const replies = commentReplies
        .filter(reply => reply.parentId === parentComment.id)
        .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
      
      return {
        ...parentComment,
        replies
      };
    };

    return topLevelComments
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
      .map(buildThread);
  };

  const threadedComments = organizeComments(props.comments);

  if (threadedComments.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-50" />
        <p>No comments yet. Start the discussion!</p>
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="threaded-comments">
      {threadedComments.map((comment) => (
        <CommentItem
          key={comment.id}
          comment={comment}
          currentUserId={props.currentUserId}
          onReply={props.onReply}
          onEdit={props.onEdit}
          onDelete={props.onDelete}
          replyingTo={props.replyingTo}
          editingComment={props.editingComment}
          commentForm={props.commentForm}
          setCommentForm={props.setCommentForm}
          editCommentForm={props.editCommentForm}
          setEditCommentForm={props.setEditCommentForm}
          onSubmitComment={props.onSubmitComment}
          onSubmitEdit={props.onSubmitEdit}
          onCancelReply={props.onCancelReply}
          onCancelEdit={props.onCancelEdit}
          expandedComments={props.expandedComments}
          onToggleExpansion={props.onToggleExpansion}
        />
      ))}
    </div>
  );
}