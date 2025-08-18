import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

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

export async function categorizeItem(itemName: string): Promise<string> {
  try {
    const prompt = `You are a shopping assistant that categorizes grocery and household items. Given an item name, return the most appropriate category from this list: ${shoppingCategories.join(", ")}. 

Examples:
- "bananas" → "Produce"
- "dishwashing liquid" → "Household & Cleaning"
- "chicken breast" → "Meat & Seafood"
- "milk" → "Dairy & Eggs"
- "bread" → "Bakery"
- "frozen peas" → "Frozen Foods"

Respond with only the category name, nothing else.

Item: ${itemName}`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });

    const category = response.text?.trim();
    
    // Validate the response is a valid category
    if (category && shoppingCategories.includes(category)) {
      return category;
    }
    
    return "Other";
  } catch (error) {
    console.error("Error categorizing item:", error);
    return "Other";
  }
}

// Batch categorize multiple items for efficiency
export async function categorizeItems(itemNames: string[]): Promise<Record<string, string>> {
  try {
    const prompt = `You are a shopping assistant that categorizes grocery and household items. Given a list of item names, return a JSON object mapping each item to its most appropriate category from this list: ${shoppingCategories.join(", ")}.

Respond with JSON in this exact format: {"item1": "category", "item2": "category"}

Items to categorize: ${itemNames.join(", ")}`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-pro",
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: "object",
          additionalProperties: {
            type: "string"
          }
        },
      },
      contents: prompt,
    });

    const result = JSON.parse(response.text || "{}");
    
    // Validate and sanitize results
    const sanitized: Record<string, string> = {};
    for (const item of itemNames) {
      const category = result[item];
      sanitized[item] = shoppingCategories.includes(category) ? category : "Other";
    }
    
    return sanitized;
  } catch (error) {
    console.error("Error batch categorizing items:", error);
    // Return default categorization
    const result: Record<string, string> = {};
    itemNames.forEach(item => result[item] = "Other");
    return result;
  }
}