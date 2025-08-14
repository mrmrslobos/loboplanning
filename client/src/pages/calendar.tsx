import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { 
  Calendar as CalendarIcon, Plus, ChevronLeft, ChevronRight, 
  MapPin, Clock, Users, User, Edit, Trash2
} from "lucide-react";
import { cn, formatDate, formatTime } from "@/lib/utils";
import type { CalendarEvent } from "@shared/schema";

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function Calendar() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<"month" | "week" | "day">("month");
  const [showEventForm, setShowEventForm] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const { data: events, isLoading } = useQuery({
    queryKey: ['/api/calendar/events'],
    enabled: !!user?.familyId,
  });

  const createEventMutation = useMutation({
    mutationFn: async (data: {
      title: string;
      description?: string;
      startTime: string;
      endTime: string;
      location?: string;
      color?: string;
      familyId?: string;
    }) => {
      return apiRequest('POST', '/api/calendar/events', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/calendar/events'] });
      setShowEventForm(false);
      toast({ title: "Success", description: "Event created successfully" });
    },
  });

  const [eventForm, setEventForm] = useState({
    title: "",
    description: "",
    startDate: "",
    startTime: "",
    endDate: "",
    endTime: "",
    location: "",
    color: "#3b82f6",
    isShared: false,
  });

  const resetEventForm = () => {
    setEventForm({
      title: "",
      description: "",
      startDate: "",
      startTime: "",
      endDate: "",
      endTime: "",
      location: "",
      color: "#3b82f6",
      isShared: false,
    });
  };

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventForm.title.trim() || !eventForm.startDate || !eventForm.startTime) {
      toast({
        title: "Error",
        description: "Please fill in required fields",
        variant: "destructive",
      });
      return;
    }

    const startDateTime = new Date(`${eventForm.startDate}T${eventForm.startTime}`);
    const endDateTime = eventForm.endDate && eventForm.endTime 
      ? new Date(`${eventForm.endDate}T${eventForm.endTime}`)
      : new Date(startDateTime.getTime() + 60 * 60 * 1000); // Default 1 hour duration

    createEventMutation.mutate({
      title: eventForm.title.trim(),
      description: eventForm.description.trim() || undefined,
      startTime: startDateTime.toISOString(),
      endTime: endDateTime.toISOString(),
      location: eventForm.location.trim() || undefined,
      color: eventForm.color,
      familyId: eventForm.isShared && user?.familyId ? user.familyId : undefined,
    });

    resetEventForm();
  };

  const openEventForm = (date?: Date) => {
    if (date) {
      const dateStr = date.toISOString().split('T')[0];
      setEventForm(prev => ({
        ...prev,
        startDate: dateStr,
        endDate: dateStr,
      }));
    }
    setShowEventForm(true);
  };

  const navigateMonth = (direction: number) => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(prev.getMonth() + direction);
      return newDate;
    });
  };

  const getMonthDays = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];
    
    // Previous month's trailing days
    for (let i = startingDayOfWeek - 1; i >= 0; i--) {
      const date = new Date(year, month, -i);
      days.push({ date, isCurrentMonth: false });
    }
    
    // Current month's days
    for (let i = 1; i <= daysInMonth; i++) {
      const date = new Date(year, month, i);
      days.push({ date, isCurrentMonth: true });
    }
    
    // Next month's leading days
    const totalCells = Math.ceil(days.length / 7) * 7;
    for (let i = days.length; i < totalCells; i++) {
      const date = new Date(year, month + 1, i - days.length + 1);
      days.push({ date, isCurrentMonth: false });
    }
    
    return days;
  };

  const getEventsForDate = (date: Date) => {
    return events?.filter(event => {
      const eventDate = new Date(event.startTime);
      return eventDate.toDateString() === date.toDateString();
    }) || [];
  };

  const today = new Date();
  const monthDays = getMonthDays();

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
          <div className="flex items-center space-x-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Calendar</h1>
              <p className="mt-1 text-sm text-gray-600">Manage your family's schedule and events</p>
            </div>
          </div>
          <div className="mt-4 sm:mt-0 flex items-center space-x-3">
            <Select value={view} onValueChange={(value: "month" | "week" | "day") => setView(value)}>
              <SelectTrigger className="w-32" data-testid="select-calendar-view">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="month">Month</SelectItem>
                <SelectItem value="week">Week</SelectItem>
                <SelectItem value="day">Day</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={() => openEventForm()} data-testid="button-create-event">
              <Plus className="h-4 w-4 mr-2" />
              Add Event
            </Button>
          </div>
        </div>
      </header>

      <main className="p-6">
        {/* Calendar Navigation */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigateMonth(-1)}
                  data-testid="button-prev-month"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <h2 className="text-xl font-semibold text-gray-900">
                  {MONTHS[currentDate.getMonth()]} {currentDate.getFullYear()}
                </h2>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigateMonth(1)}
                  data-testid="button-next-month"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
              <Button
                variant="outline"
                onClick={() => setCurrentDate(new Date())}
                data-testid="button-today"
              >
                Today
              </Button>
            </div>

            {/* Month View */}
            {view === "month" && (
              <div className="grid grid-cols-7 gap-1">
                {/* Day headers */}
                {DAYS.map(day => (
                  <div key={day} className="p-2 text-center text-sm font-medium text-gray-500">
                    {day}
                  </div>
                ))}
                
                {/* Calendar days */}
                {monthDays.map(({ date, isCurrentMonth }, index) => {
                  const dayEvents = getEventsForDate(date);
                  const isToday = date.toDateString() === today.toDateString();
                  
                  return (
                    <div
                      key={index}
                      className={cn(
                        "min-h-24 p-2 border border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors",
                        !isCurrentMonth && "bg-gray-50 text-gray-400",
                        isToday && "bg-blue-50 border-blue-200"
                      )}
                      onClick={() => openEventForm(date)}
                      data-testid={`calendar-day-${date.getDate()}`}
                    >
                      <div className={cn(
                        "text-sm font-medium mb-1",
                        isToday && "text-blue-600"
                      )}>
                        {date.getDate()}
                      </div>
                      <div className="space-y-1">
                        {dayEvents.slice(0, 2).map(event => (
                          <div
                            key={event.id}
                            className="text-xs p-1 rounded truncate"
                            style={{ backgroundColor: event.color + '20', color: event.color }}
                            data-testid={`event-${event.id}`}
                          >
                            {event.title}
                          </div>
                        ))}
                        {dayEvents.length > 2 && (
                          <div className="text-xs text-gray-500">
                            +{dayEvents.length - 2} more
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Week/Day views placeholder */}
            {(view === "week" || view === "day") && (
              <div className="text-center py-12">
                <CalendarIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {view === "week" ? "Week" : "Day"} View
                </h3>
                <p className="text-gray-500">
                  {view === "week" ? "Week" : "Day"} view coming soon. For now, use month view.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Upcoming Events */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card data-testid="card-upcoming-events">
            <CardHeader>
              <CardTitle>Upcoming Events</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {events?.filter(event => new Date(event.startTime) > new Date())
                  .slice(0, 5)
                  .map(event => (
                    <div
                      key={event.id}
                      className="flex items-start p-3 border rounded-lg hover:bg-gray-50"
                      data-testid={`upcoming-event-${event.id}`}
                    >
                      <div 
                        className="w-3 h-3 rounded-full mt-2 mr-3"
                        style={{ backgroundColor: event.color }}
                      ></div>
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900">{event.title}</h4>
                        <div className="flex items-center text-sm text-gray-500 mt-1">
                          <Clock className="h-3 w-3 mr-1" />
                          <span>{formatDate(event.startTime)} at {formatTime(event.startTime)}</span>
                        </div>
                        {event.location && (
                          <div className="flex items-center text-sm text-gray-500 mt-1">
                            <MapPin className="h-3 w-3 mr-1" />
                            <span>{event.location}</span>
                          </div>
                        )}
                        <Badge variant="outline" className="mt-2">
                          {event.familyId ? (
                            <><Users className="h-3 w-3 mr-1" />Shared</>
                          ) : (
                            <><User className="h-3 w-3 mr-1" />Private</>
                          )}
                        </Badge>
                      </div>
                    </div>
                  )) || (
                  <div className="text-center py-8">
                    <CalendarIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">No upcoming events</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card data-testid="card-recent-events">
            <CardHeader>
              <CardTitle>Recent Events</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {events?.filter(event => new Date(event.startTime) <= new Date())
                  .slice(0, 5)
                  .map(event => (
                    <div
                      key={event.id}
                      className="flex items-start p-3 border rounded-lg opacity-75"
                      data-testid={`recent-event-${event.id}`}
                    >
                      <div 
                        className="w-3 h-3 rounded-full mt-2 mr-3"
                        style={{ backgroundColor: event.color }}
                      ></div>
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-700">{event.title}</h4>
                        <div className="flex items-center text-sm text-gray-500 mt-1">
                          <Clock className="h-3 w-3 mr-1" />
                          <span>{formatDate(event.startTime)} at {formatTime(event.startTime)}</span>
                        </div>
                        {event.location && (
                          <div className="flex items-center text-sm text-gray-500 mt-1">
                            <MapPin className="h-3 w-3 mr-1" />
                            <span>{event.location}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )) || (
                  <div className="text-center py-8">
                    <CalendarIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">No recent events</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Create Event Modal */}
      <Dialog open={showEventForm} onOpenChange={setShowEventForm}>
        <DialogContent className="sm:max-w-lg" data-testid="modal-create-event">
          <DialogHeader>
            <DialogTitle>Create New Event</DialogTitle>
          </DialogHeader>
          
          <form onSubmit={handleCreateEvent} className="space-y-4">
            <div>
              <Label htmlFor="eventTitle">Event Title</Label>
              <Input
                id="eventTitle"
                value={eventForm.title}
                onChange={(e) => setEventForm(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Enter event title"
                data-testid="input-event-title"
              />
            </div>
            
            <div>
              <Label htmlFor="eventDescription">Description (optional)</Label>
              <Textarea
                id="eventDescription"
                value={eventForm.description}
                onChange={(e) => setEventForm(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Add event description..."
                rows={3}
                data-testid="textarea-event-description"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="startDate">Start Date</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={eventForm.startDate}
                  onChange={(e) => setEventForm(prev => ({ ...prev, startDate: e.target.value }))}
                  data-testid="input-start-date"
                />
              </div>
              <div>
                <Label htmlFor="startTime">Start Time</Label>
                <Input
                  id="startTime"
                  type="time"
                  value={eventForm.startTime}
                  onChange={(e) => setEventForm(prev => ({ ...prev, startTime: e.target.value }))}
                  data-testid="input-start-time"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="endDate">End Date</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={eventForm.endDate}
                  onChange={(e) => setEventForm(prev => ({ ...prev, endDate: e.target.value }))}
                  data-testid="input-end-date"
                />
              </div>
              <div>
                <Label htmlFor="endTime">End Time</Label>
                <Input
                  id="endTime"
                  type="time"
                  value={eventForm.endTime}
                  onChange={(e) => setEventForm(prev => ({ ...prev, endTime: e.target.value }))}
                  data-testid="input-end-time"
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="location">Location (optional)</Label>
              <Input
                id="location"
                value={eventForm.location}
                onChange={(e) => setEventForm(prev => ({ ...prev, location: e.target.value }))}
                placeholder="Enter event location"
                data-testid="input-event-location"
              />
            </div>
            
            <div>
              <Label htmlFor="color">Color</Label>
              <div className="flex items-center space-x-2 mt-2">
                <Input
                  id="color"
                  type="color"
                  value={eventForm.color}
                  onChange={(e) => setEventForm(prev => ({ ...prev, color: e.target.value }))}
                  className="w-16 h-10"
                  data-testid="input-event-color"
                />
                <span className="text-sm text-gray-500">Choose event color</span>
              </div>
            </div>
            
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <span className="text-sm font-medium text-gray-900">Share with family</span>
                <p className="text-xs text-gray-500">Make this event visible to all family members</p>
              </div>
              <Switch
                checked={eventForm.isShared}
                onCheckedChange={(checked) => setEventForm(prev => ({ ...prev, isShared: checked }))}
                data-testid="switch-event-shared"
              />
            </div>
            
            <div className="flex items-center justify-end space-x-3 pt-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setShowEventForm(false)}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={createEventMutation.isPending}
                data-testid="button-create-event-submit"
              >
                {createEventMutation.isPending ? "Creating..." : "Create Event"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
