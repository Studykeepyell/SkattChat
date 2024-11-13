document.addEventListener("DOMContentLoaded", () => {
    document.getElementById("startGame").addEventListener("click", () => {
        const gameDuration = 60; // Game duration in seconds
        const startTime = Date.now();
        
        // Store the start time and duration in localStorage
        localStorage.setItem("gameStartTime", startTime);
        localStorage.setItem("gameDuration", gameDuration);

        // Reset score
        localStorage.setItem("score", 0);

        // Navigate to the game page
        window.location.href = "wordGame.html"; 
    });
});