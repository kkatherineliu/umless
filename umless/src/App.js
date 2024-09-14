import React, { useState, useRef } from 'react';
import './App.css';

function App() {
  const videoRef = useRef(null);
  const [recording, setRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const [recognitionInstance, setRecognitionInstance] = useState(null);

  const startSpeechRecognition = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();

    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onresult = (event) => {
      let finalTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
          setInterimTranscript('');
        } else {
          setInterimTranscript(event.results[i][0].transcript);
        }
      }

      setTranscript((prev) => prev + finalTranscript);
    };

    recognition.onerror = (event) => {
      console.error("Speech recognition error: ", event.error);
    };

    recognition.onend = () => {
      console.log("Speech recognition ended.");
    };

    recognition.start();
    setRecognitionInstance(recognition);
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      
      videoRef.current.srcObject = stream;

      const recorder = new MediaRecorder(stream);
      setMediaRecorder(recorder);

      recorder.start();
      setRecording(true);

      startSpeechRecognition();
    } catch (error) {
      console.error('Error accessing webcam or microphone:', error);
    }
  };

  const stopRecording = (recorder, recognition) => {
    if (recorder) {
      recorder.stop();
    }
    if (recognition) {
      recognition.stop();
    }
    setRecording(false);
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>umless</h1>
        
        <video ref={videoRef} autoPlay playsInline className="video" />

        {!recording ? (
          <button onClick={startRecording}>Start Recording</button>
        ) : (
          <button onClick={() => stopRecording(mediaRecorder, recognitionInstance)}>Stop Recording</button>
        )}

        <div className="transcript-container">
          <p>{transcript} <span style={{ color: 'gray' }}>{interimTranscript}</span></p> {/* Display final and interim */}
        </div>
      </header>
    </div>
  );
}

export default App;
