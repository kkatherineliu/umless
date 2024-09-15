import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./RecordingPage.css";

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
  const [paceStatus, setPaceStatus] = useState('NORMAL');

  const startSpeechRecognition = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      const socket = new WebSocket(
        `wss://api.deepgram.com/v1/listen?model=nova-2&filler_words=true&interim_results=true&vad_events=true&endpointing=300&smart_format=true`,
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
        if (received.channel && received.channel.alternatives && received.channel.alternatives[0]) {
          const newTranscript = received.channel.alternatives[0].transcript || ""; // represents the intermin chunk

          const isFinal = received.is_final;  // Check if the transcript is final
          // console.log(received); // to test the is final stuff??

          if (isFinal) {
            setTranscript((prev) => {
              // console.log("Total transcript:", prev + newTranscript);
              return (prev + newTranscript + " ").toLowerCase();
            });
            setInterimTranscript("");

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
            ]; // Example filler words
            const wordArray = newTranscript.split(" ");
            const countFiller = wordArray.reduce((count, word) => {
              return fillerWords.includes(word.replace(/^[.,!?;:'"()[\]{}]+|[.,!?;:'"()[\]{}]+$/g, '')) ? count + 1 : count;
            }, 0);

            setFillerWordCount((prevCount) => {
              const newCount = prevCount + countFiller;
              // console.log("Updated filler word count:", newCount);
              return newCount;
            });

            wordCount += wordArray.length;

            if (Date.now() - startTime >= 2000) {
              const elapsedMinutes = (Date.now() - startTime) / 60000;
              const wpm = Math.round(wordCount / elapsedMinutes / 2);

              setWpm(wpm);
              setPaceStatus(getPaceStatus(wpm));

              startTime = Date.now();
              wordCount = 0;
            }
          } else {
            setInterimTranscript(newTranscript.toLowerCase());
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
    if (wpm > 200) return 'TOO FAST';
    if (wpm > 150) return 'A LITTLE FAST';
    if (wpm > 100) return 'NORMAL';
    if (wpm > 50) return 'A LITTLE SLOW';
    return 'TOO SLOW';
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
    <div className="container">
      <div className="video-container">
        <video className="video"
          ref={videoRef}
          autoPlay
          playsInline
          muted
          style={{ transform: "scaleX(-1)" }}
        />
        {!recording ? (
          <button onClick={startRecording}>Start Recording</button>
        ) : (
          <button onClick={stopRecording}>Stop Recording</button>
        )}
      </div>

      <div className="stats-container">
        <div className="statistic">
          <span className="label">FILLER WORDS</span>
          <span className="value">{fillerWordCount}</span>
        </div>
        <div className="statistic">
        <span className="label">SPEED (WPM)</span>
          <span className="value">{wpm}</span>
        </div>
        <div className="statistic">
          <span className="label pace-label">{paceStatus}</span>
        </div>
        <div className="transcript-container" style={{"min-height": "135px"}}>
          <div className="transcript">{interimTranscript}</div>
        </div>
      </div>
    </div>
  );
}

export default RecordingPage;

