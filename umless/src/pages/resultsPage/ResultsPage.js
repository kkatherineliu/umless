import React from "react";
import { useLocation, useNavigate } from "react-router-dom";

function ResultsPage() {
  const navigate = useNavigate();
  const location = useLocation();

  const { fillerWordCount = 0, transcript = "" } = location.state || {};

  // Define the filler words to highlight
  const fillerWords = [
    "uh",
    "um",
    "mhmm",
    "mm-mm",
    "uh-uh",
    "uh-huh",
    "nuh-uh",
    "like",
  ];

  // Function to split transcript and highlight filler words
  const highlightFillerWords = (text) => {
    const words = text.split(" ");
    return words.map((word, index) => {
      const cleanWord = word.replace(/^[.,!?;:'"()[\]{}]+|[.,!?;:'"()[\]{}]+$/g, ''); // Clean punctuation
      if (fillerWords.includes(cleanWord)) {
        return (
          <span key={index} style={{ color: "red" }}>
            {word}{" "}
          </span>
        );
      }
      return word + " "; // Add a space after each word
    });
  };

  const handleNewRecording = () => {
    navigate("/record"); // Go back to the recording page
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>Recording Results</h1>
        <p>Filler Word Count: {fillerWordCount}</p>
        <p>You have donated ${(fillerWordCount * 0.05).toFixed(2)} to charity</p>
        <p>Transcript: {highlightFillerWords(transcript)}</p>
        <button onClick={handleNewRecording}>Start New Recording</button>
      </header>
    </div>
  );
}

export default ResultsPage;
