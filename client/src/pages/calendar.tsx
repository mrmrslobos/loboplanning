import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isSameMonth, addMonths, subMonths, parseISO, isToday } from "date-fns";
import { ChevronLeft, ChevronRight, Plus, Calendar as CalendarIcon, Clock, MapPin } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  date: string;
  time?: string;
  location?: string;
  userId: string;
  familyId?: string;
  createdAt: Date;
  type: 'event';
}

interface Task {
  id: string;
  title: string;
  description?: string;
  dueDate?: string;
  priority: 'low' | 'medium' | 'high';
  status: 'pending' | 'in-progress' | 'on-hold' | 'complete';
  assignedTo?: 'me' | 'ana';
  category?: string;
  userId: string;
  familyId?: string;
  eventId?: string;
  createdAt: Date;
  type: 'task';
  date?: string; // For calendar display compatibility
}

type CalendarItem = CalendarEvent | Task;

const newEventSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  date: z.string().min(1, "Date is required"),
  time: z.string().optional(),
  location: z.string().optional(),
  familyId: z.string().optional(),
});

type NewEventForm = z.infer<typeof newEventSchema>;

export default function Calendar() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [isNewEventOpen, setIsNewEventOpen] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<NewEventForm>({
    resolver: zodResolver(newEventSchema),
    defaultValues: {
      title: "",
      description: "",
      date: "",
      time: "",
      location: "",
      familyId: user?.familyId || undefined,
    },
  });

  // Fetch events
  const { data: events = [] } = useQuery<CalendarEvent[]>({
    queryKey: ['/api/events'],
    enabled: !!user,
  });

  // Fetch tasks
  const { data: tasks = [] } = useQuery<Task[]>({
    queryKey: ['/api/tasks'],
    enabled: !!user,
  });

  // Combine events and tasks with dates
  const calendarItems = useMemo(() => {
    const items: CalendarItem[] = [];
    
    // Add events
    events.forEach(event => {
      items.push({ ...event, type: 'event' as const });
    });
    
    // Add tasks with due dates
    tasks.forEach(task => {
      if (task.dueDate) {
        items.push({ ...task, date: task.dueDate, type: 'task' as const });
      }
    });
    
    return items;
  }, [events, tasks]);

  // Create event mutation
  const createEventMutation = useMutation({
    mutationFn: async (data: NewEventForm) => {
      return await apiRequest("POST", "/api/events", {
        ...data,
        userId: user?.id,
        familyId: data.familyId || null,
        date: new Date(`${data.date}T${data.time || '12:00'}`).toISOString(),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/events'] });
      setIsNewEventOpen(false);
      form.reset();
      toast({
        title: "Success",
        description: "Event created successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create event",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: NewEventForm) => {
    createEventMutation.mutate(data);
  };

  // Calendar navigation
  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));

  // Generate calendar days
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calendarDays = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Get items for a specific date
  const getItemsForDate = (date: Date) => {
    return calendarItems.filter(item => {
      try {
        const itemDate = parseISO(item.date || '');
        return isSameDay(itemDate, date);
      } catch {
        return false;
      }
    });
  };

  // Color coding for different types
  const getItemColor = (item: CalendarItem) => {
    if (item.type === 'event') {
      return 'bg-blue-100 text-blue-800 border-blue-200';
    }
    
    if (item.type === 'task') {
      switch (item.status) {
        case 'complete':
          return 'bg-green-100 text-green-800 border-green-200';
        case 'in-progress':
          return 'bg-yellow-100 text-yellow-800 border-yellow-200';
        case 'on-hold':
          return 'bg-gray-100 text-gray-800 border-gray-200';
        default:
          return 'bg-red-100 text-red-800 border-red-200';
      }
    }
    
    return 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const handleDateClick = (date: Date) => {
    setSelectedDate(date);
    form.setValue('date', format(date, 'yyyy-MM-dd'));
    setIsNewEventOpen(true);
  };

  const formatTime = (timeStr?: string) => {
    if (!timeStr) return '';
    try {
      const [hours, minutes] = timeStr.split(':');
      const hour = parseInt(hours);
      const ampm = hour >= 12 ? 'PM' : 'AM';
      const displayHour = hour % 12 || 12;
      return `${displayHour}:${minutes} ${ampm}`;
    } catch {
      return timeStr;
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Calendar</h1>
        <Button 
          data-testid="button-new-event"
          onClick={() => {
            console.log("Calendar button clicked!");
            setIsNewEventOpen(true);
          }}
        >
          <Plus className="w-4 h-4 mr-2" />
          New Event
        </Button>
        
        <Dialog open={isNewEventOpen} onOpenChange={setIsNewEventOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Event</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Title</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Event title" 
                          {...field} 
                          data-testid="input-event-title"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Event description" 
                          {...field} 
                          data-testid="input-event-description"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="date"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Date</FormLabel>
                        <FormControl>
                          <Input 
                            type="date" 
                            {...field} 
                            data-testid="input-event-date"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="time"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Time</FormLabel>
                        <FormControl>
                          <Input 
                            type="time" 
                            {...field} 
                            data-testid="input-event-time"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <FormField
                  control={form.control}
                  name="location"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Location</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Event location" 
                          {...field} 
                          data-testid="input-event-location"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="flex gap-2 pt-4">
                  <Button 
                    type="submit" 
                    disabled={createEventMutation.isPending}
                    data-testid="button-save-event"
                  >
                    {createEventMutation.isPending ? "Creating..." : "Create Event"}
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setIsNewEventOpen(false)}
                    data-testid="button-cancel-event"
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Calendar Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl">
              {format(currentDate, 'MMMM yyyy')}
            </CardTitle>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={prevMonth}
                data-testid="button-prev-month"
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={nextMonth}
                data-testid="button-next-month"
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-2 mb-4">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="p-2 text-center font-medium text-gray-500">
                {day}
              </div>
            ))}
          </div>
          
          <div className="grid grid-cols-7 gap-2">
            {calendarDays.map(day => {
              const dayItems = getItemsForDate(day);
              const isCurrentMonth = isSameMonth(day, currentDate);
              
              return (
                <div 
                  key={day.toISOString()}
                  className={`
                    min-h-[120px] p-2 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors
                    ${isCurrentMonth ? 'bg-white' : 'bg-gray-50 text-gray-400'}
                    ${isToday(day) ? 'ring-2 ring-blue-500' : ''}
                  `}
                  onClick={() => handleDateClick(day)}
                  data-testid={`calendar-day-${format(day, 'yyyy-MM-dd')}`}
                >
                  <div className="font-medium mb-1">
                    {format(day, 'd')}
                  </div>
                  
                  <div className="space-y-1">
                    {dayItems.slice(0, 3).map(item => (
                      <div 
                        key={item.id}
                        className={`
                          text-xs p-1 rounded border truncate
                          ${getItemColor(item)}
                        `}
                        data-testid={`calendar-item-${item.id}`}
                      >
                        <div className="flex items-center gap-1">
                          {item.type === 'event' ? (
                            <CalendarIcon className="w-3 h-3" />
                          ) : (
                            <Clock className="w-3 h-3" />
                          )}
                          <span className="truncate">{item.title}</span>
                        </div>
                        {'time' in item && item.time && (
                          <div className="text-xs opacity-75">
                            {formatTime(item.time)}
                          </div>
                        )}
                      </div>
                    ))}
                    
                    {dayItems.length > 3 && (
                      <div className="text-xs text-gray-500 p-1">
                        +{dayItems.length - 3} more
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Legend */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Legend</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-blue-100 border border-blue-200 rounded"></div>
              <span className="text-sm">Events</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-red-100 border border-red-200 rounded"></div>
              <span className="text-sm">Pending Tasks</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-yellow-100 border border-yellow-200 rounded"></div>
              <span className="text-sm">In Progress Tasks</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-green-100 border border-green-200 rounded"></div>
              <span className="text-sm">Completed Tasks</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-gray-100 border border-gray-200 rounded"></div>
              <span className="text-sm">On Hold Tasks</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}