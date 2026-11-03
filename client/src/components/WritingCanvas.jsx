import { Check, Eraser, Undo2 } from 'lucide-react';
import { useRef, useState } from 'react';

export function WritingCanvas({ reference, onSave }) {
  const canvasRef = useRef(null); const strokesRef = useRef([]); const activeRef = useRef(false); const startedRef = useRef(0); const [strokes, setStrokes] = useState([]); const [showReference, setShowReference] = useState(true);
  function redraw(next = strokesRef.current) {
    const canvas = canvasRef.current; if (!canvas) return;
    const rect = canvas.getBoundingClientRect(), ratio = window.devicePixelRatio || 1;
    canvas.width = Math.max(1, Math.round(rect.width * ratio)); canvas.height = Math.max(1, Math.round(rect.height * ratio));
    const context = canvas.getContext('2d'); context.setTransform(ratio, 0, 0, ratio, 0, 0); context.clearRect(0, 0, rect.width, rect.height); context.lineWidth = 5; context.lineCap = 'round'; context.lineJoin = 'round'; context.strokeStyle = '#315e54';
    for (const stroke of next) { if (!stroke.length) continue; context.beginPath(); context.moveTo(stroke[0].x * rect.width, stroke[0].y * rect.height); for (const point of stroke.slice(1)) context.lineTo(point.x * rect.width, point.y * rect.height); context.stroke(); }
  }
  function addPoint(event, start = false) {
    const canvas = canvasRef.current, rect = canvas.getBoundingClientRect(); const point = { x: Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width)), y: Math.max(0, Math.min(1, (event.clientY - rect.top) / rect.height)) };
    const next = strokesRef.current.map((stroke) => [...stroke]); if (start) { next.push([point]); startedRef.current ||= Date.now(); } else if (next.length) next[next.length - 1].push(point);
    strokesRef.current = next; setStrokes(next); redraw(next);
  }
  function undo() { const next = strokesRef.current.slice(0, -1); strokesRef.current = next; setStrokes(next); redraw(next); }
  function clear() { strokesRef.current = []; setStrokes([]); startedRef.current = 0; redraw([]); }
  async function save() { if (!strokesRef.current.length) return; const seconds = startedRef.current ? Math.min(1800, Math.round((Date.now() - startedRef.current) / 1000)) : 0; await onSave(seconds); clear(); }
  return <section className="writing-practice"><div className="writing-heading"><div><span className="section-kicker">WRITING PRACTICE</span><h3>Try writing it</h3></div><button type="button" className={`preference-chip ${showReference ? 'selected' : ''}`} onClick={() => setShowReference((value) => !value)}>{showReference ? 'Hide' : 'Show'} reference</button></div><p>Freehand practice only. This canvas does not assess handwriting or show verified stroke order.</p><div className="writing-board">{showReference && <span className="writing-reference" aria-hidden="true">{reference}</span>}<canvas ref={canvasRef} aria-label="Draw the character using touch, mouse, or stylus" onPointerDown={(event) => { activeRef.current = true; event.currentTarget.setPointerCapture(event.pointerId); addPoint(event, true); }} onPointerMove={(event) => { if (activeRef.current) addPoint(event); }} onPointerUp={() => { activeRef.current = false; }} onPointerCancel={() => { activeRef.current = false; }} /></div><div className="writing-actions"><button type="button" className="button button-outline" onClick={undo} disabled={!strokes.length}><Undo2 size={14} /> Undo stroke</button><button type="button" className="button button-outline" onClick={clear} disabled={!strokes.length}><Eraser size={14} /> Clear</button><button type="button" className="button button-dark" onClick={save} disabled={!strokes.length}><Check size={14} /> Save practice</button></div></section>;
}
