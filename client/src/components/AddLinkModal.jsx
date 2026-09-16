import React, { useState } from "react";
import {
  ExternalLink,
  Link,
  X,
} from "lucide-react";
import { supabase } from "../lib/supabase";

function normalizeUrl(value) {
  const trimmed = value.trim();

  if (!trimmed) {
    throw new Error("Please enter a URL.");
  }

  const withProtocol =
    /^https?:\/\//i.test(trimmed)
      ? trimmed
      : `https://${trimmed}`;

  const url = new URL(withProtocol);

  if (
    !["http:", "https:"].includes(url.protocol)
  ) {
    throw new Error(
      "Only HTTP and HTTPS links are allowed."
    );
  }

  return url.href;
}

export default function AddLinkModal({
  folderId,
  onClose,
  onDone,
}) {
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function saveLink(event) {
    event.preventDefault();

    setError("");

    try {
      const cleanUrl = normalizeUrl(url);

      const displayName =
        name.trim() ||
        new URL(cleanUrl).hostname;

      setBusy(true);

      const { error: dbError } =
        await supabase.from("files").insert({
          id: crypto.randomUUID(),

          folder_id: folderId || null,

          original_name: displayName,

          storage_path:
            `link://${crypto.randomUUID()}`,

          mime_type: "text/url",

          size_bytes: 0,

          item_type: "link",

          url: cleanUrl,
        });

      if (dbError) {
        throw dbError;
      }

      await onDone?.();

      onClose();

    } catch (err) {

      console.error(
        "Add link error:",
        err
      );

      setError(
        err?.message ||
          "Could not save this link."
      );

    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      className="modal-backdrop"
      onMouseDown={onClose}
    >

      <form
        className="modal link-modal"
        onSubmit={saveLink}
        onMouseDown={(e) =>
          e.stopPropagation()
        }
      >

        <div className="modal-head">

          <div>

            <div className="modal-icon">
              <Link size={19} />
            </div>

            <h2>Add Link</h2>

          </div>

          <button
            type="button"
            className="close-btn"
            onClick={onClose}
            title="Close"
          >
            <X size={19} />
          </button>

        </div>

        <p className="muted">
          Save a website, Google Drive,
          YouTube or any other HTTP/HTTPS
          link in this folder.
        </p>

        <label>

          Link name{" "}
          <span className="optional">
            (optional)
          </span>

          <input
            autoFocus
            value={name}
            onChange={(e) =>
              setName(e.target.value)
            }
            placeholder="e.g. Google Drive"
            maxLength={180}
          />

        </label>

        <label>

          URL

          <input
            value={url}
            onChange={(e) =>
              setUrl(e.target.value)
            }
            placeholder="https://example.com"
            inputMode="url"
            type="url"
            required
          />

        </label>

        {error && (
          <div className="form-error">
            {error}
          </div>
        )}

        <div className="modal-actions">

          <button
            type="button"
            className="ghost"
            onClick={onClose}
            disabled={busy}
          >
            Cancel
          </button>

          <button
            type="submit"
            disabled={busy}
          >
            <ExternalLink size={16} />

            {busy
              ? "Saving..."
              : "Add Link"}
          </button>

        </div>

      </form>

    </div>
  );
}