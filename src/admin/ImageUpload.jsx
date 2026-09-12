import React, { useRef, useState } from "react";
import { Upload, X, CheckCircle, AlertCircle, Loader, Image, Film } from "lucide-react";
import { uploadAPI } from "../services/api";

export default function ImageUpload({
  value,
  onChange,
  label    = "Image",
  accept   = "image/*",
  type     = "image",
}) {
  const [uploading, setUploading] = useState(false);
  const [status,    setStatus]    = useState(null);
  const [error,     setError]     = useState("");
  const fileRef = useRef();

  const handleFile = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 100 * 1024 * 1024) {
      setError("File too large. Maximum 100 MB.");
      setStatus("error");
      return;
    }
    setUploading(true); setStatus(null); setError("");
    try {
      let data;
      if      (type === "video") data = await uploadAPI.video(file);
      else if (type === "ad")    data = await uploadAPI.ad(file);
      else                       data = await uploadAPI.image(file);
      onChange(data.url);
      setStatus("ok");
      setTimeout(() => setStatus(null), 3000);
    } catch (err) {
      setError(err.message || "Upload failed. Please try again.");
      setStatus("error");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) { fileRef.current.files = e.dataTransfer.files; handleFile({ target: { files: e.dataTransfer.files, value: "" } }); }
  };

  const isVideo = type === "video" || type === "ad";
  const hint    = isVideo ? "MP4 or WebM — max 100 MB" : "JPG, PNG, WebP — max 100 MB";
  const Icon    = isVideo ? Film : Image;

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
      {label && (
        <span style={{ fontSize:".78rem", fontWeight:600, color:"rgba(255,255,255,.5)",
          textTransform:"uppercase", letterSpacing:".6px" }}>
          {label}
        </span>
      )}

      {/* Drop zone / upload button */}
      <div
        onClick={() => !uploading && fileRef.current?.click()}
        onDragOver={e => e.preventDefault()}
        onDrop={handleDrop}
        style={{
          border: `2px dashed ${status === "error" ? "rgba(229,9,20,.5)" : status === "ok" ? "rgba(76,222,128,.5)" : "rgba(255,255,255,.12)"}`,
          borderRadius: 10,
          padding: "20px 16px",
          textAlign: "center",
          cursor: uploading ? "not-allowed" : "pointer",
          background: uploading ? "rgba(255,255,255,.02)" : "rgba(255,255,255,.03)",
          transition: "all .2s",
          position: "relative",
        }}
      >
        {/* Preview inside the drop zone when file is selected */}
        {value && !uploading && (
          <div style={{ position:"relative", display:"inline-block", marginBottom:10 }}>
            {isVideo ? (
              <video src={value} style={{ maxHeight:120, maxWidth:"100%", borderRadius:7, display:"block" }} />
            ) : (
              <img src={value} alt="preview"
                style={{ maxHeight:120, maxWidth:"100%", borderRadius:7, objectFit:"cover", display:"block" }} />
            )}
            <button
              type="button"
              onClick={e => { e.stopPropagation(); onChange(""); setStatus(null); setError(""); }}
              style={{ position:"absolute", top:-8, right:-8, width:22, height:22, borderRadius:"50%",
                background:"#e50914", border:"none", color:"white", cursor:"pointer",
                display:"flex", alignItems:"center", justifyContent:"center", fontSize:12, fontWeight:900 }}
              title="Remove"
            >×</button>
          </div>
        )}

        {/* Upload state */}
        {uploading ? (
          <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:8, color:"rgba(255,255,255,.6)" }}>
            <Loader size={28} style={{ animation:"spin 1s linear infinite", color:"#e50914" }} />
            <span style={{ fontSize:".82rem", fontWeight:600 }}>Uploading...</span>
          </div>
        ) : status === "ok" ? (
          <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:6 }}>
            <CheckCircle size={28} color="#4cde80" />
            <span style={{ fontSize:".82rem", color:"#4cde80", fontWeight:700 }}>Uploaded!</span>
            <span style={{ fontSize:".72rem", color:"rgba(255,255,255,.35)" }}>Click to replace</span>
          </div>
        ) : !value ? (
          <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:8,
            color:"rgba(255,255,255,.35)" }}>
            <Icon size={28} />
            <div>
              <span style={{ fontSize:".85rem", fontWeight:600, color:"rgba(255,255,255,.55)" }}>
                Click to upload
              </span>
              <span style={{ fontSize:".85rem", color:"rgba(255,255,255,.35)" }}> or drag & drop</span>
            </div>
            <span style={{ fontSize:".7rem" }}>{hint}</span>
          </div>
        ) : (
          <span style={{ fontSize:".72rem", color:"rgba(255,255,255,.3)", display:"block", marginTop:4 }}>
            Click or drag to replace
          </span>
        )}
      </div>

      {/* Error message */}
      {status === "error" && (
        <div style={{ display:"flex", alignItems:"center", gap:6, color:"#ff5252",
          fontSize:".78rem", background:"rgba(229,9,20,.1)", border:"1px solid rgba(229,9,20,.25)",
          borderRadius:7, padding:"7px 11px" }}>
          <AlertCircle size={14} /> {error}
        </div>
      )}

      <input ref={fileRef} type="file" accept={accept} style={{ display:"none" }} onChange={handleFile} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}