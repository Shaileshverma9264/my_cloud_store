import React, {
  useRef,
  useState,
} from "react";

import {
  Link as LinkIcon,
  UploadCloud,
} from "lucide-react";

import { uploadFile } from "../lib/storage";

export default function UploadBox({
  folderId,
  onDone,
  onAddLink,
}) {
  const ref = useRef(null);

  const [busy, setBusy] =
    useState(false);

  const [dragging, setDragging] =
    useState(false);

  async function add(files) {

    if (!files?.length || busy) {
      return;
    }

    setBusy(true);

    try {

      for (const file of Array.from(files)) {

        await uploadFile({
          folderId,
          file,
        });

      }

      await onDone?.();

    } catch (error) {

      console.error(
        "Upload error:",
        error
      );

      alert(
        error?.message ||
        "File upload failed."
      );

    } finally {

      setBusy(false);

      if (ref.current) {
        ref.current.value = "";
      }

    }
  }

  function handleDrop(event) {

    event.preventDefault();

    setDragging(false);

    add(event.dataTransfer.files);
  }

  return (

    <div
      className={`upload-box ${
        dragging ? "dragging" : ""
      }`}

      onDragOver={(event) => {

        event.preventDefault();

        if (!busy) {
          setDragging(true);
        }

      }}

      onDragLeave={() =>
        setDragging(false)
      }

      onDrop={handleDrop}
    >

      <div className="upload-icon">
        <UploadCloud size={30} />
      </div>

      <div className="upload-copy">

        <strong>
          {busy
            ? "Uploading files..."
            : "Drop files here"}
        </strong>

        <span>
          {busy
            ? "Please keep this tab open until the upload finishes."
            : "or choose files from your device"}
        </span>

      </div>

      <div className="upload-actions">

        <button
          type="button"
          disabled={busy}
          onClick={() =>
            ref.current?.click()
          }
        >
          {busy
            ? "Uploading..."
            : "Choose Files"}
        </button>

        <button
          type="button"
          className="link-action"
          disabled={busy}
          onClick={onAddLink}
        >
          <LinkIcon size={16} />
          Add Link
        </button>

      </div>

      <input
        ref={ref}
        hidden
        type="file"
        multiple
        onChange={(event) =>
          add(event.target.files)
        }
        disabled={busy}
      />

    </div>
  );
}