/**
 * AI Generation Service
 *
 * Service for generating trip plans using AI (OpenRouter API).
 */

import type { GeneratePlanCommand, GeneratedTripPlanDto, PlanDetailsDto } from "../../types";
import { OpenRouterService } from "./openrouter";
import type { ChatMessage } from "./openrouter";
import { z } from "zod";

// Initialize OpenRouter service
const openRouterService = new OpenRouterService({
  // Configuration will be loaded from environment variables
});

/**
 * Zod schema for trip plan validation
 */
const ActivitySchema = z.object({
  time: z.string(),
  title: z.string(),
  description: z.string(),
  location: z.string(),
  estimated_cost: z.number().optional(),
  duration: z.string().optional(),
  category: z.string().optional(),
});

const DaySchema = z.object({
  day: z.number(),
  date: z.string(),
  activities: z.array(ActivitySchema),
});

const AccommodationSchema = z.object({
  name: z.string(),
  address: z.string(),
  check_in: z.string(),
  check_out: z.string(),
  estimated_cost: z.number().optional(),
  booking_url: z.string().optional(),
});

const PlanDetailsSchema = z.object({
  days: z.array(DaySchema),
  accommodation: AccommodationSchema.optional(),
  total_estimated_cost: z.number().optional(),
  notes: z.string().optional(),
});

/**
 * Builds AI prompt from the generation command
 */
function buildMessages(command: GeneratePlanCommand): ChatMessage[] {
  const { destination, start_date, end_date, people_count, budget_type, notes } = command;

  const durationDays =
    Math.ceil((new Date(end_date).getTime() - new Date(start_date).getTime()) / (1000 * 60 * 60 * 24)) + 1;

  let userPrompt = `Generate a detailed trip plan with the following requirements:

Destination: ${destination}
Start Date: ${start_date}
End Date: ${end_date}
Duration: ${durationDays} days
Number of People: ${people_count}
Budget Type: ${budget_type}
`;

  if (notes) {
    userPrompt += `\nUser Preferences:`;
    if (notes.transport) userPrompt += `\n- Transport: ${notes.transport}`;
    if (notes.todo) userPrompt += `\n- Things to do: ${notes.todo}`;
    if (notes.avoid) userPrompt += `\n- Things to avoid: ${notes.avoid}`;

    // Other dynamic preferences
    Object.entries(notes).forEach(([key, value]) => {
      if (key !== "transport" && key !== "todo" && key !== "avoid" && value) {
        userPrompt += `\n- ${key}: ${value}`;
      }
    });
  }

  return [
    {
      role: "system",
      content:
        "You are an expert travel planning assistant. Generate detailed, realistic trip itineraries based on user requirements. Include specific locations, estimated costs, and helpful recommendations. Write a response in a Polish language",
    },
    {
      role: "user",
      content: userPrompt,
    },
  ];
}

/**
 * Converts Zod schema to JSON Schema
 * Uses a simplified manual conversion for this specific schema
 */
function getJsonSchema() {
  return {
    name: "trip-plan",
    schema: {
      type: "object" as const,
      properties: {
        days: {
          type: "array" as const,
          items: {
            type: "object" as const,
            properties: {
              day: { type: "number" as const },
              date: { type: "string" as const },
              activities: {
                type: "array" as const,
                items: {
                  type: "object" as const,
                  properties: {
                    time: { type: "string" as const },
                    title: { type: "string" as const },
                    description: { type: "string" as const },
                    location: { type: "string" as const },
                  },
                  required: ["time", "title", "description", "location"],
                  additionalProperties: false,
                },
              },
            },
            required: ["day", "date", "activities"],
            additionalProperties: false,
          },
        },
        accommodation: {
          type: "object" as const,
          properties: {
            name: { type: "string" as const },
            address: { type: "string" as const },
            check_in: { type: "string" as const },
            check_out: { type: "string" as const },
          },
          required: ["name", "address", "check_in", "check_out"],
          additionalProperties: false,
        },
        total_estimated_cost: { type: "number" as const },
        notes: { type: "string" as const },
      },
      required: ["days", "accommodation", "total_estimated_cost", "notes"],
      additionalProperties: false,
    },
  };
}

/**
 * Main function to generate a trip plan using OpenRouter
 */
export async function generateTripPlan(command: GeneratePlanCommand): Promise<GeneratedTripPlanDto> {
  const startTime = Date.now();

  try {
    const messages = buildMessages(command);

    // Use OpenRouterService with structured output
    const planDetails = await openRouterService.completeStructured<PlanDetailsDto>({
      messages,
      schema: getJsonSchema(),
      validator: (data) => PlanDetailsSchema.parse(data),
      temperature: 0.8,
      maxTokens: 4000,
    });

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

    throw enhancedError;
  }
}

/**
 * Converts ChatMessage array to string format for logging
 */
export function messagesToPrompt(messages: ChatMessage[]): string {
  return messages.map((msg) => `[${msg.role}]: ${msg.content}`).join("\n\n");
}

/**
 * Export buildMessages for external use (e.g., logging)
 */
export { buildMessages };

/**
 * Export model name for logging
 */
export const MODEL = openRouterService.getConfig().model;
