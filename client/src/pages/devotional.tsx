import { useState, useEffect } from "react";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { 
  Plus, BookOpen, Calendar, MessageSquare, 
  Users, User, Heart, Share2, Edit, Trash2, 
  RefreshCw, Sparkles, Pray, Quote, X
} from "lucide-react";
import { cn, formatDate, formatDateTime, generateInitials } from "@/lib/utils";
import type { DevotionalPost, DevotionalComment } from "@shared/schema";
import ThreadedComments from "@/components/ThreadedComments";
import { EmojiReactions } from "@/components/EmojiReactions";

// Daily inspirational verses pool
const DAILY_VERSES = [
  { verse: "For I know the plans I have for you, declares the Lord, plans for welfare and not for evil, to give you a future and a hope.", reference: "Jeremiah 29:11" },
  { verse: "Trust in the Lord with all your heart, and do not lean on your own understanding.", reference: "Proverbs 3:5" },
  { verse: "And we know that for those who love God all things work together for good, for those who are called according to his purpose.", reference: "Romans 8:28" },
  { verse: "Be strong and courageous. Do not fear or be in dread of them, for it is the Lord your God who goes with you.", reference: "Deuteronomy 31:6" },
  { verse: "The Lord is my shepherd; I shall not want.", reference: "Psalm 23:1" },
  { verse: "Cast all your anxieties on him, because he cares for you.", reference: "1 Peter 5:7" },
  { verse: "I can do all things through him who strengthens me.", reference: "Philippians 4:13" },
  { verse: "The Lord your God is in your midst, a mighty one who will save; he will rejoice over you with gladness.", reference: "Zephaniah 3:17" },
  { verse: "Come to me, all who labor and are heavy laden, and I will give you rest.", reference: "Matthew 11:28" },
  { verse: "Peace I leave with you; my peace I give to you. Not as the world gives do I give to you.", reference: "John 14:27" },
  { verse: "He gives power to the faint, and to him who has no might he increases strength.", reference: "Isaiah 40:29" },
  { verse: "The Lord is near to the brokenhearted and saves the crushed in spirit.", reference: "Psalm 34:18" },
  { verse: "Do not be anxious about anything, but in everything by prayer and supplication with thanksgiving let your requests be made known to God.", reference: "Philippians 4:6" },
  { verse: "The steadfast love of the Lord never ceases; his mercies never come to an end; they are new every morning.", reference: "Lamentations 3:22-23" },
  { verse: "But those who hope in the Lord will renew their strength. They will soar on wings like eagles.", reference: "Isaiah 40:31" },
];

export default function Devotional() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showPostForm, setShowPostForm] = useState(false);
  const [showReflectionForm, setShowReflectionForm] = useState(false);
  const [showPrayerForm, setShowPrayerForm] = useState(false);
  const [showCommentForm, setShowCommentForm] = useState<string | null>(null);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [editingComment, setEditingComment] = useState<string | null>(null);
  const [selectedPost, setSelectedPost] = useState<DevotionalPost | null>(null);
  const [expandedComments, setExpandedComments] = useState<Set<string>>(new Set());
  const [dailyVerse, setDailyVerse] = useState<{verse: string, reference: string} | null>(null);

  // Get daily verse based on current date
  useEffect(() => {
    const today = new Date();
    const dayOfYear = Math.floor((today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) / 86400000);
    const verseIndex = dayOfYear % DAILY_VERSES.length;
    setDailyVerse(DAILY_VERSES[verseIndex]);
  }, []);

  const { data: posts, isLoading } = useQuery({
    queryKey: ['/api/devotional/posts'],
    enabled: !!user?.familyId,
  });

  const { data: comments } = useQuery({
    queryKey: ['/api/devotional/posts', selectedPost?.id, 'comments'],
    enabled: !!selectedPost?.id,
  });

  const createReflectionMutation = useMutation({
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
      setShowReflectionForm(false);
      toast({ title: "Success", description: "Reflection shared successfully" });
    },
  });

  const createPrayerRequestMutation = useMutation({
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
      setShowPrayerForm(false);
      toast({ title: "Success", description: "Prayer request shared successfully" });
    },
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
    mutationFn: async (data: { postId: string; comment: string; parentId?: string }) => {
      return apiRequest('POST', `/api/devotional/posts/${data.postId}/comments`, { 
        comment: data.comment,
        parentId: data.parentId || null
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/devotional/posts', selectedPost?.id, 'comments'] });
      setShowCommentForm(null);
      setReplyingTo(null);
      toast({ title: "Success", description: "Comment added successfully" });
    },
  });

  const updateCommentMutation = useMutation({
    mutationFn: async (data: { id: string; comment: string }) => {
      return apiRequest('PATCH', `/api/devotional/comments/${data.id}`, { comment: data.comment });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/devotional/posts', selectedPost?.id, 'comments'] });
      setEditingComment(null);
      toast({ title: "Success", description: "Comment updated successfully" });
    },
  });

  const deleteCommentMutation = useMutation({
    mutationFn: async (commentId: string) => {
      return apiRequest('DELETE', `/api/devotional/comments/${commentId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/devotional/posts', selectedPost?.id, 'comments'] });
      toast({ title: "Success", description: "Comment deleted successfully" });
    },
  });

  const [reflectionForm, setReflectionForm] = useState({
    title: "",
    content: "",
    isShared: false,
  });

  const [prayerForm, setPrayerForm] = useState({
    title: "",
    content: "",
    isShared: false,
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

  const [editCommentForm, setEditCommentForm] = useState({
    comment: "",
  });

  // Helper function to organize comments into threads
  const organizeComments = (comments: DevotionalComment[]) => {
    const topLevelComments = comments.filter(comment => !comment.parentId);
    const commentReplies = comments.filter(comment => comment.parentId);
    
    const buildThread = (parentComment: DevotionalComment): DevotionalComment & { replies: DevotionalComment[] } => {
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

  const toggleCommentExpansion = (commentId: string) => {
    const newExpanded = new Set(expandedComments);
    if (newExpanded.has(commentId)) {
      newExpanded.delete(commentId);
    } else {
      newExpanded.add(commentId);
    }
    setExpandedComments(newExpanded);
  };

  const handleReflectOnVerse = () => {
    if (dailyVerse) {
      setReflectionForm({
        title: `Reflection on ${dailyVerse.reference}`,
        content: `"${dailyVerse.verse}" - ${dailyVerse.reference}\n\nMy thoughts: `,
        isShared: false,
      });
      setShowReflectionForm(true);
    }
  };

  const handleCreateReflection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reflectionForm.title.trim() || !reflectionForm.content.trim()) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }

    createReflectionMutation.mutate({
      title: `🌟 ${reflectionForm.title.trim()}`,
      reading: reflectionForm.content.trim(),
      topic: "Personal Reflection",
      date: new Date().toISOString(),
      familyId: reflectionForm.isShared && user?.familyId ? user.familyId : undefined,
    });

    setReflectionForm({ title: "", content: "", isShared: false });
  };

  const handleCreatePrayerRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prayerForm.title.trim() || !prayerForm.content.trim()) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }

    createPrayerRequestMutation.mutate({
      title: `🙏 ${prayerForm.title.trim()}`,
      prayer: prayerForm.content.trim(),
      topic: "Prayer Request",
      date: new Date().toISOString(),
      familyId: prayerForm.isShared && user?.familyId ? user.familyId : undefined,
    });

    setPrayerForm({ title: "", content: "", isShared: false });
  };

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
      parentId: replyingTo || undefined,
    });

    setCommentForm({ comment: "" });
  };

  const handleUpdateComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editCommentForm.comment.trim() || !editingComment) return;

    updateCommentMutation.mutate({
      id: editingComment,
      comment: editCommentForm.comment.trim(),
    });

    setEditCommentForm({ comment: "" });
  };

  const startReply = (commentId: string) => {
    setReplyingTo(commentId);
    setShowCommentForm(selectedPost?.id || null);
    setCommentForm({ comment: "" });
  };

  const startEdit = (comment: DevotionalComment) => {
    setEditingComment(comment.id);
    setEditCommentForm({ comment: comment.comment });
  };

  const cancelEdit = () => {
    setEditingComment(null);
    setEditCommentForm({ comment: "" });
  };

  const cancelReply = () => {
    setReplyingTo(null);
    if (!showCommentForm) {
      setShowCommentForm(null);
    }
  };

  const sortedPosts = posts?.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()) || [];
  const reflectionPosts = sortedPosts.filter(post => post.topic === "Personal Reflection");
  const prayerPosts = sortedPosts.filter(post => post.topic === "Prayer Request");
  const devotionalPosts = sortedPosts.filter(post => !post.topic || (post.topic !== "Personal Reflection" && post.topic !== "Prayer Request"));

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
            <h1 className="text-2xl font-bold text-gray-900">Daily Devotional</h1>
            <p className="mt-1 text-sm text-gray-600">Grow together in faith through daily verses, reflections, and prayer</p>
          </div>
          <div className="flex space-x-2 mt-4 sm:mt-0">
            <Button variant="outline" onClick={() => setShowPrayerForm(true)} data-testid="button-prayer-request">
              <Heart className="h-4 w-4 mr-2" />
              Prayer Request
            </Button>
            <Button onClick={() => setShowPostForm(true)} data-testid="button-create-devotional">
              <Plus className="h-4 w-4 mr-2" />
              New Devotional
            </Button>
          </div>
        </div>
      </header>

      <main className="p-6 space-y-6">
        {/* Daily Verse Card */}
        {dailyVerse && (
          <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200" data-testid="card-daily-verse">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-blue-900">
                <Sparkles className="h-6 w-6" />
                Today's Verse
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <blockquote className="text-lg italic text-blue-800 border-l-4 border-blue-300 pl-4">
                  "{dailyVerse.verse}"
                </blockquote>
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-blue-700">— {dailyVerse.reference}</p>
                  <Button 
                    onClick={handleReflectOnVerse}
                    className="bg-blue-600 hover:bg-blue-700"
                    data-testid="button-reflect-verse"
                  >
                    <Heart className="h-4 w-4 mr-2" />
                    Reflect on This
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Content Tabs */}
        <Tabs defaultValue="reflections" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="reflections" data-testid="tab-reflections">
              <Sparkles className="h-4 w-4 mr-2" />
              Reflections ({reflectionPosts.length})
            </TabsTrigger>
            <TabsTrigger value="prayers" data-testid="tab-prayers">
              <Heart className="h-4 w-4 mr-2" />
              Prayer Requests ({prayerPosts.length})
            </TabsTrigger>
            <TabsTrigger value="devotionals" data-testid="tab-devotionals">
              <BookOpen className="h-4 w-4 mr-2" />
              Devotionals ({devotionalPosts.length})
            </TabsTrigger>
          </TabsList>

          {/* Reflections Tab */}
          <TabsContent value="reflections">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Personal & Shared Reflections</h3>
                <Button 
                  onClick={() => setShowReflectionForm(true)} 
                  size="sm"
                  data-testid="button-new-reflection"
                >
                  <Sparkles className="h-4 w-4 mr-2" />
                  New Reflection
                </Button>
              </div>
              
              {reflectionPosts.length === 0 ? (
                <Card data-testid="card-no-reflections">
                  <CardContent className="p-8">
                    <div className="text-center">
                      <Sparkles className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No reflections yet</h3>
                      <p className="text-gray-500 mb-4">Share your thoughts on daily verses and spiritual insights</p>
                      <Button onClick={() => setShowReflectionForm(true)}>
                        <Sparkles className="h-4 w-4 mr-2" />
                        Write First Reflection
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-4">
                  {reflectionPosts.map((post) => (
                    <Card key={post.id} className="hover:shadow-md transition-shadow" data-testid={`reflection-${post.id}`}>
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-medium">
                              <Sparkles className="h-5 w-5" />
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
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          {post.reading && (
                            <div>
                              <p className="text-gray-900 whitespace-pre-wrap">{post.reading}</p>
                            </div>
                          )}
                        </div>
                        
                        {/* Emoji Reactions for Reflections */}
                        <div className="mt-4 pt-4 border-t border-gray-200">
                          <EmojiReactions 
                            targetType="devotional_post" 
                            targetId={post.id} 
                            className="mb-3"
                          />
                          
                          {post.familyId && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedPost(post);
                                setShowCommentForm(post.id);
                              }}
                              data-testid={`button-comment-${post.id}`}
                            >
                              <MessageSquare className="h-4 w-4 mr-2" />
                              Add Comment
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>

          {/* Prayer Requests Tab */}
          <TabsContent value="prayers">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Prayer Requests & Shared Thoughts</h3>
                <Button 
                  onClick={() => setShowPrayerForm(true)} 
                  size="sm"
                  data-testid="button-new-prayer"
                >
                  <Heart className="h-4 w-4 mr-2" />
                  New Prayer Request
                </Button>
              </div>
              
              {prayerPosts.length === 0 ? (
                <Card data-testid="card-no-prayers">
                  <CardContent className="p-8">
                    <div className="text-center">
                      <Heart className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No prayer requests yet</h3>
                      <p className="text-gray-500 mb-4">Share prayer requests and spiritual needs with your family</p>
                      <Button onClick={() => setShowPrayerForm(true)}>
                        <Heart className="h-4 w-4 mr-2" />
                        Share First Prayer Request
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-4">
                  {prayerPosts.map((post) => (
                    <Card key={post.id} className="hover:shadow-md transition-shadow" data-testid={`prayer-${post.id}`}>
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-teal-500 rounded-full flex items-center justify-center text-white font-medium">
                              <Heart className="h-5 w-5" />
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
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          {post.prayer && (
                            <div>
                              <p className="text-gray-900 whitespace-pre-wrap italic">{post.prayer}</p>
                            </div>
                          )}
                        </div>
                        
                        {/* Emoji Reactions for Prayer Requests */}
                        <div className="mt-4 pt-4 border-t border-gray-200">
                          <EmojiReactions 
                            targetType="devotional_post" 
                            targetId={post.id} 
                            className="mb-3"
                          />
                          
                          {post.familyId && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedPost(post);
                                setShowCommentForm(post.id);
                              }}
                              data-testid={`button-comment-${post.id}`}
                            >
                              <MessageSquare className="h-4 w-4 mr-2" />
                              Add Comment
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>

          {/* Devotionals Tab */}
          <TabsContent value="devotionals">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Family Devotionals</h3>
                <Button 
                  onClick={() => setShowPostForm(true)} 
                  size="sm"
                  data-testid="button-new-devotional"
                >
                  <BookOpen className="h-4 w-4 mr-2" />
                  New Devotional
                </Button>
              </div>
              
              {devotionalPosts.length === 0 ? (
                <Card data-testid="card-no-devotionals">
                  <CardContent className="p-8">
                    <div className="text-center">
                      <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No devotionals yet</h3>
                      <p className="text-gray-500 mb-4">Start sharing daily devotions with your family</p>
                      <Button onClick={() => setShowPostForm(true)}>
                        <BookOpen className="h-4 w-4 mr-2" />
                        Create First Devotional
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-4">
                  {devotionalPosts.map((post) => (
                    <Card key={post.id} className="hover:shadow-md transition-shadow" data-testid={`devotional-${post.id}`}>
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-gradient-to-r from-amber-500 to-orange-500 rounded-full flex items-center justify-center text-white font-medium">
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
                        </div>
                      </CardHeader>
                      <CardContent>
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
                        
                        {/* Emoji Reactions for Devotionals */}
                        <div className="mt-4 pt-4 border-t border-gray-200">
                          <EmojiReactions 
                            targetType="devotional_post" 
                            targetId={post.id} 
                            className="mb-3"
                          />
                          
                          {post.familyId && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedPost(post);
                                setShowCommentForm(post.id);
                              }}
                              data-testid={`button-comment-${post.id}`}
                            >
                              <MessageSquare className="h-4 w-4 mr-2" />
                              Add Comment
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </main>

      {/* Reflection Form Dialog */}
      <Dialog open={showReflectionForm} onOpenChange={setShowReflectionForm}>
        <DialogContent className="max-w-md" data-testid="dialog-reflection-form" aria-describedby="reflection-description">
          <DialogHeader>
            <DialogTitle>Share Your Reflection</DialogTitle>
            <p id="reflection-description" className="text-sm text-gray-600">
              Write your personal thoughts and spiritual insights to share with yourself or your family.
            </p>
          </DialogHeader>
          <form onSubmit={handleCreateReflection} className="space-y-4">
            <div>
              <Label htmlFor="reflection-title">Title</Label>
              <Input
                id="reflection-title"
                value={reflectionForm.title}
                onChange={(e) => setReflectionForm(prev => ({ ...prev, title: e.target.value }))}
                placeholder="What are you reflecting on?"
                data-testid="input-reflection-title"
              />
            </div>
            
            <div>
              <Label htmlFor="reflection-content">Your Thoughts</Label>
              <Textarea
                id="reflection-content"
                value={reflectionForm.content}
                onChange={(e) => setReflectionForm(prev => ({ ...prev, content: e.target.value }))}
                placeholder="Share your spiritual insights and reflections..."
                className="min-h-24"
                data-testid="textarea-reflection-content"
              />
            </div>
            
            <div className="flex items-center space-x-2">
              <Switch
                id="reflection-shared"
                checked={reflectionForm.isShared}
                onCheckedChange={(checked) => setReflectionForm(prev => ({ ...prev, isShared: checked }))}
                data-testid="switch-reflection-shared"
              />
              <Label htmlFor="reflection-shared" className="text-sm">
                Share with family
              </Label>
            </div>
            
            <div className="flex justify-end space-x-2">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setShowReflectionForm(false)}
                data-testid="button-cancel-reflection"
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={createReflectionMutation.isPending}
                data-testid="button-save-reflection"
              >
                {createReflectionMutation.isPending ? "Saving..." : "Share Reflection"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Prayer Request Form Dialog */}
      <Dialog open={showPrayerForm} onOpenChange={setShowPrayerForm}>
        <DialogContent className="max-w-md" data-testid="dialog-prayer-form" aria-describedby="prayer-description">
          <DialogHeader>
            <DialogTitle>Share a Prayer Request</DialogTitle>
            <p id="prayer-description" className="text-sm text-gray-600">
              Share prayer requests and spiritual needs with yourself or your family.
            </p>
          </DialogHeader>
          <form onSubmit={handleCreatePrayerRequest} className="space-y-4">
            <div>
              <Label htmlFor="prayer-title">Prayer Request Title</Label>
              <Input
                id="prayer-title"
                value={prayerForm.title}
                onChange={(e) => setPrayerForm(prev => ({ ...prev, title: e.target.value }))}
                placeholder="What can we pray for?"
                data-testid="input-prayer-title"
              />
            </div>
            
            <div>
              <Label htmlFor="prayer-content">Prayer Details</Label>
              <Textarea
                id="prayer-content"
                value={prayerForm.content}
                onChange={(e) => setPrayerForm(prev => ({ ...prev, content: e.target.value }))}
                placeholder="Share details about this prayer request..."
                className="min-h-24"
                data-testid="textarea-prayer-content"
              />
            </div>
            
            <div className="flex items-center space-x-2">
              <Switch
                id="prayer-shared"
                checked={prayerForm.isShared}
                onCheckedChange={(checked) => setPrayerForm(prev => ({ ...prev, isShared: checked }))}
                data-testid="switch-prayer-shared"
              />
              <Label htmlFor="prayer-shared" className="text-sm">
                Share with family
              </Label>
            </div>
            
            <div className="flex justify-end space-x-2">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setShowPrayerForm(false)}
                data-testid="button-cancel-prayer"
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={createPrayerRequestMutation.isPending}
                data-testid="button-save-prayer"
              >
                {createPrayerRequestMutation.isPending ? "Saving..." : "Share Prayer Request"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Discussion Dialog with Threaded Comments */}
      {selectedPost && (
        <Dialog open={!!selectedPost} onOpenChange={() => setSelectedPost(null)}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col" data-testid="dialog-discussion">
            <DialogHeader className="flex-shrink-0">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <DialogTitle className="text-lg">{selectedPost.title}</DialogTitle>
                  <div className="flex items-center gap-2 mt-1 text-sm text-gray-500">
                    <span>by {generateInitials("User")}</span>
                    <span>•</span>
                    <span>{formatDateTime(selectedPost.createdAt)}</span>
                    {selectedPost.familyId && (
                      <>
                        <span>•</span>
                        <Badge variant="secondary" className="text-xs">
                          <Users className="w-3 h-3 mr-1" />
                          Family
                        </Badge>
                      </>
                    )}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedPost(null)}
                  data-testid="button-close-discussion"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </DialogHeader>
            
            <div className="flex-1 overflow-y-auto space-y-6">
              {/* Post Content */}
              <div className="prose prose-sm max-w-none bg-gray-50 p-4 rounded-lg">
                {selectedPost.reading && (
                  <div className="mb-4">
                    <h4 className="font-medium text-gray-900">Scripture Reading:</h4>
                    <p className="whitespace-pre-wrap text-gray-700">{selectedPost.reading}</p>
                  </div>
                )}
                {selectedPost.questions && (
                  <div className="mb-4">
                    <h4 className="font-medium text-gray-900">Discussion Questions:</h4>
                    <p className="whitespace-pre-wrap text-gray-700">{selectedPost.questions}</p>
                  </div>
                )}
                {selectedPost.prayer && (
                  <div className="mb-4">
                    <h4 className="font-medium text-gray-900">Prayer:</h4>
                    <p className="whitespace-pre-wrap text-gray-700">{selectedPost.prayer}</p>
                  </div>
                )}
              </div>

              {/* Add Comment Section */}
              {!showCommentForm && !replyingTo && (
                <div className="border-t pt-4">
                  <Button
                    onClick={() => setShowCommentForm(selectedPost.id)}
                    className="w-full"
                    data-testid="button-add-comment"
                  >
                    <MessageSquare className="w-4 h-4 mr-2" />
                    Add Comment
                  </Button>
                </div>
              )}

              {/* New Comment Form */}
              {showCommentForm && !replyingTo && (
                <div className="border-t pt-4">
                  <form onSubmit={handleCreateComment} className="space-y-3">
                    <Textarea
                      value={commentForm.comment}
                      onChange={(e) => setCommentForm({ comment: e.target.value })}
                      placeholder="Share your thoughts..."
                      className="min-h-[100px]"
                      data-testid="textarea-new-comment"
                    />
                    <div className="flex gap-2">
                      <Button 
                        type="submit" 
                        disabled={createCommentMutation.isPending}
                        data-testid="button-submit-comment"
                      >
                        {createCommentMutation.isPending ? "Adding..." : "Add Comment"}
                      </Button>
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={() => {
                          setShowCommentForm(null);
                          setCommentForm({ comment: "" });
                        }}
                        data-testid="button-cancel-new-comment"
                      >
                        Cancel
                      </Button>
                    </div>
                  </form>
                </div>
              )}

              {/* Threaded Comments */}
              {comments && comments.length > 0 && (
                <div className="border-t pt-6">
                  <h3 className="font-medium mb-4">
                    Discussion ({comments.length} {comments.length === 1 ? 'comment' : 'comments'})
                  </h3>
                  <ThreadedComments
                    comments={comments}
                    currentUserId={user?.id || ""}
                    onReply={startReply}
                    onEdit={startEdit}
                    onDelete={(commentId) => deleteCommentMutation.mutate(commentId)}
                    replyingTo={replyingTo}
                    editingComment={editingComment}
                    commentForm={commentForm}
                    setCommentForm={setCommentForm}
                    editCommentForm={editCommentForm}
                    setEditCommentForm={setEditCommentForm}
                    onSubmitComment={handleCreateComment}
                    onSubmitEdit={handleUpdateComment}
                    onCancelReply={cancelReply}
                    onCancelEdit={cancelEdit}
                    expandedComments={expandedComments}
                    onToggleExpansion={toggleCommentExpansion}
                  />
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Regular Devotional Form Dialog */}
      <Dialog open={showPostForm} onOpenChange={setShowPostForm}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto" data-testid="dialog-devotional-form" aria-describedby="devotional-description">
          <DialogHeader>
            <DialogTitle>Create New Devotional</DialogTitle>
            <p id="devotional-description" className="text-sm text-gray-600">
              Create a structured devotional with readings, questions, and prayers for your family.
            </p>
          </DialogHeader>
          <form onSubmit={handleCreatePost} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="post-title">Title</Label>
                <Input
                  id="post-title"
                  value={postForm.title}
                  onChange={(e) => setPostForm(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Devotional title"
                  data-testid="input-post-title"
                />
              </div>
              
              <div>
                <Label htmlFor="post-date">Date</Label>
                <Input
                  id="post-date"
                  type="date"
                  value={postForm.date}
                  onChange={(e) => setPostForm(prev => ({ ...prev, date: e.target.value }))}
                  data-testid="input-post-date"
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="post-topic">Topic</Label>
              <Input
                id="post-topic"
                value={postForm.topic}
                onChange={(e) => setPostForm(prev => ({ ...prev, topic: e.target.value }))}
                placeholder="Today's topic or theme"
                data-testid="input-post-topic"
              />
            </div>
            
            <div>
              <Label htmlFor="post-reading">Scripture Reading</Label>
              <Textarea
                id="post-reading"
                value={postForm.reading}
                onChange={(e) => setPostForm(prev => ({ ...prev, reading: e.target.value }))}
                placeholder="Bible verse or passage"
                className="min-h-20"
                data-testid="textarea-post-reading"
              />
            </div>
            
            <div>
              <Label htmlFor="post-questions">Discussion Questions</Label>
              <Textarea
                id="post-questions"
                value={postForm.questions}
                onChange={(e) => setPostForm(prev => ({ ...prev, questions: e.target.value }))}
                placeholder="Questions for family discussion"
                className="min-h-20"
                data-testid="textarea-post-questions"
              />
            </div>
            
            <div>
              <Label htmlFor="post-prayer">Prayer</Label>
              <Textarea
                id="post-prayer"
                value={postForm.prayer}
                onChange={(e) => setPostForm(prev => ({ ...prev, prayer: e.target.value }))}
                placeholder="Closing prayer"
                className="min-h-20"
                data-testid="textarea-post-prayer"
              />
            </div>
            
            <div className="flex items-center space-x-2">
              <Switch
                id="post-shared"
                checked={postForm.isShared}
                onCheckedChange={(checked) => setPostForm(prev => ({ ...prev, isShared: checked }))}
                data-testid="switch-post-shared"
              />
              <Label htmlFor="post-shared" className="text-sm">
                Share with family
              </Label>
            </div>
            
            <div className="flex justify-end space-x-2">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setShowPostForm(false)}
                data-testid="button-cancel-post"
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={createPostMutation.isPending}
                data-testid="button-save-post"
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