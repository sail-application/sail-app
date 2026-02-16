/**
 * app/api/admin/methodologies/reorder/route.ts
 *
 * PUT /api/admin/methodologies/reorder — Bulk update sort order.
 * Admin-only. Accepts an array of {id, sort_order} pairs.
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { reorderSchema } from "@/lib/utils/methodology-validators";
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

    // Check admin role via SECURITY DEFINER RPC (avoids RLS issues)
    const { data: isAdminUser } = await supabase.rpc("check_admin", {
      check_user_id: user.id,
    });
    if (!isAdminUser) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const parsed = reorderSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.issues },
        { status: 400 },
      );
    }

    // Update each methodology's sort_order
    const updates = parsed.data.items.map((item) =>
      supabase
        .from("methodologies")
        .update({ sort_order: item.sort_order })
        .eq("id", item.id),
    );

    await Promise.all(updates);

    return NextResponse.json({ success: true });
  } catch (error) {
    captureError(error, { route: "/api/admin/methodologies/reorder" });
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
