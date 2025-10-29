export const runtime = "nodejs";

import archiver from "archiver";
import { createClient } from "@supabase/supabase-js";
import { generateDescriptiveFilename } from "@/lib/filename-generator";
import { Readable } from "stream";


export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!
  );

  const { data: collectionMemes, error } = await supabase
    .from("collection_memes")
    .select("memes(*)")
    .eq("collection_id", id);

  if (error || !collectionMemes?.length) {
    return new Response(JSON.stringify({ error: "No memes found" }), {
      status: 404,
    });
  }

  const archive = archiver("zip", { zlib: { level: 9 } });
  const nodeStream = Readable.toWeb(archive);

  (async () => {
    for (const row of collectionMemes) {
      // ✅ Fix: handle memes as array or object
      const meme = Array.isArray(row.memes) ? row.memes[0] : row.memes;
      if (!meme?.storage_path) continue;

      const { data: fileData, error: fileError } = await supabase.storage
        .from("memes")
        .download(meme.storage_path);

      if (fileError || !fileData) continue;

      const filename = generateDescriptiveFilename(meme);
      const buffer = Buffer.from(await fileData.arrayBuffer());
      archive.append(buffer, { name: filename });
    }

    archive.finalize();
  })();

  return new Response(nodeStream as any, {
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="collection-${id}.zip"`,
    },
  });
}
