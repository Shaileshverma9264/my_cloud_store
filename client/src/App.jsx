import React, { useEffect, useMemo, useState } from "react";
import {
  Search,
  HardDrive,
  Home,
  ChevronRight,
  RefreshCw,
  Cloud,
  FolderPlus,
} from "lucide-react";

import { supabase } from "./lib/supabase";
import { DEFAULT_QUOTA_BYTES } from "./config";
import { formatBytes } from "./lib/utils";
import { downloadFile } from "./lib/storage";

import Sidebar from "./components/Sidebar";
import UploadBox from "./components/UploadBox";
import FileCard from "./components/FileCard";
import ShareModal from "./components/ShareModal";
import SharePage from "./components/SharePage";
import AddLinkModal from "./components/AddLinkModal";

export default function App() {
  const shareToken = location.pathname.startsWith("/share/")
    ? location.pathname.split("/share/")[1]
    : null;

  if (shareToken) {
    return <SharePage token={shareToken} />;
  }

  return <CloudApp />;
}

function CloudApp() {
  const [files, setFiles] = useState([]);
  const [folders, setFolders] = useState([]);
  const [folderId, setFolderId] = useState(null);
  const [search, setSearch] = useState("");
  const [shareFile, setShareFile] = useState(null);
  const [showAddLink, setShowAddLink] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadAll() {
    setLoading(true);
    setError("");

    const [
      { data: f, error: fileError },
      { data: fo, error: folderError },
    ] = await Promise.all([
      supabase
        .from("files")
        .select("*")
        .is("deleted_at", null)
        .order("created_at", { ascending: false }),

      supabase
        .from("folders")
        .select("*")
        .order("name", { ascending: true }),
    ]);

    if (fileError || folderError) {
      const message =
        fileError?.message ||
        folderError?.message ||
        "Could not load cloud data.";

      console.error("Load error:", fileError || folderError);
      setError(message);
    }

    setFiles(f || []);
    setFolders(fo || []);
    setLoading(false);
  }

  useEffect(() => {
    loadAll();
  }, []);

  async function createFolder() {
    const name = window.prompt("Enter folder name:");

    if (!name?.trim()) return;

    const { error } = await supabase.from("folders").insert({
      name: name.trim(),
      parent_id: folderId,
    });

    if (error) {
      alert(error.message);
      return;
    }

    await loadAll();
  }

  async function deleteFolder(folder) {
  if (!folder?.id) return;

  const confirmed = window.confirm(
    `Are you sure you want to delete "${folder.name}"?`
  );

  if (!confirmed) return;

  try {
    // Check whether this folder contains files/links
    const { data: folderItems, error: itemsError } =
      await supabase
        .from("files")
        .select("id, original_name, storage_path, item_type")
        .eq("folder_id", folder.id);

    if (itemsError) {
      throw itemsError;
    }

    // Check whether this folder contains sub-folders
    const { data: childFolders, error: childError } =
      await supabase
        .from("folders")
        .select("id, name")
        .eq("parent_id", folder.id);

    if (childError) {
      throw childError;
    }

    if (
      (folderItems && folderItems.length > 0) ||
      (childFolders && childFolders.length > 0)
    ) {
      alert(
        `Folder "${folder.name}" is not empty.\n\n` +
        `Please delete or move its files and sub-folders first.`
      );

      return;
    }

    // Delete empty folder
    const { error: deleteError } =
      await supabase
        .from("folders")
        .delete()
        .eq("id", folder.id);

    if (deleteError) {
      throw deleteError;
    }

    // If currently inside this folder, go back to Home
    if (folderId === folder.id) {
      setFolderId(null);
    }

    await loadAll();

  } catch (error) {
    console.error(
      "Delete folder error:",
      error
    );

    alert(
      error?.message ||
      "Could not delete folder."
    );
  }
}
  async function remove(file) {
    if (!window.confirm(`Delete "${file.original_name}"?`)) {
      return;
    }

    // Links don't have a Storage object
    if (file.item_type !== "link") {
      const { error: storageError } = await supabase.storage
        .from("user-files")
        .remove([file.storage_path]);

      if (storageError) {
        alert(storageError.message);
        return;
      }
    }

    const { error: dbError } = await supabase
      .from("files")
      .delete()
      .eq("id", file.id);

    if (dbError) {
      alert(dbError.message);
      return;
    }

    await loadAll();
  }

  const normalizedSearch = search.trim().toLowerCase();

  const currentFiles = useMemo(
    () =>
      files.filter(
        (file) =>
          (file.folder_id || null) === folderId &&
          file.original_name
            .toLowerCase()
            .includes(normalizedSearch)
      ),
    [files, folderId, normalizedSearch]
  );

  const currentFolders = useMemo(
    () =>
      folders.filter(
        (folder) =>
          (folder.parent_id || null) === folderId &&
          folder.name.toLowerCase().includes(normalizedSearch)
      ),
    [folders, folderId, normalizedSearch]
  );

  const used = files.reduce(
    (total, file) =>
      total +
      Number(
        file.item_type === "link"
          ? 0
          : file.size_bytes || 0
      ),
    0
  );

  const usagePercent = Math.min(
    100,
    (used / DEFAULT_QUOTA_BYTES) * 100
  );

  const fileCount = files.filter(
    (file) => file.item_type !== "link"
  ).length;

  const linkCount = files.filter(
    (file) => file.item_type === "link"
  ).length;

  const currentFolder = folders.find(
    (folder) => folder.id === folderId
  );

  return (
    <div className="app-shell">

      <Sidebar onFolder={createFolder} />

      <main className="main">

        <header className="topbar">

          <div>
            <div className="eyebrow">
              <Cloud size={15} />
              Public Cloud
            </div>

            <h1>My Files</h1>

            <p>
              Upload, organize, download and share your files.
            </p>
          </div>

          <div className="top-actions">

            <div className="search-wrap">
              <Search size={18} />

              <input
                aria-label="Search files and links"
                placeholder="Search files and links..."
                value={search}
                onChange={(e) =>
                  setSearch(e.target.value)
                }
              />
            </div>

            <button
              className="icon-btn"
              title="Refresh"
              onClick={loadAll}
              disabled={loading}
            >
              <RefreshCw
                size={18}
                className={loading ? "spin" : ""}
              />
            </button>

          </div>

        </header>

        <section className="content">

          <div className="crumbs">

            <button
              onClick={() => setFolderId(null)}
            >
              <Home size={16} />
              Home
            </button>

            {currentFolder && (
              <>
                <ChevronRight size={15} />
                <span>{currentFolder.name}</span>
              </>
            )}

          </div>

          {/* Upload + Add Link */}

          <UploadBox
            folderId={folderId}
            onDone={loadAll}
            onAddLink={() => setShowAddLink(true)}
          />

          {/* Statistics */}

          <div className="stats">

            <div>
              <div className="stat-label">
                <HardDrive size={18} />
                <span>Storage used</span>
              </div>

              <b>
                {formatBytes(used)} /{" "}
                {formatBytes(DEFAULT_QUOTA_BYTES)}
              </b>

              <div className="progress">
                <i
                  style={{
                    width: `${usagePercent}%`,
                  }}
                />
              </div>
            </div>

            <div>
              <span>Files</span>
              <b>{fileCount}</b>
            </div>

            <div>
              <span>Links</span>
              <b>{linkCount}</b>
            </div>

            <div>
              <span>Folders</span>
              <b>{folders.length}</b>
            </div>

          </div>

          {/* Error */}

          {error && (
            <div className="error-banner">
              <strong>
                Could not load your cloud.
              </strong>

              <span>{error}</span>

              <button onClick={loadAll}>
                Try again
              </button>
            </div>
          )}

          {/* Folders */}

          <div className="section-title">

            <h2>Folders</h2>

            <button
              className="small-action"
              onClick={createFolder}
            >
              <FolderPlus size={16} />
              New folder
            </button>

          </div>

          <div className="folder-grid">

  {currentFolders.map((folder) => (
    <div
      key={folder.id}
      className="folder-card"
    >

      {/* Open Folder */}

      <button
        type="button"
        className="folder-open"
        onDoubleClick={() =>
          setFolderId(folder.id)
        }
        title="Double-click to open folder"
      >
        <span className="folder-icon">
          📁
        </span>

        <span className="folder-name">
          {folder.name}
        </span>
      </button>


      {/* Delete Folder */}

      <button
        type="button"
        className="folder-delete"
        title={`Delete ${folder.name}`}
        onClick={() =>
          deleteFolder(folder)
        }
      >
        🗑️
      </button>

    </div>
  ))}

</div>

          {/* Files */}

          <div className="section-title">

            <h2>Files & Links</h2>

            <span>
              {currentFiles.length} items
            </span>

          </div>

          {loading ? (
            <div className="empty">
              <RefreshCw
                size={24}
                className="spin"
              />

              <p>Loading your cloud...</p>
            </div>
          ) : currentFiles.length ? (

            <div className="file-list">

              {currentFiles.map((file) => (
                <FileCard
                  key={file.id}
                  file={file}
                  onDownload={downloadFile}
                  onDelete={remove}
                  onShare={setShareFile}
                />
              ))}

            </div>

          ) : (

            <div className="empty">

              <div className="empty-icon">
                ☁️
              </div>

              <h3>
                {normalizedSearch
                  ? "No matching files or links"
                  : "Your cloud is empty"}
              </h3>

              <p>
                {normalizedSearch
                  ? "Try a different search term."
                  : "Upload a file or add a link above to get started."}
              </p>

            </div>

          )}

        </section>

      </main>

      {/* Share */}

      {shareFile && (
        <ShareModal
          file={shareFile}
          onClose={() => setShareFile(null)}
        />
      )}

      {/* Add Link Modal */}

      {showAddLink && (
        <AddLinkModal
          folderId={folderId}
          onDone={loadAll}
          onClose={() => setShowAddLink(false)}
        />
      )}

    </div>
  );
}