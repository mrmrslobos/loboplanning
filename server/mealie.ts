import { Recipe, InsertRecipe } from "@shared/schema";

export interface MealieRecipe {
  id: string;
  name: string;
  description?: string;
  prepTime?: string;
  cookTime?: string;
  totalTime?: string;
  recipeYield?: string;
  recipeIngredient?: string[];
  recipeInstructions?: Array<{
    text: string;
  }>;
  nutrition?: {
    servingSize?: string;
  };
  tags?: Array<{
    name: string;
  }>;
  recipeCategory?: Array<{
    name: string;
  }>;
  recipeCuisine?: Array<{
    name: string;
  }>;
  image?: string;
  rating?: number;
  difficulty?: number;
}

export interface MealieApiClient {
  baseUrl: string;
  apiKey: string;
}

export class MealieService {
  private client: MealieApiClient;

  constructor(baseUrl: string, apiKey: string) {
    this.client = {
      baseUrl: baseUrl.replace(/\/$/, ''), // Remove trailing slash
      apiKey
    };
  }

  private async makeRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.client.baseUrl}/api${endpoint}`;
    
    const response = await fetch(url, {
      ...options,
      headers: {
        'Authorization': `Bearer ${this.client.apiKey}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Mealie API error (${response.status}): ${errorText}`);
    }

    return response.json();
  }

  async testConnection(): Promise<boolean> {
    try {
      await this.makeRequest('/users/self');
      return true;
    } catch (error) {
      console.error('Mealie connection test failed:', error);
      return false;
    }
  }

  async getRecipes(page = 1, perPage = 50): Promise<{ items: MealieRecipe[]; total: number }> {
    const params = new URLSearchParams({
      page: page.toString(),
      perPage: perPage.toString(),
    });

    return this.makeRequest(`/recipes?${params}`);
  }

  async getRecipe(id: string): Promise<MealieRecipe> {
    return this.makeRequest(`/recipes/${id}`);
  }

  async searchRecipes(query: string): Promise<{ items: MealieRecipe[]; total: number }> {
    const params = new URLSearchParams({
      search: query,
    });

    return this.makeRequest(`/recipes?${params}`);
  }

  async getRecipesByTag(tag: string): Promise<{ items: MealieRecipe[]; total: number }> {
    const params = new URLSearchParams({
      tags: tag,
    });

    return this.makeRequest(`/recipes?${params}`);
  }

  async getRecipeImage(recipeId: string): Promise<string | null> {
    try {
      const response = await fetch(`${this.client.baseUrl}/api/media/recipes/${recipeId}/images/min-original.webp`, {
        headers: {
          'Authorization': `Bearer ${this.client.apiKey}`,
        },
      });

      if (response.ok) {
        return `${this.client.baseUrl}/api/media/recipes/${recipeId}/images/min-original.webp`;
      }
      return null;
    } catch {
      return null;
    }
  }

  // Convert Mealie recipe to our internal format
  convertMealieRecipe(mealieRecipe: MealieRecipe, userId: string, familyId?: string): InsertRecipe {
    const prepTime = this.parseTimeString(mealieRecipe.prepTime);
    const cookTime = this.parseTimeString(mealieRecipe.cookTime);
    
    // Extract servings from recipeYield
    const servings = mealieRecipe.recipeYield ? 
      parseInt(mealieRecipe.recipeYield.replace(/[^\d]/g, '')) || undefined : 
      undefined;

    // Get cuisine from recipeCuisine array
    const cuisine = mealieRecipe.recipeCuisine?.[0]?.name;

    // Convert difficulty (Mealie uses 1-5 scale, we use easy/medium/hard)
    let difficulty: 'easy' | 'medium' | 'hard' | undefined;
    if (mealieRecipe.difficulty) {
      if (mealieRecipe.difficulty <= 2) difficulty = 'easy';
      else if (mealieRecipe.difficulty <= 4) difficulty = 'medium';
      else difficulty = 'hard';
    }

    // Extract instructions
    const instructions = mealieRecipe.recipeInstructions?.map(instruction => 
      instruction.text
    ) || [];

    // Extract tag names
    const tags = mealieRecipe.tags?.map(tag => tag.name) || [];

    return {
      name: mealieRecipe.name,
      description: mealieRecipe.description,
      prepTime,
      cookTime,
      servings,
      difficulty,
      cuisine,
      ingredients: mealieRecipe.recipeIngredient || [],
      instructions,
      imageUrl: mealieRecipe.image ? `${this.client.baseUrl}${mealieRecipe.image}` : undefined,
      tags,
      source: 'mealie',
      mealieId: mealieRecipe.id,
      userId,
      familyId: familyId || null,
    };
  }

  // Parse time strings like "PT30M" or "30 minutes" to minutes
  private parseTimeString(timeStr?: string): number | undefined {
    if (!timeStr) return undefined;

    // Handle ISO 8601 duration format (PT30M, PT1H30M)
    const isoDurationMatch = timeStr.match(/PT(?:(\d+)H)?(?:(\d+)M)?/);
    if (isoDurationMatch) {
      const hours = parseInt(isoDurationMatch[1] || '0');
      const minutes = parseInt(isoDurationMatch[2] || '0');
      return hours * 60 + minutes;
    }

    // Handle simple number formats
    const numberMatch = timeStr.match(/(\d+)/);
    if (numberMatch) {
      const number = parseInt(numberMatch[1]);
      // Assume minutes if no unit specified and reasonable range
      if (number <= 480) { // 8 hours max
        return number;
      }
    }

    return undefined;
  }
}