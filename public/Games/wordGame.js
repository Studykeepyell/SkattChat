

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
    const characters = createRandomCharacterArray(3); // Adjust the number as needed

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
    if(response = true){
        const characters = localStorage.getItem("characters");
        const letters = word.split('');
        console.log(characters);
        
        response = letters.every(letter => characters.includes(letter));
    }
    return response;
}
// async function checkWord(word) {
//     let response = false;

//     try {
//         const ifWord = await fetch(`http://localhost:5000/check-word?word=${word}`);
//         const data = await ifWord.json();
        
//         console.log(`${word} is ${data.isEnglishWord ? 'an English' : 'not an English'} word.`);

//         // Check if the word is an English word
//         if (data.isEnglishWord) {
//             // Get the characters from local storage and parse them as an array
//             const characters = JSON.parse(localStorage.getItem("characters") || "[]");

//             // Convert the word to individual letters
//             const letters = word.split('');

//             // Check if every letter in the word is included in the characters array
//             response = letters.every(letter => characters.includes(letter));
//         }
//     } catch (error) {
//         console.error('Error fetching word data:', error);
//     }

//     return response;
// }

checkWord("hello"); 

async function handleSubmit() {
    const inputElement = document.getElementById("wordInput");
    const word = inputElement.value.trim();

    const isValidWord = await checkWord(word);
    console.log('word: ' + word);
    if (word) {
        console.log(isValidWord);
        if (isValidWord) {
            alert(`${word} is a valid word!`);
            displayCharacters();
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