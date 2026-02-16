/**
 * app/api/methodologies/route.ts
 *
 * GET /api/methodologies — List active methodologies for the user.
 * Supports search, category filter, and pagination.
 * Returns listing-optimized data (no AI coaching content).
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { captureError } from "@/lib/sentry";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parse query params
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") ?? "";
    const category = searchParams.get("category") ?? "";
    const limit = Math.min(parseInt(searchParams.get("limit") ?? "50"), 100);
    const offset = parseInt(searchParams.get("offset") ?? "0");

    // Build query — only select listing fields (no AI content)
    let query = supabase
      .from("methodologies")
      .select(
        "id, name, slug, author, tagline, icon, category, relevance_rating, complexity_level, tags, access_tier, sort_order, is_active, trademark_attribution, created_at",
        { count: "exact" },
      )
      .eq("is_active", true)
      .order("sort_order", { ascending: true })
      .range(offset, offset + limit - 1);

    // Category filter
    if (category) {
      query = query.eq("category", category);
    }

    // Full-text search
    if (search) {
      query = query.textSearch("search_vector", search, { type: "websearch" });
    }

    const { data, error, count } = await query;

    if (error) {
      captureError(error, { route: "/api/methodologies" });
      return NextResponse.json(
        { error: "Failed to fetch methodologies" },
        { status: 500 },
      );
    }

    // Also fetch technique counts per methodology
    const methodologyIds = (data ?? []).map((m) => m.id);
    let techniqueCounts: Record<string, number> = {};

    if (methodologyIds.length > 0) {
      const { data: strategies } = await supabase
        .from("strategies")
        .select("methodology_id")
        .in("methodology_id", methodologyIds)
        .eq("is_active", true);

      if (strategies) {
        techniqueCounts = strategies.reduce(
          (acc, s) => {
            const mid = s.methodology_id as string;
            acc[mid] = (acc[mid] ?? 0) + 1;
            return acc;
          },
          {} as Record<string, number>,
        );
      }
    }

    return NextResponse.json({
      methodologies: data ?? [],
      techniqueCounts,
      total: count ?? 0,
    });
  } catch (error) {
    captureError(error, { route: "/api/methodologies" });
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
