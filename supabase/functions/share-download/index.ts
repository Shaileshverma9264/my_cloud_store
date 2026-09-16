import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

Deno.serve(async (req) => {
  try {
    const { token } = await req.json();
    if (!token) return new Response(JSON.stringify({ error: "Token required" }), { status: 400 });

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data, error } = await admin
      .from("share_links")
      .select("file_id, expires_at")
      .eq("token", token)
      .gt("expires_at", new Date().toISOString())
      .maybeSingle();

    if (error || !data) return new Response(JSON.stringify({ error: "Link invalid or expired" }), { status: 404 });

    const { data: file, error: fileError } = await admin
      .from("files")
      .select("original_name, storage_path, deleted_at")
      .eq("id", data.file_id)
      .maybeSingle();

    if (fileError || !file || file.deleted_at) {
      return new Response(JSON.stringify({ error: "File unavailable" }), { status: 404 });
    }

    const { data: signed, error: signedError } = await admin.storage
      .from("user-files")
      .createSignedUrl(file.storage_path, 300, { download: file.original_name });

    if (signedError) throw signedError;

    return new Response(JSON.stringify({ url: signed.signedUrl }), {
      headers: { "Content-Type": "application/json" }
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500 });
  }
});