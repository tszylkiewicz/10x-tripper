/**
 * AI Generation Service
 *
 * Service for generating trip plans using AI (OpenRouter API).
 * Currently uses mock data for testing. Will be replaced with real API calls in production.
 */

import type { GeneratePlanCommand, GeneratedTripPlanDto, PlanDetailsDto } from "../../types";

const OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions";
const MODEL = import.meta.env.OPENROUTER_MODEL || "anthropic/claude-3-sonnet-20240229";

/**
 * Builds AI prompt from the generation command
 *
 * @param command - The generation command with user inputs
 * @returns Formatted prompt string for the AI
 */
function buildPrompt(command: GeneratePlanCommand): string {
  const { destination, start_date, end_date, people_count, budget_type, notes } = command;

  const durationDays =
    Math.ceil((new Date(end_date).getTime() - new Date(start_date).getTime()) / (1000 * 60 * 60 * 24)) + 1;

  let prompt = `Generate a detailed trip plan with the following requirements:

Destination: ${destination}
Start Date: ${start_date}
End Date: ${end_date}
Duration: ${durationDays} days
Number of People: ${people_count}
Budget Type: ${budget_type}
`;

  if (notes) {
    prompt += `\nUser Preferences:`;
    if (notes.transport) prompt += `\n- Transport: ${notes.transport}`;
    if (notes.todo) prompt += `\n- Things to do: ${notes.todo}`;
    if (notes.avoid) prompt += `\n- Things to avoid: ${notes.avoid}`;

    // Other dynamic preferences
    Object.entries(notes).forEach(([key, value]) => {
      if (key !== "transport" && key !== "todo" && key !== "avoid" && value) {
        prompt += `\n- ${key}: ${value}`;
      }
    });
  }

  prompt += `\n\nReturn the response as valid JSON with this exact structure:
{
  "days": [
    {
      "day": 1,
      "date": "YYYY-MM-DD",
      "activities": [
        {
          "time": "HH:MM",
          "title": "Activity title",
          "description": "Detailed description",
          "location": "Full address",
          "estimated_cost": 0,
          "duration": "X hours",
          "category": "sightseeing/food/transport/etc"
        }
      ]
    }
  ],
  "accommodation": {
    "name": "Hotel name",
    "address": "Full address",
    "check_in": "${start_date}",
    "check_out": "${end_date}",
    "estimated_cost": 0,
    "booking_url": "https://..."
  },
  "total_estimated_cost": 0,
  "notes": "Any additional recommendations"
}

Important: Return ONLY the JSON object, no additional text.`;

  return prompt;
}

/**
 * Calls OpenRouter API to generate trip plan
 * CURRENTLY MOCKED - Returns sample data instead of real API call
 *
 * @param prompt - The formatted prompt for AI
 * @param abortSignal - Signal to abort the request (timeout)
 * @returns AI response as string (JSON)
 * @throws Error if API call fails or times out
 */
async function callOpenRouterAPI(prompt: string, abortSignal: AbortSignal): Promise<string> {
  // TODO: Replace with real OpenRouter API call when ready for production
  // const apiKey = import.meta.env.OPENROUTER_API_KEY;
  // if (!apiKey) {
  //   throw new Error("OPENROUTER_API_KEY not configured");
  // }

  // Simulate API delay (1-3 seconds)
  const delay = Math.random() * 2000 + 1000;
  await new Promise((resolve, reject) => {
    const timeout = setTimeout(resolve, delay);
    abortSignal.addEventListener("abort", () => {
      clearTimeout(timeout);
      reject(new DOMException("Aborted", "AbortError"));
    });
  });

  // Mock response based on the prompt
  const mockResponse = {
    days: [
      {
        day: 1,
        date: "2025-06-15",
        activities: [
          {
            time: "09:00",
            title: "Arrival and Hotel Check-in",
            description:
              "Arrive at the destination and check into your accommodation. Take some time to rest and freshen up after your journey.",
            location: "Hotel Central",
            estimated_cost: 0,
            duration: "1 hour",
            category: "logistics",
          },
          {
            time: "10:30",
            title: "Explore Local Market",
            description:
              "Visit the vibrant local market to get a feel for the city. Sample local snacks and pick up some fresh fruits.",
            location: "Central Market Square",
            estimated_cost: 15,
            duration: "2 hours",
            category: "sightseeing",
          },
          {
            time: "13:00",
            title: "Lunch at Traditional Restaurant",
            description: "Enjoy authentic local cuisine at a highly-rated traditional restaurant.",
            location: "La Bella Vista Restaurant, 123 Main Street",
            estimated_cost: 25,
            duration: "1.5 hours",
            category: "food",
          },
          {
            time: "15:00",
            title: "Walking City Tour",
            description:
              "Join a guided walking tour to discover the main attractions and learn about the city's history.",
            location: "Tourist Information Center",
            estimated_cost: 20,
            duration: "3 hours",
            category: "sightseeing",
          },
          {
            time: "19:00",
            title: "Dinner at Rooftop Restaurant",
            description:
              "End your first day with a spectacular sunset dinner at a rooftop restaurant with panoramic views.",
            location: "Sky Terrace, 456 High Street",
            estimated_cost: 40,
            duration: "2 hours",
            category: "food",
          },
        ],
      },
      {
        day: 2,
        date: "2025-06-16",
        activities: [
          {
            time: "08:00",
            title: "Breakfast at Hotel",
            description: "Start your day with a complimentary breakfast at the hotel.",
            location: "Hotel Central",
            estimated_cost: 0,
            duration: "1 hour",
            category: "food",
          },
          {
            time: "09:30",
            title: "Museum Visit",
            description: "Explore the city's main museum featuring local art and historical artifacts.",
            location: "National Museum, 789 Culture Avenue",
            estimated_cost: 15,
            duration: "2.5 hours",
            category: "culture",
          },
          {
            time: "12:30",
            title: "Lunch at Cafe",
            description: "Light lunch at a charming local cafe.",
            location: "Cafe Boulevard, 321 Park Street",
            estimated_cost: 18,
            duration: "1 hour",
            category: "food",
          },
          {
            time: "14:00",
            title: "Beach Time",
            description: "Relax at the beautiful local beach. Swim, sunbathe, or try water sports.",
            location: "Sunset Beach",
            estimated_cost: 10,
            duration: "3 hours",
            category: "leisure",
          },
          {
            time: "18:00",
            title: "Seafood Dinner",
            description: "Fresh seafood dinner at a beachfront restaurant.",
            location: "Ocean View Restaurant, Sunset Beach Promenade",
            estimated_cost: 35,
            duration: "2 hours",
            category: "food",
          },
        ],
      },
    ],
    accommodation: {
      name: "Hotel Central",
      address: "100 Downtown Avenue, City Center",
      check_in: "2025-06-15",
      check_out: "2025-06-17",
      estimated_cost: 120,
      booking_url: "https://booking.example.com/hotel-central",
    },
    total_estimated_cost: 458,
    notes:
      "Best time to visit attractions is early morning to avoid crowds. Consider purchasing a city pass for discounts on multiple attractions. The local currency is accepted everywhere, but cards are also widely used.",
  };

  return JSON.stringify(mockResponse);

  /* Real API implementation (commented out for now):
  const response = await fetch(OPENROUTER_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`,
      "HTTP-Referer": import.meta.env.PUBLIC_APP_URL || "http://localhost:4321",
      "X-Title": "Tripper App"
    },
    body: JSON.stringify({
      model: MODEL,
      messages: [
        {
          role: "user",
          content: prompt
        }
      ]
    }),
    signal: abortSignal
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenRouter API error: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;

  if (!content) {
    throw new Error("Invalid response from OpenRouter API");
  }

  return content;
  */
}

/**
 * Parses and validates AI response
 *
 * @param response - Raw AI response string (expected to be JSON)
 * @returns Validated PlanDetailsDto
 * @throws Error if response is invalid or doesn't match expected structure
 */
function parseAIResponse(response: string): PlanDetailsDto {
  // Remove potential markdown code blocks
  const cleaned = response
    .replace(/```json\n?/g, "")
    .replace(/```\n?/g, "")
    .trim();

  try {
    const parsed = JSON.parse(cleaned);

    // Basic validation
    if (!parsed.days || !Array.isArray(parsed.days) || parsed.days.length === 0) {
      throw new Error("Invalid plan_details structure: missing or empty days array");
    }

    // Validate each day has required fields
    for (const day of parsed.days) {
      if (!day.day || !day.date || !day.activities || !Array.isArray(day.activities)) {
        throw new Error("Invalid day structure");
      }

      // Validate each activity
      for (const activity of day.activities) {
        if (!activity.time || !activity.title || !activity.description || !activity.location) {
          throw new Error("Invalid activity structure: missing required fields");
        }
      }
    }

    return parsed as PlanDetailsDto;
  } catch (error) {
    console.error("Failed to parse AI response:", response);
    throw new Error(`Failed to parse AI response: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
}

/**
 * Main function to generate a trip plan
 * Orchestrates the entire generation process
 *
 * @param command - The generation command with all user inputs
 * @returns Generated trip plan DTO (without generation_id - will be set by caller)
 * @throws Error if generation fails at any step
 */
export async function generateTripPlan(command: GeneratePlanCommand): Promise<GeneratedTripPlanDto> {
  const startTime = Date.now();
  const prompt = buildPrompt(command);

  // Setup timeout (180 seconds as per PRD)
  const abortController = new AbortController();
  const timeoutId = setTimeout(() => abortController.abort(), 180000);

  try {
    const aiResponse = await callOpenRouterAPI(prompt, abortController.signal);
    const planDetails = parseAIResponse(aiResponse);

    return {
      generation_id: "", // Will be set by the API route after logging
      destination: command.destination,
      start_date: command.start_date,
      end_date: command.end_date,
      people_count: command.people_count,
      budget_type: command.budget_type,
      plan_details: planDetails,
    };
  } catch (error) {
    const duration = Date.now() - startTime;

    // Re-throw with metadata for logging
    const enhancedError = new Error(error instanceof Error ? error.message : "Unknown error");
    enhancedError.name = error instanceof Error ? error.name : "Error";
    (enhancedError as any).duration_ms = duration;
    (enhancedError as any).prompt = prompt;

    throw enhancedError;
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Export buildPrompt for use in logging
 */
export { buildPrompt, MODEL };
