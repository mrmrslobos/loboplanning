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
import { insertListSchema, insertListItemSchema, type List, type ListItem } from "@shared/schema";
import { z } from "zod";
import { Plus, ShoppingCart, Package, CheckSquare, Trash2, Edit, MoreVertical } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

const listFormSchema = insertListSchema.extend({});
const itemFormSchema = insertListItemSchema.extend({});

type ListFormData = z.infer<typeof listFormSchema>;
type ItemFormData = z.infer<typeof itemFormSchema>;

const templateOptions = [
  { value: "custom", label: "Custom List", icon: CheckSquare },
  { value: "shopping", label: "Shopping List", icon: ShoppingCart },
  { value: "packing", label: "Packing List", icon: Package },
  { value: "task-checklist", label: "Task Checklist", icon: CheckSquare },
];

const categoryOptions = [
  "Household",
  "Groceries", 
  "Travel",
  "Work",
  "Personal",
  "Family",
  "Events",
];

export default function ListsPage() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isAddItemDialogOpen, setIsAddItemDialogOpen] = useState(false);
  const [selectedList, setSelectedList] = useState<List | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState("custom");
  const { toast } = useToast();

  const { data: lists = [], isLoading } = useQuery<List[]>({
    queryKey: ["/api/lists"],
  });

  const { data: listItems = [], isLoading: isLoadingItems } = useQuery<ListItem[]>({
    queryKey: ["/api/lists", selectedList?.id, "items"],
    enabled: !!selectedList,
  });

  const createListMutation = useMutation({
    mutationFn: async (data: ListFormData) => {
      return await apiRequest("POST", "/api/lists", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/lists"] });
      setIsCreateDialogOpen(false);
      toast({ title: "List created successfully" });
    },
    onError: () => {
      toast({ title: "Failed to create list", variant: "destructive" });
    },
  });

  const deleteListMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("DELETE", `/api/lists/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/lists"] });
      if (selectedList?.id === id) {
        setSelectedList(null);
      }
      toast({ title: "List deleted successfully" });
    },
  });

  const createItemMutation = useMutation({
    mutationFn: async (data: ItemFormData) => {
      return await apiRequest("POST", "/api/list-items", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/lists", selectedList?.id, "items"] });
      setIsAddItemDialogOpen(false);
      toast({ title: "Item added successfully" });
    },
  });

  const updateItemMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<ListItem> }) => {
      return await apiRequest("PATCH", `/api/list-items/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/lists", selectedList?.id, "items"] });
    },
  });

  const deleteItemMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("DELETE", `/api/list-items/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/lists", selectedList?.id, "items"] });
      toast({ title: "Item deleted successfully" });
    },
  });

  const listForm = useForm<ListFormData>({
    resolver: zodResolver(listFormSchema),
    defaultValues: {
      title: "",
      description: "",
      template: "custom",
      category: "",
    },
  });

  const itemForm = useForm<ItemFormData>({
    resolver: zodResolver(itemFormSchema),
    defaultValues: {
      title: "",
      quantity: "",
      notes: "",
      category: "",
    },
  });

  const onCreateList = (data: ListFormData) => {
    createListMutation.mutate(data);
  };

  const onAddItem = (data: ItemFormData) => {
    if (!selectedList) return;
    createItemMutation.mutate({
      ...data,
      listId: selectedList.id,
    });
  };

  const handleItemToggle = (itemId: string, completed: boolean) => {
    updateItemMutation.mutate({ id: itemId, data: { completed } });
  };

  const getTemplateIcon = (template: string) => {
    const templateConfig = templateOptions.find(t => t.value === template);
    return templateConfig?.icon || CheckSquare;
  };

  const completedCount = listItems.filter(item => item.completed).length;
  const totalCount = listItems.length;
  const progressPercentage = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="grid gap-4 md:grid-cols-3">
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
        {/* Lists Sidebar */}
        <div className="lg:col-span-4 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Lists</h1>
              <p className="text-muted-foreground text-sm">
                Organize with categories and templates
              </p>
            </div>
            <Button 
              size="sm" 
              data-testid="button-create-list"
              onClick={() => setIsCreateDialogOpen(true)}
            >
              <Plus className="h-4 w-4 mr-2" />
              New List
            </Button>
            
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Create New List</DialogTitle>
                  <DialogDescription>
                    Choose a template or create a custom list.
                  </DialogDescription>
                </DialogHeader>
                <Form {...listForm}>
                  <form onSubmit={listForm.handleSubmit(onCreateList)} className="space-y-4">
                    <FormField
                      control={listForm.control}
                      name="template"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Template</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger data-testid="select-template">
                                <SelectValue placeholder="Choose a template" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {templateOptions.map((template) => {
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
                      control={listForm.control}
                      name="title"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Title</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="Enter list title" 
                              {...field} 
                              data-testid="input-list-title"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={listForm.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Description (Optional)</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Enter list description" 
                              {...field} 
                              value={field.value || ""}
                              data-testid="input-list-description"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={listForm.control}
                      name="category"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Category (Optional)</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value || ""}>
                            <FormControl>
                              <SelectTrigger data-testid="select-category">
                                <SelectValue placeholder="Select category" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {categoryOptions.map((category) => (
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
                        disabled={createListMutation.isPending}
                        data-testid="button-submit-list"
                      >
                        {createListMutation.isPending ? "Creating..." : "Create List"}
                      </Button>
                    </div>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>

          <div className="space-y-3">
            {lists.map((list) => {
              const Icon = getTemplateIcon(list.template || "custom");
              return (
                <Card 
                  key={list.id} 
                  className={`cursor-pointer transition-colors hover:bg-accent ${
                    selectedList?.id === list.id ? "ring-2 ring-primary" : ""
                  }`}
                  onClick={() => setSelectedList(list)}
                  data-testid={`list-card-${list.id}`}
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-2 flex-1">
                        <Icon className="h-4 w-4 text-muted-foreground" />
                        <div className="min-w-0 flex-1">
                          <CardTitle className="text-sm truncate">{list.title}</CardTitle>
                          {list.description && (
                            <CardDescription className="text-xs truncate">
                              {list.description}
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
                              deleteListMutation.mutate(list.id);
                            }}
                            className="text-destructive"
                            data-testid={`delete-list-${list.id}`}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete List
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    {list.category && (
                      <Badge variant="secondary" className="text-xs w-fit">
                        {list.category}
                      </Badge>
                    )}
                  </CardHeader>
                </Card>
              );
            })}
            
            {lists.length === 0 && (
              <Card className="p-4 text-center border-dashed">
                <CardContent className="pt-0">
                  <div className="space-y-2">
                    <h3 className="font-medium">No lists yet</h3>
                    <p className="text-sm text-muted-foreground">
                      Create your first list to get organized.
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* List Items */}
        <div className="lg:col-span-8">
          {selectedList ? (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold">{selectedList.title}</h2>
                  {selectedList.description && (
                    <p className="text-sm text-muted-foreground">{selectedList.description}</p>
                  )}
                  <div className="flex items-center space-x-4 mt-2">
                    <div className="text-sm text-muted-foreground">
                      {completedCount} of {totalCount} items completed
                    </div>
                    <div className="flex-1 max-w-32">
                      <div className="w-full bg-secondary rounded-full h-2">
                        <div 
                          className="bg-primary h-2 rounded-full transition-all duration-300" 
                          style={{ width: `${progressPercentage}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
                <Dialog open={isAddItemDialogOpen} onOpenChange={setIsAddItemDialogOpen}>
                  <DialogTrigger asChild>
                    <Button data-testid="button-add-item">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Item
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-md">
                    <DialogHeader>
                      <DialogTitle>Add Item</DialogTitle>
                      <DialogDescription>
                        Add a new item to {selectedList.title}.
                      </DialogDescription>
                    </DialogHeader>
                    <Form {...itemForm}>
                      <form onSubmit={itemForm.handleSubmit(onAddItem)} className="space-y-4">
                        <FormField
                          control={itemForm.control}
                          name="title"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Item</FormLabel>
                              <FormControl>
                                <Input 
                                  placeholder="Enter item name" 
                                  {...field} 
                                  data-testid="input-item-title"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={itemForm.control}
                          name="quantity"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Quantity (Optional)</FormLabel>
                              <FormControl>
                                <Input 
                                  placeholder="e.g., 2, 1kg, 3 boxes" 
                                  {...field} 
                                  value={field.value || ""}
                                  data-testid="input-item-quantity"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={itemForm.control}
                          name="notes"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Notes (Optional)</FormLabel>
                              <FormControl>
                                <Textarea 
                                  placeholder="Additional notes" 
                                  {...field} 
                                  value={field.value || ""}
                                  data-testid="input-item-notes"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={itemForm.control}
                          name="category"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Category (Optional)</FormLabel>
                              <FormControl>
                                <Input 
                                  placeholder="e.g., Produce, Dairy, Personal" 
                                  {...field} 
                                  value={field.value || ""}
                                  data-testid="input-item-category"
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
                            onClick={() => setIsAddItemDialogOpen(false)}
                            data-testid="button-cancel-item"
                          >
                            Cancel
                          </Button>
                          <Button 
                            type="submit" 
                            disabled={createItemMutation.isPending}
                            data-testid="button-submit-item"
                          >
                            {createItemMutation.isPending ? "Adding..." : "Add Item"}
                          </Button>
                        </div>
                      </form>
                    </Form>
                  </DialogContent>
                </Dialog>
              </div>

              {/* List Items */}
              <div className="space-y-2">
                {isLoadingItems ? (
                  <div className="space-y-2">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="flex items-center space-x-3 p-3 border rounded animate-pulse">
                        <div className="w-4 h-4 bg-gray-200 rounded"></div>
                        <div className="flex-1 h-4 bg-gray-200 rounded"></div>
                        <div className="w-8 h-4 bg-gray-200 rounded"></div>
                      </div>
                    ))}
                  </div>
                ) : listItems.length > 0 ? (
                  listItems.map((item) => (
                    <div 
                      key={item.id} 
                      className={`flex items-center space-x-3 p-3 border rounded hover:bg-accent transition-colors ${
                        item.completed ? "bg-muted/50" : ""
                      }`}
                      data-testid={`item-${item.id}`}
                    >
                      <Checkbox
                        checked={item.completed || false}
                        onCheckedChange={(checked) => 
                          handleItemToggle(item.id, checked as boolean)
                        }
                        data-testid={`checkbox-item-${item.id}`}
                      />
                      <div className="flex-1 min-w-0">
                        <div className={`font-medium ${item.completed ? "line-through text-muted-foreground" : ""}`}>
                          {item.title}
                          {item.quantity && (
                            <span className="text-sm text-muted-foreground ml-2">({item.quantity})</span>
                          )}
                        </div>
                        {item.notes && (
                          <div className="text-sm text-muted-foreground truncate">{item.notes}</div>
                        )}
                        {item.category && (
                          <Badge variant="outline" className="text-xs mt-1">{item.category}</Badge>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteItemMutation.mutate(item.id)}
                        className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                        data-testid={`delete-item-${item.id}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))
                ) : (
                  <Card className="p-8 text-center border-dashed">
                    <CardContent>
                      <div className="space-y-2">
                        <h3 className="font-medium">No items yet</h3>
                        <p className="text-sm text-muted-foreground">
                          Add your first item to this list.
                        </p>
                        <Button onClick={() => setIsAddItemDialogOpen(true)} data-testid="button-add-first-item">
                          <Plus className="h-4 w-4 mr-2" />
                          Add First Item
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          ) : (
            <Card className="p-8 text-center border-dashed">
              <CardContent>
                <div className="space-y-2">
                  <h3 className="font-medium">Select a list</h3>
                  <p className="text-sm text-muted-foreground">
                    Choose a list from the sidebar to view and manage its items.
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