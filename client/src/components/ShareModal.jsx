import React,{ useState } from "react";
import { Copy, Link, X } from "lucide-react";
import { supabase } from "../lib/supabase";
import { SHARE_EXPIRY_OPTIONS } from "../config";

export default function ShareModal({ file, onClose }) {
  const [seconds, setSeconds] = useState(86400);
  const [link, setLink] = useState("");
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);

  async function create() {
    setBusy(true);
    try {
      const token = crypto.randomUUID().replaceAll("-", "");
      const expires = new Date(Date.now() + seconds * 1000).toISOString();

      const { error } = await supabase.from("share_links").insert({
        token,
        file_id: file.id,
        expires_at: expires,
      });

      if (error) throw error;
      setLink(`${window.location.origin}/share/${token}`);
    } catch (error) {
      console.error("Share error:", error);
      alert(error?.message || "Could not create share link.");
    } finally {
      setBusy(false);
    }
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      alert("Copy failed. Please copy the link manually.");
    }
  }

  return (
    <div className="modal-backdrop" onMouseDown={onClose}>
      <div className="modal share-modal" onMouseDown={(event) => event.stopPropagation()}>
        <div className="modal-head">
          <div>
            <div className="modal-icon"><Link size={19} /></div>
            <h2>Share file</h2>
          </div>
          <button className="close-btn" onClick={onClose} title="Close">
            <X size={19} />
          </button>
        </div>

        <p className="share-file-name">{file.original_name}</p>

        <label>
          Link expires after
          <select value={seconds} onChange={(e) => setSeconds(Number(e.target.value))}>
            {SHARE_EXPIRY_OPTIONS.map((option) => (
              <option key={option.seconds} value={option.seconds}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        {!link ? (
          <button onClick={create} disabled={busy}>
            {busy ? "Creating link..." : "Create share link"}
          </button>
        ) : (
          <div className="share-result">
            <input value={link} readOnly onFocus={(e) => e.target.select()} />
            <button onClick={copyLink}>
              <Copy size={16} />
              {copied ? "Copied" : "Copy"}
            </button>
          </div>
        )}

        <button className="ghost" onClick={onClose}>Close</button>
      </div>
    </div>
  );
}
