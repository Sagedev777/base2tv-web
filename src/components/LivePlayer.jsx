import React, { useEffect, useRef, useState } from "react";
import Hls from "hls.js";
import { Volume2, VolumeX, Maximize, SkipBack, SkipForward } from "lucide-react";
import "./LivePlayer.css";
import AudienceStats from "./AudienceStats";

const LivePlayer = () => {
  const videoRef = useRef(null);
  const controlsTimerRef = useRef(null);
  const [muted, setMuted] = useState(true);
  const [error, setError] = useState(false);
  const [controlsVisible, setControlsVisible] = useState(true);

  const showControls = () => {
    setControlsVisible(true);
    if (controlsTimerRef.current) clearTimeout(controlsTimerRef.current);
    controlsTimerRef.current = setTimeout(() => setControlsVisible(false), 3500);
  };

  useEffect(() => {
    showControls();
    const handleScroll = () => showControls();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", handleScroll);
      if (controlsTimerRef.current) clearTimeout(controlsTimerRef.current);
    };
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

  const seekVideo = (seconds) => {
    const video = videoRef.current;
    if (!video || !video.seekable.length) return;
    const start = video.seekable.start(0);
    const end = video.seekable.end(video.seekable.length - 1);
    video.currentTime = Math.max(start, Math.min(end, video.currentTime + seconds));
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
        <div
          className="video-wrapper"
          onMouseMove={showControls}
          onTouchStart={showControls}
          onClick={showControls}
          onWheel={showControls}
          onKeyDown={showControls}
        >
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

          <div className={`player-controls-overlay ${controlsVisible ? "" : "controls-hidden"}`}>
            <div className="controls-row">
              <button className="control-btn seek-btn" onClick={() => seekVideo(-10)} title="Skip back 10 seconds" aria-label="Skip back 10 seconds">
                <SkipBack />
              </button>
              <button className="control-btn seek-btn" onClick={() => seekVideo(10)} title="Skip forward 10 seconds" aria-label="Skip forward 10 seconds">
                <SkipForward />
              </button>
              <div className="spacer" />
              <button className="control-btn" onClick={handleFullscreen} title="Fullscreen">
                <Maximize />
              </button>
            </div>
          </div>
          <button className="control-btn play-btn always-mute-control" onClick={toggleMute} title={muted ? "Unmute" : "Mute"} aria-label={muted ? "Unmute" : "Mute"}>
            {muted ? <VolumeX fill="currentColor" color="black" /> : <Volume2 fill="currentColor" color="black" />}
          </button>
        </div>
      </div>
      <AudienceStats />
    </section>
  );
};

export default LivePlayer;
