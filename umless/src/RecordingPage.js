import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./App.css";

function RecordingPage() {
  const videoRef = useRef(null);
  const [status, setStatus] = useState('Disconnected');
  const [fillerWordCount, setFillerWordCount] = useState(0);
  const [recording, setRecording] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [interimTranscript, setInterimTranscript] = useState("");
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const [socketInstance, setSocketInstance] = useState(null);
  const navigate = useNavigate(); 

  const [wpm, setWpm] = useState(0);
  const [paceStatus, setPaceStatus] = useState('Normal');

  const startSpeechRecognition = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      const socket = new WebSocket(
        "wss://api.deepgram.com/v1/listen?model=nova-2&filler_words=true",
        ["token", process.env.REACT_APP_API_KEY]
      );

      let startTime = Date.now();
      let wordCount = 0;

      socket.onopen = () => {
        console.log("WebSocket connection opened.");
        setStatus("Connected");

        // Send audio data every 250ms
        mediaRecorder.addEventListener("dataavailable", (event) => {
          if (event.data.size > 0 && socket.readyState === 1) {
            socket.send(event.data);
          }
        });

        mediaRecorder.start(250);
        setMediaRecorder(mediaRecorder);
        setSocketInstance(socket);
      };

      socket.onmessage = (message) => {
        const received = JSON.parse(message.data);
        const newTranscript =
          received.channel.alternatives[0]?.transcript || "";

        if (newTranscript && received.is_final) {
          setTranscript((prev) => prev + newTranscript + " ");

          // Check for filler words and update the tally
          const fillerWords = [
            "uh",
            "um",
            "mhmm",
            "mm-mm",
            "uh-uh",
            "uh-huh",
            "nuh-uh",
            "like",
            "so",
          ]; // Example filler words
          const wordArray = newTranscript.split(" "); // Split transcript into words
          const countFiller = wordArray.reduce((count, word) => {
            return fillerWords.includes(word) ? count + 1 : count;
          }, 0);
          setFillerWordCount((prevCount) => prevCount + countFiller);

          wordCount += wordArray.length;

          if (Date.now() - startTime >= 2000) {
            const elapsedMinutes = (Date.now() - startTime) / 60000;
            const wpm = Math.round(wordCount / elapsedMinutes / 2);

            setWpm(wpm);
            setPaceStatus(getPaceStatus(wpm));

            startTime = Date.now();
            wordCount = 0;
          }
        }
      };

      socket.onclose = () => {
        console.log("WebSocket connection closed.");
        setStatus("Disconnected");
      };

      socket.onerror = (error) => {
        console.log("WebSocket error:", error);
        setStatus("Error");
      };
    } catch (error) {
      console.error("Error accessing media devices.", error);
      setStatus("Error accessing microphone");
    }
  };

  const getPaceStatus = (wpm) => {
    if (wpm > 200) return 'Too fast';
    if (wpm > 150) return 'A little fast';
    if (wpm > 100) return 'Normal';
    if (wpm > 50) return 'A little slow';
    return 'Too slow';
  };

  useEffect(() => {
    return () => {
      if (mediaRecorder && mediaRecorder.state !== "inactive") {
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

      startSpeechRecognition();

      setRecording(true);
    } catch (error) {
      console.error("Error accessing webcam or microphone:", error);
    }
  };

  const stopRecording = () => {
    if (mediaRecorder) {
      mediaRecorder.stop();
    }
    if (socketInstance) {
      socketInstance.close();
    }
    setRecording(false);

    navigate("/results", {
      state: {
        fillerWordCount,
        transcript },
    });
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>umless</h1>

        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="video"
          style={{ transform: "scaleX(-1)" }}
        />
        <p>Status: {status}</p>
        <p>Transcript: {transcript}</p>
        <p>Filler Word Count: {fillerWordCount}</p>
        <p>Words Per Minute: {wpm}</p>
        <p>Pace: {paceStatus}</p>
        {!recording ? (
          <button onClick={startRecording}>Start Recording</button>
        ) : (
          <button onClick={stopRecording}>Stop Recording</button>
        )}
        <div className="transcript-container">
          <p>
           
            <span style={{ color: "gray" }}>{interimTranscript}</span>
          </p>{" "}
          {/* Display final and interim */}
        </div>
      </header>
    </div>
  );
}

export default RecordingPage;
