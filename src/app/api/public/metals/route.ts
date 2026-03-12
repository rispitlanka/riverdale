import { NextResponse } from "next/server";

/**
 * Public API: returns metal types for the sell form dropdown.
 * Matches the options used in Admin → Metals (Gold, Silver, Platinum, Palladium).
 * Returns { id, name } so the client can use name for display and value.
 */
const METAL_TYPES = [
  { id: "Gold", name: "Gold" },
  { id: "Silver", name: "Silver" },
  { id: "Platinum", name: "Platinum" },
  { id: "Palladium", name: "Palladium" },
];

export async function GET() {
  return NextResponse.json(METAL_TYPES, { status: 200 });
}
