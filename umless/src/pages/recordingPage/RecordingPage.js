import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./RecordingPage.css";

function RecordingPage() {
  const videoRef = useRef(null);
  const [status, setStatus] = useState("Disconnected");
  const [fillerWordCount, setFillerWordCount] = useState(0);
  const [recording, setRecording] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [interimTranscript, setInterimTranscript] = useState("");
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const [socketInstance, setSocketInstance] = useState(null);
  const [armPosition, setArmPosition] = useState(0);
  const [coinPositionX, setCoinPositionX] = useState(0);
  const [coinPositionY, setCoinPositionY] = useState(0);
  const [coinVisible, setCoinVisible] = useState(true);
  const navigate = useNavigate();

  const [wpm, setWpm] = useState(0);
  const [paceStatus, setPaceStatus] = useState("Normal");

  const coinDrop = () => {
    // Move both the arm and coin 80px to the left
    setArmPosition(armPosition - 120);
    setCoinPositionX(coinPositionX - 90);

    setTimeout(() => {
      setArmPosition(armPosition); 
      setCoinPositionY(coinPositionY + 90); 
      setTimeout(() => {
        setCoinVisible(false);
        setCoinPositionY(coinPositionY); 
        setCoinPositionX(coinPositionX); 
      }, 1000);
    }, 1000); // 1 second delay

    setCoinVisible(true);

    //setCoinVisible(false);
    //setTimeout(()=>{
    //  setCoinPositionY(coinPositionY);
      //setCoinPositionX(coinPositionX);
    //}, 1000)
    //setCoinVisible(true);
  };

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
        if (
          received.channel &&
          received.channel.alternatives &&
          received.channel.alternatives[0]
        ) {
          const newTranscript =
            received.channel.alternatives[0].transcript || ""; // represents the intermin chunk

          const isFinal = received.is_final; // Check if the transcript is final
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
              // Clean the word by removing punctuation
              const cleanedWord = word.replace(/^[.,!?;:'"()[\]{}]+|[.,!?;:'"()[\]{}]+$/g, "");
              
              // Check if the cleaned word is in the list of filler words
              if (fillerWords.includes(cleanedWord)) {
                coinDrop();
                return count + 1; // Increment count if it is a filler word
              } else {
                return count; // Return the current count if it is not a filler word
              }
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
    if (wpm > 200) return "Too fast";
    if (wpm > 150) return "A little fast";
    if (wpm > 100) return "Normal";
    if (wpm > 50) return "A little slow";
    return "Too slow";
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
        transcript,
      },
    });
  };

  return (
    <div className="container">
      <div className="video-container">
        <video
          className="video"
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
        <img
          src="/arm.png"
          alt="arm"
          style={{
            width: "150px",
            position: "absolute",
            right: "-150px",
            top: "20px",
            transform: `translateX(${armPosition}px)`,
            transition: "transform 0.5s ease",
          }}
        />
        <img
          src="/chinese-coin.png"
          alt="coin"
          style={{
            width: "30px",
            position: "absolute",
            right: "-30px",
            top: "70px",
            transform: `translateX(${coinPositionX}px) translateY(${coinPositionY}px)`,
            transition: "transform 0.5s ease",
            opacity: coinVisible ? 1 : 0, 
          }}
        />

        <div className="statistic">
          <span className="label">Filler Words</span>
          <span className="jar">{fillerWordCount}</span>
        </div>
        <div className="statistic">
          <span className="label">Speed (WPM)</span>
          <span className="value">{wpm}</span>
        </div>
        <div className="statistic">
          <span className="label">{paceStatus}</span>
        </div>
      </div>
    </div>
  );
}

export default RecordingPage;

// <div className="transcript-container">
// <p>Transcript: {transcript}<span style={{ color: "gray" }}>{interimTranscript}</span></p>
// </div>
