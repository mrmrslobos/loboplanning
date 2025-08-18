import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

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
    // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are a shopping assistant that categorizes grocery and household items. Given an item name, return the most appropriate category from this list: ${shoppingCategories.join(", ")}. 

Examples:
- "bananas" → "Produce"
- "dishwashing liquid" → "Household & Cleaning"
- "chicken breast" → "Meat & Seafood"
- "milk" → "Dairy & Eggs"
- "bread" → "Bakery"
- "frozen peas" → "Frozen Foods"

Respond with only the category name, nothing else.`
        },
        {
          role: "user",
          content: itemName
        }
      ],
      max_tokens: 20,
      temperature: 0.1
    });

    const category = response.choices[0].message.content?.trim();
    
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
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are a shopping assistant that categorizes grocery and household items. Given a list of item names, return a JSON object mapping each item to its most appropriate category from this list: ${shoppingCategories.join(", ")}.

Respond with JSON in this exact format: {"item1": "category", "item2": "category"}`
        },
        {
          role: "user",
          content: `Categorize these items: ${itemNames.join(", ")}`
        }
      ],
      response_format: { type: "json_object" },
      max_tokens: 200,
      temperature: 0.1
    });

    const result = JSON.parse(response.choices[0].message.content || "{}");
    
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