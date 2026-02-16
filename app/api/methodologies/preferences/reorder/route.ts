/**
 * app/api/methodologies/preferences/reorder/route.ts
 *
 * PUT /api/methodologies/preferences/reorder
 * Bulk update sort_order on user_methodology_preferences for the current user.
 * Accepts { items: [{ methodology_id, sort_order }] }.
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { userReorderSchema } from "@/lib/utils/methodology-validators";
import { captureError } from "@/lib/sentry";

export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const parsed = userReorderSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.issues },
        { status: 400 },
      );
    }

    // Upsert each preference with the new sort_order
    const updates = parsed.data.items.map((item) =>
      supabase.from("user_methodology_preferences").upsert(
        {
          user_id: user.id,
          methodology_id: item.methodology_id,
          sort_order: item.sort_order,
        },
        { onConflict: "user_id,methodology_id" },
      ),
    );

    await Promise.all(updates);

    return NextResponse.json({ success: true });
  } catch (error) {
    captureError(error, { route: "/api/methodologies/preferences/reorder" });
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
