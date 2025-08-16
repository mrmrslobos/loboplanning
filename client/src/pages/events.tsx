import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertEventSchema, insertTaskSchema, type Event, type Task } from "@shared/schema";
import { z } from "zod";
import { Plus, Calendar, MapPin, Clock, Users, CheckSquare, Trash2, Edit, MoreVertical, CalendarDays } from "lucide-react";
import { formatDistanceToNow, format, differenceInDays } from "date-fns";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const eventFormSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  location: z.string().optional(),
  template: z.string().optional(),
  eventDate: z.string().min(1, "Date is required"),
  eventTime: z.string().optional(),
});

const taskFormSchema = insertTaskSchema.extend({}).omit({ 
  userId: true,
  familyId: true,
  eventId: true
});

type EventFormData = z.infer<typeof eventFormSchema>;
type TaskFormData = z.infer<typeof taskFormSchema>;

const eventTemplates = [
  { value: "custom", label: "Custom Event", icon: CalendarDays },
  { value: "birthday", label: "Birthday Party", icon: CalendarDays },
  { value: "wedding", label: "Wedding", icon: CalendarDays },
  { value: "vacation", label: "Vacation Trip", icon: CalendarDays },
  { value: "graduation", label: "Graduation", icon: CalendarDays },
  { value: "holiday", label: "Holiday Celebration", icon: CalendarDays },
  { value: "anniversary", label: "Anniversary", icon: CalendarDays },
];

const taskCategories = [
  "Planning",
  "Preparation", 
  "Shopping",
  "Decorations",
  "Food & Catering",
  "Entertainment",
  "Travel",
  "Communication",
  "Cleanup",
  "Other",
];

const assigneeOptions = [
  { value: "Me", label: "Me" },
  { value: "Ana", label: "Ana" },
];

export default function EventsPage() {
  const [isCreateEventDialogOpen, setIsCreateEventDialogOpen] = useState(false);
  const [isAddTaskDialogOpen, setIsAddTaskDialogOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const { toast } = useToast();

  const { data: events = [], isLoading } = useQuery<Event[]>({
    queryKey: ["/api/events"],
  });

  const { data: eventTasks = [], isLoading: isLoadingTasks } = useQuery<EventTask[]>({
    queryKey: ["/api/events", selectedEvent?.id, "tasks"],
    enabled: !!selectedEvent,
  });

  const createEventMutation = useMutation({
    mutationFn: async (data: any) => {
      console.log("Mutation receiving data:", data);
      console.log("Making API request to /api/events");
      
      try {
        const response = await apiRequest("POST", "/api/events", data);
        console.log("API response received:", response);
        return response;
      } catch (error) {
        console.error("API request failed:", error);
        throw error;
      }
    },
    onSuccess: (result) => {
      console.log("Event created successfully:", result);
      queryClient.invalidateQueries({ queryKey: ["/api/events"] });
      setIsCreateEventDialogOpen(false);
      eventForm.reset();
      toast({ title: "Event created successfully" });
    },
    onError: (error: any) => {
      console.error("Event creation failed:", error);
      console.error("Full error details:", JSON.stringify(error, null, 2));
      toast({ title: "Failed to create event", variant: "destructive" });
    },
  });

  const deleteEventMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("DELETE", `/api/events/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/events"] });
      setSelectedEvent(null);
      toast({ title: "Event deleted successfully" });
    },
  });

  const createTaskMutation = useMutation({
    mutationFn: async (data: TaskFormData) => {
      return await apiRequest("POST", "/api/event-tasks", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/events", selectedEvent?.id, "tasks"] });
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] }); // Also update main tasks
      setIsAddTaskDialogOpen(false);
      toast({ title: "Task added successfully" });
    },
  });

  const updateTaskMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<EventTask> }) => {
      return await apiRequest("PATCH", `/api/event-tasks/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/events", selectedEvent?.id, "tasks"] });
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] }); // Also update main tasks
    },
  });

  const deleteTaskMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("DELETE", `/api/event-tasks/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/events", selectedEvent?.id, "tasks"] });
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] }); // Also update main tasks
      toast({ title: "Task deleted successfully" });
    },
  });

  const eventForm = useForm<EventFormData>({
    resolver: zodResolver(eventFormSchema),
    defaultValues: {
      title: "",
      description: "",
      location: "",
      template: "custom",
      eventDate: "",
      eventTime: "",
    },
  });

  const taskForm = useForm<TaskFormData>({
    resolver: zodResolver(taskFormSchema),
    defaultValues: {
      title: "",
      description: "",
      category: "",
      assignedTo: "Me",
    },
  });

  const onCreateEvent = (data: EventFormData) => {
    console.log("onCreateEvent called with data:", data);
    console.log("Form errors:", eventForm.formState.errors);
    console.log("Form validation state:", eventForm.formState.isValid);
    
    // Check if form has any validation errors
    if (!eventForm.formState.isValid) {
      console.log("Form is invalid, checking individual field errors:");
      Object.keys(eventForm.formState.errors).forEach(field => {
        console.log(`Error in ${field}:`, eventForm.formState.errors[field]);
      });
    }
    
    // Properly format the date by combining eventDate and eventTime
    const formattedDate = data.eventDate ? 
      new Date(`${data.eventDate}T${data.eventTime || '12:00'}`).toISOString() : 
      new Date().toISOString();
    
    // Transform to the format expected by the server
    const eventData = {
      title: data.title,
      description: data.description,
      location: data.location,
      template: data.template,
      date: formattedDate,
    };
    
    console.log("Transformed eventData for server:", eventData);
    createEventMutation.mutate(eventData);
  };

  const onAddTask = (data: TaskFormData) => {
    if (!selectedEvent) return;
    createTaskMutation.mutate({
      ...data,
      eventId: selectedEvent.id,
    });
  };

  const handleTaskToggle = (taskId: string, completedStatus: boolean) => {
    updateTaskMutation.mutate({ id: taskId, data: { completed: completedStatus } });
  };

  const getEventProgress = (tasks: Task[]) => {
    if (tasks.length === 0) return 0;
    const completedTasks = tasks.filter(task => task.completed).length;
    return (completedTasks / tasks.length) * 100;
  };

  const getDaysUntilEvent = (eventDate: Date) => {
    const now = new Date();
    const event = new Date(eventDate);
    return differenceInDays(event, now);
  };

  const getTemplateIcon = (template: string) => {
    const templateConfig = eventTemplates.find(t => t.value === template);
    return templateConfig?.icon || CalendarDays;
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </CardHeader>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="grid gap-6 lg:grid-cols-12">
        {/* Events Sidebar */}
        <div className="lg:col-span-4 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Events</h1>
              <p className="text-muted-foreground text-sm">
                Plan and manage your special occasions
              </p>
            </div>
            <Button 
              size="sm" 
              data-testid="button-create-event"
              onClick={() => setIsCreateEventDialogOpen(true)}
            >
              <Plus className="h-4 w-4 mr-2" />
              New Event
            </Button>
            
            <Dialog open={isCreateEventDialogOpen} onOpenChange={setIsCreateEventDialogOpen}>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Create New Event</DialogTitle>
                </DialogHeader>
                <Form {...eventForm}>
                  <form onSubmit={(e) => {
                    console.log("Events Form onSubmit event triggered");
                    console.log("Events Form is valid:", eventForm.formState.isValid);
                    console.log("Events Form values:", eventForm.getValues());
                    eventForm.handleSubmit(onCreateEvent)(e);
                  }} className="space-y-4">
                    <FormField
                      control={eventForm.control}
                      name="template"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Template</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value ?? undefined}>
                            <FormControl>
                              <SelectTrigger data-testid="select-event-template">
                                <SelectValue placeholder="Choose a template" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {eventTemplates.map((template) => {
                                const Icon = template.icon;
                                return (
                                  <SelectItem key={template.value} value={template.value}>
                                    <div className="flex items-center space-x-2">
                                      <Icon className="h-4 w-4" />
                                      <span>{template.label}</span>
                                    </div>
                                  </SelectItem>
                                );
                              })}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={eventForm.control}
                      name="title"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Event Title</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="Enter event title" 
                              {...field} 
                              data-testid="input-event-title"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={eventForm.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Description</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Enter event description" 
                              {...field}
                              value={field.value ?? ""}
                              data-testid="input-event-description"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={eventForm.control}
                      name="eventDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Event Date</FormLabel>
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
                      control={eventForm.control}
                      name="eventTime"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Event Time (Optional)</FormLabel>
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
                    <FormField
                      control={eventForm.control}
                      name="location"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Location (Optional)</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="Enter event location" 
                              {...field}
                              value={field.value || ""} 
                              data-testid="input-event-location"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="flex justify-end space-x-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setIsCreateEventDialogOpen(false)}
                        data-testid="button-cancel-event"
                      >
                        Cancel
                      </Button>
                      <Button 
                        type="submit" 
                        disabled={createEventMutation.isPending}
                        data-testid="button-submit-event"
                        onClick={(e) => {
                          console.log("Create Event submit button clicked!");
                          // Let the form handle the submission
                        }}
                      >
                        {createEventMutation.isPending ? "Creating..." : "Create Event"}
                      </Button>
                    </div>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>

          <div className="space-y-3">
            {events.map((event) => {
              const Icon = getTemplateIcon(event.template || "custom");
              const daysUntil = getDaysUntilEvent(event.date);
              const isUpcoming = daysUntil >= 0;
              
              return (
                <Card 
                  key={event.id} 
                  className={`cursor-pointer transition-colors hover:bg-accent ${
                    selectedEvent?.id === event.id ? "ring-2 ring-primary" : ""
                  }`}
                  onClick={() => setSelectedEvent(event)}
                  data-testid={`event-card-${event.id}`}
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-2 flex-1">
                        <Icon className="h-4 w-4 text-muted-foreground" />
                        <div className="min-w-0 flex-1">
                          <CardTitle className="text-sm truncate">{event.title}</CardTitle>
                          {event.description && (
                            <CardDescription className="text-xs truncate">
                              {event.description}
                            </CardDescription>
                          )}
                        </div>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteEventMutation.mutate(event.id);
                            }}
                            className="text-destructive"
                            data-testid={`delete-event-${event.id}`}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete Event
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                        <div className="flex items-center space-x-1">
                          <Calendar className="h-3 w-3" />
                          <span>{format(new Date(event.date), 'MMM d, yyyy')}</span>
                        </div>
                        {event.location && (
                          <div className="flex items-center space-x-1">
                            <MapPin className="h-3 w-3" />
                            <span className="truncate">{event.location}</span>
                          </div>
                        )}
                      </div>
                      
                      {/* Countdown */}
                      <div className="flex items-center justify-between">
                        <Badge 
                          variant={isUpcoming ? "default" : "secondary"}
                          className="text-xs"
                        >
                          {isUpcoming ? (
                            daysUntil === 0 ? "Today!" : 
                            daysUntil === 1 ? "Tomorrow" : 
                            `${daysUntil} days left`
                          ) : (
                            `${Math.abs(daysUntil)} days ago`
                          )}
                        </Badge>
                        {event.template && (
                          <Badge variant="outline" className="text-xs">
                            {eventTemplates.find(t => t.value === event.template)?.label}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                </Card>
              );
            })}
            
            {events.length === 0 && (
              <Card className="p-4 text-center border-dashed">
                <CardContent className="pt-0">
                  <div className="space-y-2">
                    <h3 className="font-medium">No events yet</h3>
                    <p className="text-sm text-muted-foreground">
                      Create your first event to start planning.
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Event Details and Tasks */}
        <div className="lg:col-span-8">
          {selectedEvent ? (
            <div className="space-y-6">
              {/* Event Header */}
              <Card>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <CardTitle className="text-xl">{selectedEvent.title}</CardTitle>
                        <Badge variant="outline">
                          {eventTemplates.find(t => t.value === selectedEvent.template)?.label || "Custom"}
                        </Badge>
                      </div>
                      {selectedEvent.description && (
                        <CardDescription>{selectedEvent.description}</CardDescription>
                      )}
                      <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                        <div className="flex items-center space-x-1">
                          <Calendar className="h-4 w-4" />
                          <span>{format(new Date(selectedEvent.date), 'EEEE, MMMM d, yyyy')}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Clock className="h-4 w-4" />
                          <span>{format(new Date(selectedEvent.date), 'h:mm a')}</span>
                        </div>
                        {selectedEvent.location && (
                          <div className="flex items-center space-x-1">
                            <MapPin className="h-4 w-4" />
                            <span>{selectedEvent.location}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold">
                        {(() => {
                          const daysUntil = getDaysUntilEvent(selectedEvent.date);
                          return daysUntil >= 0 ? (
                            daysUntil === 0 ? "Today!" : 
                            daysUntil === 1 ? "Tomorrow" : 
                            `${daysUntil} days`
                          ) : (
                            "Past event"
                          );
                        })()}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {getDaysUntilEvent(selectedEvent.date) >= 0 ? "until event" : ""}
                      </div>
                    </div>
                  </div>
                </CardHeader>
              </Card>

              {/* Tasks Section */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg">Event Tasks</CardTitle>
                      <CardDescription>
                        Manage tasks and track progress for this event
                      </CardDescription>
                    </div>
                    <Dialog open={isAddTaskDialogOpen} onOpenChange={setIsAddTaskDialogOpen}>
                      <DialogTrigger asChild>
                        <Button data-testid="button-add-event-task">
                          <Plus className="h-4 w-4 mr-2" />
                          Add Task
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-md">
                        <DialogHeader>
                          <DialogTitle>Add Event Task</DialogTitle>
                          <DialogDescription>
                            Add a new task for {selectedEvent.title}.
                          </DialogDescription>
                        </DialogHeader>
                        <Form {...taskForm}>
                          <form onSubmit={taskForm.handleSubmit(onAddTask)} className="space-y-4">
                            <FormField
                              control={taskForm.control}
                              name="title"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Task Title</FormLabel>
                                  <FormControl>
                                    <Input 
                                      placeholder="Enter task title" 
                                      {...field} 
                                      data-testid="input-event-task-title"
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={taskForm.control}
                              name="description"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Description (Optional)</FormLabel>
                                  <FormControl>
                                    <Textarea 
                                      placeholder="Enter task description" 
                                      {...field}
                                      value={field.value || ""} 
                                      data-testid="input-event-task-description"
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={taskForm.control}
                              name="category"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Category</FormLabel>
                                  <Select onValueChange={field.onChange} value={field.value || ""}>
                                    <FormControl>
                                      <SelectTrigger data-testid="select-task-category">
                                        <SelectValue placeholder="Select category" />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      {taskCategories.map((category) => (
                                        <SelectItem key={category} value={category}>
                                          {category}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={taskForm.control}
                              name="assignedTo"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Assign To</FormLabel>
                                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                      <SelectTrigger data-testid="select-task-assignee">
                                        <SelectValue placeholder="Select assignee" />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      {assigneeOptions.map((option) => (
                                        <SelectItem key={option.value} value={option.value}>
                                          {option.label}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <div className="flex justify-end space-x-2">
                              <Button
                                type="button"
                                variant="outline"
                                onClick={() => setIsAddTaskDialogOpen(false)}
                                data-testid="button-cancel-task"
                              >
                                Cancel
                              </Button>
                              <Button 
                                type="submit" 
                                disabled={createTaskMutation.isPending}
                                data-testid="button-submit-task"
                              >
                                {createTaskMutation.isPending ? "Adding..." : "Add Task"}
                              </Button>
                            </div>
                          </form>
                        </Form>
                      </DialogContent>
                    </Dialog>
                  </div>
                  
                  {/* Progress Bar */}
                  {eventTasks.length > 0 && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span>Progress</span>
                        <span>
                          {eventTasks.filter(task => task.completed).length} of {eventTasks.length} tasks completed
                        </span>
                      </div>
                      <Progress 
                        value={getEventProgress(eventTasks)} 
                        className="h-2"
                        data-testid="event-progress"
                      />
                    </div>
                  )}
                </CardHeader>
                <CardContent>
                  {/* Tasks by Category */}
                  {isLoadingTasks ? (
                    <div className="space-y-2">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="flex items-center space-x-3 p-3 border rounded animate-pulse">
                          <div className="w-4 h-4 bg-gray-200 rounded"></div>
                          <div className="flex-1 h-4 bg-gray-200 rounded"></div>
                          <div className="w-8 h-4 bg-gray-200 rounded"></div>
                        </div>
                      ))}
                    </div>
                  ) : eventTasks.length > 0 ? (
                    (() => {
                      const tasksByCategory = eventTasks.reduce((acc, task) => {
                        const category = task.category || "Other";
                        if (!acc[category]) acc[category] = [];
                        acc[category].push(task);
                        return acc;
                      }, {} as Record<string, EventTask[]>);

                      return (
                        <Tabs defaultValue={Object.keys(tasksByCategory)[0]} className="w-full">
                          <TabsList className="grid w-full grid-cols-auto">
                            {Object.keys(tasksByCategory).map((category) => (
                              <TabsTrigger key={category} value={category}>
                                {category} ({tasksByCategory[category].length})
                              </TabsTrigger>
                            ))}
                          </TabsList>
                          {Object.entries(tasksByCategory).map(([category, tasks]) => (
                            <TabsContent key={category} value={category} className="space-y-2 mt-4">
                              {tasks.map((task) => (
                                <div 
                                  key={task.id} 
                                  className={`flex items-center space-x-3 p-3 border rounded hover:bg-accent transition-colors ${
                                    task.completed ? "bg-muted/50" : ""
                                  }`}
                                  data-testid={`event-task-${task.id}`}
                                >
                                  <Checkbox
                                    checked={task.completed || false}
                                    onCheckedChange={(checked) => 
                                      handleTaskToggle(task.id, checked as boolean)
                                    }
                                    data-testid={`checkbox-event-task-${task.id}`}
                                  />
                                  <div className="flex-1 min-w-0">
                                    <div className={`font-medium ${task.completed ? "line-through text-muted-foreground" : ""}`}>
                                      {task.title}
                                    </div>
                                    {task.description && (
                                      <div className="text-sm text-muted-foreground truncate">{task.description}</div>
                                    )}
                                    <div className="flex items-center space-x-2 text-xs text-muted-foreground mt-1">
                                      <div className="flex items-center space-x-1">
                                        <Users className="h-3 w-3" />
                                        <span>{task.assignedTo}</span>
                                      </div>
                                      <Badge variant="outline" className="text-xs">
                                        {task.completed ? "complete" : "pending"}
                                      </Badge>
                                    </div>
                                  </div>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => deleteTaskMutation.mutate(task.id)}
                                    className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                                    data-testid={`delete-event-task-${task.id}`}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              ))}
                            </TabsContent>
                          ))}
                        </Tabs>
                      );
                    })()
                  ) : (
                    <div className="text-center py-8 border-dashed border rounded">
                      <CheckSquare className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                      <h3 className="font-medium">No tasks yet</h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        Add tasks to start planning this event.
                      </p>
                      <Button onClick={() => setIsAddTaskDialogOpen(true)} data-testid="button-add-first-event-task">
                        <Plus className="h-4 w-4 mr-2" />
                        Add First Task
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card className="p-8 text-center border-dashed">
              <CardContent>
                <div className="space-y-2">
                  <CalendarDays className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                  <h3 className="font-medium">Select an event</h3>
                  <p className="text-sm text-muted-foreground">
                    Choose an event from the sidebar to view details and manage tasks.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}