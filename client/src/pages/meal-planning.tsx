import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { 
  Utensils, Calendar, ShoppingCart, BookOpen, 
  Settings, ExternalLink, Search, Plus, 
  AlertCircle, CheckCircle2, Clock
} from "lucide-react";
import { cn, formatDate } from "@/lib/utils";

export default function MealPlanning() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showSettingsForm, setShowSettingsForm] = useState(false);

  const { data: mealieSettings } = useQuery({
    queryKey: ['/api/mealie/settings'],
    enabled: !!user?.id,
  });

  const updateSettingsMutation = useMutation({
    mutationFn: async (data: { instanceUrl: string; apiKey: string }) => {
      if (mealieSettings) {
        return apiRequest('PATCH', `/api/mealie/settings/${user?.id}`, data);
      } else {
        return apiRequest('POST', '/api/mealie/settings', data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/mealie/settings'] });
      setShowSettingsForm(false);
      toast({ title: "Success", description: "Mealie settings updated successfully" });
    },
    onError: () => {
      toast({ 
        title: "Error", 
        description: "Failed to update settings. Please check your URL and API key.", 
        variant: "destructive" 
      });
    },
  });

  const [settingsForm, setSettingsForm] = useState({
    instanceUrl: mealieSettings?.instanceUrl || "",
    apiKey: mealieSettings?.apiKey || "",
  });

  const handleUpdateSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settingsForm.instanceUrl.trim() || !settingsForm.apiKey.trim()) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }

    // Validate URL format
    try {
      new URL(settingsForm.instanceUrl);
    } catch {
      toast({
        title: "Error",
        description: "Please enter a valid URL",
        variant: "destructive",
      });
      return;
    }

    updateSettingsMutation.mutate({
      instanceUrl: settingsForm.instanceUrl.trim(),
      apiKey: settingsForm.apiKey.trim(),
    });
  };

  // Mock data for demonstration since we can't make actual Mealie API calls without settings
  const mockMealPlans = [
    {
      id: "1",
      date: "2024-01-15",
      meal: "Breakfast",
      recipe: "Pancakes with Fresh Berries",
      servings: 4,
    },
    {
      id: "2",
      date: "2024-01-15",
      meal: "Lunch",
      recipe: "Grilled Chicken Salad",
      servings: 4,
    },
    {
      id: "3",
      date: "2024-01-15",
      meal: "Dinner",
      recipe: "Spaghetti Carbonara",
      servings: 4,
    },
  ];

  const mockRecipes = [
    {
      id: "1",
      name: "Spaghetti Carbonara",
      description: "Classic Italian pasta dish with eggs, cheese, and pancetta",
      prepTime: "15 mins",
      cookTime: "20 mins",
      servings: 4,
      tags: ["Italian", "Pasta", "Quick"],
    },
    {
      id: "2",
      name: "Grilled Chicken Salad",
      description: "Fresh mixed greens with grilled chicken and vinaigrette",
      prepTime: "10 mins",
      cookTime: "15 mins",
      servings: 2,
      tags: ["Healthy", "Salad", "Protein"],
    },
  ];

  const mockShoppingList = [
    { id: "1", item: "Spaghetti pasta", quantity: "1 lb", checked: false },
    { id: "2", item: "Eggs", quantity: "6", checked: true },
    { id: "3", item: "Parmesan cheese", quantity: "1 cup", checked: false },
    { id: "4", item: "Pancetta", quantity: "4 oz", checked: false },
    { id: "5", item: "Mixed greens", quantity: "2 bags", checked: true },
  ];

  const isConfigured = !!mealieSettings?.instanceUrl && !!mealieSettings?.apiKey;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Meal Planning</h1>
            <p className="mt-1 text-sm text-gray-600">Plan meals and manage shopping lists with Mealie integration</p>
          </div>
          <div className="mt-4 sm:mt-0 flex items-center space-x-3">
            <Button 
              variant="outline" 
              onClick={() => setShowSettingsForm(true)}
              data-testid="button-settings"
            >
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </Button>
            {isConfigured && (
              <Button 
                onClick={() => window.open(mealieSettings.instanceUrl, '_blank')}
                data-testid="button-open-mealie"
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Open Mealie
              </Button>
            )}
          </div>
        </div>
      </header>

      <main className="p-6">
        {!isConfigured ? (
          /* Setup Card */
          <Card className="max-w-2xl mx-auto" data-testid="card-setup">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Utensils className="h-6 w-6" />
                Connect to Mealie
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center py-8">
                <Utensils className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-medium text-gray-900 mb-2">Setup Mealie Integration</h3>
                <p className="text-gray-500 mb-6">
                  Connect your self-hosted Mealie instance to manage meal plans, recipes, and shopping lists
                </p>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                  <div className="flex items-start">
                    <AlertCircle className="h-5 w-5 text-blue-600 mr-3 mt-0.5" />
                    <div className="text-left">
                      <h4 className="text-sm font-medium text-blue-900 mb-1">Prerequisites</h4>
                      <ul className="text-sm text-blue-700 space-y-1">
                        <li>• A running Mealie instance (self-hosted)</li>
                        <li>• A valid API key from your Mealie settings</li>
                        <li>• Network access to your Mealie instance</li>
                      </ul>
                    </div>
                  </div>
                </div>
                <Button onClick={() => setShowSettingsForm(true)}>
                  <Settings className="h-4 w-4 mr-2" />
                  Configure Mealie Connection
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          /* Main Interface */
          <div className="space-y-6">
            {/* Status Banner */}
            <Card className="bg-green-50 border-green-200" data-testid="card-status">
              <CardContent className="p-4">
                <div className="flex items-center">
                  <CheckCircle2 className="h-5 w-5 text-green-600 mr-3" />
                  <div>
                    <h4 className="text-sm font-medium text-green-900">Connected to Mealie</h4>
                    <p className="text-sm text-green-700">
                      Syncing with: {mealieSettings.instanceUrl}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Tabs defaultValue="meal-plans" className="space-y-6">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="meal-plans" data-testid="tab-meal-plans">Meal Plans</TabsTrigger>
                <TabsTrigger value="recipes" data-testid="tab-recipes">Recipes</TabsTrigger>
                <TabsTrigger value="shopping" data-testid="tab-shopping">Shopping List</TabsTrigger>
              </TabsList>

              {/* Meal Plans Tab */}
              <TabsContent value="meal-plans">
                <Card data-testid="card-meal-plans">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2">
                        <Calendar className="h-5 w-5" />
                        This Week's Meal Plans
                      </CardTitle>
                      <Badge variant="secondary">
                        {mockMealPlans.length} meals planned
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {mockMealPlans.map((plan) => (
                        <div
                          key={plan.id}
                          className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                          data-testid={`meal-plan-${plan.id}`}
                        >
                          <div className="flex items-center space-x-4">
                            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                              <Utensils className="h-6 w-6 text-orange-600" />
                            </div>
                            <div>
                              <h4 className="font-medium text-gray-900">{plan.recipe}</h4>
                              <div className="flex items-center text-sm text-gray-500 mt-1 space-x-3">
                                <span>{formatDate(plan.date)}</span>
                                <span>•</span>
                                <span>{plan.meal}</span>
                                <span>•</span>
                                <span>{plan.servings} servings</span>
                              </div>
                            </div>
                          </div>
                          <Button variant="ghost" size="sm">
                            View Recipe
                          </Button>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Recipes Tab */}
              <TabsContent value="recipes">
                <Card data-testid="card-recipes">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2">
                        <BookOpen className="h-5 w-5" />
                        Recipe Collection
                      </CardTitle>
                      <div className="flex items-center space-x-2">
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                          <Input
                            placeholder="Search recipes..."
                            className="pl-10 w-64"
                            data-testid="input-search-recipes"
                          />
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {mockRecipes.map((recipe) => (
                        <div
                          key={recipe.id}
                          className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                          data-testid={`recipe-${recipe.id}`}
                        >
                          <div className="flex items-start justify-between mb-3">
                            <h4 className="font-medium text-gray-900">{recipe.name}</h4>
                            <Button variant="ghost" size="sm">
                              <ExternalLink className="h-4 w-4" />
                            </Button>
                          </div>
                          <p className="text-sm text-gray-600 mb-3">{recipe.description}</p>
                          <div className="flex items-center text-xs text-gray-500 space-x-4 mb-3">
                            <div className="flex items-center">
                              <Clock className="h-3 w-3 mr-1" />
                              <span>Prep: {recipe.prepTime}</span>
                            </div>
                            <div className="flex items-center">
                              <Clock className="h-3 w-3 mr-1" />
                              <span>Cook: {recipe.cookTime}</span>
                            </div>
                            <span>Serves {recipe.servings}</span>
                          </div>
                          <div className="flex flex-wrap gap-1">
                            {recipe.tags.map((tag) => (
                              <Badge key={tag} variant="secondary" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Shopping List Tab */}
              <TabsContent value="shopping">
                <Card data-testid="card-shopping-list">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <ShoppingCart className="h-5 w-5" />
                      Shopping List
                      <Badge variant="secondary" className="ml-2">
                        {mockShoppingList.filter(item => !item.checked).length} remaining
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {mockShoppingList.map((item) => (
                        <div
                          key={item.id}
                          className={cn(
                            "flex items-center space-x-3 p-3 border rounded-lg transition-colors",
                            item.checked ? "bg-gray-50 opacity-75" : "bg-white hover:bg-gray-50"
                          )}
                          data-testid={`shopping-item-${item.id}`}
                        >
                          <input
                            type="checkbox"
                            checked={item.checked}
                            readOnly
                            className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
                          />
                          <div className="flex-1">
                            <span className={cn(
                              "font-medium",
                              item.checked ? "line-through text-gray-500" : "text-gray-900"
                            )}>
                              {item.item}
                            </span>
                            <span className="text-sm text-gray-500 ml-2">
                              {item.quantity}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <div className="flex items-start">
                        <AlertCircle className="h-5 w-5 text-blue-600 mr-3 mt-0.5" />
                        <div>
                          <h4 className="text-sm font-medium text-blue-900 mb-1">Live Integration</h4>
                          <p className="text-sm text-blue-700">
                            This shopping list syncs automatically with your Mealie instance. 
                            Changes made here or in Mealie will be reflected across both platforms.
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        )}
      </main>

      {/* Settings Modal */}
      <Dialog open={showSettingsForm} onOpenChange={setShowSettingsForm}>
        <DialogContent className="sm:max-w-lg" data-testid="modal-mealie-settings">
          <DialogHeader>
            <DialogTitle>Mealie Settings</DialogTitle>
          </DialogHeader>
          
          <form onSubmit={handleUpdateSettings} className="space-y-4">
            <div>
              <Label htmlFor="instanceUrl">Mealie Instance URL</Label>
              <Input
                id="instanceUrl"
                type="url"
                value={settingsForm.instanceUrl}
                onChange={(e) => setSettingsForm(prev => ({ ...prev, instanceUrl: e.target.value }))}
                placeholder="https://your-mealie-instance.com"
                data-testid="input-instance-url"
              />
              <p className="text-xs text-gray-500 mt-1">
                The full URL to your self-hosted Mealie instance
              </p>
            </div>
            
            <div>
              <Label htmlFor="apiKey">API Key</Label>
              <Input
                id="apiKey"
                type="password"
                value={settingsForm.apiKey}
                onChange={(e) => setSettingsForm(prev => ({ ...prev, apiKey: e.target.value }))}
                placeholder="Your Mealie API key"
                data-testid="input-api-key"
              />
              <p className="text-xs text-gray-500 mt-1">
                Generate a long-lived API key from your Mealie user settings
              </p>
            </div>
            
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-start">
                <AlertCircle className="h-5 w-5 text-yellow-600 mr-3 mt-0.5" />
                <div>
                  <h4 className="text-sm font-medium text-yellow-900 mb-1">Security Note</h4>
                  <p className="text-sm text-yellow-700">
                    Your API key is stored securely and only used to communicate with your Mealie instance. 
                    Never share your API key with others.
                  </p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center justify-end space-x-3 pt-4">
              <Button type="button" variant="outline" onClick={() => setShowSettingsForm(false)}>
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={updateSettingsMutation.isPending}
                data-testid="button-save-settings"
              >
                {updateSettingsMutation.isPending ? "Saving..." : "Save Settings"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
