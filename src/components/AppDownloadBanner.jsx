import React from 'react';
import './AppDownloadBanner.css';

export default function AppDownloadBanner() {
  return (
    <section className="app-download-section">
      <div className="app-download-content">
        <h2>Take Base2 TV Everywhere</h2>
        <p>Download our new mobile app for iOS and Android. Watch live streams, read the latest news, and catch up on missed shows anywhere, anytime.</p>
        
        <div className="app-download-buttons">
          <a href="#download-android" className="store-btn android-btn">
            <div className="store-icon">
              <svg viewBox="0 0 24 24" fill="currentColor" width="24" height="24">
                <path d="M17.523 15.3414C17.523 15.3414 15.8267 12.3926 15.6599 12.0934C15.4931 11.7941 15.6702 11.4552 15.9868 11.4552H18.9103L12.0006 0L5.08984 11.4552H8.01429C8.33083 11.4552 8.508 11.7941 8.34114 12.0934C8.17429 12.3926 6.47805 15.3414 6.47805 15.3414C6.31119 15.6406 6.48835 15.9795 6.8049 15.9795H9.72834L2.81858 24L9.72834 16.5246H6.8049C6.48835 16.5246 6.31119 16.1857 6.47805 15.8865L12.0006 6.13028L17.523 15.8865C17.6899 16.1857 17.5127 16.5246 17.1962 16.5246H14.2727L21.1825 24L14.2727 15.9795H17.1962C17.5127 15.9795 17.6899 15.6406 17.523 15.3414Z"/>
              </svg>
            </div>
            <div className="store-text">
              <span>GET IT ON</span>
              <strong>Google Play</strong>
            </div>
          </a>

          <a href="#download-ios" className="store-btn ios-btn">
            <div className="store-icon">
              <svg viewBox="0 0 24 24" fill="currentColor" width="24" height="24">
                <path d="M12.0001 24C12.0001 24 16.5222 19.4779 16.5222 14.9558C16.5222 10.4336 12.0001 5.9115 12.0001 5.9115C12.0001 5.9115 7.47797 10.4336 7.47797 14.9558C7.47797 19.4779 12.0001 24 12.0001 24ZM12.0001 0C9.5539 0 7.57074 1.98316 7.57074 4.42926C7.57074 4.54533 7.57502 4.66035 7.58348 4.77416C9.91924 4.88725 11.9056 6.87353 12.0187 9.2093C12.1325 9.21775 12.2476 9.22204 12.3636 9.22204C14.8097 9.22204 16.7929 7.23888 16.7929 4.79278C16.7929 2.34668 14.8097 0.36352 12.3636 0.36352C12.242 0.36352 12.1209 0.36841 12.0001 0.37803V0Z"/>
              </svg>
            </div>
            <div className="store-text">
              <span>Download on the</span>
              <strong>App Store</strong>
            </div>
          </a>
        </div>
      </div>
      
      <div className="app-mockup">
        {/* Placeholder for phone mockup graphic */}
        <div className="phone-frame">
          <div className="phone-screen">
            <span className="phone-logo">Base2<br/>Telefwunkeni</span>
          </div>
        </div>
      </div>
    </section>
  );
}
