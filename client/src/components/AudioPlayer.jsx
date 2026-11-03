import { RotateCcw, Volume2 } from 'lucide-react';
import { useRef, useState } from 'react';

export function AudioPlayer({ src, label = 'Pronunciation audio', attribution = '', speaker = '' }) {
  const audioRef = useRef(null); const [speed, setSpeed] = useState(1); const [unavailable, setUnavailable] = useState(false);
  if (!src || unavailable) return <div className="audio-fallback"><Volume2 size={16} /> Audio is not available for this item.</div>;
  return <div className="audio-player"><audio ref={audioRef} controls preload="none" src={src} aria-label={label} onError={() => setUnavailable(true)} /><label>Speed<select value={speed} onChange={(event) => { const next = Number(event.target.value); setSpeed(next); if (audioRef.current) audioRef.current.playbackRate = next; }}><option value="1">Normal</option><option value="0.75">Slower</option></select></label><button type="button" className="icon-button audio-replay" onClick={() => { if (audioRef.current) { audioRef.current.currentTime = 0; audioRef.current.play(); } }} aria-label="Replay audio"><RotateCcw size={15} /></button>{(speaker || attribution) && <small>{speaker && `${speaker}${attribution ? ' · ' : ''}`}{attribution}</small>}</div>;
}
