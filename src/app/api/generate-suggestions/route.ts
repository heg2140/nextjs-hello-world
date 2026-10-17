import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

type SuggestionShape = {
  title: string;
  description: string;
  neighborhood: string;
  transit_directions: string;
};

const GEMINI_MODEL = "gemini-flash-latest";
const SUGGESTION_COUNT = 4;

const RESPONSE_SCHEMA = {
  type: "ARRAY",
  items: {
    type: "OBJECT",
    properties: {
      title: { type: "STRING" },
      description: { type: "STRING" },
      neighborhood: { type: "STRING" },
      transit_directions: { type: "STRING" },
    },
    required: ["title", "description", "neighborhood", "transit_directions"],
  },
};

function buildPrompt(input: {
  startingPoint: string;
  startingLat: number | null;
  startingLon: number | null;
  activityType: string;
  timeOfDay: string;
  maxTravelMinutes: number;
}) {
  const coordsLine =
    input.startingLat !== null && input.startingLon !== null
      ? `\nStarting point coordinates: ${input.startingLat}, ${input.startingLon} (use this for an accurate location, the address text can be ambiguous)`
      : "";

  return `You are a local NYC expert who only recommends completely free activities (the only acceptable cost is public transit fare). The user is a college student exploring New York City.

Starting point: ${input.startingPoint}${coordsLine}
Activity type: ${input.activityType}
Time of day: ${input.timeOfDay}
Maximum one-way travel time: ${input.maxTravelMinutes} minutes

Suggest exactly ${SUGGESTION_COUNT} distinct, real, specific free things to do in NYC that fit these constraints. For each, include a short best-guess public transit route from the starting point, and explicitly note in that field that it's an AI estimate the user should double check before heading out.`;
}

function isValidSuggestion(value: unknown): value is SuggestionShape {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.title === "string" &&
    typeof v.description === "string" &&
    typeof v.neighborhood === "string" &&
    typeof v.transit_directions === "string"
  );
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      { error: "You must be signed in to generate suggestions." },
      { status: 401 }
    );
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "Server is missing GEMINI_API_KEY." },
      { status: 500 }
    );
  }

  const body = await request.json().catch(() => null);
  const startingPoint = typeof body?.startingPoint === "string" ? body.startingPoint.trim() : "";
  const activityType = typeof body?.activityType === "string" ? body.activityType.trim() : "";
  const timeOfDay = typeof body?.timeOfDay === "string" ? body.timeOfDay.trim() : "";
  const maxTravelMinutes = Number(body?.maxTravelMinutes);
  const startingLat =
    typeof body?.startingLat === "number" ? body.startingLat : null;
  const startingLon =
    typeof body?.startingLon === "number" ? body.startingLon : null;

  if (
    !startingPoint ||
    !activityType ||
    !timeOfDay ||
    !Number.isFinite(maxTravelMinutes) ||
    maxTravelMinutes <= 0 ||
    maxTravelMinutes > 180 ||
    startingLat === null ||
    startingLon === null
  ) {
    return NextResponse.json(
      { error: "Missing or invalid fields. Pick an address from the autocomplete suggestions." },
      { status: 400 }
    );
  }

  const prompt = buildPrompt({
    startingPoint,
    startingLat,
    startingLon,
    activityType,
    timeOfDay,
    maxTravelMinutes,
  });

  let suggestions: SuggestionShape[];
  try {
    const geminiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            responseMimeType: "application/json",
            responseSchema: RESPONSE_SCHEMA,
          },
        }),
      }
    );

    if (!geminiResponse.ok) {
      const errText = await geminiResponse.text();
      throw new Error(`Gemini API error (${geminiResponse.status}): ${errText}`);
    }

    const geminiData = await geminiResponse.json();
    const text = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (typeof text !== "string") {
      throw new Error("Gemini response was missing generated text.");
    }

    const parsed = JSON.parse(text);
    if (!Array.isArray(parsed) || !parsed.every(isValidSuggestion)) {
      throw new Error("Gemini response did not match the expected shape.");
    }
    suggestions = parsed;
  } catch (err) {
    console.error("Gemini generation failed:", err);
    return NextResponse.json(
      { error: "Failed to generate suggestions. Please try again." },
      { status: 502 }
    );
  }

  // Save the generation (inputs + prompt used) and the resulting suggestions.
  // RLS enforces that these rows can only be inserted as the signed-in user.
  const { data: generation, error: generationError } = await supabase
    .from("generations")
    .insert({
      user_id: user.id,
      starting_point: startingPoint,
      start_lat: startingLat,
      start_lon: startingLon,
      activity_type: activityType,
      time_of_day: timeOfDay,
      max_travel_minutes: maxTravelMinutes,
      prompt,
    })
    .select("id")
    .single();

  if (generationError || !generation) {
    console.error("Failed to save generation:", generationError);
    return NextResponse.json(
      { error: "Failed to save the generation." },
      { status: 500 }
    );
  }

  const { data: savedSuggestions, error: suggestionsError } = await supabase
    .from("suggestions")
    .insert(
      suggestions.map((s) => ({
        generation_id: generation.id,
        user_id: user.id,
        title: s.title,
        description: s.description,
        neighborhood: s.neighborhood,
        transit_directions: s.transit_directions,
      }))
    )
    .select("id, title, description, neighborhood, transit_directions, created_at");

  if (suggestionsError) {
    console.error("Failed to save suggestions:", suggestionsError);
    return NextResponse.json(
      { error: "Failed to save the generated suggestions." },
      { status: 500 }
    );
  }

  return NextResponse.json({ suggestions: savedSuggestions });
}
