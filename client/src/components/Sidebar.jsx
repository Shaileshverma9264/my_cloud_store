import React from "react";
import { Files, FolderPlus, Share2 } from "lucide-react";

export default function Sidebar({ onFolder }) {
  return (
    <aside className="sidebar">
      <div className="logo">
        <span className="logo-mark">☁️</span>
        <span>My Cloud</span>
      </div>

      <div className="sidebar-nav">
        <button className="nav-btn active">
          <Files size={18} />
          <span>My Files</span>
        </button>

        <button className="nav-btn" onClick={onFolder}>
          <FolderPlus size={18} />
          <span>New Folder</span>
        </button>

        <button
          className="nav-btn"
          onClick={() =>
            alert("Share links are created from the Share button beside each file.")
          }
        >
          <Share2 size={18} />
          <span>Shared Links</span>
        </button>
      </div>

      <div className="sidebar-bottom">
        <div className="public-badge">
          <span className="status-dot" />
          <div>
            <strong>Public Cloud</strong>
            <small>Authentication disabled</small>
          </div>
        </div>
      </div>
    </aside>
  );
}
