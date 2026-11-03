import { Mic, Square, Trash2 } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

export function RecordingControls({ onRecorded }) {
  const recorderRef = useRef(null); const streamRef = useRef(null); const chunksRef = useRef([]); const urlRef = useRef('');
  const [recording, setRecording] = useState(false); const [recordingUrl, setRecordingUrl] = useState(''); const [error, setError] = useState(''); const [unsupported, setUnsupported] = useState(false);
  useEffect(() => () => { streamRef.current?.getTracks().forEach((track) => track.stop()); if (urlRef.current) URL.revokeObjectURL(urlRef.current); }, []);
  async function start() {
    setError(''); setUnsupported(false);
    if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) { setUnsupported(true); return; }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true }); streamRef.current = stream; chunksRef.current = [];
      const recorder = new MediaRecorder(stream); recorderRef.current = recorder;
      recorder.ondataavailable = (event) => { if (event.data.size) chunksRef.current.push(event.data); };
      const startedAt = Date.now();
      recorder.onstop = () => { const blob = new Blob(chunksRef.current, { type: recorder.mimeType || 'audio/webm' }); if (urlRef.current) URL.revokeObjectURL(urlRef.current); urlRef.current = URL.createObjectURL(blob); setRecordingUrl(urlRef.current); stream.getTracks().forEach((track) => track.stop()); streamRef.current = null; onRecorded?.(Math.min(1800, Math.round((Date.now() - startedAt) / 1000))); };
      recorder.start(); setRecording(true);
    } catch (cause) { setError(cause.name === 'NotAllowedError' ? 'Microphone access was declined. You can still listen and practise writing.' : 'The microphone could not be started on this device.'); }
  }
  function stop() { if (recorderRef.current?.state === 'recording') recorderRef.current.stop(); setRecording(false); }
  function remove() { if (urlRef.current) URL.revokeObjectURL(urlRef.current); urlRef.current = ''; setRecordingUrl(''); chunksRef.current = []; }
  return <section className="recording-practice"><div className="section-kicker">SPEAKING PRACTICE</div><h3>Record yourself</h3><p>Microphone access starts only when you choose to record. Your recording stays on this device and is not uploaded.</p>{unsupported && <p className="detail-empty">Microphone recording is not supported in this browser. Listening practice is still available.</p>}{error && <p className="form-error" role="alert">{error}</p>}<div className="recording-actions">{recording ? <button type="button" className="button button-dark" onClick={stop}><Square size={14} /> Stop recording</button> : <button type="button" className="button button-outline" onClick={start}><Mic size={15} /> {recordingUrl ? 'Record again' : 'Start recording'}</button>}{recordingUrl && <button type="button" className="button button-outline" onClick={remove}><Trash2 size={14} /> Delete recording</button>}</div>{recording && <span className="recording-indicator" role="status">Recording…</span>}{recordingUrl && <audio className="self-audio" controls src={recordingUrl} aria-label="Play your local recording" />}</section>;
}
