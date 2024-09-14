import React, { useState, useRef } from 'react';
import './App.css';

function App() {
  const videoRef = useRef(null);
  const [recording, setRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const [recordedChunks, setRecordedChunks] = useState([]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      
      videoRef.current.srcObject = stream;

      const recorder = new MediaRecorder(stream);
      setMediaRecorder(recorder);

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          setRecordedChunks((prev) => [...prev, event.data]);
        }
      };

      recorder.start();
      setRecording(true);

      // Stop recording after 5 seconds for demo purposes
      setTimeout(() => stopRecording(recorder), 5000);

    } catch (error) {
      console.error('Error accessing webcam or microphone:', error);
    }
  };

  const stopRecording = (recorder) => {
    recorder.stop();
    setRecording(false);
  };

  const downloadRecording = () => {
    const blob = new Blob(recordedChunks, { type: 'video/webm' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'presentation.webm';
    a.click();
    URL.revokeObjectURL(url);
    setRecordedChunks([]);
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>umless</h1>
        <video ref={videoRef} autoPlay playsInline style={{ width: '600px', height: '400px', backgroundColor: 'black' }} />
        
        {!recording ? (
          <button onClick={startRecording}>Start Recording</button>
        ) : (
          <button onClick={() => stopRecording(mediaRecorder)}>Stop Recording</button>
        )}

        {recordedChunks.length > 0 && (
          <button onClick={downloadRecording}>Download Video</button>
        )}
      </header>
    </div>
  );
}

export default App;
