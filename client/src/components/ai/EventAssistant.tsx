import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Sparkles, Calendar, ShoppingCart, CheckSquare, DollarSign, 
  Clock, Users, MapPin, Lightbulb, Target, AlertTriangle,
  Plus, Zap, Gift, PartyPopper
} from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface EventSuggestion {
  tasks: Array<{
    title: string;
    description: string;
    category: string;
    priority: 'low' | 'medium' | 'high';
    dueDate?: Date;
    estimatedTime: string;
    assignable: boolean;
  }>;
  shoppingLists: Array<{
    title: string;
    category: string;
    items: Array<{
      name: string;
      quantity?: string;
      priority: 'essential' | 'preferred' | 'optional';
      estimatedCost?: number;
      category: string;
    }>;
    estimatedBudget: number;
  }>;
  timeline: Array<{
    timeframe: string;
    activities: string[];
    deadline: Date;
  }>;
  budgetBreakdown: {
    categories: Array<{
      name: string;
      estimatedCost: number;
      items: string[];
    }>;
    totalEstimated: number;
    savingsTips: string[];
  };
  preparation: {
    earlyPrep: string[];
    dayBeforePrep: string[];
    dayOfPrep: string[];
    contingencyPlans: string[];
  };
}

interface EventAssistantProps {
  event: {
    id: string;
    title: string;
    type: string;
    date: Date;
    location?: string;
    description?: string;
  };
  onClose?: () => void;
}

export function EventAssistant({ event, onClose }: EventAssistantProps) {
  const { toast } = useToast();
  const [suggestions, setSuggestions] = useState<EventSuggestion | null>(null);
  const [selectedTasks, setSelectedTasks] = useState<Set<number>>(new Set());
  const [selectedLists, setSelectedLists] = useState<Set<number>>(new Set());
  const [isGenerating, setIsGenerating] = useState(false);

  const generateSuggestions = useMutation({
    mutationFn: (eventData: any) => apiRequest('POST', '/api/ai/event-suggestions', eventData),
    onSuccess: (data) => {
      setSuggestions(data);
      // Select all items by default
      setSelectedTasks(new Set(Array.from({ length: data.tasks?.length || 0 }, (_, i) => i)));
      setSelectedLists(new Set(Array.from({ length: data.shoppingLists?.length || 0 }, (_, i) => i)));
      toast({
        title: "Event Suggestions Generated!",
        description: `Created ${data.tasks?.length || 0} tasks and ${data.shoppingLists?.length || 0} shopping lists.`,
      });
    },
    onError: () => {
      toast({
        title: "Generation Failed",
        description: "Could not generate event suggestions. Please try again.",
        variant: "destructive",
      });
    },
  });

  const createEventItems = useMutation({
    mutationFn: (data: any) => apiRequest('POST', '/api/ai/create-event-items', data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/tasks'] });
      queryClient.invalidateQueries({ queryKey: ['/api/lists'] });
      toast({
        title: "Event Items Created!",
        description: `Created ${data.tasks?.length || 0} tasks and ${data.lists?.length || 0} lists for your event.`,
      });
      onClose?.();
    },
    onError: () => {
      toast({
        title: "Creation Failed",
        description: "Could not create event items. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleGenerateSuggestions = async () => {
    setIsGenerating(true);
    try {
      await generateSuggestions.mutateAsync({
        eventTitle: event.title,
        eventType: event.type,
        eventDate: event.date,
        location: event.location,
        description: event.description,
        attendeeCount: 10, // Could be user input
        budget: 200, // Could be user input
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCreateItems = () => {
    if (!suggestions) return;

    const selectedTaskItems = suggestions.tasks.filter((_, index) => selectedTasks.has(index));
    const selectedListItems = suggestions.shoppingLists.filter((_, index) => selectedLists.has(index));

    createEventItems.mutate({
      eventId: event.id,
      tasks: selectedTaskItems,
      shoppingLists: selectedListItems,
    });
  };

  const toggleTaskSelection = (index: number) => {
    const newSelection = new Set(selectedTasks);
    if (newSelection.has(index)) {
      newSelection.delete(index);
    } else {
      newSelection.add(index);
    }
    setSelectedTasks(newSelection);
  };

  const toggleListSelection = (index: number) => {
    const newSelection = new Set(selectedLists);
    if (newSelection.has(index)) {
      newSelection.delete(index);
    } else {
      newSelection.add(index);
    }
    setSelectedLists(newSelection);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-600 bg-red-50 border-red-200';
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'low': return 'text-green-600 bg-green-50 border-green-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getEventIcon = (eventType: string) => {
    switch (eventType.toLowerCase()) {
      case 'birthday': return <Gift className="h-5 w-5 text-pink-500" />;
      case 'party': return <PartyPopper className="h-5 w-5 text-purple-500" />;
      case 'meeting': return <Users className="h-5 w-5 text-blue-500" />;
      default: return <Calendar className="h-5 w-5 text-gray-500" />;
    }
  };

  const daysUntilEvent = Math.ceil((event.date.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-xl flex items-center space-x-2">
            {getEventIcon(event.type)}
            <span>AI Event Assistant</span>
          </CardTitle>
          <CardDescription>
            Get smart suggestions for planning your {event.type.toLowerCase()} - {event.title}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Event Info */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-blue-50 rounded-lg">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {daysUntilEvent}
                </div>
                <div className="text-xs text-blue-700">Days Until Event</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {event.date.toLocaleDateString()}
                </div>
                <div className="text-xs text-green-700">Event Date</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600 capitalize">
                  {event.type}
                </div>
                <div className="text-xs text-purple-700">Event Type</div>
              </div>
            </div>

            {/* Generate Button */}
            {!suggestions && (
              <Button 
                onClick={handleGenerateSuggestions}
                disabled={isGenerating || generateSuggestions.isPending}
                className="w-full"
                size="lg"
              >
                {isGenerating ? (
                  <>
                    <Sparkles className="h-4 w-4 mr-2 animate-spin" />
                    Generating Event Plan...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" />
                    Generate AI Event Plan
                  </>
                )}
              </Button>
            )}

            {/* Urgency Alert */}
            {daysUntilEvent <= 3 && (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Your event is in {daysUntilEvent} days! Focus on essential preparations first.
                </AlertDescription>
              </Alert>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Budget Overview */}
      {suggestions?.budgetBreakdown && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center space-x-2">
              <DollarSign className="h-5 w-5 text-green-500" />
              <span>Budget Breakdown</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-3xl font-bold text-green-600">
                  ${suggestions.budgetBreakdown.totalEstimated.toFixed(2)}
                </div>
                <div className="text-sm text-green-700">Estimated Total</div>
              </div>

              <div className="space-y-2">
                {suggestions.budgetBreakdown.categories.map((category, idx) => (
                  <div key={idx} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                    <span className="font-medium">{category.name}</span>
                    <span className="text-green-600 font-bold">${category.estimatedCost.toFixed(2)}</span>
                  </div>
                ))}
              </div>

              {suggestions.budgetBreakdown.savingsTips.length > 0 && (
                <div className="mt-4">
                  <h5 className="font-medium text-sm mb-2">💰 Money-Saving Tips</h5>
                  <ul className="space-y-1">
                    {suggestions.budgetBreakdown.savingsTips.slice(0, 3).map((tip, idx) => (
                      <li key={idx} className="text-xs text-green-600">• {tip}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tasks */}
      {suggestions?.tasks && suggestions.tasks.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center space-x-2">
              <CheckSquare className="h-5 w-5 text-blue-500" />
              <span>Suggested Tasks ({selectedTasks.size} selected)</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {suggestions.tasks.map((task, idx) => (
                <div key={idx} className="flex items-start space-x-3 p-3 border rounded-lg">
                  <Checkbox
                    checked={selectedTasks.has(idx)}
                    onCheckedChange={() => toggleTaskSelection(idx)}
                  />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium">{task.title}</h4>
                      <div className="flex items-center space-x-2">
                        <div className={`px-2 py-1 rounded text-xs border ${getPriorityColor(task.priority)}`}>
                          {task.priority}
                        </div>
                        <div className="text-xs text-gray-500 flex items-center">
                          <Clock className="h-3 w-3 mr-1" />
                          {task.estimatedTime}
                        </div>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">{task.description}</p>
                    {task.dueDate && (
                      <p className="text-xs text-blue-600 mt-1">
                        Due: {new Date(task.dueDate).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Shopping Lists */}
      {suggestions?.shoppingLists && suggestions.shoppingLists.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center space-x-2">
              <ShoppingCart className="h-5 w-5 text-orange-500" />
              <span>Shopping Lists ({selectedLists.size} selected)</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {suggestions.shoppingLists.map((list, idx) => (
                <div key={idx} className="border rounded-lg p-4">
                  <div className="flex items-center space-x-3 mb-3">
                    <Checkbox
                      checked={selectedLists.has(idx)}
                      onCheckedChange={() => toggleListSelection(idx)}
                    />
                    <div>
                      <h4 className="font-medium">{list.title}</h4>
                      <p className="text-sm text-green-600">Budget: ${list.estimatedBudget.toFixed(2)}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pl-7">
                    {list.items.slice(0, 6).map((item, itemIdx) => (
                      <div key={itemIdx} className="flex items-center justify-between text-sm">
                        <span>{item.name} {item.quantity && `(${item.quantity})`}</span>
                        <Badge variant="outline" className="text-xs">
                          {item.priority}
                        </Badge>
                      </div>
                    ))}
                    {list.items.length > 6 && (
                      <div className="text-xs text-gray-500">
                        +{list.items.length - 6} more items...
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Timeline */}
      {suggestions?.timeline && suggestions.timeline.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center space-x-2">
              <Target className="h-5 w-5 text-purple-500" />
              <span>Event Timeline</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {suggestions.timeline.map((phase, idx) => (
                <div key={idx} className="border-l-4 border-purple-400 pl-4 py-2">
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="font-medium">{phase.timeframe}</h4>
                    <span className="text-xs text-gray-500">
                      {new Date(phase.deadline).toLocaleDateString()}
                    </span>
                  </div>
                  <ul className="text-sm text-gray-600 space-y-1">
                    {phase.activities.map((activity, activityIdx) => (
                      <li key={activityIdx}>• {activity}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Create Items Button */}
      {suggestions && (
        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
          <div>
            <p className="font-medium">Ready to create your event plan?</p>
            <p className="text-sm text-gray-600">
              {selectedTasks.size} tasks and {selectedLists.size} lists selected
            </p>
          </div>
          <Button 
            onClick={handleCreateItems}
            disabled={createEventItems.isPending || (selectedTasks.size === 0 && selectedLists.size === 0)}
            size="lg"
          >
            {createEventItems.isPending ? (
              <>
                <Plus className="h-4 w-4 mr-2 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <Plus className="h-4 w-4 mr-2" />
                Create Event Items
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  );
}