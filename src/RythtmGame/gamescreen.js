import { LEVELS } from "./levels.js";
import './gamescreen.css';

// Get DOM elements
const countdownElement = document.getElementById("countdown");
const gameContainer = document.getElementById("game-container");
const lanes = document.querySelectorAll(".lane");
const logContainer = document.getElementById("log-container");
const gameMusic = document.getElementById("gameMusic");
const settingsBtn = document.getElementById("settingsBtn");
const settingsModal = document.getElementById("settingsModal");
const homeBtn = document.getElementById("homeBtn");
const endBtn = document.getElementById("endBtn");
const resumeBtn = document.getElementById("resumeBtn");

// Variables tracking game state
let countdown = 1;
let perfectStreak = 0;
let numOfNotes = 0;
let totalHits = 0;
let isPaused = false;
let gameStartTime = 0;
let pauseStartTime = 0;
let totalPauseTime = 0;

// Necessary to store update interval ID when we
// create it so we can access and modify it later
let updateInterval;

let gameStats = {
  score: 0,
  accuracy: 0,
};

// An incredibly important constant. The time it takes for
// a note to fall from its spawn point to the hit indicator.
// Used to offset music playback and rate hits.
const fallToIndicatorTime = 2590;

// Note queues for each lane
const noteQueues = [[], [], [], []];

// What song the user picked
let songIndex;

// Initialize based on current height, used
// to offset position of notes later on
let newIndicatorPx = calculateIndicatorPx();

// Settings button functionality
settingsBtn.addEventListener("click", () => {
  settingsModal.classList.add("show");
  if (!isPaused) {
    pauseGame();
  }
});

// Resume game
resumeBtn.addEventListener("click", () => {
  settingsModal.classList.remove("show");
  if (isPaused) {
    resumeGame();
  }
});

// Return to home page
homeBtn.addEventListener("click", () => {
  window.location.href = "index.html";
});

// End game and go to end screen
endBtn.addEventListener("click", () => {
  stopGame(numOfNotes);
});

// Utility function to log messages to the right-side log container
function logMessage(message, color = "black") {
  logContainer.innerHTML = ""; // Clear previous log
  const logEntry = document.createElement("div");
  logEntry.textContent = message;
  logEntry.classList.add("log-entry");
  logEntry.style.color = color; // Set log text color
  logContainer.appendChild(logEntry);
}

// Function to calculate the new margin-bottom for indicators
function calculateIndicatorPx() {
  return (gameContainer.offsetHeight * 75) / 945 - 1;
}

// Function to update indicators' margin-bottom
function updateIndicatorMargins() {
  newIndicatorPx = calculateIndicatorPx(); // Recalculate newIndicatorPx
  const indicators = document.querySelectorAll(".indicator");
  indicators.forEach((indicator) => {
    indicator.style.marginBottom = `${newIndicatorPx}px`;
  });
}

function startCountdown() {
  countdownElement.textContent = countdown; // Set initial value of countdown

  const interval = setInterval(() => {
    countdown--; // Decrease countdown value

    if (countdown > 0) {
      countdownElement.textContent = countdown;
    } else if (countdown === 0) {
      countdownElement.textContent = "Start!"; // Display "Start!" at 0
      setTimeout(() => {
        countdownElement.style.display = "none"; // Hide countdown after 1 second
        // Start the music after the countdown, making sure the first notes have time to fall
        setTimeout(() => gameMusic.play(), fallToIndicatorTime);

        // Start the game depending on if it's a human- or AI-designed level
        songIndex = new URLSearchParams(window.location.search).get(
          "songIndex",
        );
        if (songIndex == -1) {
          fetchBeatInfoAndStart();
          gameMusic.src = "../resources/songs/only-alone.mp3";
        } else {
          startWithPrebuiltLevel(LEVELS[songIndex]);
        }
      }, 1000); // Wait 1 second before hiding countdown and starting music
    } else {
      clearInterval(interval); // Stop the countdown after it reaches 0
    }
  }, 1000); // Update countdown every 1000 ms
}

function generateFallingBox(laneIndex) {
  const fallingBox = document.createElement("div");
  fallingBox.classList.add("falling-box");
  lanes[laneIndex].appendChild(fallingBox);
  noteQueues[laneIndex].push(fallingBox);

  // Store the start time when the note is created, accounting for total pause time
  fallingBox.startTime = Date.now() - totalPauseTime;

  // After 3 seconds (duration of the fall), remove the note from the DOM
  setTimeout(() => {
    if (fallingBox.parentNode && !isPaused) {
      fallingBox.remove();
      noteQueues[laneIndex].shift(); // Remove it from the note queue
      logMessage("Missed note", "red"); // Log missed note
      perfectStreak = 0;
    }
  }, 3000); // Matches the 3-second animation duration

  numOfNotes++;
}

// Update positions of falling boxes
function updateFallingBoxes() {
  noteQueues.forEach((queue, laneIndex) => {
    queue.forEach((box, boxIndex) => {
      const topPosition = parseInt(box.style.top);
      box.style.top = `${topPosition + 5}px`; // Move the box down

      if (topPosition > window.innerHeight) {
        // Remove if it reaches bottom
        box.remove();
        noteQueues[laneIndex].splice(boxIndex, 1);
        logMessage("Missed note", "red"); // Log missed note
        perfectStreak = 0;
      }
    });
  });
}

// Handle key press events for hitting notes
document.addEventListener("keydown", (e) => {
  if (isPaused) return; // Ignore key presses while paused
  
  const laneIndex = { d: 0, f: 1, j: 2, k: 3 }[e.key]; // Map keys to lanes
  if (laneIndex !== undefined && noteQueues[laneIndex].length > 0) {
    const note = noteQueues[laneIndex].shift(); // Get the note from the queue
    const timeElapsed = Date.now() - totalPauseTime - note.startTime; // Calculate time since note started, accounting for pauses
    note.remove(); // Remove the note from the DOM

    totalHits++;

    // Determine note accuracy
    if (Math.abs(timeElapsed - fallToIndicatorTime) < 100) {
      logMessage(`Perfect note x${++perfectStreak}`, "gold");
      gameStats.score += 100; // Update score for perfect hit
    } else if (Math.abs(timeElapsed - fallToIndicatorTime) < 250) {
      logMessage("Good note", "green");
      gameStats.score += 50; // Update score for good hit
      perfectStreak = 0;
    } else {
      logMessage("Offbeat note", "purple");
      perfectStreak = 0;
    }
  }
});

// AI-GENERATED LEVEL -- Song is processed and segmented server-side.
// We fetch these beat times from the API we made available and start
// generating notes.
function fetchBeatInfoAndStart() {
  fetch("http://127.0.0.1:5000/beat-info")
    .then((response) => response.json())
    .then((data) => {
      const beatTimes = data.beat_times;

      if (beatTimes && beatTimes.length) {
        // Generate random lane indices for each beat
        const whereTheyreDropping = [];
        for (let i = 0; i < beatTimes.length; i++) {
          whereTheyreDropping.push([Math.floor(Math.random() * 4)]);
        }

        scheduleFallingBoxes(beatTimes, whereTheyreDropping);
      }

      else {
        console.error("No beat times received");
      }
    })
    .catch((error) => console.error("Error fetching beat info:", error));
}

function startWithPrebuiltLevel(level) {
  // Conversion from bpm to mspb is derived as follows:
  //   x beats     1 min       1 s                 60000 ms
  // ( -------  *  -----  *  ------- ) ^ -1   ==   --------
  //    1 min      60 s      1000 ms               x beats
  const msPerBeat = 60000 / level.bpm;

  // Shift notes early-ward based on start beat (for testing)
  const testingStartIndex = level.beats.indexOf(level.testingStartAtBeat);
  level.beats = level.beats
    .slice(testingStartIndex)
    .map((beat) => beat - level.testingStartAtBeat);
  level.whereTheyreDropping =
    level.whereTheyreDropping.slice(testingStartIndex);

  // Switch to correct song and adjust music for testing
  gameMusic.src = level.src;
  gameMusic.currentTime = (level.testingStartAtBeat * 60) / level.bpm;

  // Convert beats to beat-times, then schedule the notes
  scheduleFallingBoxes(
    level.beats.map((beat) => beat * msPerBeat + level.offset),
    level.whereTheyreDropping,
  );
}

function scheduleFallingBoxes(beatTimes, whereTheyreDropping) {
  // We'll increment this variable as we iterate through
  // whereTheyreDropping so we know how many notes there
  // are in this song (for stats calculations later)
  let totalNotes = 0;

  // Iterate through beat times and lane arrays in parallel,
  // since each beat time corresponds to an array of lane indices
  // where notes should drop
  zip(beatTimes, whereTheyreDropping).forEach(([beatTime, laneIndices]) => {
    laneIndices.forEach((laneIndex) => {
      setTimeout(() => {
        generateFallingBox(laneIndex);
      }, beatTime);
    });

    totalNotes += laneIndices.length;
  });

  // Continuously update the positions of falling boxes
  // (Also store the interval ID in updateInterval)
  updateInterval = setInterval(updateFallingBoxes, 10);

  // Schedule game to stop a bit after the last note plays
  setTimeout(
    () => stopGame(totalNotes),
    beatTimes[beatTimes.length - 1] + fallToIndicatorTime * 2,
  );
}

// Convenience function for "zipping" up arrays.
// Usage example: zip([[0, 1, 2], [3, 4, 5]]) becomes [[0, 3], [1, 4], [2, 5]].
// Very practical for when you want to iterate arrays IN PARALLEL.
function zip(...rows) {
  return rows[0].map((_, i) => rows.map((row) => row[i]));
}

document.addEventListener("DOMContentLoaded", () => {
  const countdownElement = document.getElementById("countdown");
  const gameMusic = document.getElementById("gameMusic");

  // Now it's safe to use gameMusic
  if (gameMusic) {
    startCountdown(); // Your game logic

    // If screen resolution changes, query the new indicator
    // margins so note position offset still works
    const resizeObserver = new ResizeObserver(() => {
      updateIndicatorMargins();
    });
    resizeObserver.observe(gameContainer);
  }
  
  else {
    console.error('Audio element with id "gameMusic" not found');
  }
});

function stopGame(totalNotes) {
  clearInterval(updateInterval); // Stop updating falling boxes
  gameMusic.pause(); // Pause the music
  gameMusic.currentTime = 0; // Reset the music to the beginning

  gameStats.accuracy = ((totalHits / totalNotes) * 100).toFixed(2);

  // Store game statistics in localStorage
  localStorage.setItem("gameStats", JSON.stringify(gameStats));

  // Redirect to end screen, again storing info about the current song
  window.location.href = `endscreen.html?songIndex=${songIndex}`;
}

// Pause game functionality
function pauseGame() {
  isPaused = true;
  gameMusic.pause();
  clearInterval(updateInterval);
  pauseStartTime = Date.now();
  gameContainer.classList.add('game-paused');
  
  // Pause all falling box animations
  document.querySelectorAll('.falling-box').forEach(box => {
    const computedStyle = window.getComputedStyle(box);
    const currentTop = computedStyle.getPropertyValue('top');
    box.style.top = currentTop;
  });
}

// Resume game functionality
function resumeGame() {
  isPaused = false;
  totalPauseTime += Date.now() - pauseStartTime;
  gameMusic.play();
  updateInterval = setInterval(updateFallingBoxes, 10);
  gameContainer.classList.remove('game-paused');
  
  // Resume falling box animations
  document.querySelectorAll('.falling-box').forEach(box => {
    box.style.top = '';
  });
}
