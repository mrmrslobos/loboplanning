import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { 
  Download, Search, Settings, RefreshCw, 
  CheckCircle, XCircle, ExternalLink, Clock, Users
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";

interface MealieRecipe {
  id: string;
  name: string;
  description?: string;
  prepTime?: string;
  cookTime?: string;
  recipeYield?: string;
  tags?: Array<{ name: string }>;
  recipeCuisine?: Array<{ name: string }>;
  difficulty?: number;
  image?: string;
}

interface MealieSettings {
  id: string;
  instanceUrl: string;
  apiKey: string;
  isActive: boolean;
  lastSync?: string;
}

const settingsSchema = z.object({
  instanceUrl: z.string().url("Please enter a valid URL"),
  apiKey: z.string().min(1, "API key is required"),
});

type SettingsForm = z.infer<typeof settingsSchema>;

export default function MealieImportDialog() {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'success' | 'error'>('idle');
  
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const settingsForm = useForm<SettingsForm>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      instanceUrl: "",
      apiKey: "",
    },
  });

  // Fetch Mealie settings
  const { data: mealieSettings } = useQuery<MealieSettings>({
    queryKey: ['/api/mealie/settings'],
    enabled: !!user && isOpen,
  });

  // Initialize form with existing settings
  useState(() => {
    if (mealieSettings) {
      settingsForm.reset({
        instanceUrl: mealieSettings.instanceUrl,
        apiKey: mealieSettings.apiKey,
      });
    }
  });

  // Fetch Mealie recipes
  const { data: mealieRecipes, isLoading: isLoadingRecipes, refetch: refetchRecipes } = useQuery<{
    items: MealieRecipe[];
    total: number;
  }>({
    queryKey: ['/api/mealie/recipes', searchQuery],
    enabled: !!mealieSettings && isOpen,
    retry: false,
  });

  // Test connection mutation
  const testConnectionMutation = useMutation({
    mutationFn: async (data: SettingsForm) => {
      const response = await apiRequest('POST', '/api/mealie/test-connection', data);
      return response.json();
    },
    onSuccess: (result) => {
      setConnectionStatus(result.connected ? 'success' : 'error');
      if (result.connected) {
        toast({ title: "Success", description: "Successfully connected to Mealie!" });
      } else {
        toast({ 
          title: "Connection Failed", 
          description: "Could not connect to Mealie. Please check your URL and API key.",
          variant: "destructive" 
        });
      }
    },
    onError: () => {
      setConnectionStatus('error');
      toast({ 
        title: "Connection Error", 
        description: "Failed to test connection. Please check your settings.",
        variant: "destructive" 
      });
    },
    onSettled: () => {
      setIsTestingConnection(false);
    },
  });

  // Save settings mutation
  const saveSettingsMutation = useMutation({
    mutationFn: async (data: SettingsForm) => {
      const method = mealieSettings ? 'PATCH' : 'POST';
      const url = mealieSettings 
        ? `/api/mealie/settings/${user?.id}` 
        : '/api/mealie/settings';
      
      const response = await apiRequest(method, url, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/mealie/settings'] });
      toast({ title: "Success", description: "Mealie settings saved successfully!" });
    },
    onError: (error: any) => {
      toast({ 
        title: "Error", 
        description: error.message,
        variant: "destructive" 
      });
    },
  });

  // Import recipe mutation
  const importRecipeMutation = useMutation({
    mutationFn: async (recipeId: string) => {
      const response = await apiRequest('POST', `/api/mealie/import-recipe/${recipeId}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/recipes'] });
      toast({ title: "Success", description: "Recipe imported successfully!" });
    },
    onError: (error: any) => {
      toast({ 
        title: "Import Error", 
        description: error.message,
        variant: "destructive" 
      });
    },
  });

  // Sync all recipes mutation
  const syncRecipesMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', '/api/mealie/sync-recipes');
      return response.json();
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['/api/recipes'] });
      toast({ 
        title: "Sync Complete", 
        description: `Imported ${result.imported} new recipes from Mealie!` 
      });
    },
    onError: (error: any) => {
      toast({ 
        title: "Sync Error", 
        description: error.message,
        variant: "destructive" 
      });
    },
  });

  const handleTestConnection = async () => {
    const isValid = await settingsForm.trigger();
    if (!isValid) return;

    setIsTestingConnection(true);
    setConnectionStatus('idle');
    const data = settingsForm.getValues();
    testConnectionMutation.mutate(data);
  };

  const handleSaveSettings = (data: SettingsForm) => {
    saveSettingsMutation.mutate(data);
  };

  const handleImportRecipe = (recipeId: string) => {
    importRecipeMutation.mutate(recipeId);
  };

  const handleSyncAllRecipes = () => {
    syncRecipesMutation.mutate();
  };

  const formatTime = (timeStr?: string) => {
    if (!timeStr) return null;
    
    // Handle ISO 8601 duration format
    const match = timeStr.match(/PT(?:(\d+)H)?(?:(\d+)M)?/);
    if (match) {
      const hours = parseInt(match[1] || '0');
      const minutes = parseInt(match[2] || '0');
      if (hours > 0) {
        return `${hours}h ${minutes}m`;
      }
      return `${minutes}m`;
    }
    
    return timeStr;
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" data-testid="button-mealie-import">
          <Download className="w-4 h-4 mr-2" />
          Import from Mealie
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Import Recipes from Mealie</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue={mealieSettings ? "recipes" : "settings"} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="settings" data-testid="tab-mealie-settings">Settings</TabsTrigger>
            <TabsTrigger value="recipes" disabled={!mealieSettings} data-testid="tab-mealie-recipes">
              Recipes
            </TabsTrigger>
          </TabsList>

          <TabsContent value="settings" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="w-5 h-5" />
                  Mealie Connection Settings
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Form {...settingsForm}>
                  <form onSubmit={settingsForm.handleSubmit(handleSaveSettings)} className="space-y-4">
                    <FormField
                      control={settingsForm.control}
                      name="instanceUrl"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Mealie Instance URL</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="https://mealie.example.com" 
                              {...field}
                              data-testid="input-mealie-url"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={settingsForm.control}
                      name="apiKey"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>API Key</FormLabel>
                          <FormControl>
                            <Input 
                              type="password" 
                              placeholder="Your Mealie API key" 
                              {...field}
                              data-testid="input-mealie-api-key"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="flex gap-2 pt-4">
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={handleTestConnection}
                        disabled={isTestingConnection}
                        data-testid="button-test-connection"
                      >
                        {isTestingConnection ? (
                          <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                        ) : connectionStatus === 'success' ? (
                          <CheckCircle className="w-4 h-4 mr-2 text-green-600" />
                        ) : connectionStatus === 'error' ? (
                          <XCircle className="w-4 h-4 mr-2 text-red-600" />
                        ) : (
                          <ExternalLink className="w-4 h-4 mr-2" />
                        )}
                        Test Connection
                      </Button>
                      
                      <Button 
                        type="submit" 
                        disabled={saveSettingsMutation.isPending}
                        data-testid="button-save-settings"
                      >
                        {saveSettingsMutation.isPending ? "Saving..." : "Save Settings"}
                      </Button>
                    </div>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="recipes" className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search Mealie recipes..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 w-64"
                    data-testid="input-search-mealie-recipes"
                  />
                </div>
                <Button 
                  variant="outline" 
                  onClick={() => refetchRecipes()}
                  disabled={isLoadingRecipes}
                  data-testid="button-refresh-recipes"
                >
                  <RefreshCw className={`w-4 h-4 ${isLoadingRecipes ? 'animate-spin' : ''}`} />
                </Button>
              </div>
              
              <Button 
                onClick={handleSyncAllRecipes}
                disabled={syncRecipesMutation.isPending}
                data-testid="button-sync-all-recipes"
              >
                {syncRecipesMutation.isPending ? (
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Download className="w-4 h-4 mr-2" />
                )}
                {syncRecipesMutation.isPending ? "Syncing..." : "Sync All Recipes"}
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-96 overflow-y-auto">
              {isLoadingRecipes ? (
                <div className="col-span-2 text-center py-8">
                  <RefreshCw className="w-8 h-8 mx-auto mb-2 animate-spin" />
                  <p>Loading recipes from Mealie...</p>
                </div>
              ) : mealieRecipes?.items.length ? (
                mealieRecipes.items.map((recipe) => (
                  <Card key={recipe.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="font-medium text-sm">{recipe.name}</h3>
                        <Button 
                          size="sm" 
                          onClick={() => handleImportRecipe(recipe.id)}
                          disabled={importRecipeMutation.isPending}
                          data-testid={`button-import-recipe-${recipe.id}`}
                        >
                          <Download className="w-3 h-3" />
                        </Button>
                      </div>
                      
                      {recipe.description && (
                        <p className="text-xs text-gray-600 mb-2 line-clamp-2">
                          {recipe.description}
                        </p>
                      )}
                      
                      <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
                        {recipe.prepTime && (
                          <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            <span>{formatTime(recipe.prepTime)}</span>
                          </div>
                        )}
                        {recipe.recipeYield && (
                          <div className="flex items-center gap-1">
                            <Users className="w-3 h-3" />
                            <span>{recipe.recipeYield}</span>
                          </div>
                        )}
                      </div>
                      
                      <div className="flex flex-wrap gap-1">
                        {recipe.tags?.slice(0, 3).map((tag) => (
                          <Badge key={tag.name} variant="secondary" className="text-xs">
                            {tag.name}
                          </Badge>
                        ))}
                        {recipe.recipeCuisine?.[0] && (
                          <Badge variant="outline" className="text-xs">
                            {recipe.recipeCuisine[0].name}
                          </Badge>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <div className="col-span-2 text-center py-8">
                  <p className="text-gray-500">No recipes found in Mealie</p>
                </div>
              )}
            </div>
            
            {mealieRecipes?.total && (
              <p className="text-sm text-gray-500 text-center">
                Showing {mealieRecipes.items.length} of {mealieRecipes.total} recipes
              </p>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}