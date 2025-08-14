import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format, startOfWeek, addDays, addWeeks, subWeeks } from "date-fns";
import { 
  Plus, ChefHat, Calendar, Clock, Users, BookOpen, Star, 
  ChevronLeft, ChevronRight, Save, Copy, Trash2, Edit3
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import MealieImportDialog from "@/components/MealieImportDialog";

interface Recipe {
  id: string;
  name: string;
  description?: string;
  prepTime?: number;
  cookTime?: number;
  servings?: number;
  difficulty?: 'easy' | 'medium' | 'hard';
  cuisine?: string;
  ingredients?: string[];
  instructions?: string[];
  imageUrl?: string;
  tags?: string[];
  source?: 'mealie' | 'custom';
  userId: string;
  familyId?: string;
  createdAt: Date;
}

interface MealPlan {
  id: string;
  name: string;
  weekStartDate: string;
  meals: {
    [day: string]: {
      breakfast?: { type: 'recipe' | 'custom'; recipeId?: string; customName?: string; };
      lunch?: { type: 'recipe' | 'custom'; recipeId?: string; customName?: string; };
      dinner?: { type: 'recipe' | 'custom'; recipeId?: string; customName?: string; };
    };
  };
  userId: string;
  familyId?: string;
  createdAt: Date;
}

const daysOfWeek = [
  'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'
];

const mealTypes = ['breakfast', 'lunch', 'dinner'] as const;

const recipeSchema = z.object({
  name: z.string().min(1, "Recipe name is required"),
  description: z.string().optional(),
  prepTime: z.number().positive().optional(),
  cookTime: z.number().positive().optional(),
  servings: z.number().positive().optional(),
  difficulty: z.enum(['easy', 'medium', 'hard']).optional(),
  cuisine: z.string().optional(),
  ingredients: z.array(z.string()).optional(),
  instructions: z.array(z.string()).optional(),
  tags: z.array(z.string()).optional(),
  familyId: z.string().optional(),
});

const mealPlanSchema = z.object({
  name: z.string().min(1, "Meal plan name is required"),
  familyId: z.string().optional(),
});

type RecipeForm = z.infer<typeof recipeSchema>;
type MealPlanForm = z.infer<typeof mealPlanSchema>;

export default function MealPlanning() {
  const [currentWeek, setCurrentWeek] = useState(() => startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [isRecipeDialogOpen, setIsRecipeDialogOpen] = useState(false);
  const [isMealPlanDialogOpen, setIsMealPlanDialogOpen] = useState(false);
  const [isMealSelectionOpen, setIsMealSelectionOpen] = useState(false);
  const [selectedMealSlot, setSelectedMealSlot] = useState<{ day: string; mealType: string } | null>(null);
  const [currentMealPlan, setCurrentMealPlan] = useState<MealPlan | null>(null);
  const [draggedRecipe, setDraggedRecipe] = useState<Recipe | null>(null);
  const [customMealText, setCustomMealText] = useState("");

  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const recipeForm = useForm<RecipeForm>({
    resolver: zodResolver(recipeSchema),
    defaultValues: {
      name: "",
      description: "",
      prepTime: undefined,
      cookTime: undefined,
      servings: undefined,
      difficulty: undefined,
      cuisine: "",
      ingredients: [],
      instructions: [],
      tags: [],
      familyId: user?.familyId || undefined,
    },
  });

  const mealPlanForm = useForm<MealPlanForm>({
    resolver: zodResolver(mealPlanSchema),
    defaultValues: {
      name: "",
      familyId: user?.familyId || undefined,
    },
  });

  // Fetch recipes
  const { data: recipes = [] } = useQuery<Recipe[]>({
    queryKey: ['/api/recipes'],
    enabled: !!user,
  });

  // Fetch meal plans
  const { data: mealPlans = [] } = useQuery<MealPlan[]>({
    queryKey: ['/api/meal-plans'],
    enabled: !!user,
  });

  // Create recipe mutation
  const createRecipeMutation = useMutation({
    mutationFn: async (data: RecipeForm) => {
      return await apiRequest("POST", "/api/recipes", {
        ...data,
        source: 'custom',
        userId: user?.id,
        familyId: data.familyId || null,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/recipes'] });
      setIsRecipeDialogOpen(false);
      recipeForm.reset();
      toast({ title: "Success", description: "Recipe created successfully" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  // Create/update meal plan mutation
  const saveMealPlanMutation = useMutation({
    mutationFn: async (data: { name: string; meals: any }) => {
      const weekStartDate = format(currentWeek, 'yyyy-MM-dd');
      const method = currentMealPlan ? 'PUT' : 'POST';
      return await apiRequest(method, '/api/meal-plans', {
        ...data,
        weekStartDate,
        userId: user?.id,
        familyId: user?.familyId || null,
        id: currentMealPlan?.id,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/meal-plans'] });
      toast({ title: "Success", description: "Meal plan saved successfully" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  // Get current week's meal plan
  const weekMealPlan = useMemo(() => {
    const weekStartDate = format(currentWeek, 'yyyy-MM-dd');
    return mealPlans.find(plan => plan.weekStartDate === weekStartDate) || null;
  }, [mealPlans, currentWeek]);

  // Initialize current meal plan
  useMemo(() => {
    if (weekMealPlan && !currentMealPlan) {
      setCurrentMealPlan(weekMealPlan);
    } else if (!weekMealPlan && currentMealPlan) {
      setCurrentMealPlan(null);
    }
  }, [weekMealPlan, currentMealPlan]);

  const onSubmitRecipe = (data: RecipeForm) => {
    createRecipeMutation.mutate(data);
  };

  const handleMealSelection = (recipe: Recipe | null, customName?: string) => {
    if (!selectedMealSlot) return;

    const newMealPlan = currentMealPlan || {
      id: '',
      name: `Week of ${format(currentWeek, 'MMM dd, yyyy')}`,
      weekStartDate: format(currentWeek, 'yyyy-MM-dd'),
      meals: {},
      userId: user?.id || '',
      familyId: user?.familyId,
      createdAt: new Date(),
    };

    const updatedMeals = { ...newMealPlan.meals };
    if (!updatedMeals[selectedMealSlot.day]) {
      updatedMeals[selectedMealSlot.day] = {};
    }

    if (recipe) {
      updatedMeals[selectedMealSlot.day][selectedMealSlot.mealType as keyof typeof updatedMeals[string]] = {
        type: 'recipe',
        recipeId: recipe.id,
      };
    } else if (customName) {
      updatedMeals[selectedMealSlot.day][selectedMealSlot.mealType as keyof typeof updatedMeals[string]] = {
        type: 'custom',
        customName,
      };
    }

    const updatedMealPlan = { ...newMealPlan, meals: updatedMeals };
    setCurrentMealPlan(updatedMealPlan);
    setIsMealSelectionOpen(false);
    setSelectedMealSlot(null);
    setCustomMealText("");
  };

  const handleDragStart = (recipe: Recipe) => {
    setDraggedRecipe(recipe);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, day: string, mealType: string) => {
    e.preventDefault();
    if (!draggedRecipe) return;

    setSelectedMealSlot({ day, mealType });
    handleMealSelection(draggedRecipe);
    setDraggedRecipe(null);
  };

  const openMealSelection = (day: string, mealType: string) => {
    setSelectedMealSlot({ day, mealType });
    setIsMealSelectionOpen(true);
  };

  const removeMeal = (day: string, mealType: string) => {
    if (!currentMealPlan) return;

    const updatedMeals = { ...currentMealPlan.meals };
    if (updatedMeals[day]) {
      delete updatedMeals[day][mealType as keyof typeof updatedMeals[string]];
      if (Object.keys(updatedMeals[day]).length === 0) {
        delete updatedMeals[day];
      }
    }

    setCurrentMealPlan({ ...currentMealPlan, meals: updatedMeals });
  };

  const saveMealPlan = () => {
    if (!currentMealPlan) return;
    saveMealPlanMutation.mutate({
      name: currentMealPlan.name,
      meals: currentMealPlan.meals,
    });
  };

  const getMealDisplay = (day: string, mealType: string) => {
    const meal = currentMealPlan?.meals[day]?.[mealType as keyof typeof currentMealPlan.meals[string]];
    if (!meal) return null;

    if (meal.type === 'recipe' && meal.recipeId) {
      const recipe = recipes.find(r => r.id === meal.recipeId);
      return recipe ? { name: recipe.name, type: 'recipe', recipe } : null;
    }

    if (meal.type === 'custom' && meal.customName) {
      return { name: meal.customName, type: 'custom' };
    }

    return null;
  };

  const getWeekDays = () => {
    return Array.from({ length: 7 }, (_, i) => addDays(currentWeek, i));
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Meal Planning</h1>
        <div className="flex gap-2">
          <Dialog open={isRecipeDialogOpen} onOpenChange={setIsRecipeDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" data-testid="button-new-recipe">
                <ChefHat className="w-4 h-4 mr-2" />
                New Recipe
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create New Recipe</DialogTitle>
              </DialogHeader>
              <Form {...recipeForm}>
                <form onSubmit={recipeForm.handleSubmit(onSubmitRecipe)} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={recipeForm.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Recipe Name</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="Enter recipe name" 
                              {...field} 
                              data-testid="input-recipe-name"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={recipeForm.control}
                      name="cuisine"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Cuisine</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="e.g., Italian, Mexican" 
                              {...field} 
                              data-testid="input-recipe-cuisine"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <FormField
                    control={recipeForm.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Brief description of the recipe" 
                            {...field} 
                            data-testid="input-recipe-description"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="grid grid-cols-3 gap-4">
                    <FormField
                      control={recipeForm.control}
                      name="prepTime"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Prep Time (min)</FormLabel>
                          <FormControl>
                            <Input 
                              type="number"
                              placeholder="30"
                              {...field}
                              onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                              data-testid="input-recipe-prep-time"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={recipeForm.control}
                      name="cookTime"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Cook Time (min)</FormLabel>
                          <FormControl>
                            <Input 
                              type="number"
                              placeholder="45"
                              {...field}
                              onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                              data-testid="input-recipe-cook-time"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={recipeForm.control}
                      name="servings"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Servings</FormLabel>
                          <FormControl>
                            <Input 
                              type="number"
                              placeholder="4"
                              {...field}
                              onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                              data-testid="input-recipe-servings"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <FormField
                    control={recipeForm.control}
                    name="difficulty"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Difficulty</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-recipe-difficulty">
                              <SelectValue placeholder="Select difficulty" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="easy">Easy</SelectItem>
                            <SelectItem value="medium">Medium</SelectItem>
                            <SelectItem value="hard">Hard</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="flex gap-2 pt-4">
                    <Button 
                      type="submit" 
                      disabled={createRecipeMutation.isPending}
                      data-testid="button-save-recipe"
                    >
                      {createRecipeMutation.isPending ? "Creating..." : "Create Recipe"}
                    </Button>
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => setIsRecipeDialogOpen(false)}
                      data-testid="button-cancel-recipe"
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
          
          <Button onClick={saveMealPlan} disabled={!currentMealPlan || saveMealPlanMutation.isPending} data-testid="button-save-meal-plan">
            <Save className="w-4 h-4 mr-2" />
            {saveMealPlanMutation.isPending ? "Saving..." : "Save Meal Plan"}
          </Button>
        </div>
      </div>

      <Tabs defaultValue="weekly-planner" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="weekly-planner" data-testid="tab-weekly-planner">Weekly Planner</TabsTrigger>
          <TabsTrigger value="recipes" data-testid="tab-recipes">Recipes</TabsTrigger>
          <TabsTrigger value="meal-plans" data-testid="tab-meal-plans">Saved Plans</TabsTrigger>
        </TabsList>

        <TabsContent value="weekly-planner" className="space-y-6">
          {/* Week Navigation */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  Week of {format(currentWeek, 'MMM dd, yyyy')}
                </CardTitle>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setCurrentWeek(subWeeks(currentWeek, 1))}
                    data-testid="button-prev-week"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setCurrentWeek(startOfWeek(new Date(), { weekStartsOn: 1 }))}
                    data-testid="button-current-week"
                  >
                    Today
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setCurrentWeek(addWeeks(currentWeek, 1))}
                    data-testid="button-next-week"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {/* Meal Planning Grid */}
              <div className="grid grid-cols-8 gap-2">
                {/* Header Row */}
                <div className="font-medium text-center p-2">Meal</div>
                {getWeekDays().map(day => (
                  <div key={day.toISOString()} className="font-medium text-center p-2">
                    <div>{format(day, 'EEE')}</div>
                    <div className="text-sm text-gray-500">{format(day, 'MMM dd')}</div>
                  </div>
                ))}
                
                {/* Meal Rows */}
                {mealTypes.map(mealType => (
                  <div key={mealType} className="contents">
                    <div className="font-medium p-2 bg-gray-50 rounded-l-lg flex items-center">
                      {mealType.charAt(0).toUpperCase() + mealType.slice(1)}
                    </div>
                    {getWeekDays().map(day => {
                      const dayKey = format(day, 'yyyy-MM-dd');
                      const meal = getMealDisplay(dayKey, mealType);
                      
                      return (
                        <div 
                          key={`${dayKey}-${mealType}`}
                          className="min-h-[80px] border-2 border-dashed border-gray-200 rounded-lg p-2 hover:border-gray-300 transition-colors"
                          onDragOver={handleDragOver}
                          onDrop={(e) => handleDrop(e, dayKey, mealType)}
                          data-testid={`meal-slot-${dayKey}-${mealType}`}
                        >
                          {meal ? (
                            <div className="bg-white border rounded p-2 h-full flex flex-col justify-between">
                              <div>
                                <div className="font-medium text-sm truncate">{meal.name}</div>
                                <Badge variant="outline" className="text-xs mt-1">
                                  {meal.type === 'recipe' ? 'Recipe' : 'Custom'}
                                </Badge>
                              </div>
                              <div className="flex gap-1 mt-2">
                                <Button 
                                  size="sm" 
                                  variant="ghost" 
                                  className="h-6 w-6 p-0"
                                  onClick={() => openMealSelection(dayKey, mealType)}
                                  data-testid={`button-edit-meal-${dayKey}-${mealType}`}
                                >
                                  <Edit3 className="w-3 h-3" />
                                </Button>
                                <Button 
                                  size="sm" 
                                  variant="ghost" 
                                  className="h-6 w-6 p-0"
                                  onClick={() => removeMeal(dayKey, mealType)}
                                  data-testid={`button-remove-meal-${dayKey}-${mealType}`}
                                >
                                  <Trash2 className="w-3 h-3" />
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <div 
                              className="h-full flex items-center justify-center text-gray-400 cursor-pointer hover:text-gray-600"
                              onClick={() => openMealSelection(dayKey, mealType)}
                            >
                              <Plus className="w-6 h-6" />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="recipes" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Recipe Collection</CardTitle>
                <div className="flex gap-2">
                  <MealieImportDialog />
                  <Button onClick={() => setIsRecipeDialogOpen(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Recipe
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {recipes.map(recipe => (
                  <div 
                    key={recipe.id}
                    className="border rounded-lg p-4 cursor-move hover:shadow-md transition-shadow"
                    draggable
                    onDragStart={() => handleDragStart(recipe)}
                    data-testid={`recipe-card-${recipe.id}`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-medium truncate">{recipe.name}</h3>
                      <Badge variant={recipe.source === 'mealie' ? 'default' : 'secondary'}>
                        {recipe.source}
                      </Badge>
                    </div>
                    
                    {recipe.description && (
                      <p className="text-sm text-gray-600 mb-2 line-clamp-2">{recipe.description}</p>
                    )}
                    
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      {recipe.prepTime && (
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          <span>{recipe.prepTime}m prep</span>
                        </div>
                      )}
                      {recipe.servings && (
                        <div className="flex items-center gap-1">
                          <Users className="w-3 h-3" />
                          <span>{recipe.servings} servings</span>
                        </div>
                      )}
                    </div>
                    
                    {recipe.difficulty && (
                      <div className="mt-2">
                        <Badge 
                          variant={
                            recipe.difficulty === 'easy' ? 'default' : 
                            recipe.difficulty === 'medium' ? 'secondary' : 'destructive'
                          }
                          className="text-xs"
                        >
                          {recipe.difficulty}
                        </Badge>
                      </div>
                    )}
                  </div>
                ))}
                
                {recipes.length === 0 && (
                  <div className="col-span-3 text-center py-12">
                    <ChefHat className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No recipes yet</h3>
                    <p className="text-gray-600 mb-4">Create your first recipe or import from Mealie</p>
                    <Button onClick={() => setIsRecipeDialogOpen(true)}>
                      <Plus className="w-4 h-4 mr-2" />
                      Add Recipe
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="meal-plans" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Saved Meal Plans</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {mealPlans.map(plan => (
                  <div key={plan.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-medium">{plan.name}</h3>
                      <Badge variant="outline">
                        {format(new Date(plan.weekStartDate), 'MMM dd')}
                      </Badge>
                    </div>
                    
                    <div className="text-sm text-gray-600 mb-3">
                      Week of {format(new Date(plan.weekStartDate), 'MMM dd, yyyy')}
                    </div>
                    
                    <div className="flex gap-2">
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => {
                          setCurrentWeek(new Date(plan.weekStartDate));
                          setCurrentMealPlan(plan);
                        }}
                        data-testid={`button-load-plan-${plan.id}`}
                      >
                        <Copy className="w-3 h-3 mr-1" />
                        Load
                      </Button>
                    </div>
                  </div>
                ))}
                
                {mealPlans.length === 0 && (
                  <div className="col-span-3 text-center py-12">
                    <BookOpen className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No saved meal plans</h3>
                    <p className="text-gray-600">Create your first meal plan in the weekly planner</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Meal Selection Dialog */}
      <Dialog open={isMealSelectionOpen} onOpenChange={setIsMealSelectionOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>
              Select Meal for {selectedMealSlot?.day} {selectedMealSlot?.mealType}
            </DialogTitle>
          </DialogHeader>
          
          <Tabs defaultValue="recipes" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="recipes">Choose Recipe</TabsTrigger>
              <TabsTrigger value="custom">Custom Meal</TabsTrigger>
            </TabsList>
            
            <TabsContent value="recipes" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-96 overflow-y-auto">
                {recipes.map(recipe => (
                  <div 
                    key={recipe.id}
                    className="border rounded p-3 cursor-pointer hover:bg-gray-50 transition-colors"
                    onClick={() => handleMealSelection(recipe)}
                    data-testid={`select-recipe-${recipe.id}`}
                  >
                    <div className="font-medium text-sm">{recipe.name}</div>
                    {recipe.cuisine && (
                      <div className="text-xs text-gray-500">{recipe.cuisine}</div>
                    )}
                    <div className="flex items-center gap-2 mt-1">
                      {recipe.prepTime && (
                        <span className="text-xs text-gray-500">{recipe.prepTime}m</span>
                      )}
                      {recipe.difficulty && (
                        <Badge variant="outline" className="text-xs">
                          {recipe.difficulty}
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>
            
            <TabsContent value="custom" className="space-y-4">
              <div className="space-y-4">
                <Input 
                  placeholder="Enter custom meal name"
                  value={customMealText}
                  onChange={(e) => setCustomMealText(e.target.value)}
                  data-testid="input-custom-meal"
                />
                <Button 
                  onClick={() => handleMealSelection(null, customMealText)}
                  disabled={!customMealText.trim()}
                  data-testid="button-save-custom-meal"
                >
                  Add Custom Meal
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>
    </div>
  );
}