document.addEventListener("DOMContentLoaded", () => {
    // Retrieve and display the final score
    const finalScore = localStorage.getItem("score") || 0;
    document.getElementById("finalScore").textContent = finalScore;
});

function startNewGame() {
    // Clear score if needed
    localStorage.setItem("score", 0);

    // Redirect to the start page
    window.location.href = "wordGameStart.html"; // Adjust path as needed
}

function returnToChat() {
    // Redirect to the chat page on the server
    window.location.href = "/chat.html"; // Adjust path as needed
}