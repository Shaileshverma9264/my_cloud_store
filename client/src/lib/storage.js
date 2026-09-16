import { supabase } from "./supabase";
import { STORAGE_BUCKET } from "../config";
import { safeName } from "./utils";

export async function uploadFile({ folderId, file }) {
  if (!file) {
    throw new Error("No file selected.");
  }

  const fileId = crypto.randomUUID();

  const path = `public/${
    folderId || "root"
  }/${fileId}-${safeName(file.name)}`;

  const { error: uploadError } = await supabase.storage
    .from(STORAGE_BUCKET)
    .upload(path, file, {
      contentType: file.type || "application/octet-stream",
      upsert: false,
    });

  if (uploadError) {
    throw uploadError;
  }

  const { data, error: metaError } = await supabase
    .from("files")
    .insert({
      id: fileId,
      folder_id: folderId || null,
      original_name: file.name,
      storage_path: path,
      mime_type: file.type || "application/octet-stream",
      size_bytes: file.size,
      item_type: "file",
    })
    .select()
    .single();

  if (metaError) {
    await supabase.storage
      .from(STORAGE_BUCKET)
      .remove([path]);

    throw metaError;
  }

  return data;
}


/*
 * Get temporary download URL for uploaded file
 *
 * This URL is valid for 1 hour.
 */
export async function getFileDownloadUrl(file) {
  if (!file?.storage_path) {
    throw new Error("File path is missing.");
  }

  const { data, error } = await supabase.storage
    .from(STORAGE_BUCKET)
    .createSignedUrl(
      file.storage_path,
      60 * 60,
      {
        download: file.original_name,
      }
    );

  if (error) {
    throw error;
  }

  if (!data?.signedUrl) {
    throw new Error(
      "Could not create download link."
    );
  }

  return data.signedUrl;
}


/*
 * Download uploaded file
 */
export async function downloadFile(file) {
  const signedUrl = await getFileDownloadUrl(file);

  window.open(
    signedUrl,
    "_blank",
    "noopener,noreferrer"
  );
}