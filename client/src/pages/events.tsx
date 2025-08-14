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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { 
  Plus, Calendar, MapPin, Users, User, CheckCircle2, 
  DollarSign, UserCheck, UserX, UserRound, 
  Clock, Edit, Trash2, PartyPopper
} from "lucide-react";
import { cn, formatDate, formatDateTime } from "@/lib/utils";
import type { Event, EventGuest, EventChecklist, EventBudget } from "@shared/schema";

export default function Events() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showEventForm, setShowEventForm] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [showGuestForm, setShowGuestForm] = useState(false);
  const [showChecklistForm, setShowChecklistForm] = useState(false);
  const [showBudgetForm, setShowBudgetForm] = useState(false);

  const { data: events, isLoading } = useQuery({
    queryKey: ['/api/events'],
    enabled: !!user?.familyId,
  });

  const { data: guests } = useQuery({
    queryKey: ['/api/events', selectedEvent?.id, 'guests'],
    enabled: !!selectedEvent?.id,
  });

  const { data: checklists } = useQuery({
    queryKey: ['/api/events', selectedEvent?.id, 'checklists'],
    enabled: !!selectedEvent?.id,
  });

  const { data: budgetItems } = useQuery({
    queryKey: ['/api/events', selectedEvent?.id, 'budget'],
    enabled: !!selectedEvent?.id,
  });

  const createEventMutation = useMutation({
    mutationFn: async (data: {
      title: string;
      description?: string;
      date: string;
      location?: string;
      familyId?: string;
    }) => {
      return apiRequest('POST', '/api/events', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/events'] });
      setShowEventForm(false);
      toast({ title: "Success", description: "Event created successfully" });
    },
  });

  const [eventForm, setEventForm] = useState({
    title: "",
    description: "",
    date: "",
    location: "",
    isShared: false,
  });

  const [guestForm, setGuestForm] = useState({
    name: "",
    email: "",
  });

  const [checklistForm, setChecklistForm] = useState({
    title: "",
  });

  const [budgetForm, setBudgetForm] = useState({
    item: "",
    budgetedAmount: "",
    actualAmount: "",
  });

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventForm.title.trim() || !eventForm.date) {
      toast({
        title: "Error",
        description: "Please fill in required fields",
        variant: "destructive",
      });
      return;
    }

    createEventMutation.mutate({
      title: eventForm.title.trim(),
      description: eventForm.description.trim() || undefined,
      date: new Date(eventForm.date).toISOString(),
      location: eventForm.location.trim() || undefined,
      familyId: eventForm.isShared && user?.familyId ? user.familyId : undefined,
    });

    setEventForm({
      title: "",
      description: "",
      date: "",
      location: "",
      isShared: false,
    });
  };

  const addGuest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!guestForm.name.trim() || !selectedEvent) return;

    try {
      await apiRequest('POST', `/api/events/${selectedEvent.id}/guests`, {
        name: guestForm.name.trim(),
        email: guestForm.email.trim() || undefined,
      });
      
      queryClient.invalidateQueries({ queryKey: ['/api/events', selectedEvent.id, 'guests'] });
      setGuestForm({ name: "", email: "" });
      setShowGuestForm(false);
      toast({ title: "Success", description: "Guest added successfully" });
    } catch (error) {
      toast({ title: "Error", description: "Failed to add guest", variant: "destructive" });
    }
  };

  const addChecklistItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!checklistForm.title.trim() || !selectedEvent) return;

    try {
      await apiRequest('POST', `/api/events/${selectedEvent.id}/checklists`, {
        title: checklistForm.title.trim(),
      });
      
      queryClient.invalidateQueries({ queryKey: ['/api/events', selectedEvent.id, 'checklists'] });
      setChecklistForm({ title: "" });
      setShowChecklistForm(false);
      toast({ title: "Success", description: "Checklist item added successfully" });
    } catch (error) {
      toast({ title: "Error", description: "Failed to add checklist item", variant: "destructive" });
    }
  };

  const addBudgetItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!budgetForm.item.trim() || !selectedEvent) return;

    try {
      await apiRequest('POST', `/api/events/${selectedEvent.id}/budget`, {
        item: budgetForm.item.trim(),
        budgetedAmount: budgetForm.budgetedAmount ? parseFloat(budgetForm.budgetedAmount) : undefined,
        actualAmount: budgetForm.actualAmount ? parseFloat(budgetForm.actualAmount) : undefined,
      });
      
      queryClient.invalidateQueries({ queryKey: ['/api/events', selectedEvent.id, 'budget'] });
      setBudgetForm({ item: "", budgetedAmount: "", actualAmount: "" });
      setShowBudgetForm(false);
      toast({ title: "Success", description: "Budget item added successfully" });
    } catch (error) {
      toast({ title: "Error", description: "Failed to add budget item", variant: "destructive" });
    }
  };

  const updateGuestRSVP = async (guestId: string, status: string) => {
    try {
      await apiRequest('PATCH', `/api/events/guests/${guestId}`, { rsvpStatus: status });
      queryClient.invalidateQueries({ queryKey: ['/api/events', selectedEvent?.id, 'guests'] });
    } catch (error) {
      toast({ title: "Error", description: "Failed to update RSVP", variant: "destructive" });
    }
  };

  const toggleChecklistItem = async (itemId: string, completed: boolean) => {
    try {
      await apiRequest('PATCH', `/api/events/checklists/${itemId}`, { completed: !completed });
      queryClient.invalidateQueries({ queryKey: ['/api/events', selectedEvent?.id, 'checklists'] });
    } catch (error) {
      toast({ title: "Error", description: "Failed to update checklist", variant: "destructive" });
    }
  };

  const sortedEvents = events?.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()) || [];
  const upcomingEvents = sortedEvents.filter(event => new Date(event.date) > new Date());
  const pastEvents = sortedEvents.filter(event => new Date(event.date) <= new Date());

  const getRSVPIcon = (status: string) => {
    switch (status) {
      case 'attending': return <UserCheck className="h-4 w-4 text-green-600" />;
      case 'declined': return <UserX className="h-4 w-4 text-red-600" />;
      case 'maybe': return <UserRound className="h-4 w-4 text-yellow-600" />;
      default: return <Clock className="h-4 w-4 text-gray-400" />;
    }
  };

  const totalBudgeted = budgetItems?.reduce((sum, item) => sum + parseFloat(item.budgetedAmount || '0'), 0) || 0;
  const totalSpent = budgetItems?.reduce((sum, item) => sum + parseFloat(item.actualAmount || '0'), 0) || 0;
  const budgetProgress = totalBudgeted > 0 ? Math.round((totalSpent / totalBudgeted) * 100) : 0;

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
            <h1 className="text-2xl font-bold text-gray-900">Event Planning</h1>
            <p className="mt-1 text-sm text-gray-600">Plan and organize special family events</p>
          </div>
          <Button onClick={() => setShowEventForm(true)} data-testid="button-create-event">
            <Plus className="h-4 w-4 mr-2" />
            Plan Event
          </Button>
        </div>
      </header>

      <main className="p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Events List */}
          <div className="lg:col-span-2 space-y-6">
            {/* Upcoming Events */}
            <Card data-testid="card-upcoming-events">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PartyPopper className="h-5 w-5" />
                  Upcoming Events ({upcomingEvents.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {upcomingEvents.length === 0 ? (
                  <div className="text-center py-8">
                    <PartyPopper className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No upcoming events</h3>
                    <p className="text-gray-500 mb-4">Start planning your next family gathering</p>
                    <Button onClick={() => setShowEventForm(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Plan First Event
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {upcomingEvents.map((event) => (
                      <div
                        key={event.id}
                        className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                        onClick={() => setSelectedEvent(event)}
                        data-testid={`event-${event.id}`}
                      >
                        <div className="flex items-center space-x-4">
                          <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                            <Calendar className="h-6 w-6 text-primary" />
                          </div>
                          <div>
                            <h4 className="font-medium text-gray-900">{event.title}</h4>
                            <div className="flex items-center text-sm text-gray-500 mt-1 space-x-3">
                              <div className="flex items-center">
                                <Calendar className="h-3 w-3 mr-1" />
                                <span>{formatDate(event.date)}</span>
                              </div>
                              {event.location && (
                                <div className="flex items-center">
                                  <MapPin className="h-3 w-3 mr-1" />
                                  <span>{event.location}</span>
                                </div>
                              )}
                              <Badge variant="outline">
                                {event.familyId ? (
                                  <><Users className="h-3 w-3 mr-1" />Shared</>
                                ) : (
                                  <><User className="h-3 w-3 mr-1" />Private</>
                                )}
                              </Badge>
                            </div>
                          </div>
                        </div>
                        <Button variant="ghost" size="sm">
                          View Details
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Past Events */}
            {pastEvents.length > 0 && (
              <Card data-testid="card-past-events">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5" />
                    Past Events ({pastEvents.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {pastEvents.slice(0, 3).map((event) => (
                      <div
                        key={event.id}
                        className="flex items-center justify-between p-3 border rounded-lg opacity-75 hover:opacity-100 cursor-pointer transition-opacity"
                        onClick={() => setSelectedEvent(event)}
                        data-testid={`past-event-${event.id}`}
                      >
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                            <Calendar className="h-4 w-4 text-gray-500" />
                          </div>
                          <div>
                            <h4 className="font-medium text-gray-700">{event.title}</h4>
                            <p className="text-sm text-gray-500">{formatDate(event.date)}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Event Details */}
          <div>
            {selectedEvent ? (
              <Card data-testid="card-event-details">
                <CardHeader className="border-b border-gray-200">
                  <CardTitle>{selectedEvent.title}</CardTitle>
                  <div className="flex items-center text-sm text-gray-500 space-x-3">
                    <div className="flex items-center">
                      <Calendar className="h-3 w-3 mr-1" />
                      <span>{formatDate(selectedEvent.date)}</span>
                    </div>
                    {selectedEvent.location && (
                      <div className="flex items-center">
                        <MapPin className="h-3 w-3 mr-1" />
                        <span>{selectedEvent.location}</span>
                      </div>
                    )}
                  </div>
                  {selectedEvent.description && (
                    <p className="text-sm text-gray-600 mt-2">{selectedEvent.description}</p>
                  )}
                </CardHeader>
                <CardContent className="p-0">
                  <Tabs defaultValue="guests" className="w-full">
                    <TabsList className="grid w-full grid-cols-3">
                      <TabsTrigger value="guests" data-testid="tab-guests">Guests</TabsTrigger>
                      <TabsTrigger value="checklist" data-testid="tab-checklist">Checklist</TabsTrigger>
                      <TabsTrigger value="budget" data-testid="tab-budget">Budget</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="guests" className="p-4 space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium">Guest List</h4>
                        <Button
                          size="sm"
                          onClick={() => setShowGuestForm(true)}
                          data-testid="button-add-guest"
                        >
                          <Plus className="h-4 w-4 mr-1" />
                          Add Guest
                        </Button>
                      </div>
                      <div className="space-y-2">
                        {guests?.map((guest) => (
                          <div
                            key={guest.id}
                            className="flex items-center justify-between p-2 border rounded"
                            data-testid={`guest-${guest.id}`}
                          >
                            <div>
                              <p className="font-medium text-sm">{guest.name}</p>
                              {guest.email && (
                                <p className="text-xs text-gray-500">{guest.email}</p>
                              )}
                            </div>
                            <div className="flex items-center space-x-2">
                              {getRSVPIcon(guest.rsvpStatus || 'pending')}
                              <Select
                                value={guest.rsvpStatus || 'pending'}
                                onValueChange={(value) => updateGuestRSVP(guest.id, value)}
                              >
                                <SelectTrigger className="w-20 h-8 text-xs">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="pending">Pending</SelectItem>
                                  <SelectItem value="attending">Attending</SelectItem>
                                  <SelectItem value="maybe">Maybe</SelectItem>
                                  <SelectItem value="declined">Declined</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                        )) || (
                          <p className="text-center text-gray-500 py-4">No guests added yet</p>
                        )}
                      </div>
                    </TabsContent>
                    
                    <TabsContent value="checklist" className="p-4 space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium">Event Checklist</h4>
                        <Button
                          size="sm"
                          onClick={() => setShowChecklistForm(true)}
                          data-testid="button-add-checklist"
                        >
                          <Plus className="h-4 w-4 mr-1" />
                          Add Item
                        </Button>
                      </div>
                      <div className="space-y-2">
                        {checklists?.map((item) => (
                          <div
                            key={item.id}
                            className="flex items-center space-x-3 p-2 border rounded"
                            data-testid={`checklist-${item.id}`}
                          >
                            <input
                              type="checkbox"
                              checked={item.completed || false}
                              onChange={() => toggleChecklistItem(item.id, item.completed || false)}
                              className="w-4 h-4 text-primary border-gray-300 rounded"
                            />
                            <span className={cn(
                              "text-sm",
                              item.completed ? "line-through text-gray-500" : "text-gray-900"
                            )}>
                              {item.title}
                            </span>
                          </div>
                        )) || (
                          <p className="text-center text-gray-500 py-4">No checklist items yet</p>
                        )}
                      </div>
                    </TabsContent>
                    
                    <TabsContent value="budget" className="p-4 space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium">Budget Tracking</h4>
                        <Button
                          size="sm"
                          onClick={() => setShowBudgetForm(true)}
                          data-testid="button-add-budget-item"
                        >
                          <Plus className="h-4 w-4 mr-1" />
                          Add Item
                        </Button>
                      </div>
                      
                      {totalBudgeted > 0 && (
                        <div className="p-3 bg-gray-50 rounded-lg">
                          <div className="flex justify-between text-sm mb-2">
                            <span>Total Spent</span>
                            <span className="font-medium">
                              ${totalSpent.toFixed(2)} / ${totalBudgeted.toFixed(2)}
                            </span>
                          </div>
                          <Progress value={budgetProgress} className="h-2" />
                          <p className="text-xs text-gray-500 mt-1 text-center">
                            {budgetProgress}% of budget used
                          </p>
                        </div>
                      )}
                      
                      <div className="space-y-2">
                        {budgetItems?.map((item) => (
                          <div
                            key={item.id}
                            className="flex items-center justify-between p-2 border rounded"
                            data-testid={`budget-item-${item.id}`}
                          >
                            <span className="text-sm font-medium">{item.item}</span>
                            <div className="text-right">
                              <div className="text-sm">
                                {item.actualAmount && (
                                  <span className="text-gray-900">${parseFloat(item.actualAmount).toFixed(2)}</span>
                                )}
                                {item.budgetedAmount && (
                                  <span className="text-gray-500 ml-2">
                                    / ${parseFloat(item.budgetedAmount).toFixed(2)}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        )) || (
                          <p className="text-center text-gray-500 py-4">No budget items yet</p>
                        )}
                      </div>
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            ) : (
              <Card data-testid="card-select-event">
                <CardContent className="p-8">
                  <div className="text-center">
                    <PartyPopper className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Select an event</h3>
                    <p className="text-gray-500">Choose an event to view guests, checklists, and budget details</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>

      {/* Create Event Modal */}
      <Dialog open={showEventForm} onOpenChange={setShowEventForm}>
        <DialogContent className="sm:max-w-lg" data-testid="modal-create-event">
          <DialogHeader>
            <DialogTitle>Plan New Event</DialogTitle>
          </DialogHeader>
          
          <form onSubmit={handleCreateEvent} className="space-y-4">
            <div>
              <Label htmlFor="eventTitle">Event Title</Label>
              <Input
                id="eventTitle"
                value={eventForm.title}
                onChange={(e) => setEventForm(prev => ({ ...prev, title: e.target.value }))}
                placeholder="e.g., Dad's 50th Birthday, Summer BBQ"
                data-testid="input-event-title"
              />
            </div>
            
            <div>
              <Label htmlFor="eventDate">Event Date</Label>
              <Input
                id="eventDate"
                type="date"
                value={eventForm.date}
                onChange={(e) => setEventForm(prev => ({ ...prev, date: e.target.value }))}
                data-testid="input-event-date"
              />
            </div>
            
            <div>
              <Label htmlFor="eventLocation">Location (optional)</Label>
              <Input
                id="eventLocation"
                value={eventForm.location}
                onChange={(e) => setEventForm(prev => ({ ...prev, location: e.target.value }))}
                placeholder="Enter event location"
                data-testid="input-event-location"
              />
            </div>
            
            <div>
              <Label htmlFor="eventDescription">Description (optional)</Label>
              <Textarea
                id="eventDescription"
                value={eventForm.description}
                onChange={(e) => setEventForm(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Add event details..."
                rows={3}
                data-testid="textarea-event-description"
              />
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
              <Button type="button" variant="outline" onClick={() => setShowEventForm(false)}>
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

      {/* Add Guest Modal */}
      <Dialog open={showGuestForm} onOpenChange={setShowGuestForm}>
        <DialogContent data-testid="modal-add-guest">
          <DialogHeader>
            <DialogTitle>Add Guest</DialogTitle>
          </DialogHeader>
          
          <form onSubmit={addGuest} className="space-y-4">
            <div>
              <Label htmlFor="guestName">Guest Name</Label>
              <Input
                id="guestName"
                value={guestForm.name}
                onChange={(e) => setGuestForm(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Enter guest name"
                data-testid="input-guest-name"
              />
            </div>
            
            <div>
              <Label htmlFor="guestEmail">Email (optional)</Label>
              <Input
                id="guestEmail"
                type="email"
                value={guestForm.email}
                onChange={(e) => setGuestForm(prev => ({ ...prev, email: e.target.value }))}
                placeholder="Enter guest email"
                data-testid="input-guest-email"
              />
            </div>
            
            <div className="flex items-center justify-end space-x-3 pt-4">
              <Button type="button" variant="outline" onClick={() => setShowGuestForm(false)}>
                Cancel
              </Button>
              <Button type="submit" data-testid="button-add-guest-submit">
                Add Guest
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Add Checklist Item Modal */}
      <Dialog open={showChecklistForm} onOpenChange={setShowChecklistForm}>
        <DialogContent data-testid="modal-add-checklist">
          <DialogHeader>
            <DialogTitle>Add Checklist Item</DialogTitle>
          </DialogHeader>
          
          <form onSubmit={addChecklistItem} className="space-y-4">
            <div>
              <Label htmlFor="checklistTitle">Task</Label>
              <Input
                id="checklistTitle"
                value={checklistForm.title}
                onChange={(e) => setChecklistForm({ title: e.target.value })}
                placeholder="e.g., Order cake, Send invitations"
                data-testid="input-checklist-title"
              />
            </div>
            
            <div className="flex items-center justify-end space-x-3 pt-4">
              <Button type="button" variant="outline" onClick={() => setShowChecklistForm(false)}>
                Cancel
              </Button>
              <Button type="submit" data-testid="button-add-checklist-submit">
                Add Item
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Add Budget Item Modal */}
      <Dialog open={showBudgetForm} onOpenChange={setShowBudgetForm}>
        <DialogContent data-testid="modal-add-budget-item">
          <DialogHeader>
            <DialogTitle>Add Budget Item</DialogTitle>
          </DialogHeader>
          
          <form onSubmit={addBudgetItem} className="space-y-4">
            <div>
              <Label htmlFor="budgetItem">Item</Label>
              <Input
                id="budgetItem"
                value={budgetForm.item}
                onChange={(e) => setBudgetForm(prev => ({ ...prev, item: e.target.value }))}
                placeholder="e.g., Decorations, Food, Venue"
                data-testid="input-budget-item"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="budgetedAmount">Budgeted Amount</Label>
                <Input
                  id="budgetedAmount"
                  type="number"
                  step="0.01"
                  value={budgetForm.budgetedAmount}
                  onChange={(e) => setBudgetForm(prev => ({ ...prev, budgetedAmount: e.target.value }))}
                  placeholder="0.00"
                  data-testid="input-budgeted-amount"
                />
              </div>
              <div>
                <Label htmlFor="actualAmount">Actual Amount</Label>
                <Input
                  id="actualAmount"
                  type="number"
                  step="0.01"
                  value={budgetForm.actualAmount}
                  onChange={(e) => setBudgetForm(prev => ({ ...prev, actualAmount: e.target.value }))}
                  placeholder="0.00"
                  data-testid="input-actual-amount"
                />
              </div>
            </div>
            
            <div className="flex items-center justify-end space-x-3 pt-4">
              <Button type="button" variant="outline" onClick={() => setShowBudgetForm(false)}>
                Cancel
              </Button>
              <Button type="submit" data-testid="button-add-budget-item-submit">
                Add Item
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
