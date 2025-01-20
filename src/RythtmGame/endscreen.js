import './endscreen.css';
import { Constants } from '../scripts/core/constants.ts';

// Define the API URL with port
const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'https://skattchat.online' 
  : 'http://localhost:3000';

document.addEventListener("DOMContentLoaded", () => {
  // Retrieve game stats from localStorage
  const storedStats = localStorage.getItem("gameStats");
  const gameStats = storedStats ? JSON.parse(storedStats) : null;
  const songIndex = new URLSearchParams(window.location.search).get(
    "songIndex",
  );

  // Debug logging for authentication data
  console.log("Local Storage Contents:", {
    token: localStorage.getItem(Constants.STORAGE_KEYS.AUTH_TOKEN),
    userId: localStorage.getItem(Constants.STORAGE_KEYS.USER_ID),
    username: localStorage.getItem(Constants.STORAGE_KEYS.USERNAME),
    rawToken: localStorage.getItem(Constants.STORAGE_KEYS.AUTH_TOKEN)?.length > 0 ? 'Present' : 'Missing'
  });

  const token = localStorage.getItem(Constants.STORAGE_KEYS.AUTH_TOKEN)?.trim();
  const userId = localStorage.getItem(Constants.STORAGE_KEYS.USER_ID)?.trim();
  const username = localStorage.getItem(Constants.STORAGE_KEYS.USERNAME)?.trim();

  // Display the game stats on the end screen
  if (gameStats) {
    document.getElementById("accuracy").textContent =
      `Accuracy: ${gameStats.accuracy}%`;
    document.getElementById("score").textContent = `Score: ${gameStats.score}`;
  } else {
    console.error("No game statistics found in localStorage");
  }

  // Restart game
  document.getElementById("restartGameBtn").addEventListener("click", () => {
    window.location.href = `gamescreen.html?songIndex=${songIndex}`;
  });

  // Go back to main menu
  document.getElementById("mainMenuBtn").addEventListener("click", () => {
    window.location.href = "index.html";
  });

  // Save score
  document.getElementById("saveScoreBtn").addEventListener("click", async () => {
    console.log("Save Score Button Clicked - Auth State:", {
      hasToken: !!token,
      tokenLength: token?.length,
      hasUserId: !!userId,
      hasUsername: !!username
    });

    if (!token || !userId || !username) {
      console.log("Authentication Check Failed:", {
        token: token || 'missing',
        userId: userId || 'missing',
        username: username || 'missing'
      });
      alert("Please log in to save your score!");
      window.location.href = "/dist/pages/login.html";
      return;
    }

    try {
      if (!gameStats || !gameStats.score || !gameStats.accuracy) {
        throw new Error('Game statistics are missing or invalid');
      }

      const songName = getSongName(songIndex);
      if (!songName) {
        throw new Error('Invalid song index');
      }

      const scoreData = {
        score: parseInt(gameStats.score),
        accuracy: parseFloat(gameStats.accuracy),
        songName: songName,
        userId: userId,
        username: username
      };

      console.log('Submitting score data:', scoreData);
      console.log('Auth token being used:', token); // Debug log for token

      const response = await fetch(`${API_BASE_URL}/api/game/scores`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": token // Remove 'Bearer ' prefix as it might be included in the token already
        },
        body: JSON.stringify(scoreData),
        credentials: 'include' // Include credentials in the request
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Server response:', {
          status: response.status,
          statusText: response.statusText,
          data: errorData,
          headers: Object.fromEntries(response.headers.entries()) // Log response headers
        });

        if (response.status === 401) {
          alert("Your session has expired. Please log in again.");
          window.location.href = "/dist/pages/login.html";
          return;
        }
        if (response.status === 403) {
          alert("You don't have permission to save scores. Please log in again.");
          window.location.href = "/dist/pages/login.html";
          return;
        }
        throw new Error(`Server error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      console.log('Score saved successfully:', data);
      alert("Score saved successfully!");
      loadLeaderboard(); // Refresh leaderboard after saving
    } catch (error) {
      console.error("Error saving score:", error);
      alert(`Failed to save score: ${error.message}`);
    }
  });

  // Check leaderboard button
  document.getElementById("leaderboardBtn").addEventListener("click", loadLeaderboard);

  // Initial leaderboard load
  loadLeaderboard();
});

// Function to load leaderboard
async function loadLeaderboard() {
  try {
    const response = await fetch("/api/game/leaderboard");
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    const leaderboardList = document.getElementById("leaderboardList");
    leaderboardList.innerHTML = ""; // Clear existing entries

    // Create and append leaderboard entries
    data.forEach((entry, index) => {
      const li = document.createElement("li");
      li.style.cssText = `
        padding: 10px;
        margin: 5px 0;
        border-radius: 5px;
        background-color: ${index < 3 ? 'rgba(98, 0, 238, 0.1)' : 'transparent'};
        display: flex;
        justify-content: space-between;
        align-items: center;
      `;

      const rank = document.createElement("span");
      rank.textContent = `#${index + 1}`;
      rank.style.fontWeight = "bold";

      const info = document.createElement("span");
      info.textContent = `${entry.username} - Score: ${entry.score} - Accuracy: ${entry.accuracy}%`;

      li.appendChild(rank);
      li.appendChild(info);
      leaderboardList.appendChild(li);
    });
  } catch (error) {
    console.error("Error fetching leaderboard:", error);
    const leaderboardList = document.getElementById("leaderboardList");
    leaderboardList.innerHTML = "<li>Failed to load leaderboard. Please try again later.</li>";
  }
}

function getSongName(index) {
  const songs = {
    "0": "MDK - Fingerdash",
    "1": "Seven Nation Army",
    "-1": "Basxhkzir - Only Alone"
  };
  return songs[index] || "Unknown Song";
}
