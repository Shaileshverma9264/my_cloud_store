import React, { useState } from "react";

import {
  Download,
  ExternalLink,
  File,
  Link as LinkIcon,
  MoreVertical,
  Share2,
  Trash2,
  Copy,
  Check,
} from "lucide-react";

import {
  formatBytes,
  getExtension,
} from "../lib/utils";

import {
  getFileDownloadUrl,
} from "../lib/storage";


export default function FileCard({
  file,
  onDownload,
  onDelete,
  onShare,
}) {

  const isLink =
    file.item_type === "link";

  const [copied, setCopied] =
    useState(false);

  const [copying, setCopying] =
    useState(false);


  /*
   * Copy normal URL
   */
  async function copyLink() {

    if (!file.url) {
      alert("Link is not available.");
      return;
    }

    try {

      await navigator.clipboard.writeText(
        file.url
      );

      setCopied(true);

      setTimeout(() => {
        setCopied(false);
      }, 2000);

    } catch (error) {

      console.error(
        "Copy link error:",
        error
      );

      alert("Could not copy the link.");
    }
  }


  /*
   * Copy uploaded file download URL
   */
  async function copyFileLink() {

    if (!file.storage_path) {
      alert("File path is missing.");
      return;
    }

    if (copying) {
      return;
    }

    try {

      setCopying(true);

      const downloadUrl =
        await getFileDownloadUrl(file);

      await navigator.clipboard.writeText(
        downloadUrl
      );

      setCopied(true);

      setTimeout(() => {
        setCopied(false);
      }, 2000);

    } catch (error) {

      console.error(
        "Copy file link error:",
        error
      );

      alert(
        error?.message ||
        "Could not create download link."
      );

    } finally {

      setCopying(false);

    }
  }


  /*
   * Open external link
   */
  function openLink() {

    if (!file.url) {
      alert("Link is not available.");
      return;
    }

    window.open(
      file.url,
      "_blank",
      "noopener,noreferrer"
    );
  }


  return (

    <div className="file-row">

      {/* File / Link Icon */}

      <div
        className={`file-type ${
          isLink ? "link-type" : ""
        }`}
      >

        {isLink ? (
          <LinkIcon size={20} />
        ) : (
          <File size={20} />
        )}

        <small>
          {isLink
            ? "LINK"
            : getExtension(
                file.original_name
              )}
        </small>

      </div>


      {/* Name + Details */}

      <div className="file-name">

        <strong
          title={file.original_name}
        >
          {file.original_name}
        </strong>

        <span>

          {isLink
            ? file.url
            : formatBytes(
                file.size_bytes
              )}

          {" · "}

          {file.created_at
            ? new Date(
                file.created_at
              ).toLocaleDateString()
            : ""}

        </span>

      </div>


      {/* =========================
          LINK ACTIONS
          ========================= */}

      {isLink ? (

        <>

          {/* Open Link */}

          <button
            className="icon-btn"
            title="Open link"
            onClick={openLink}
            disabled={!file.url}
          >
            <ExternalLink
              size={18}
            />
          </button>


          {/* Copy Link */}

          <button
            className="icon-btn"
            title={
              copied
                ? "Copied!"
                : "Copy link"
            }
            onClick={copyLink}
            disabled={!file.url}
          >

            {copied ? (
              <Check size={18} />
            ) : (
              <Copy size={18} />
            )}

          </button>

        </>

      ) : (

        /* =========================
           FILE ACTIONS
           ========================= */

        <>

          {/* Download */}

          <button
            className="icon-btn"
            title="Download file"
            onClick={() =>
              onDownload(file)
            }
          >
            <Download
              size={18}
            />
          </button>


          {/* Copy Download Link */}

          <button
            className="icon-btn"
            title={
              copying
                ? "Creating link..."
                : copied
                ? "Copied!"
                : "Copy download link"
            }
            onClick={copyFileLink}
            disabled={copying}
          >

            {copied ? (
              <Check size={18} />
            ) : (
              <Copy size={18} />
            )}

          </button>


          {/* Share */}

          <button
            className="icon-btn"
            title="Share"
            onClick={() =>
              onShare(file)
            }
          >
            <Share2
              size={18}
            />
          </button>

        </>

      )}


      {/* Delete */}

      <button
        className="icon-btn danger-icon"
        title="Delete"
        onClick={() =>
          onDelete(file)
        }
      >
        <Trash2 size={18} />
      </button>


      <MoreVertical
        size={18}
        className="muted"
      />

    </div>

  );
}