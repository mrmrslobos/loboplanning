import { useState, useEffect } from "react";
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

const listFormSchema = insertListSchema.omit({ 
  userId: true, 
  familyId: true 
}).extend({
  isShared: z.boolean().default(false)
});
const itemFormSchema = z.object({
  title: z.string().min(1, "Title is required"),
  completed: z.boolean().default(false),
  category: z.string().optional(),
  quantity: z.string().optional(),
  notes: z.string().optional(),
});

type ListFormData = z.infer<typeof listFormSchema>;
type ItemFormData = z.infer<typeof itemFormSchema>;

const templateOptions = [
  { value: "custom", label: "Custom List", icon: CheckSquare },
  { value: "shopping", label: "Shopping List", icon: ShoppingCart },
  { value: "packing", label: "Packing List", icon: Package },
  { value: "task-checklist", label: "Task Checklist", icon: CheckSquare },
];

const listCategoryOptions = [
  "Household",
  "Groceries", 
  "Travel",
  "Work",
  "Personal",
  "Family",
  "Events",
];

const shoppingCategories = [
  "Produce",
  "Meat & Seafood", 
  "Dairy & Eggs",
  "Bakery",
  "Pantry & Canned Goods",
  "Frozen Foods",
  "Beverages",
  "Snacks & Candy",
  "Health & Beauty",
  "Household & Cleaning",
  "Pet Supplies",
  "Other"
];

// Shopping List Component with Categories
function ShoppingListView({ items, onItemToggle, onEditItem }: {
  items: ListItem[];
  onItemToggle: (id: string, completed: boolean) => void;
  onEditItem: (item: ListItem) => void;
}) {
  // Group items by category
  const groupedItems = items.reduce((acc, item) => {
    const category = item.category || 'Other';
    if (!acc[category]) acc[category] = [];
    acc[category].push(item);
    return acc;
  }, {} as Record<string, ListItem[]>);

  const relevantCategories = shoppingCategories.filter(cat => 
    groupedItems[cat] && groupedItems[cat].length > 0
  );

  return (
    <div className="space-y-4">
      {relevantCategories.map(category => (
        <div key={category} className="space-y-2">
          <div className="flex items-center gap-2 px-4 py-2 bg-muted/30">
            <div className="w-4 h-4 rounded bg-primary/20" />
            <h3 className="text-sm font-medium text-primary">{category}</h3>
          </div>
          {groupedItems[category].map(item => (
            <div 
              key={item.id}
              className={`flex items-center gap-3 px-4 py-3 hover:bg-muted/50 transition-colors group ${
                item.completed ? "opacity-60" : ""
              }`}
              onClick={() => onEditItem(item)}
              data-testid={`item-${item.id}`}
            >
              <Checkbox
                checked={item.completed || false}
                onCheckedChange={(checked) => {
                  onItemToggle(item.id, checked as boolean);
                }}
                onClick={(e) => e.stopPropagation()}
                data-testid={`checkbox-item-${item.id}`}
              />
              <div className="flex-1 min-w-0">
                <div className={`text-sm ${item.completed ? "line-through text-muted-foreground" : ""}`}>
                  {item.title}
                  {item.quantity && (
                    <span className="text-xs text-muted-foreground ml-2">• {item.quantity}</span>
                  )}
                </div>
                {item.notes && (
                  <div className="text-xs text-muted-foreground mt-1">{item.notes}</div>
                )}
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onEditItem(item);
                }}
                className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100"
                data-testid={`edit-item-${item.id}`}
              >
                <Edit className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

export default function ListsPage() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedList, setSelectedList] = useState<List | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState("custom");
  const [newItemName, setNewItemName] = useState("");
  const [editingItem, setEditingItem] = useState<ListItem | null>(null);
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
      const { isShared, ...listData } = data;
      const payload = {
        ...listData,
        familyId: isShared ? 'current' : null
      };
      return await apiRequest("POST", "/api/lists", payload);
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
    onSuccess: (_, deletedId) => {
      queryClient.invalidateQueries({ queryKey: ["/api/lists"] });
      if (selectedList?.id === deletedId) {
        setSelectedList(null);
      }
      toast({ title: "List deleted successfully" });
    },
  });

  const createItemMutation = useMutation({
    mutationFn: async (data: { title: string; listId: string; completed?: boolean; category?: string; quantity?: string; notes?: string }) => {
      return await apiRequest("POST", "/api/list-items", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/lists", selectedList?.id, "items"] });
      toast({ title: "Item added successfully" });
    },
    onError: (error) => {
      console.error("Create item error:", error);
      toast({ title: "Failed to add item", variant: "destructive" });
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
      isShared: false,
    },
  });

  const itemForm = useForm<ItemFormData>({
    resolver: zodResolver(itemFormSchema),
    defaultValues: {
      title: "",
      quantity: "",
      notes: "",
      category: "",
      completed: false,
    },
  });

  const onCreateList = (data: ListFormData) => {
    console.log("onCreateList called with data:", data);
    console.log("Form errors:", listForm.formState.errors);
    createListMutation.mutate(data);
  };

  const onAddItem = (data: ItemFormData) => {
    if (!selectedList) return;
    createItemMutation.mutate({
      title: data.title,
      listId: selectedList.id,
      completed: data.completed || false,
      category: data.category,
      quantity: data.quantity,
      notes: data.notes,
    });
  };

  const handleItemToggle = (itemId: string, completed: boolean) => {
    updateItemMutation.mutate({ id: itemId, data: { completed } });
  };

  // Effect to populate edit form when editingItem changes
  useEffect(() => {
    if (editingItem) {
      itemForm.reset({
        title: editingItem.title,
        quantity: editingItem.quantity || "",
        notes: editingItem.notes || "",
        category: editingItem.category || "",
        completed: editingItem.completed,
      });
    }
  }, [editingItem, itemForm]);

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
              onClick={() => {
                console.log("Lists button clicked!");
                console.log("Setting dialog open to true");
                console.log("Current dialog state before:", isCreateDialogOpen);
                setIsCreateDialogOpen(true);
                console.log("Dialog state should be:", true);
                // Force a small delay to see if React needs time to update
                setTimeout(() => {
                  console.log("Dialog state after timeout:", isCreateDialogOpen);
                }, 100);
              }}
            >
              <Plus className="h-4 w-4 mr-2" />
              New List
            </Button>
            
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogContent className="max-w-md" style={{ zIndex: 9999 }}>
                <DialogHeader>
                  <DialogTitle>Create New List</DialogTitle>
                </DialogHeader>
                <Form {...listForm}>
                  <form onSubmit={(e) => {
                    console.log("Form onSubmit event triggered");
                    console.log("Form is valid:", listForm.formState.isValid);
                    console.log("Form values:", listForm.getValues());
                    listForm.handleSubmit(onCreateList)(e);
                  }} className="space-y-4">
                    <FormField
                      control={listForm.control}
                      name="template"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Template</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value || "custom"}>
                            <FormControl>
                              <SelectTrigger data-testid="select-template">
                                <SelectValue placeholder="Choose a template" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent className="z-[10000]">
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
                          <Select onValueChange={field.onChange} value={field.value ?? ""}>
                            <FormControl>
                              <SelectTrigger data-testid="select-category">
                                <SelectValue placeholder="Select category" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent className="z-[10000]">
                              {listCategoryOptions.map((category) => (
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
                      control={listForm.control}
                      name="isShared"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">
                              Share with Family
                            </FormLabel>
                            <div className="text-sm text-muted-foreground">
                              Allow family members to view and edit this list
                            </div>
                          </div>
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                              data-testid="checkbox-share-list"
                            />
                          </FormControl>
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
                        onClick={(e) => {
                          console.log("Create List submit button clicked!");
                          // Let the form handle the submission
                        }}
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
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="text-xs w-fit">
                          {list.category}
                        </Badge>
                        {list.familyId ? (
                          <Badge variant="outline" className="text-xs w-fit">
                            Shared
                          </Badge>
                        ) : (
                          <Badge variant="default" className="text-xs w-fit">
                            Private
                          </Badge>
                        )}
                      </div>
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

        {/* List Detail View - AnyList Style */}
        <div className="lg:col-span-8">
          {selectedList ? (
            <div className="bg-card rounded-lg border overflow-hidden">
              {/* Header */}
              <div className="bg-muted/50 p-4 border-b">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-semibold">{selectedList.title}</h2>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-sm text-muted-foreground">
                        {totalCount} items
                      </span>
                      {selectedList.familyId && (
                        <span className="text-sm text-muted-foreground">• Shared with family</span>
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
                        onClick={() => deleteListMutation.mutate(selectedList.id)}
                        className="text-destructive"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete List
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>

              {/* Add Item Input */}
              <div className="p-4 border-b bg-background">
                <div className="flex items-center gap-2">
                  <Input
                    placeholder="Add Item"
                    value={newItemName}
                    onChange={(e) => setNewItemName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && newItemName.trim()) {
                        const newItem = {
                          title: newItemName.trim(),
                          listId: selectedList.id,
                          completed: false,
                          // No category - let AI determine it automatically
                        };
                        console.log('Adding item via Enter:', newItem);
                        createItemMutation.mutate(newItem);
                        setNewItemName('');
                      }
                    }}
                    className="flex-1"
                    data-testid="input-add-item"
                  />
                  <Button
                    onClick={() => {
                      if (newItemName.trim()) {
                        const newItem = {
                          title: newItemName.trim(),
                          listId: selectedList.id,
                          completed: false,
                          // No category - let AI determine it automatically
                        };
                        console.log('Adding item:', newItem);
                        createItemMutation.mutate(newItem);
                        setNewItemName('');
                      }
                    }}
                    disabled={!newItemName.trim() || createItemMutation.isPending}
                    data-testid="button-add-item"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Items organized by category */}
              <div className="overflow-y-auto max-h-[calc(100vh-300px)]">
                {isLoadingItems ? (
                  <div className="space-y-2 p-4">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="flex items-center space-x-3 p-3 animate-pulse">
                        <div className="w-4 h-4 bg-gray-200 rounded"></div>
                        <div className="flex-1 h-4 bg-gray-200 rounded"></div>
                      </div>
                    ))}
                  </div>
                ) : listItems.length > 0 ? (
                  selectedList.template === 'shopping' ? (
                    // Shopping list with categories
                    <ShoppingListView 
                      items={listItems} 
                      onItemToggle={handleItemToggle}
                      onEditItem={setEditingItem}
                    />
                  ) : (
                    // Regular list view
                    <div className="space-y-1">
                      {listItems.map(item => (
                        <div 
                          key={item.id}
                          className={`flex items-center gap-3 px-4 py-3 hover:bg-muted/50 transition-colors ${
                            item.completed ? "opacity-60" : ""
                          }`}
                          onClick={() => setEditingItem(item)}
                          data-testid={`item-${item.id}`}
                        >
                          <Checkbox
                            checked={item.completed || false}
                            onCheckedChange={(checked) => {
                              handleItemToggle(item.id, checked as boolean);
                            }}
                            onClick={(e) => e.stopPropagation()}
                            data-testid={`checkbox-item-${item.id}`}
                          />
                          <div className="flex-1 min-w-0">
                            <div className={`text-sm ${item.completed ? "line-through text-muted-foreground" : ""}`}>
                              {item.title}
                              {item.quantity && (
                                <span className="text-xs text-muted-foreground ml-2">• {item.quantity}</span>
                              )}
                            </div>
                            {item.notes && (
                              <div className="text-xs text-muted-foreground mt-1">{item.notes}</div>
                            )}
                            {item.category && (
                              <Badge variant="outline" className="text-xs mt-1">{item.category}</Badge>
                            )}
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingItem(item);
                            }}
                            className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100"
                            data-testid={`edit-item-${item.id}`}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )
                ) : (
                  <div className="p-8 text-center">
                    <div className="space-y-2">
                      <h3 className="font-medium text-muted-foreground">No items yet</h3>
                      <p className="text-sm text-muted-foreground">
                        Add your first item using the input above.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-card rounded-lg border p-8 text-center">
              <div className="space-y-2">
                <h3 className="font-medium">Select a list</h3>
                <p className="text-sm text-muted-foreground">
                  Choose a list from the sidebar to view and manage its items.
                </p>
              </div>
            </div>
          )}

          {/* Edit Item Dialog */}
          {editingItem && (
            <Dialog open={!!editingItem} onOpenChange={() => setEditingItem(null)}>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Edit Item</DialogTitle>
                </DialogHeader>
                <Form {...itemForm}>
                  <form onSubmit={itemForm.handleSubmit((data) => {
                    updateItemMutation.mutate({ 
                      id: editingItem.id, 
                      data: {
                        title: data.title,
                        quantity: data.quantity || null,
                        notes: data.notes || null,
                        category: selectedList?.template === 'shopping' ? (data.category || null) : null
                      }
                    });
                    setEditingItem(null);
                    itemForm.reset();
                  })} className="space-y-4" key={editingItem.id}>
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
                              data-testid="input-edit-item-title"
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
                          <FormLabel>Quantity</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="e.g., 2, 1kg, 3 boxes" 
                              {...field} 
                              value={field.value || ""}
                              data-testid="input-edit-item-quantity"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    {selectedList?.template === 'shopping' && (
                      <FormField
                        control={itemForm.control}
                        name="category"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Category</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value || ""}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select category" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent className="z-[10000]">
                                {shoppingCategories.map((category) => (
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
                    )}
                    <FormField
                      control={itemForm.control}
                      name="notes"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Notes</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Additional notes" 
                              {...field} 
                              value={field.value || ""}
                              data-testid="input-edit-item-notes"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="flex justify-between space-x-2">
                      <Button
                        type="button"
                        variant="destructive"
                        onClick={() => {
                          deleteItemMutation.mutate(editingItem.id);
                          setEditingItem(null);
                        }}
                        data-testid="button-delete-item"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </Button>
                      <div className="flex space-x-2">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setEditingItem(null)}
                          data-testid="button-cancel-edit"
                        >
                          Cancel
                        </Button>
                        <Button 
                          type="submit" 
                          disabled={updateItemMutation.isPending}
                          data-testid="button-save-item"
                        >
                          {updateItemMutation.isPending ? "Saving..." : "Save"}
                        </Button>
                      </div>
                    </div>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>
    </div>
  );
}