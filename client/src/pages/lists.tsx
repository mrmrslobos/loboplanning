import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { Plus, List, Check, X, Edit, Trash2, Users, User, RotateCcw } from "lucide-react";
import { cn, formatDate } from "@/lib/utils";
import type { List as ListType, ListItem } from "@shared/schema";

export default function Lists() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showListForm, setShowListForm] = useState(false);
  const [showItemForm, setShowItemForm] = useState(false);
  const [selectedList, setSelectedList] = useState<ListType | null>(null);
  const [editingItem, setEditingItem] = useState<ListItem | null>(null);

  const { data: lists, isLoading } = useQuery({
    queryKey: ['/api/lists'],
    enabled: !!user?.familyId,
  });

  const { data: listItems } = useQuery({
    queryKey: ['/api/lists', selectedList?.id, 'items'],
    enabled: !!selectedList?.id,
  });

  const createListMutation = useMutation({
    mutationFn: async (data: { title: string; description?: string; familyId?: string }) => {
      return apiRequest('POST', '/api/lists', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/lists'] });
      setShowListForm(false);
      toast({ title: "Success", description: "List created successfully" });
    },
  });

  const createItemMutation = useMutation({
    mutationFn: async (data: { title: string; quantity?: string; notes?: string }) => {
      return apiRequest('POST', `/api/lists/${selectedList?.id}/items`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/lists', selectedList?.id, 'items'] });
      setShowItemForm(false);
      setEditingItem(null);
    },
  });

  const updateItemMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<ListItem> }) => {
      return apiRequest('PATCH', `/api/list-items/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/lists', selectedList?.id, 'items'] });
    },
  });

  const uncheckAllMutation = useMutation({
    mutationFn: async () => {
      const promises = listItems?.filter(item => item.completed).map(item =>
        apiRequest('PATCH', `/api/list-items/${item.id}`, { completed: false })
      ) || [];
      return Promise.all(promises);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/lists', selectedList?.id, 'items'] });
      toast({ title: "Success", description: "All items unchecked" });
    },
  });

  const [listForm, setListForm] = useState({
    title: "",
    description: "",
    isShared: false,
  });

  const [itemForm, setItemForm] = useState({
    title: "",
    quantity: "",
    notes: "",
  });

  const handleCreateList = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!listForm.title.trim()) return;

    createListMutation.mutate({
      title: listForm.title.trim(),
      description: listForm.description.trim() || undefined,
      familyId: listForm.isShared && user?.familyId ? user.familyId : undefined,
    });

    setListForm({ title: "", description: "", isShared: false });
  };

  const handleCreateItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemForm.title.trim()) return;

    createItemMutation.mutate({
      title: itemForm.title.trim(),
      quantity: itemForm.quantity.trim() || undefined,
      notes: itemForm.notes.trim() || undefined,
    });

    setItemForm({ title: "", quantity: "", notes: "" });
  };

  const toggleItemCompleted = (item: ListItem) => {
    updateItemMutation.mutate({
      id: item.id,
      data: { completed: !item.completed }
    });
  };

  const completedCount = listItems?.filter(item => item.completed).length || 0;
  const totalCount = listItems?.length || 0;

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
            <h1 className="text-2xl font-bold text-gray-900">Lists</h1>
            <p className="mt-1 text-sm text-gray-600">Organize your family's shopping and to-do lists</p>
          </div>
          <Button onClick={() => setShowListForm(true)} data-testid="button-create-list">
            <Plus className="h-4 w-4 mr-2" />
            New List
          </Button>
        </div>
      </header>

      <main className="p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Lists Sidebar */}
          <div className="space-y-4">
            <Card data-testid="card-lists-sidebar">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <List className="h-5 w-5" />
                  My Lists ({lists?.length || 0})
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {lists?.length === 0 ? (
                  <div className="text-center py-8 px-6">
                    <List className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No lists yet</h3>
                    <p className="text-gray-500 mb-4">Create your first list to get started</p>
                    <Button onClick={() => setShowListForm(true)} size="sm">
                      <Plus className="h-4 w-4 mr-2" />
                      Create List
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-1 p-2">
                    {lists?.map((list) => (
                      <button
                        key={list.id}
                        onClick={() => setSelectedList(list)}
                        className={cn(
                          "w-full text-left p-3 rounded-lg transition-colors hover:bg-gray-100",
                          selectedList?.id === list.id && "bg-primary text-white hover:bg-primary/90"
                        )}
                        data-testid={`button-select-list-${list.id}`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <h4 className="font-medium truncate">{list.title}</h4>
                            <p className={cn(
                              "text-xs mt-1",
                              selectedList?.id === list.id ? "text-white/70" : "text-gray-500"
                            )}>
                              {formatDate(list.createdAt || new Date())}
                            </p>
                          </div>
                          <div className="flex items-center space-x-2">
                            {list.familyId ? (
                              <Users className="h-4 w-4 opacity-70" />
                            ) : (
                              <User className="h-4 w-4 opacity-70" />
                            )}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* List Details */}
          <div className="lg:col-span-2">
            {selectedList ? (
              <Card data-testid="card-list-details">
                <CardHeader className="border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>{selectedList.title}</CardTitle>
                      {selectedList.description && (
                        <p className="text-sm text-gray-600 mt-1">{selectedList.description}</p>
                      )}
                      <div className="flex items-center space-x-2 mt-2">
                        <Badge variant="outline">
                          {selectedList.familyId ? 'Shared List' : 'Private List'}
                        </Badge>
                        <span className="text-sm text-gray-500">
                          {completedCount}/{totalCount} completed
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {completedCount > 0 && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => uncheckAllMutation.mutate()}
                          data-testid="button-uncheck-all"
                        >
                          <RotateCcw className="h-4 w-4 mr-2" />
                          Uncheck All
                        </Button>
                      )}
                      <Button
                        size="sm"
                        onClick={() => setShowItemForm(true)}
                        data-testid="button-add-item"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Item
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  {listItems?.length === 0 ? (
                    <div className="text-center py-12">
                      <List className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No items yet</h3>
                      <p className="text-gray-500 mb-4">Add your first item to this list</p>
                      <Button onClick={() => setShowItemForm(true)}>
                        <Plus className="h-4 w-4 mr-2" />
                        Add Item
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {listItems?.map((item) => (
                        <div
                          key={item.id}
                          className={cn(
                            "flex items-center p-3 border rounded-lg transition-colors",
                            item.completed ? "bg-gray-50 opacity-75" : "bg-white hover:bg-gray-50"
                          )}
                          data-testid={`list-item-${item.id}`}
                        >
                          <input
                            type="checkbox"
                            checked={item.completed || false}
                            onChange={() => toggleItemCompleted(item)}
                            className="w-5 h-5 text-primary border-gray-300 rounded focus:ring-primary"
                            data-testid={`checkbox-item-${item.id}`}
                          />
                          <div className="ml-3 flex-1">
                            <div className="flex items-center justify-between">
                              <h4 className={cn(
                                "font-medium",
                                item.completed ? "line-through text-gray-500" : "text-gray-900"
                              )}>
                                {item.title}
                              </h4>
                              {item.quantity && (
                                <span className="text-sm text-gray-500 font-mono">
                                  {item.quantity}
                                </span>
                              )}
                            </div>
                            {item.notes && (
                              <p className="text-sm text-gray-600 mt-1">{item.notes}</p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            ) : (
              <Card data-testid="card-no-list-selected">
                <CardContent className="p-12">
                  <div className="text-center">
                    <List className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-xl font-medium text-gray-900 mb-2">Select a list</h3>
                    <p className="text-gray-500">Choose a list from the sidebar to view and manage its items</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>

      {/* Create List Modal */}
      <Dialog open={showListForm} onOpenChange={setShowListForm}>
        <DialogContent data-testid="modal-create-list">
          <DialogHeader>
            <DialogTitle>Create New List</DialogTitle>
          </DialogHeader>
          
          <form onSubmit={handleCreateList} className="space-y-4">
            <div>
              <Label htmlFor="listTitle">List Name</Label>
              <Input
                id="listTitle"
                value={listForm.title}
                onChange={(e) => setListForm(prev => ({ ...prev, title: e.target.value }))}
                placeholder="e.g., Grocery Shopping, Hardware Store"
                data-testid="input-list-title"
              />
            </div>
            
            <div>
              <Label htmlFor="listDescription">Description (optional)</Label>
              <Textarea
                id="listDescription"
                value={listForm.description}
                onChange={(e) => setListForm(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Add a description for this list..."
                rows={3}
                data-testid="textarea-list-description"
              />
            </div>
            
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <span className="text-sm font-medium text-gray-900">Share with family</span>
                <p className="text-xs text-gray-500">Make this list visible to all family members</p>
              </div>
              <Switch
                checked={listForm.isShared}
                onCheckedChange={(checked) => setListForm(prev => ({ ...prev, isShared: checked }))}
                data-testid="switch-list-shared"
              />
            </div>
            
            <div className="flex items-center justify-end space-x-3 pt-4">
              <Button type="button" variant="outline" onClick={() => setShowListForm(false)}>
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={createListMutation.isPending}
                data-testid="button-create-list-submit"
              >
                {createListMutation.isPending ? "Creating..." : "Create List"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Add Item Modal */}
      <Dialog open={showItemForm} onOpenChange={setShowItemForm}>
        <DialogContent data-testid="modal-add-item">
          <DialogHeader>
            <DialogTitle>Add Item to {selectedList?.title}</DialogTitle>
          </DialogHeader>
          
          <form onSubmit={handleCreateItem} className="space-y-4">
            <div>
              <Label htmlFor="itemTitle">Item Name</Label>
              <Input
                id="itemTitle"
                value={itemForm.title}
                onChange={(e) => setItemForm(prev => ({ ...prev, title: e.target.value }))}
                placeholder="e.g., Milk, Bananas, Light bulbs"
                data-testid="input-item-title"
              />
            </div>
            
            <div>
              <Label htmlFor="itemQuantity">Quantity (optional)</Label>
              <Input
                id="itemQuantity"
                value={itemForm.quantity}
                onChange={(e) => setItemForm(prev => ({ ...prev, quantity: e.target.value }))}
                placeholder="e.g., 2x, 1 gallon, 500g"
                data-testid="input-item-quantity"
              />
            </div>
            
            <div>
              <Label htmlFor="itemNotes">Notes (optional)</Label>
              <Textarea
                id="itemNotes"
                value={itemForm.notes}
                onChange={(e) => setItemForm(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Any additional notes..."
                rows={2}
                data-testid="textarea-item-notes"
              />
            </div>
            
            <div className="flex items-center justify-end space-x-3 pt-4">
              <Button type="button" variant="outline" onClick={() => setShowItemForm(false)}>
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={createItemMutation.isPending}
                data-testid="button-add-item-submit"
              >
                {createItemMutation.isPending ? "Adding..." : "Add Item"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
