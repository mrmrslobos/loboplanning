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
import { Checkbox } from "@/components/ui/checkbox";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertTaskSchema, type Task } from "@shared/schema";
import { z } from "zod";
import { Plus, Calendar, User, Trash2, Filter } from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

const taskFormSchema = insertTaskSchema.extend({
  dueDate: z.string().optional(),
}).omit({ 
  userId: true,
  familyId: true 
});

type TaskFormData = z.infer<typeof taskFormSchema>;

const statusOptions = [
  { value: "pending", label: "Pending", color: "bg-yellow-500" },
  { value: "in-progress", label: "In Progress", color: "bg-blue-500" },
  { value: "on-hold", label: "On Hold", color: "bg-orange-500" },
  { value: "complete", label: "Complete", color: "bg-green-500" },
];

const assigneeOptions = [
  { value: "Me", label: "Me" },
  { value: "Ana", label: "Ana" },
];

export default function TasksPage() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterAssignee, setFilterAssignee] = useState<string>("all");
  const { toast } = useToast();

  const { data: tasks = [], isLoading } = useQuery<Task[]>({
    queryKey: ["/api/tasks"],
  });

  const createTaskMutation = useMutation({
    mutationFn: async (data: TaskFormData) => {
      const taskData = {
        title: data.title,
        description: data.description || '',
        category: data.category || '',
        assignedTo: data.assignedTo,
        status: 'pending', // Default status
        dueDate: data.dueDate ? new Date(data.dueDate).toISOString() : null,
      };
      return await apiRequest("POST", "/api/tasks", taskData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      setIsCreateDialogOpen(false);
      toast({ title: "Task created successfully" });
    },
    onError: () => {
      toast({ title: "Failed to create task", variant: "destructive" });
    },
  });

  const updateTaskMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Task> }) => {
      return await apiRequest("PATCH", `/api/tasks/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      toast({ title: "Task updated successfully" });
    },
  });

  const deleteTaskMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("DELETE", `/api/tasks/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      toast({ title: "Task deleted successfully" });
    },
  });

  const form = useForm<TaskFormData>({
    resolver: zodResolver(taskFormSchema),
    defaultValues: {
      title: "",
      description: "",
      assignedTo: "Me",
    },
  });

  const onSubmit = (data: TaskFormData) => {
    console.log("onSubmit called with data:", data);
    console.log("Form errors:", form.formState.errors);
    createTaskMutation.mutate(data);
  };

  const handleStatusChange = (taskId: string, status: string) => {
    updateTaskMutation.mutate({ id: taskId, data: { status } });
  };

  const handleTaskComplete = (taskId: string, completed: boolean) => {
    const status = completed ? "complete" : "pending";
    updateTaskMutation.mutate({ id: taskId, data: { status } });
  };

  const filteredTasks = tasks.filter((task) => {
    const statusMatch = filterStatus === "all" || task.status === filterStatus;
    const assigneeMatch = filterAssignee === "all" || task.assignedTo === filterAssignee;
    return statusMatch && assigneeMatch;
  });

  const getStatusConfig = (status: string) => {
    return statusOptions.find(opt => opt.value === status) || statusOptions[0];
  };

  const groupedTasks = filteredTasks.reduce((acc, task) => {
    const status = task.status;
    if (!acc[status]) acc[status] = [];
    acc[status].push(task);
    return acc;
  }, {} as Record<string, Task[]>);

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="pb-2">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="h-3 bg-gray-200 rounded"></div>
                  <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Tasks</h1>
          <p className="text-muted-foreground">
            Manage and track your family tasks
          </p>
        </div>
        <Button 
          data-testid="button-create-task"
          onClick={() => {
            console.log("Tasks button clicked!");
            setIsCreateDialogOpen(true);
          }}
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Task
        </Button>
        
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Create New Task</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={(e) => {
                console.log("Tasks Form onSubmit event triggered");
                console.log("Tasks Form is valid:", form.formState.isValid);
                console.log("Tasks Form values:", form.getValues());
                form.handleSubmit(onSubmit)(e);
              }} className="space-y-4">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Title</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Enter task title" 
                          {...field} 
                          data-testid="input-task-title"
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
                          placeholder="Enter task description" 
                          {...field} 
                          value={field.value || ""} 
                          data-testid="input-task-description"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="assignedTo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Assign To</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-assigned-to">
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
                <FormField
                  control={form.control}
                  name="dueDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Due Date (Optional)</FormLabel>
                      <FormControl>
                        <Input 
                          type="date" 
                          {...field} 
                          data-testid="input-due-date"
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
                    onClick={() => setIsCreateDialogOpen(false)}
                    data-testid="button-cancel"
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={createTaskMutation.isPending}
                    data-testid="button-submit-task"
                    onClick={(e) => {
                      console.log("Create Task submit button clicked!");
                      // Let the form handle the submission
                    }}
                  >
                    {createTaskMutation.isPending ? "Creating..." : "Create Task"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        <div className="flex items-center space-x-2">
          <Filter className="h-4 w-4" />
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-40" data-testid="filter-status">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              {statusOptions.map((status) => (
                <SelectItem key={status.value} value={status.value}>
                  {status.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center space-x-2">
          <User className="h-4 w-4" />
          <Select value={filterAssignee} onValueChange={setFilterAssignee}>
            <SelectTrigger className="w-40" data-testid="filter-assignee">
              <SelectValue placeholder="Filter by assignee" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Assignees</SelectItem>
              {assigneeOptions.map((assignee) => (
                <SelectItem key={assignee.value} value={assignee.value}>
                  {assignee.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Task Columns */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {statusOptions.map((statusConfig) => (
          <div key={statusConfig.value} className="space-y-4">
            <div className="flex items-center space-x-2">
              <div className={`w-3 h-3 rounded-full ${statusConfig.color}`}></div>
              <h2 className="font-semibold">{statusConfig.label}</h2>
              <Badge variant="secondary" data-testid={`count-${statusConfig.value}`}>
                {groupedTasks[statusConfig.value]?.length || 0}
              </Badge>
            </div>
            <div className="space-y-3">
              {groupedTasks[statusConfig.value]?.map((task) => (
                <Card key={task.id} className="cursor-pointer hover:shadow-md transition-shadow" data-testid={`task-card-${task.id}`}>
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1 flex-1">
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            checked={task.status === "complete"}
                            onCheckedChange={(checked) => 
                              handleTaskComplete(task.id, checked as boolean)
                            }
                            data-testid={`checkbox-complete-${task.id}`}
                          />
                          <CardTitle className={`text-sm ${task.status === "complete" ? "line-through text-muted-foreground" : ""}`}>
                            {task.title}
                          </CardTitle>
                        </div>
                        {task.description && (
                          <CardDescription className="text-xs">
                            {task.description}
                          </CardDescription>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteTaskMutation.mutate(task.id)}
                        className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                        data-testid={`button-delete-${task.id}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <div className="flex items-center space-x-1">
                        <User className="h-3 w-3" />
                        <span data-testid={`assignee-${task.id}`}>{task.assignedTo}</span>
                      </div>
                      {task.dueDate && (
                        <div className="flex items-center space-x-1">
                          <Calendar className="h-3 w-3" />
                          <span data-testid={`due-date-${task.id}`}>
                            {formatDistanceToNow(new Date(task.dueDate), { addSuffix: true })}
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="mt-2">
                      <Select
                        value={task.status}
                        onValueChange={(status) => handleStatusChange(task.id, status)}
                      >
                        <SelectTrigger className="h-8 text-xs" data-testid={`select-status-${task.id}`}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {statusOptions.map((status) => (
                            <SelectItem key={status.value} value={status.value}>
                              {status.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        ))}
      </div>

      {tasks.length === 0 && (
        <Card className="p-8 text-center">
          <CardContent>
            <div className="space-y-2">
              <h3 className="text-lg font-medium">No tasks yet</h3>
              <p className="text-muted-foreground">
                Create your first task to get started organizing your family activities.
              </p>
              <Button onClick={() => setIsCreateDialogOpen(true)} data-testid="button-create-first-task">
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Task
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}