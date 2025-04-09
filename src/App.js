import React, { useRef, useState } from 'react';
import YouTubePodcast from './components/YouTubePodcast';
import './App.css';

function App() {
  const playerRef = useRef(null);
  const [bootSequence, setBootSequence] = useState(false);
  
  // Define techno tracks
  const technoTracks = [
    '/audio/techno1.mp3',
    '/audio/techno2.mp3',
    '/audio/techno3.mp3'
  ];
  
  return (
    <div className="cyber-app">
      <div className="crt-grid"></div>
      
      <header className="cyber-header">
        <div className="cyber-title-container">
          <h1 className="cyber-title">BLOOMBERG<span className="highlight"> TECHNO</span></h1>
        </div>
      </header>

      <main className="cyber-main">
        <section className="cyber-section">
          <YouTubePodcast 
            ref={playerRef}
            technoTracks={technoTracks}
          />
        </section>
      </main>

      <footer className="cyber-footer">
        <div className="cyber-copyright">
          <span>
            [<a href="https://rana.land" target="_blank" rel="noopener noreferrer" className="cyber-link">rana.land</a>] © 2025
          </span>
          <span className="terminal-cursor">█</span>
        </div>
      </footer>
    </div>
  );
}

export default App;
