import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

const BUCKET = "chat-attachments";

export async function POST(request: Request) {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ data: null, error: "Unauthorized", meta: {} }, { status: 401 });

    const formData = await request.formData();
    const file = formData.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json({ data: null, error: "File is required", meta: {} }, { status: 400 });
    }

    const admin = createSupabaseAdminClient();
    const safeName = file.name.replace(/[^\w.-]+/g, "_");
    const path = `${user.id}/${Date.now()}_${safeName}`;
    const buffer = Buffer.from(await file.arrayBuffer());

    const { error: uploadError } = await admin.storage.from(BUCKET).upload(path, buffer, {
      contentType: file.type || "application/octet-stream",
      upsert: false,
    });
    if (uploadError) throw uploadError;

    const { data } = admin.storage.from(BUCKET).getPublicUrl(path);

    return NextResponse.json({
      data: {
        name: file.name,
        path,
        mimeType: file.type || "application/octet-stream",
        size: file.size,
        publicUrl: data.publicUrl,
      },
      error: null,
      meta: {},
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Upload failed";
    return NextResponse.json({ data: null, error: message, meta: {} }, { status: 500 });
  }
}

