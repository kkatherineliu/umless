import React, { useState, useRef, useEffect } from 'react';
import './App.css';

function RecordingPage() {
  const videoRef = useRef(null);
  const [status, setStatus] = useState('Disconnected');
  const [fillerWordCount, setFillerWordCount] = useState(0); // Track filler words
  const [recording, setRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const [recognitionInstance, setRecognitionInstance] = useState(null);
  const [socketInstance, setSocketInstance] = useState(null);

  const startSpeechRecognition = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      const socket = new WebSocket('wss://api.deepgram.com/v1/listen?model=nova-2&filler_words=true', [
        'token',
        process.env.REACT_APP_API_KEY,
      ]);

      socket.onopen = () => {
        console.log('WebSocket connection opened.');
        setStatus('Connected');

        // Send audio data every 250ms
        mediaRecorder.addEventListener('dataavailable', (event) => {
          if (event.data.size > 0 && socket.readyState === 1) {
            socket.send(event.data);
          }
        });

        mediaRecorder.start(250);
        setMediaRecorder(mediaRecorder); // Save recorder in state
        setSocketInstance(socket); // Save socket in state
      };

      // Handle incoming transcript messages from Deepgram
      socket.onmessage = (message) => {
        const received = JSON.parse(message.data);
        const newTranscript = received.channel.alternatives[0]?.transcript || '';

        // Append transcript regardless of filler words
        if (newTranscript && received.is_final) {
          setTranscript((prev) => prev + newTranscript + ' ');

          // Check for filler words and update the tally
          const fillerWords = ['uh', 'um', 'mhmm', 'mm-mm', 'uh-uh', 'uh-huh', 'nuh-uh', 'like', 'you know', 'so']; // Example filler words
          const wordArray = newTranscript.split(' '); // Split transcript into words
          const countFiller = wordArray.reduce((count, word) => {
            return fillerWords.includes(word) ? count + 1 : count;
          }, 0);

          // Add the count of filler words to the running tally
          setFillerWordCount((prevCount) => prevCount + countFiller);
        }
      };

      socket.onclose = () => {
        console.log('WebSocket connection closed.');
        setStatus('Disconnected');
      };

      socket.onerror = (error) => {
        console.log('WebSocket error:', error);
        setStatus('Error');
      };
    } catch (error) {
      console.error('Error accessing media devices.', error);
      setStatus('Error accessing microphone');
    }
  };

  useEffect(() => {
    return () => {
      if (mediaRecorder && mediaRecorder.state !== 'inactive') {
        mediaRecorder.stop();
      }
      if (socketInstance && socketInstance.readyState === WebSocket.OPEN) {
        socketInstance.close();
      }
    };
  }, [mediaRecorder, socketInstance]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });

      videoRef.current.srcObject = stream;

      startSpeechRecognition(); // Start the speech recognition with Deepgram

      setRecording(true);
    } catch (error) {
      console.error('Error accessing webcam or microphone:', error);
    }
  };

  const stopRecording = () => {
    if (mediaRecorder) {
      mediaRecorder.stop();
    }
    if (socketInstance) {
      socketInstance.close();
    }
    if (recognitionInstance) {
      recognitionInstance.stop();
    }
    setRecording(false);
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>umless</h1>
        
        <video ref={videoRef} autoPlay playsInline className="video" />
        <p>Status: {status}</p>
        <p>Transcript: {transcript}</p>
        <p>Filler Word Count: {fillerWordCount}</p>
        {!recording ? (
          <button onClick={startRecording}>Start Recording</button>
        ) : (
          <button onClick={stopRecording}>Stop Recording</button>
        )}

        <div className="transcript-container">
          <p>{transcript} <span style={{ color: 'gray' }}>{interimTranscript}</span></p> {/* Display final and interim */}
        </div>
      </header>
    </div>
  );
}

export default RecordingPage;
