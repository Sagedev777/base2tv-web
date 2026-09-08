import React, { useEffect, useRef, useState } from "react";
import Hls from "hls.js";
import { Volume2, VolumeX, Maximize } from "lucide-react";
import { scheduleAPI } from "../services/api";
import { tvSchedule as staticSchedule } from "../data/schedule";
import "./LivePlayer.css";
import AudienceStats from "./AudienceStats";

const LivePlayer = () => {
  const videoRef = useRef(null);
  const [muted, setMuted] = useState(true);
  const [error, setError] = useState(false);
  const [currentShow, setCurrentShow] = useState(null);

  // Detect current show from API, fall back to static
  useEffect(() => {
    const detect = async () => {
      try {
        const d = await scheduleAPI.getCurrent();
        setCurrentShow(d.show || null);
      } catch {
        // fallback to static schedule
        const now = new Date();
        const ugStr = new Intl.DateTimeFormat("en-US", { timeZone: "Africa/Kampala", hour: "numeric", minute: "numeric", hour12: false }).format(now);
        const [h, m] = ugStr.split(":").map(Number);
        const nowMins = h * 60 + m;
        const active = staticSchedule.find((show) => {
          const match = show.time.match(/(\d{1,2}:\d{2})\s*(AM|PM)/i);
          if (!match) return false;
          let [, timeStr, mod] = match;
          let [hours, mins] = timeStr.split(":").map(Number);
          if (mod.toUpperCase() === "PM" && hours < 12) hours += 12;
          if (mod.toUpperCase() === "AM" && hours === 12) hours = 0;
          const start = hours * 60 + mins;
          return nowMins >= start && nowMins < start + show.duration;
        });
        setCurrentShow(active || null);
      }
    };
    detect();
    const i = setInterval(detect, 60000);
    return () => clearInterval(i);
  }, []);

  // HLS stream
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const streamUrl = "https://stream.base2tv.ug/live/livestream.m3u8";
    if (Hls.isSupported()) {
      const hls = new Hls({ enableWorker: true, lowLatencyMode: true });
      hls.loadSource(streamUrl);
      hls.attachMedia(video);
      hls.on(Hls.Events.MANIFEST_PARSED, () => { video.play().catch(() => {}); });
      hls.on(Hls.Events.ERROR, (e, data) => { if (data.fatal) setError(true); });
      return () => hls.destroy();
    } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = streamUrl;
      video.addEventListener("loadedmetadata", () => { video.play().catch(() => {}); });
    }
  }, []);

  const toggleMute = () => {
    if (videoRef.current) { videoRef.current.muted = !muted; setMuted(!muted); }
  };

  const handleFullscreen = () => {
    const v = videoRef.current;
    if (!v) return;
    if (v.requestFullscreen) v.requestFullscreen();
    else if (v.webkitEnterFullscreen) v.webkitEnterFullscreen(); // iOS Safari
    else if (v.webkitRequestFullscreen) v.webkitRequestFullscreen();
  };

  return (
    <section className="live-player-section" id="live">
      <div className="player-container glass-panel">
        <div className="video-wrapper">
          {error ? (
            <div className="stream-error"><p>Stream is currently offline or loading…</p></div>
          ) : (
            <video
              ref={videoRef}
              className="main-video-player"
              muted={muted}
              autoPlay
              playsInline
              webkit-playsinline="true"
              x-webkit-airplay="allow"
            />
          )}

          <div className="live-badge">
            <span className="pulsing-dot" />
            LIVE
          </div>

          <div className="player-controls-overlay">
            <div className="show-info">
              <h2>{currentShow ? currentShow.title : "Base2 TV Uganda"}</h2>
              <p>{currentShow ? currentShow.description : "Live Broadcasting 24/7"}</p>
            </div>
            <div className="controls-row">
              <button className="control-btn play-btn" onClick={toggleMute} title={muted ? "Unmute" : "Mute"}>
                {muted ? <VolumeX fill="currentColor" color="black" /> : <Volume2 fill="currentColor" color="black" />}
              </button>
              <span className="mute-label">{muted ? "Click to Unmute" : "Playing Live"}</span>
              <div className="spacer" />
              <button className="control-btn" onClick={handleFullscreen} title="Fullscreen">
                <Maximize />
              </button>
            </div>
          </div>
        </div>
      </div>
      <AudienceStats />
    </section>
  );
};

export default LivePlayer;
