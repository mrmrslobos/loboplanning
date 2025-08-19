import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

interface DevotionalRequest {
  theme: 'marriage' | 'parenting' | 'family' | 'children' | 'relationships' | 'general';
  familySize?: number;
  childrenAges?: number[];
  marriageYears?: number;
  specificNeeds?: string[];
  previousTopics?: string[];
}

interface DailyDevotional {
  title: string;
  theme: string;
  bibleVerse: {
    text: string;
    reference: string;
    version: string;
  };
  reflection: string;
  practicalApplication: string;
  prayer: string;
  familyActivity?: string;
  discussion: {
    coupleQuestions?: string[];
    familyQuestions?: string[];
    parentingInsights?: string[];
  };
  encouragement: string;
  date: string;
  tags: string[];
}

interface WeeklyDevotionalPlan {
  weekTheme: string;
  devotionals: DailyDevotional[];
  weeklyGoal: string;
  familyChallenge: string;
  memorizeVerse: {
    text: string;
    reference: string;
  };
}

export async function generateDailyDevotional(request: DevotionalRequest): Promise<DailyDevotional> {
  try {
    const currentDate = new Date().toLocaleDateString();
    
    const contextPrompt = buildContextPrompt(request);
    
    const prompt = `You are a Christian devotional writer creating meaningful, practical daily devotionals for families. Generate a complete daily devotional with the following requirements:

${contextPrompt}

DEVOTIONAL REQUIREMENTS:
1. Include a relevant Bible verse (accurate text and reference)
2. Provide meaningful reflection on the verse
3. Give practical application for daily life
4. Include a heartfelt prayer
5. Suggest family activity when appropriate
6. Create discussion questions for couples/families
7. Offer encouragement and hope
8. Use contemporary, accessible language
9. Keep content authentic and spiritually grounding
10. Focus on building stronger relationships

DATE: ${currentDate}
BIBLE VERSION: Use ESV (English Standard Version) for accuracy

Generate a complete devotional that speaks to the heart while providing practical guidance for Christian family life.

IMPORTANT: Return a complete JSON object with ALL required fields:
{
  "title": "Devotional title",
  "theme": "Theme name",
  "bibleVerse": {
    "text": "Complete Bible verse text",
    "reference": "Book Chapter:Verse",
    "version": "ESV"
  },
  "reflection": "Meaningful reflection paragraph",
  "practicalApplication": "Practical application for daily life",
  "prayer": "Heartfelt prayer",
  "familyActivity": "Family activity suggestion",
  "discussion": {
    "coupleQuestions": ["Question 1", "Question 2"],
    "familyQuestions": ["Question 1", "Question 2"],
    "parentingInsights": ["Insight 1", "Insight 2"]
  },
  "encouragement": "Encouraging message",
  "tags": ["tag1", "tag2", "tag3"]
}

Ensure ALL fields are included with meaningful content.`;

    console.log("Generating devotional with prompt:", prompt.substring(0, 200) + "...");
    
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: "object",
          properties: {
            title: { type: "string" },
            theme: { type: "string" },
            bibleVerse: {
              type: "object",
              properties: {
                text: { type: "string" },
                reference: { type: "string" },
                version: { type: "string" }
              }
            },
            reflection: { type: "string" },
            practicalApplication: { type: "string" },
            prayer: { type: "string" },
            familyActivity: { type: "string" },
            discussion: {
              type: "object",
              properties: {
                coupleQuestions: { type: "array", items: { type: "string" } },
                familyQuestions: { type: "array", items: { type: "string" } },
                parentingInsights: { type: "array", items: { type: "string" } }
              }
            },
            encouragement: { type: "string" },
            tags: { type: "array", items: { type: "string" } }
          }
        }
      },
      contents: prompt,
    });

    console.log("Received response from Gemini:", response.text?.substring(0, 500));

    if (!response.text) {
      throw new Error("No response text from Gemini API");
    }

    let result;
    try {
      result = JSON.parse(response.text);
    } catch (parseError) {
      console.error("Failed to parse JSON response:", parseError);
      console.error("Raw response:", response.text);
      throw new Error("Invalid JSON response from AI");
    }
    
    console.log("Parsed result from Gemini:", JSON.stringify(result, null, 2));
    
    const devotionalResult = {
      title: result.title || "Daily Devotional",
      theme: request.theme,
      date: currentDate,
      bibleVerse: result.bibleVerse || {
        text: "For I know the plans I have for you, declares the Lord, plans for welfare and not for evil, to give you a future and a hope.",
        reference: "Jeremiah 29:11",
        version: "ESV"
      },
      reflection: result.reflection || "God's love sustains us through every challenge.",
      practicalApplication: result.practicalApplication || "Take time today to reflect on God's faithfulness in your life.",
      prayer: result.prayer || "Dear Lord, help us to trust in Your perfect plan for our lives. Amen.",
      familyActivity: result.familyActivity || "Share one thing you're grateful for as a family today.",
      discussion: result.discussion || {
        coupleQuestions: ["How can we support each other better today?"],
        familyQuestions: ["What is one blessing we can count today?"],
        parentingInsights: ["Children learn from our example of faith and perseverance."]
      },
      encouragement: result.encouragement || "God is with you in every season of life.",
      tags: result.tags || ["faith", "family", "hope"]
    };
    
    console.log("Final devotional result:", JSON.stringify(devotionalResult, null, 2));
    return devotionalResult;
  } catch (error: any) {
    console.error("=== DEVOTIONAL GENERATION ERROR ===");
    console.error("Error type:", error.constructor.name);
    console.error("Error message:", error.message);
    console.error("Error stack:", error.stack);
    console.error("=== END ERROR ===");
    throw error;
  }
}

export async function generateWeeklyDevotionalPlan(request: DevotionalRequest): Promise<WeeklyDevotionalPlan> {
  try {
    const contextPrompt = buildContextPrompt(request);
    
    const prompt = `Create a 7-day devotional plan with a cohesive weekly theme. Each day should build upon the previous while maintaining individual completeness.

${contextPrompt}

WEEKLY PLAN REQUIREMENTS:
1. Choose a unifying theme for the week
2. Generate 7 complete daily devotionals
3. Include a weekly goal for spiritual growth
4. Create a family challenge for the week
5. Select a memory verse for the week
6. Ensure each day connects to the weekly theme
7. Provide progressive spiritual development
8. Include varied Bible passages and books
9. Balance instruction with encouragement
10. Make it practical for busy families

Generate a complete weekly devotional plan that strengthens faith and family bonds.`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-pro",
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: "object",
          properties: {
            weekTheme: { type: "string" },
            devotionals: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  title: { type: "string" },
                  theme: { type: "string" },
                  bibleVerse: {
                    type: "object",
                    properties: {
                      text: { type: "string" },
                      reference: { type: "string" },
                      version: { type: "string" }
                    }
                  },
                  reflection: { type: "string" },
                  practicalApplication: { type: "string" },
                  prayer: { type: "string" },
                  familyActivity: { type: "string" },
                  discussion: {
                    type: "object",
                    properties: {
                      coupleQuestions: { type: "array", items: { type: "string" } },
                      familyQuestions: { type: "array", items: { type: "string" } },
                      parentingInsights: { type: "array", items: { type: "string" } }
                    }
                  },
                  encouragement: { type: "string" },
                  tags: { type: "array", items: { type: "string" } }
                }
              }
            },
            weeklyGoal: { type: "string" },
            familyChallenge: { type: "string" },
            memorizeVerse: {
              type: "object",
              properties: {
                text: { type: "string" },
                reference: { type: "string" }
              }
            }
          }
        }
      },
      contents: prompt,
    });

    const result = JSON.parse(response.text || "{}");
    
    // Add dates to each devotional
    const today = new Date();
    result.devotionals = result.devotionals?.map((devotional: any, index: number) => {
      const devotionalDate = new Date(today);
      devotionalDate.setDate(today.getDate() + index);
      return {
        ...devotional,
        date: devotionalDate.toLocaleDateString(),
        theme: request.theme
      };
    }) || [];

    return result;
  } catch (error) {
    console.error("Error generating weekly plan:", error);
    throw new Error("Failed to generate weekly devotional plan");
  }
}

export async function generateTopicalDevotional(topic: string, additionalContext?: string): Promise<DailyDevotional> {
  try {
    const currentDate = new Date().toLocaleDateString();
    
    const prompt = `Create a devotional focused specifically on: ${topic}

${additionalContext ? `Additional Context: ${additionalContext}` : ''}

REQUIREMENTS:
1. Find relevant Bible verses that speak to this topic
2. Provide deep, meaningful reflection
3. Offer practical steps for application
4. Include encouraging prayer
5. Suggest concrete family activities
6. Create discussion questions for growth
7. End with hope and encouragement
8. Use authentic, accessible language
9. Make it personally applicable
10. Ground everything in Biblical truth

DATE: ${currentDate}
Generate a devotional that meaningfully addresses this topic with spiritual depth and practical wisdom.`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-pro",
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: "object",
          properties: {
            title: { type: "string" },
            theme: { type: "string" },
            bibleVerse: {
              type: "object",
              properties: {
                text: { type: "string" },
                reference: { type: "string" },
                version: { type: "string" }
              }
            },
            reflection: { type: "string" },
            practicalApplication: { type: "string" },
            prayer: { type: "string" },
            familyActivity: { type: "string" },
            discussion: {
              type: "object",
              properties: {
                coupleQuestions: { type: "array", items: { type: "string" } },
                familyQuestions: { type: "array", items: { type: "string" } },
                parentingInsights: { type: "array", items: { type: "string" } }
              }
            },
            encouragement: { type: "string" },
            tags: { type: "array", items: { type: "string" } }
          }
        }
      },
      contents: prompt,
    });

    const result = JSON.parse(response.text || "{}");
    
    return {
      ...result,
      date: currentDate,
      theme: 'topical'
    };
  } catch (error) {
    console.error("Error generating topical devotional:", error);
    throw new Error("Failed to generate topical devotional");
  }
}

function buildContextPrompt(request: DevotionalRequest): string {
  let context = `FAMILY CONTEXT:
- Primary Theme: ${request.theme}
- Family Size: ${request.familySize || 'Not specified'}`;

  if (request.childrenAges && request.childrenAges.length > 0) {
    context += `\n- Children Ages: ${request.childrenAges.join(', ')}`;
  }

  if (request.marriageYears) {
    context += `\n- Years Married: ${request.marriageYears}`;
  }

  if (request.specificNeeds && request.specificNeeds.length > 0) {
    context += `\n- Specific Needs: ${request.specificNeeds.join(', ')}`;
  }

  if (request.previousTopics && request.previousTopics.length > 0) {
    context += `\n- Avoid Recent Topics: ${request.previousTopics.join(', ')}`;
  }

  // Add theme-specific guidance
  switch (request.theme) {
    case 'marriage':
      context += `\n\nFOCUS: Marriage strengthening, communication, love, commitment, conflict resolution, intimacy, partnership in faith.`;
      break;
    case 'parenting':
      context += `\n\nFOCUS: Biblical parenting, discipline with love, teaching faith, patience, wisdom in guidance, raising godly children.`;
      break;
    case 'family':
      context += `\n\nFOCUS: Family unity, traditions, creating loving home, serving together, building faith foundations.`;
      break;
    case 'children':
      context += `\n\nFOCUS: Age-appropriate spiritual lessons, character building, kindness, obedience, faith development.`;
      break;
    case 'relationships':
      context += `\n\nFOCUS: Healthy relationships, forgiveness, love in action, community, friendship, family bonds.`;
      break;
    default:
      context += `\n\nFOCUS: General Christian living, faith growth, practical spirituality, encouragement.`;
  }

  return context;
}

export async function generateDevotionalSuggestions(familyProfile: {
  theme?: string;
  recentChallenges?: string[];
  familySize?: number;
  childrenAges?: number[];
}): Promise<{
  suggestedThemes: string[];
  relevantTopics: string[];
  weeklyPlanIdeas: string[];
}> {
  try {
    const prompt = `Based on this family profile, suggest relevant devotional themes and topics:

FAMILY PROFILE:
- Preferred Theme: ${familyProfile.theme || 'Not specified'}
- Family Size: ${familyProfile.familySize || 'Not specified'}
- Children Ages: ${familyProfile.childrenAges?.join(', ') || 'Not specified'}
- Recent Challenges: ${familyProfile.recentChallenges?.join(', ') || 'None specified'}

Provide:
1. 5-7 suggested themes that would benefit this family
2. Specific relevant topics for devotionals
3. Ideas for weekly devotional plans
4. Consider family dynamics and needs

Make suggestions practical and spiritually meaningful.`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: "object",
          properties: {
            suggestedThemes: { type: "array", items: { type: "string" } },
            relevantTopics: { type: "array", items: { type: "string" } },
            weeklyPlanIdeas: { type: "array", items: { type: "string" } }
          }
        }
      },
      contents: prompt,
    });

    return JSON.parse(response.text || "{}");
  } catch (error) {
    console.error("Error generating devotional suggestions:", error);
    return {
      suggestedThemes: [],
      relevantTopics: [],
      weeklyPlanIdeas: []
    };
  }
}