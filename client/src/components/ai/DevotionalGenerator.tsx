import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  BookOpen, Heart, Users, Baby, Sparkles, Calendar, 
  Copy, Share, Save, RefreshCw, MessageCircle, Lightbulb,
  Church, Star
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface DailyDevotional {
  title: string;
  theme: string;
  bibleVerse: {
    text: string;
    reference: string;
    version: string;
  };
  reflection: string;
  practicalApplication: string;
  prayer: string;
  familyActivity?: string;
  discussion: {
    coupleQuestions?: string[];
    familyQuestions?: string[];
    parentingInsights?: string[];
  };
  encouragement: string;
  date: string;
  tags: string[];
}

interface WeeklyDevotionalPlan {
  weekTheme: string;
  devotionals: DailyDevotional[];
  weeklyGoal: string;
  familyChallenge: string;
  memorizeVerse: {
    text: string;
    reference: string;
  };
}

export function DevotionalGenerator() {
  const { toast } = useToast();
  const [devotional, setDevotional] = useState<DailyDevotional | null>(null);
  const [weeklyPlan, setWeeklyPlan] = useState<WeeklyDevotionalPlan | null>(null);
  const [activeTab, setActiveTab] = useState("daily");
  
  // Form state
  const [theme, setTheme] = useState("family");
  const [familySize, setFamilySize] = useState("");
  const [childrenAges, setChildrenAges] = useState("");
  const [marriageYears, setMarriageYears] = useState("");
  const [specificTopic, setSpecificTopic] = useState("");
  const [additionalNeeds, setAdditionalNeeds] = useState("");

  const generateDaily = useMutation<DailyDevotional, Error, any>({
    mutationFn: async (data: any) => {
      console.log("Sending devotional request:", data);
      try {
        const response = await apiRequest('POST', '/api/ai/daily-devotional', data);
        console.log("Received devotional response:", response);
        return response as unknown as DailyDevotional;
      } catch (error) {
        console.error("Devotional generation error:", error);
        throw error;
      }
    },
    onSuccess: (data: DailyDevotional) => {
      console.log("Devotional generated successfully:", data);
      setDevotional(data);
      toast({
        title: "Daily Devotional Generated!",
        description: "Your personalized devotional is ready.",
      });
    },
    onError: (error: Error) => {
      console.error("Generate daily error:", error);
      toast({
        title: "Generation Failed",
        description: error.message || "Could not generate devotional. Please try again.",
        variant: "destructive",
      });
    },
  });

  const generateWeekly = useMutation<WeeklyDevotionalPlan, Error, any>({
    mutationFn: async (data: any) => {
      const response = await apiRequest('POST', '/api/ai/weekly-devotional-plan', data);
      return response as unknown as WeeklyDevotionalPlan;
    },
    onSuccess: (data: WeeklyDevotionalPlan) => {
      setWeeklyPlan(data);
      toast({
        title: "Weekly Plan Generated!",
        description: "Your 7-day devotional plan is ready.",
      });
    },
    onError: () => {
      toast({
        title: "Generation Failed",
        description: "Could not generate weekly plan. Please try again.",
        variant: "destructive",
      });
    },
  });

  const generateTopical = useMutation<DailyDevotional, Error, any>({
    mutationFn: async (data: any) => {
      const response = await apiRequest('POST', '/api/ai/topical-devotional', data);
      return response as unknown as DailyDevotional;
    },
    onSuccess: (data: DailyDevotional) => {
      setDevotional(data);
      toast({
        title: "Topical Devotional Generated!",
        description: `Devotional on "${specificTopic}" is ready.`,
      });
    },
    onError: () => {
      toast({
        title: "Generation Failed",
        description: "Could not generate topical devotional. Please try again.",
        variant: "destructive",
      });
    },
  });

  const saveDevotional = useMutation<any, Error, any>({
    mutationFn: async (data: any) => {
      const response = await apiRequest('POST', '/api/devotionals/save', data);
      return response;
    },
    onSuccess: () => {
      toast({
        title: "Devotional Saved!",
        description: "Added to your devotional collection.",
      });
    },
    onError: () => {
      toast({
        title: "Save Failed",
        description: "Could not save devotional. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleGenerateDaily = () => {
    const data = {
      theme,
      familySize: familySize ? parseInt(familySize) : undefined,
      childrenAges: childrenAges ? childrenAges.split(',').map(age => parseInt(age.trim())).filter(age => !isNaN(age)) : undefined,
      marriageYears: marriageYears ? parseInt(marriageYears) : undefined,
      specificNeeds: additionalNeeds ? [additionalNeeds] : undefined
    };
    
    generateDaily.mutate(data);
  };

  const handleGenerateWeekly = () => {
    const data = {
      theme,
      familySize: familySize ? parseInt(familySize) : undefined,
      childrenAges: childrenAges ? childrenAges.split(',').map(age => parseInt(age.trim())).filter(age => !isNaN(age)) : undefined,
      marriageYears: marriageYears ? parseInt(marriageYears) : undefined,
      specificNeeds: additionalNeeds ? [additionalNeeds] : undefined
    };
    
    generateWeekly.mutate(data);
  };

  const handleGenerateTopical = () => {
    if (!specificTopic.trim()) {
      toast({
        title: "Topic Required",
        description: "Please enter a specific topic for the devotional.",
        variant: "destructive",
      });
      return;
    }

    generateTopical.mutate({
      topic: specificTopic,
      additionalContext: additionalNeeds
    });
  };

  const handleSaveDevotional = (devotionalToSave: DailyDevotional) => {
    saveDevotional.mutate(devotionalToSave);
  };

  const handleCopyText = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: "Text copied to clipboard.",
    });
  };

  const getThemeIcon = (theme: string) => {
    switch (theme) {
      case 'marriage': return <Heart className="h-5 w-5 text-red-500" />;
      case 'parenting': return <Baby className="h-5 w-5 text-green-500" />;
      case 'family': return <Users className="h-5 w-5 text-blue-500" />;
      case 'children': return <Star className="h-5 w-5 text-yellow-500" />;
      default: return <Church className="h-5 w-5 text-purple-500" />;
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-xl flex items-center space-x-2">
            <BookOpen className="h-6 w-6 text-blue-600" />
            <span>AI Devotional Generator</span>
          </CardTitle>
          <CardDescription>
            Generate personalized daily devotionals with Bible verses, reflections, and family activities
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="daily">Daily Devotional</TabsTrigger>
              <TabsTrigger value="weekly">Weekly Plan</TabsTrigger>
              <TabsTrigger value="topical">Topical</TabsTrigger>
            </TabsList>

            {/* Form for all tabs */}
            <div className="space-y-4 mt-6">
              {activeTab !== 'topical' && (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="theme">Devotional Theme</Label>
                      <Select value={theme} onValueChange={setTheme}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select theme" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="marriage">Marriage & Couples</SelectItem>
                          <SelectItem value="parenting">Parenting</SelectItem>
                          <SelectItem value="family">Family Life</SelectItem>
                          <SelectItem value="children">Children's Faith</SelectItem>
                          <SelectItem value="relationships">Relationships</SelectItem>
                          <SelectItem value="general">General Christian Living</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="familySize">Family Size</Label>
                      <Input
                        id="familySize"
                        type="number"
                        placeholder="Number of family members"
                        value={familySize}
                        onChange={(e) => setFamilySize(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="childrenAges">Children's Ages (comma-separated)</Label>
                      <Input
                        id="childrenAges"
                        placeholder="e.g., 5, 8, 12"
                        value={childrenAges}
                        onChange={(e) => setChildrenAges(e.target.value)}
                      />
                    </div>

                    <div>
                      <Label htmlFor="marriageYears">Years Married</Label>
                      <Input
                        id="marriageYears"
                        type="number"
                        placeholder="Years married"
                        value={marriageYears}
                        onChange={(e) => setMarriageYears(e.target.value)}
                      />
                    </div>
                  </div>
                </>
              )}

              {activeTab === 'topical' && (
                <div>
                  <Label htmlFor="specificTopic">Specific Topic</Label>
                  <Input
                    id="specificTopic"
                    placeholder="e.g., forgiveness, patience, communication, trust"
                    value={specificTopic}
                    onChange={(e) => setSpecificTopic(e.target.value)}
                  />
                </div>
              )}

              <div>
                <Label htmlFor="additionalNeeds">Additional Context/Needs</Label>
                <Textarea
                  id="additionalNeeds"
                  placeholder="Any specific challenges, prayer requests, or focus areas..."
                  value={additionalNeeds}
                  onChange={(e) => setAdditionalNeeds(e.target.value)}
                />
              </div>

              <TabsContent value="daily" className="mt-6">
                <Button 
                  onClick={handleGenerateDaily}
                  disabled={generateDaily.isPending}
                  className="w-full"
                  size="lg"
                >
                  {generateDaily.isPending ? (
                    <>
                      <Sparkles className="h-4 w-4 mr-2 animate-spin" />
                      Generating Daily Devotional...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4 mr-2" />
                      Generate Daily Devotional
                    </>
                  )}
                </Button>
              </TabsContent>

              <TabsContent value="weekly" className="mt-6">
                <Button 
                  onClick={handleGenerateWeekly}
                  disabled={generateWeekly.isPending}
                  className="w-full"
                  size="lg"
                >
                  {generateWeekly.isPending ? (
                    <>
                      <Calendar className="h-4 w-4 mr-2 animate-spin" />
                      Generating Weekly Plan...
                    </>
                  ) : (
                    <>
                      <Calendar className="h-4 w-4 mr-2" />
                      Generate 7-Day Devotional Plan
                    </>
                  )}
                </Button>
              </TabsContent>

              <TabsContent value="topical" className="mt-6">
                <Button 
                  onClick={handleGenerateTopical}
                  disabled={generateTopical.isPending || !specificTopic.trim()}
                  className="w-full"
                  size="lg"
                >
                  {generateTopical.isPending ? (
                    <>
                      <Lightbulb className="h-4 w-4 mr-2 animate-spin" />
                      Generating Topical Devotional...
                    </>
                  ) : (
                    <>
                      <Lightbulb className="h-4 w-4 mr-2" />
                      Generate Topical Devotional
                    </>
                  )}
                </Button>
              </TabsContent>
            </div>
          </Tabs>
        </CardContent>
      </Card>

      {/* Display Daily Devotional */}
      {devotional && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl flex items-center space-x-2">
                  {getThemeIcon(devotional.theme)}
                  <span>{devotional.title}</span>
                </CardTitle>
                <CardDescription className="flex items-center space-x-2 mt-2">
                  <Badge variant="outline">{devotional.theme}</Badge>
                  <span>•</span>
                  <span>{devotional.date}</span>
                </CardDescription>
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleCopyText(`${devotional.title}\n\n${devotional.bibleVerse?.text || ''}\n- ${devotional.bibleVerse?.reference || ''}\n\n${devotional.reflection || ''}`)}
                >
                  <Copy className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleSaveDevotional(devotional)}
                  disabled={saveDevotional.isPending}
                >
                  <Save className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Bible Verse */}
            <div className="p-4 bg-blue-50 border-l-4 border-blue-400 rounded">
              <blockquote className="text-lg font-medium italic text-blue-900 mb-2">
                "{devotional.bibleVerse?.text || 'Loading...'}"
              </blockquote>
              <cite className="text-blue-700 font-medium">
                - {devotional.bibleVerse?.reference || ''} ({devotional.bibleVerse?.version || 'ESV'})
              </cite>
            </div>

            {/* Reflection */}
            <div>
              <h4 className="font-semibold text-lg mb-2 flex items-center">
                <MessageCircle className="h-5 w-5 mr-2 text-green-600" />
                Reflection
              </h4>
              <p className="text-gray-700 leading-relaxed">{devotional.reflection}</p>
            </div>

            {/* Practical Application */}
            <div>
              <h4 className="font-semibold text-lg mb-2 flex items-center">
                <Lightbulb className="h-5 w-5 mr-2 text-yellow-600" />
                Practical Application
              </h4>
              <p className="text-gray-700 leading-relaxed">{devotional.practicalApplication}</p>
            </div>

            {/* Family Activity */}
            {devotional.familyActivity && (
              <div>
                <h4 className="font-semibold text-lg mb-2 flex items-center">
                  <Users className="h-5 w-5 mr-2 text-blue-600" />
                  Family Activity
                </h4>
                <p className="text-gray-700 leading-relaxed">{devotional.familyActivity}</p>
              </div>
            )}

            {/* Discussion Questions */}
            {devotional.discussion && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {devotional.discussion.coupleQuestions && devotional.discussion.coupleQuestions.length > 0 && (
                  <div>
                    <h5 className="font-medium mb-2 text-red-600">For Couples:</h5>
                    <ul className="text-sm space-y-1">
                      {devotional.discussion.coupleQuestions.map((question, idx) => (
                        <li key={idx} className="text-gray-600">• {question}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {devotional.discussion.familyQuestions && devotional.discussion.familyQuestions.length > 0 && (
                  <div>
                    <h5 className="font-medium mb-2 text-blue-600">For Families:</h5>
                    <ul className="text-sm space-y-1">
                      {devotional.discussion.familyQuestions.map((question, idx) => (
                        <li key={idx} className="text-gray-600">• {question}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {devotional.discussion.parentingInsights && devotional.discussion.parentingInsights.length > 0 && (
                  <div className="md:col-span-2">
                    <h5 className="font-medium mb-2 text-green-600">Parenting Insights:</h5>
                    <ul className="text-sm space-y-1">
                      {devotional.discussion.parentingInsights.map((insight, idx) => (
                        <li key={idx} className="text-gray-600">• {insight}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {/* Prayer */}
            <div className="p-4 bg-purple-50 border-l-4 border-purple-400 rounded">
              <h4 className="font-semibold text-lg mb-2 flex items-center text-purple-800">
                <Heart className="h-5 w-5 mr-2" />
                Prayer
              </h4>
              <p className="text-purple-900 italic leading-relaxed">{devotional.prayer}</p>
            </div>

            {/* Encouragement */}
            <div className="p-4 bg-green-50 border rounded">
              <h4 className="font-semibold text-lg mb-2 flex items-center text-green-800">
                <Heart className="h-5 w-5 mr-2" />
                Encouragement
              </h4>
              <p className="text-green-900 leading-relaxed">{devotional.encouragement}</p>
            </div>

            {/* Tags */}
            {devotional.tags && devotional.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {devotional.tags.map((tag, idx) => (
                  <Badge key={idx} variant="secondary" className="text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Display Weekly Plan */}
      {weeklyPlan && (
        <Card>
          <CardHeader>
            <CardTitle className="text-xl flex items-center space-x-2">
              <Calendar className="h-6 w-6 text-green-600" />
              <span>{weeklyPlan.weekTheme}</span>
            </CardTitle>
            <CardDescription>7-Day Devotional Journey</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Weekly Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-blue-50 rounded">
                <h4 className="font-semibold mb-2">Weekly Goal</h4>
                <p className="text-sm text-blue-800">{weeklyPlan.weeklyGoal}</p>
              </div>
              <div className="p-4 bg-green-50 rounded">
                <h4 className="font-semibold mb-2">Family Challenge</h4>
                <p className="text-sm text-green-800">{weeklyPlan.familyChallenge}</p>
              </div>
            </div>

            {/* Memory Verse */}
            <div className="p-4 bg-yellow-50 border-l-4 border-yellow-400 rounded">
              <h4 className="font-semibold mb-2">This Week's Memory Verse</h4>
              <blockquote className="italic text-yellow-900 mb-1">"{weeklyPlan.memorizeVerse.text}"</blockquote>
              <cite className="text-yellow-800 text-sm">- {weeklyPlan.memorizeVerse.reference}</cite>
            </div>

            {/* Daily Devotionals */}
            <div className="space-y-4">
              <h4 className="font-semibold text-lg">Daily Devotionals</h4>
              {weeklyPlan.devotionals.map((daily, idx) => (
                <Card key={idx} className="border-l-4 border-purple-400">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center justify-between">
                      <span>Day {idx + 1}: {daily.title}</span>
                      <Badge variant="outline">{daily.date}</Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="space-y-3">
                      <div className="text-sm bg-gray-50 p-3 rounded">
                        <strong>Verse:</strong> "{daily.bibleVerse?.text || 'Loading...'}" - {daily.bibleVerse?.reference || ''}
                      </div>
                      <p className="text-sm text-gray-700">{daily.reflection.substring(0, 200)}...</p>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setDevotional(daily)}
                      >
                        Read Full Devotional
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}