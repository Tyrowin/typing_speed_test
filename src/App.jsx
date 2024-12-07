import React, { useEffect, useRef, useState } from "react";
import "./App.css";
import wordsData from "./en.json"; // Import the words data

// Function to shuffle an array
const shuffleArray = (array) => {
  let shuffledArray = [...array];
  for (let i = shuffledArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffledArray[i], shuffledArray[j]] = [shuffledArray[j], shuffledArray[i]];
  }
  return shuffledArray;
};

function App() {
  const [userInput, setUserInput] = useState("");
  const [words, setWords] = useState([]); // Full list of words
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [visibleWords, setVisibleWords] = useState([]); // Words visible in the box
  const [isTestStarted, setIsTestStarted] = useState(false);
  const [isTestFinished, setIsTestFinished] = useState(false);
  const [wpm, setWpm] = useState(0);
  const [errors, setErrors] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(60);
  const [selectedDuration, setSelectedDuration] = useState(60); // Default duration is 60 seconds
  const [totalCharactersTyped, setTotalCharactersTyped] = useState(0);
  const [correctCharacters, setCorrectCharacters] = useState(0);
  const [accuracy, setAccuracy] = useState(100);

  const wordBoxRef = useRef(null); // Reference for scrolling

  const ROW_SIZE = 10; // Number of words per row
  const CHUNK_SIZE = ROW_SIZE * 2; // Number of words to display at a time

  useEffect(() => {
    if (isTestStarted && timeRemaining > 0 && !isTestFinished) {
      const timerInterval = setInterval(() => {
        setTimeRemaining((prevTime) => prevTime - 1);
      }, 1000);

      return () => clearInterval(timerInterval);
    }
  }, [isTestStarted, timeRemaining, isTestFinished]);

  useEffect(() => {
    if (timeRemaining === 0 && !isTestFinished) {
      calculateWpm();
      setIsTestFinished(true);
    }
  }, [timeRemaining]);

  useEffect(() => {
    const shuffledWords = shuffleArray(wordsData.words);
    setWords(shuffledWords);
    setCurrentWordIndex(0);
    setUserInput("");
    setVisibleWords(shuffledWords.slice(0, CHUNK_SIZE)); // Initialize the first chunk
    setIsTestFinished(false);
    setTimeRemaining(selectedDuration);
    setErrors(0);
    setTotalCharactersTyped(0);
    setCorrectCharacters(0);
    setAccuracy(100);
  }, [selectedDuration]);

  const handleInputChange = (e) => {
    const input = e.target.value;
    const targetWord = words[currentWordIndex].englishWord;

    // Increment total characters typed
    setTotalCharactersTyped((prev) => prev + 1);

    // Check if the current keystroke is correct
    if (
      input[input.length - 1] &&
      input[input.length - 1] === targetWord[input.length - 1]
    ) {
      setCorrectCharacters((prev) => prev + 1);
    } else if (input[input.length - 1]) {
      setErrors((prevErrors) => prevErrors + 1); // Increment errors for mismatched characters
    }

    setUserInput(input);

    if (!isTestStarted) {
      setIsTestStarted(true);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === " " && !isTestFinished) {
      if (userInput.trim() === words[currentWordIndex].englishWord) {
        const nextIndex = currentWordIndex + 1;
        setCurrentWordIndex(nextIndex);
        setUserInput(""); // Clear input box

        if (nextIndex % ROW_SIZE === 0) {
          const nextChunkStart = Math.floor(nextIndex / ROW_SIZE) * ROW_SIZE;
          const nextChunkEnd = nextChunkStart + CHUNK_SIZE;
          setVisibleWords(words.slice(nextChunkStart, nextChunkEnd));
          scrollToNextRow();
        }

        if (nextIndex === words.length) {
          setIsTestFinished(true);
          calculateWpm();
        }
      }
      e.preventDefault(); // Prevent default space behavior
    }
  };

  const scrollToNextRow = () => {
    if (wordBoxRef.current) {
      wordBoxRef.current.scrollTop += wordBoxRef.current.offsetHeight / 2;
    }
  };

  const calculateWpm = () => {
    const wordsTyped = currentWordIndex + 1;
    const timeInMinutes = selectedDuration / 60;
    setWpm(Math.round(wordsTyped / timeInMinutes));

    // Calculate accuracy
    const accuracyPercentage =
      Math.round((correctCharacters / totalCharactersTyped) * 100) || 0;
    setAccuracy(accuracyPercentage);
  };

  const handleDurationChange = (duration) => {
    setSelectedDuration(duration);
  };

  const resetTest = () => {
    setUserInput("");
    setCurrentWordIndex(0);
    setVisibleWords(words.slice(0, CHUNK_SIZE));
    setIsTestStarted(false);
    setIsTestFinished(false);
    setErrors(0);
    setWpm(0);
    setTimeRemaining(selectedDuration);
    setTotalCharactersTyped(0);
    setCorrectCharacters(0);
    setAccuracy(100);
    if (wordBoxRef.current) {
      wordBoxRef.current.scrollTop = 0; // Reset scroll position
    }
  };

  const getWordClass = (index) => {
    const visibleStartIndex =
      Math.floor(currentWordIndex / ROW_SIZE) * ROW_SIZE;
    const actualIndex = currentWordIndex - visibleStartIndex;

    if (index < actualIndex) {
      return "correct";
    } else if (index === actualIndex) {
      return "current";
    }
    return "";
  };

  return (
    <div className="App">
      <h1>Typing Speed Test</h1>
      <div className="duration-selector">
        <button onClick={() => handleDurationChange(15)}>15 Seconds</button>
        <button onClick={() => handleDurationChange(30)}>30 Seconds</button>
        <button onClick={() => handleDurationChange(60)}>60 Seconds</button>
        <button onClick={() => handleDurationChange(120)}>120 Seconds</button>
      </div>

      <div className="test-container">
        <div className="word-list-box" ref={wordBoxRef}>
          <div className="word-list">
            {visibleWords.map((word, index) => (
              <span key={index} className={getWordClass(index)}>
                {word.englishWord}{" "}
              </span>
            ))}
          </div>
        </div>

        <textarea
          value={userInput}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          disabled={isTestFinished}
          placeholder={isTestFinished ? "Test Finished!" : "Start typing..."}
          className="input-box"
        />

        <div className="results">
          {isTestStarted && !isTestFinished && (
            <div className="timer">
              <p>Time remaining: {timeRemaining}s</p>
            </div>
          )}
          {isTestFinished && (
            <>
              <p>Your typing speed: {wpm} WPM</p>
              <p>Errors: {errors}</p>
              <p>Accuracy: {accuracy}%</p>
            </>
          )}
        </div>

        <button className="restart-button" onClick={resetTest}>
          Restart Test
        </button>
      </div>
    </div>
  );
}

export default App;
