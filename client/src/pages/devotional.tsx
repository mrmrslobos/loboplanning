import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { 
  Plus, BookOpen, Calendar, MessageSquare, 
  Users, User, Heart, Share2, Edit, Trash2
} from "lucide-react";
import { cn, formatDate, formatDateTime, generateInitials } from "@/lib/utils";
import type { DevotionalPost, DevotionalComment } from "@shared/schema";

export default function Devotional() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showPostForm, setShowPostForm] = useState(false);
  const [showCommentForm, setShowCommentForm] = useState<string | null>(null);
  const [selectedPost, setSelectedPost] = useState<DevotionalPost | null>(null);

  const { data: posts, isLoading } = useQuery({
    queryKey: ['/api/devotional/posts'],
    enabled: !!user?.familyId,
  });

  const { data: comments } = useQuery({
    queryKey: ['/api/devotional/posts', selectedPost?.id, 'comments'],
    enabled: !!selectedPost?.id,
  });

  const createPostMutation = useMutation({
    mutationFn: async (data: {
      title: string;
      reading?: string;
      topic?: string;
      questions?: string;
      prayer?: string;
      date: string;
      familyId?: string;
    }) => {
      return apiRequest('POST', '/api/devotional/posts', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/devotional/posts'] });
      setShowPostForm(false);
      toast({ title: "Success", description: "Devotional post created successfully" });
    },
  });

  const createCommentMutation = useMutation({
    mutationFn: async (data: { postId: string; comment: string }) => {
      return apiRequest('POST', `/api/devotional/posts/${data.postId}/comments`, { comment: data.comment });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/devotional/posts', selectedPost?.id, 'comments'] });
      setShowCommentForm(null);
      toast({ title: "Success", description: "Comment added successfully" });
    },
  });

  const [postForm, setPostForm] = useState({
    title: "",
    reading: "",
    topic: "",
    questions: "",
    prayer: "",
    date: new Date().toISOString().split('T')[0],
    isShared: false,
  });

  const [commentForm, setCommentForm] = useState({
    comment: "",
  });

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!postForm.title.trim()) {
      toast({
        title: "Error",
        description: "Please enter a title",
        variant: "destructive",
      });
      return;
    }

    createPostMutation.mutate({
      title: postForm.title.trim(),
      reading: postForm.reading.trim() || undefined,
      topic: postForm.topic.trim() || undefined,
      questions: postForm.questions.trim() || undefined,
      prayer: postForm.prayer.trim() || undefined,
      date: new Date(postForm.date).toISOString(),
      familyId: postForm.isShared && user?.familyId ? user.familyId : undefined,
    });

    setPostForm({
      title: "",
      reading: "",
      topic: "",
      questions: "",
      prayer: "",
      date: new Date().toISOString().split('T')[0],
      isShared: false,
    });
  };

  const handleCreateComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentForm.comment.trim() || !selectedPost) return;

    createCommentMutation.mutate({
      postId: selectedPost.id,
      comment: commentForm.comment.trim(),
    });

    setCommentForm({ comment: "" });
  };

  const sortedPosts = posts?.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()) || [];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Devotional</h1>
            <p className="mt-1 text-sm text-gray-600">Share daily devotions and spiritual thoughts with your family</p>
          </div>
          <Button onClick={() => setShowPostForm(true)} data-testid="button-create-devotional">
            <Plus className="h-4 w-4 mr-2" />
            New Devotional
          </Button>
        </div>
      </header>

      <main className="p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Posts List */}
          <div className="lg:col-span-2 space-y-6">
            {sortedPosts.length === 0 ? (
              <Card data-testid="card-no-devotionals">
                <CardContent className="p-12">
                  <div className="text-center">
                    <BookOpen className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-xl font-medium text-gray-900 mb-2">No devotionals yet</h3>
                    <p className="text-gray-500 mb-4">Start sharing daily devotions with your family</p>
                    <Button onClick={() => setShowPostForm(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Create First Devotional
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              sortedPosts.map((post) => (
                <Card 
                  key={post.id} 
                  className="hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => setSelectedPost(post)}
                  data-testid={`devotional-post-${post.id}`}
                >
                  <CardHeader className="border-b border-gray-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center text-white font-medium">
                          <BookOpen className="h-5 w-5" />
                        </div>
                        <div>
                          <CardTitle className="text-lg">{post.title}</CardTitle>
                          <div className="flex items-center text-sm text-gray-500 mt-1 space-x-3">
                            <div className="flex items-center">
                              <Calendar className="h-3 w-3 mr-1" />
                              <span>{formatDate(post.date)}</span>
                            </div>
                            <Badge variant="outline">
                              {post.familyId ? (
                                <><Users className="h-3 w-3 mr-1" />Shared</>
                              ) : (
                                <><User className="h-3 w-3 mr-1" />Private</>
                              )}
                            </Badge>
                          </div>
                        </div>
                      </div>
                      <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center text-primary text-sm font-medium">
                        {generateInitials(user?.name || "U")}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="space-y-4">
                      {post.topic && (
                        <div>
                          <h4 className="text-sm font-medium text-gray-700 mb-1">Today's Topic</h4>
                          <p className="text-gray-900">{post.topic}</p>
                        </div>
                      )}
                      
                      {post.reading && (
                        <div>
                          <h4 className="text-sm font-medium text-gray-700 mb-1">Scripture Reading</h4>
                          <p className="text-gray-900 italic">{post.reading}</p>
                        </div>
                      )}
                      
                      {post.questions && (
                        <div>
                          <h4 className="text-sm font-medium text-gray-700 mb-1">Discussion Questions</h4>
                          <p className="text-gray-900">{post.questions}</p>
                        </div>
                      )}
                      
                      {post.prayer && (
                        <div>
                          <h4 className="text-sm font-medium text-gray-700 mb-1">Prayer</h4>
                          <p className="text-gray-900 italic">{post.prayer}</p>
                        </div>
                      )}
                    </div>
                    
                    {post.familyId && (
                      <div className="mt-4 pt-4 border-t border-gray-200">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedPost(post);
                            setShowCommentForm(post.id);
                          }}
                          data-testid={`button-comment-${post.id}`}
                        >
                          <MessageSquare className="h-4 w-4 mr-2" />
                          Add Comment
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))
            )}
          </div>

          {/* Comments Sidebar */}
          <div>
            {selectedPost ? (
              <Card data-testid="card-devotional-comments">
                <CardHeader className="border-b border-gray-200">
                  <CardTitle className="text-lg">Comments</CardTitle>
                  <p className="text-sm text-gray-600">{selectedPost.title}</p>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="max-h-96 overflow-y-auto">
                    {comments?.length === 0 ? (
                      <div className="text-center py-8 px-6">
                        <MessageSquare className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                        <p className="text-gray-500 text-sm">No comments yet</p>
                        {selectedPost.familyId && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setShowCommentForm(selectedPost.id)}
                            className="mt-2"
                          >
                            Be the first to comment
                          </Button>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-4 p-4">
                        {comments?.map((comment) => (
                          <div key={comment.id} className="flex space-x-3" data-testid={`comment-${comment.id}`}>
                            <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center text-gray-600 text-sm font-medium">
                              {generateInitials("User")}
                            </div>
                            <div className="flex-1">
                              <div className="bg-gray-50 rounded-lg p-3">
                                <p className="text-sm text-gray-900">{comment.comment}</p>
                              </div>
                              <p className="text-xs text-gray-500 mt-1">
                                {formatDateTime(comment.createdAt || new Date())}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  {selectedPost.familyId && showCommentForm === selectedPost.id && (
                    <div className="border-t border-gray-200 p-4">
                      <form onSubmit={handleCreateComment} className="space-y-3">
                        <Textarea
                          value={commentForm.comment}
                          onChange={(e) => setCommentForm({ comment: e.target.value })}
                          placeholder="Share your thoughts..."
                          rows={3}
                          data-testid="textarea-comment"
                        />
                        <div className="flex items-center justify-end space-x-2">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => setShowCommentForm(null)}
                          >
                            Cancel
                          </Button>
                          <Button
                            type="submit"
                            size="sm"
                            disabled={!commentForm.comment.trim() || createCommentMutation.isPending}
                            data-testid="button-submit-comment"
                          >
                            {createCommentMutation.isPending ? "Posting..." : "Post Comment"}
                          </Button>
                        </div>
                      </form>
                    </div>
                  )}
                </CardContent>
              </Card>
            ) : (
              <Card data-testid="card-select-devotional">
                <CardContent className="p-8">
                  <div className="text-center">
                    <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Select a devotional</h3>
                    <p className="text-gray-500">Choose a devotional post to view comments and discussions</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>

      {/* Create Devotional Modal */}
      <Dialog open={showPostForm} onOpenChange={setShowPostForm}>
        <DialogContent className="sm:max-w-2xl" data-testid="modal-create-devotional">
          <DialogHeader>
            <DialogTitle>Create New Devotional</DialogTitle>
          </DialogHeader>
          
          <form onSubmit={handleCreatePost} className="space-y-4">
            <div>
              <Label htmlFor="devotionalTitle">Title</Label>
              <Input
                id="devotionalTitle"
                value={postForm.title}
                onChange={(e) => setPostForm(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Enter devotional title"
                data-testid="input-devotional-title"
              />
            </div>
            
            <div>
              <Label htmlFor="devotionalDate">Date</Label>
              <Input
                id="devotionalDate"
                type="date"
                value={postForm.date}
                onChange={(e) => setPostForm(prev => ({ ...prev, date: e.target.value }))}
                data-testid="input-devotional-date"
              />
            </div>
            
            <div>
              <Label htmlFor="devotionalTopic">Topic (optional)</Label>
              <Input
                id="devotionalTopic"
                value={postForm.topic}
                onChange={(e) => setPostForm(prev => ({ ...prev, topic: e.target.value }))}
                placeholder="What's today's focus?"
                data-testid="input-devotional-topic"
              />
            </div>
            
            <div>
              <Label htmlFor="devotionalReading">Scripture Reading (optional)</Label>
              <Textarea
                id="devotionalReading"
                value={postForm.reading}
                onChange={(e) => setPostForm(prev => ({ ...prev, reading: e.target.value }))}
                placeholder="Enter scripture passage or reference"
                rows={3}
                data-testid="textarea-devotional-reading"
              />
            </div>
            
            <div>
              <Label htmlFor="devotionalQuestions">Discussion Questions (optional)</Label>
              <Textarea
                id="devotionalQuestions"
                value={postForm.questions}
                onChange={(e) => setPostForm(prev => ({ ...prev, questions: e.target.value }))}
                placeholder="Questions for family discussion"
                rows={3}
                data-testid="textarea-devotional-questions"
              />
            </div>
            
            <div>
              <Label htmlFor="devotionalPrayer">Prayer (optional)</Label>
              <Textarea
                id="devotionalPrayer"
                value={postForm.prayer}
                onChange={(e) => setPostForm(prev => ({ ...prev, prayer: e.target.value }))}
                placeholder="Prayer for today"
                rows={3}
                data-testid="textarea-devotional-prayer"
              />
            </div>
            
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <span className="text-sm font-medium text-gray-900">Share with family</span>
                <p className="text-xs text-gray-500">Make this devotional visible to all family members</p>
              </div>
              <Switch
                checked={postForm.isShared}
                onCheckedChange={(checked) => setPostForm(prev => ({ ...prev, isShared: checked }))}
                data-testid="switch-devotional-shared"
              />
            </div>
            
            <div className="flex items-center justify-end space-x-3 pt-4">
              <Button type="button" variant="outline" onClick={() => setShowPostForm(false)}>
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={createPostMutation.isPending}
                data-testid="button-create-devotional-submit"
              >
                {createPostMutation.isPending ? "Creating..." : "Create Devotional"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
