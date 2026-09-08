import React, { useRef, useState } from "react";
import { Upload, X, CheckCircle, AlertCircle, Loader } from "lucide-react";
import { uploadAPI } from "../services/api";

export default function ImageUpload({
  value,
  onChange,
  label    = "Image",
  accept   = "image/*",
  type     = "image",    // "image" | "video" | "ad"
}) {
  const [uploading, setUploading] = useState(false);
  const [progress,  setProgress]  = useState(0);
  const [status,    setStatus]    = useState(null); // null | "ok" | "error"
  const [error,     setError]     = useState("");
  const fileRef = useRef();

  const handleFile = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate size before sending (100 MB max)
    if (file.size > 100 * 1024 * 1024) {
      setError("File too large. Maximum size is 100 MB.");
      setStatus("error");
      return;
    }

    setUploading(true); setStatus(null); setError(""); setProgress(0);
    try {
      const onProgress = (p) => setProgress(p);
      let data;
      if      (type === "video") data = await uploadAPI.video(file, onProgress);
      else if (type === "ad")    data = await uploadAPI.ad(file, onProgress);
      else                       data = await uploadAPI.image(file, onProgress);

      onChange(data.url);
      setStatus("ok");
      setTimeout(() => setStatus(null), 3000);
    } catch(err) {
      setError(err.message || "Upload failed. Check your connection.");
      setStatus("error");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const sizeLabel = type === "video" ? "MP4, WebM — max 100MB" : "JPEG, PNG, WebP, GIF — max 100MB";

  return (
    <div style={{display:"flex",flexDirection:"column",gap:6}}>
      <label style={{fontSize:".78rem",fontWeight:600,color:"rgba(255,255,255,.5)",textTransform:"uppercase",letterSpacing:".6px"}}>
        {label}
      </label>

      {/* URL input + upload button row */}
      <div style={{display:"flex",gap:8,alignItems:"center"}}>
        <input
          type="url"
          placeholder="Paste a URL or click Upload to choose a file..."
          value={value || ""}
          onChange={e => { onChange(e.target.value); setStatus(null); }}
          style={{flex:1,background:"rgba(255,255,255,.05)",border:"1px solid rgba(255,255,255,.1)",borderRadius:8,color:"white",padding:"9px 12px",fontSize:".9rem",outline:"none",fontFamily:"inherit"}}
        />

        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          style={{
            display:"flex",alignItems:"center",gap:6,
            background: uploading ? "rgba(255,255,255,.04)" : "rgba(229,9,20,0.15)",
            border: "1px solid rgba(229,9,20,0.3)",
            borderRadius:8,color:"white",padding:"9px 14px",
            cursor: uploading ? "not-allowed" : "pointer",
            fontSize:".82rem",fontWeight:700,whiteSpace:"nowrap",
            opacity: uploading ? 0.6 : 1,
            transition:"all .2s",
          }}
        >
          {uploading
            ? <><Loader size={14} style={{animation:"spin 1s linear infinite"}}/> {progress > 0 ? `${progress}%` : "Uploading..."}</>
            : <><Upload size={14}/> Upload File</>
          }
        </button>

        {value && (
          <button
            type="button"
            onClick={() => { onChange(""); setStatus(null); setError(""); }}
            title="Remove"
            style={{background:"none",border:"none",color:"rgba(255,255,255,.3)",cursor:"pointer",padding:4,display:"flex"}}
          >
            <X size={16}/>
          </button>
        )}
      </div>

      <input
        ref={fileRef}
        type="file"
        accept={accept}
        style={{display:"none"}}
        onChange={handleFile}
      />

      {uploading && (
        <div style={{width: "100%", height: 4, background: "rgba(255,255,255,0.1)", borderRadius: 2, overflow: "hidden", marginTop: 4}}>
          <div style={{height: "100%", width: `${progress}%`, background: "#e50914", transition: "width 0.2s"}} />
        </div>
      )}

      {/* Status messages */}
      {status === "ok" && (
        <div style={{display:"flex",alignItems:"center",gap:6,color:"#4cde80",fontSize:".78rem"}}>
          <CheckCircle size={14}/> Uploaded successfully
        </div>
      )}
      {status === "error" && (
        <div style={{display:"flex",alignItems:"center",gap:6,color:"#ff5252",fontSize:".78rem",background:"rgba(229,9,20,.1)",border:"1px solid rgba(229,9,20,.25)",borderRadius:6,padding:"6px 10px"}}>
          <AlertCircle size={14}/> {error}
        </div>
      )}

      {/* File type hint */}
      {!value && (
        <span style={{fontSize:".68rem",color:"rgba(255,255,255,.25)"}}>{sizeLabel}</span>
      )}

      {/* Preview */}
      {value && type !== "video" && (
        <img
          src={value}
          alt="preview"
          onError={() => { setError("Could not load image. Check the URL."); setStatus("error"); }}
          style={{maxHeight:90,maxWidth:220,borderRadius:7,objectFit:"cover",marginTop:2,border:"1px solid rgba(255,255,255,.1)"}}
        />
      )}
      {value && type === "video" && (
        <video
          src={value}
          controls
          style={{maxHeight:90,maxWidth:220,borderRadius:7,marginTop:2,border:"1px solid rgba(255,255,255,.1)"}}
        />
      )}

      {/* Spin animation */}
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}