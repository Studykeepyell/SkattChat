

function createRandomCharacterArray(length) {
    const charsVowels = "aeiou";
    const charsConsonants = "BCDFGJKLMNPQSTVXZHRWY";
    let result = [];
    for (let i = 0; i < length; i++) {
        result.push(charsVowels.charAt(Math.floor(Math.random() * charsVowels.length)));
        result.push(charsConsonants.charAt(Math.floor(Math.random() * charsConsonants.length)));
        result.push(charsConsonants.charAt(Math.floor(Math.random() * charsConsonants.length)));

    }
    return result;
}

function displayCharacters() {
    const lettersContainer = document.querySelector(".letters");
    const characters = createRandomCharacterArray(3); // Adjust the number as needed

    characters.forEach(char => {
        const listItem = document.createElement("li");
        listItem.textContent = char;
        lettersContainer.appendChild(listItem);
    });
}

async function checkWord(word) {
    const response = await fetch(`http://localhost:5000/check-word?word=${word}`);
    const data = await response.json();
    console.log(`${word} is ${data.isEnglishWord ? 'an English' : 'not an English'} word.`);
    return response;
}
checkWord("hello"); 

function handleSubmit() {
    const inputElement = document.getElementById("wordInput");
    const word = inputElement.value.trim();

    if (word) {
        if (checkWord(word)) {
            alert(`${word} is a valid word!`);
        } else {
            alert(`${word} is not a valid word.`);
        }
    } else {
        alert("Please enter a word.");
    }

    inputElement.value = ""; // Clear the input field
}

// Set up event listeners
document.getElementById("submit").addEventListener("click", handleSubmit);

document.getElementById("wordInput").addEventListener("keydown", function(event) {
    if (event.key === "Enter") {
        handleSubmit();
    }
});

displayCharacters();