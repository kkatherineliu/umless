import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "./ResultsPage.css";

function ResultsPage() {
  const navigate = useNavigate();
  const location = useLocation();

  const { fillerWordCount = 0, transcript = "" } = location.state || {};

  const fillerWords = [
    "uh", "um", "mhmm", "mm-mm", "uh-uh", "uh-huh", "nuh-uh", "like"
  ];

  const highlightFillerWords = (text) => {
    const regex = new RegExp(`\\b(${fillerWords.join('|')})\\b`, 'gi');
    return text.replace(regex, (match) => `<span class="highlight">${match}</span>`);
  };
  let countFiller = 0;
  transcript.split(' ').forEach((word) => {
    const cleanedWord = word.replace(/^[.,!?;:'"()[\]{}]+|[.,!?;:'"()[\]{}]+$/g, "").toLowerCase();
    // console.log(cleanedWord)

    if (fillerWords.includes(cleanedWord)) {
      countFiller += 1
    }
  });

  const handleNewRecording = () => {
    navigate("/record");
  };

  return (
    <div className="results-page-container">
      <h1>RECORDING RESULTS</h1>
      <div
        className="transcript-box"
        dangerouslySetInnerHTML={{ __html: highlightFillerWords(transcript) }}
      />
      <div className="results-stats">
        <div className="results-stat">
          <span>
            <span className="stat-label">FILLER</span>
            <span className="stat-label">WORDS:</span>
          </span>
          <span className="stat-value">{countFiller}</span>
        </div>
        <div className="results-stat">
          <span>
            <span className="stat-label">AMOUNT</span>
            <span className="stat-label">DONATED:</span>
          </span>
          <span className="stat-value">${(countFiller * 0.05).toFixed(2)}</span>
        </div>
        <div className="button-container">
          <button onClick={handleNewRecording}>new recording</button>
          <button>see history</button>
        </div>
      </div>
    </div>
  );
}

export default ResultsPage;
