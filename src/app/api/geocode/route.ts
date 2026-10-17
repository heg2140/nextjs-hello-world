import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Roughly covers all five NYC boroughs.
const NYC_VIEWBOX = "-74.26,40.92,-73.68,40.49";

export async function GET(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim();

  if (!q || q.length < 3) {
    return NextResponse.json({ results: [] });
  }

  // OpenStreetMap's Nominatim: free, no API key required. We proxy
  // server-side so we can set a proper User-Agent per their usage policy
  // (https://operations.osmfoundation.org/policies/nominatim/) and keep
  // request volume controlled.
  const url = new URL("https://nominatim.openstreetmap.org/search");
  url.searchParams.set("q", q);
  url.searchParams.set("format", "json");
  url.searchParams.set("limit", "5");
  url.searchParams.set("countrycodes", "us");
  url.searchParams.set("viewbox", NYC_VIEWBOX);
  url.searchParams.set("bounded", "1");

  const res = await fetch(url.toString(), {
    headers: {
      "User-Agent": "nextjs-hello-world-class-project/1.0 (contact: heg2140@barnard.edu)",
    },
  });

  if (!res.ok) {
    return NextResponse.json({ results: [] }, { status: 502 });
  }

  const data = await res.json();
  const results = (
    data as Array<{ display_name: string; lat: string; lon: string }>
  ).map((item) => ({
    displayName: item.display_name,
    lat: Number(item.lat),
    lon: Number(item.lon),
  }));

  return NextResponse.json({ results });
}
