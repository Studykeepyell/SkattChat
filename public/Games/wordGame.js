let points = 0;
let mes = "";

function createRandomCharacterArray(length) {
    const charsVowels = "aeiou";
    const charsConsonants = "bcdfghjklmnpqrstvwxyz";
    let result = [];
    for (let i = 0; i < length; i++) {
        result.push(charsVowels.charAt(Math.floor(Math.random() * charsVowels.length)));
        result.push(charsConsonants.charAt(Math.floor(Math.random() * charsConsonants.length)));
        result.push(charsConsonants.charAt(Math.floor(Math.random() * charsConsonants.length)));
    }
    localStorage.setItem("characters", result);
    return result;
}

function displayCharacters() {
    const lettersContainer = document.querySelector(".letters");
    lettersContainer.innerHTML = ""; // Clear previous characters
    const characters = createRandomCharacterArray(2); // Adjust the number as needed

    characters.forEach(char => {
        const listItem = document.createElement("li");
        listItem.textContent = char;
        lettersContainer.appendChild(listItem);
    });
}

async function checkWord(word) {
    let response = false;
    const ifWord = await fetch(`http://localhost:5000/check-word?word=${word}`);
    const data = await ifWord.json();
    console.log(`${word} is ${data.isEnglishWord ? 'an English' : 'not an English'} word.`);
    response = data.isEnglishWord;
    if(response){
        const characters = localStorage.getItem("characters");
        const letters = word.split('');
        console.log(characters);
        
        response = letters.every(letter => characters.includes(letter));
    }
    return response;
}

checkWord("hello"); 

async function handleSubmit() {
    const inputElement = document.getElementById("wordInput");
    const word = inputElement.value.trim();

    const isValidWord = await checkWord(word);
    if (word) {
        console.log(isValidWord);
        if (isValidWord) {
            points += word.length;
            localStorage.setItem("score", points);
            updatePointsDisplay();
            displayCharacters();
        }
        else{
            mes = "Invalid word";
            updateMessage();
            displayCharacters();
        }
    } else {
        mes = "Please enter a word";
        updateMessage();
    }

    inputElement.value = ""; // Clear the input field
}

function updatePointsDisplay() {
    const pointsDisplay = document.getElementById("pointsDisplay");
    pointsDisplay.textContent = `Points: ${points}`;
}
function updateMessage(){
    const messageDisplay = document.getElementById("message");
    messageDisplay.textContent = `${mes}`;
}
// Set up event listeners
document.getElementById("submit").addEventListener("click", handleSubmit);

document.getElementById("wordInput").addEventListener("keydown", function(event) {
    if (event.key === "Enter") {
        handleSubmit();
    }
});

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
        window.location.href = "public/Games/wordGame.html"; 
    });
});

let getPoints = parseInt(localStorage.getItem("score")) || 0;

function updateTimer() {
    const startTime = parseInt(localStorage.getItem("gameStartTime"));
    const duration = parseInt(localStorage.getItem("gameDuration"));
    const currentTime = Date.now();
    const timeElapsed = Math.floor((currentTime - startTime) / 1000);
    const timeLeft = duration - timeElapsed;

    if (timeLeft > 0) {
        document.getElementById("timer").textContent = `Time left: ${timeLeft}s`;
    } else {
        // End game if time runs out
        clearInterval(timerInterval);
        document.getElementById("timer").textContent = "Time's up!";
        endGame();
    }
}

function endGame() {
    alert(`Game over! Your final score is ${points}`);
    localStorage.setItem("score", points); // Store final score if needed
    console.log("Score: " + points);
    window.location.href = "\wordGameEnd.html"; 
}

function addPoints(wordLength) {
    getPoints += wordLength;
    localStorage.setItem("score", getPoints); // Update score in localStorage
    updategetPointsDisplay();
}

// Start the timer
const timerInterval = setInterval(updateTimer, 1000);

// Call display characters and update display functions as needed
displayCharacters();
updatePointsDisplay();
updateMessage();
updateTimer();
