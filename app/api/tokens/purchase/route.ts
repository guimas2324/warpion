export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { TOKEN_PACKAGES } from "@/lib/tokens/packages";

type PurchaseBody = {
  package_index?: number;
};

export async function POST(request: Request) {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ data: null, error: "Unauthorized", meta: {} }, { status: 401 });

    const body = (await request.json()) as PurchaseBody;
    const packageIndex = Number(body.package_index);
    if (!Number.isInteger(packageIndex) || packageIndex < 0 || packageIndex >= TOKEN_PACKAGES.length) {
      return NextResponse.json({ data: null, error: "Invalid package index", meta: {} }, { status: 400 });
    }

    const selectedPackage = TOKEN_PACKAGES[packageIndex];
    const admin = createSupabaseAdminClient();

    const { data: purchase, error: purchaseError } = await admin
      .from("token_purchases")
      .insert({
        user_id: user.id,
        tokens_amount: selectedPackage.tokens,
        price_cents: selectedPackage.price_cents,
        status: "pending",
        payment_method: "stripe",
      })
      .select("id")
      .single();
    if (purchaseError) throw purchaseError;

    let credited = false;
    if (process.env.NODE_ENV === "development") {
      const { data: profile, error: profileError } = await admin
        .from("profiles")
        .select("tokens_remaining")
        .eq("id", user.id)
        .single();
      if (profileError) throw profileError;

      const { error: updateError } = await admin
        .from("profiles")
        .update({ tokens_remaining: Number(profile.tokens_remaining ?? 0) + selectedPackage.tokens })
        .eq("id", user.id);
      if (updateError) throw updateError;

      credited = true;
    }

    return NextResponse.json({
      data: {
        purchase_id: purchase.id,
        package: selectedPackage,
        credited_in_dev: credited,
      },
      error: null,
      meta: {
        message: "Pagamento via Stripe sera integrado na Fase 14",
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create token purchase";
    return NextResponse.json({ data: null, error: message, meta: {} }, { status: 500 });
  }
}
