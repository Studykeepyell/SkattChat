const express = require('express');
const cors = require('cors');
const isWord = require('is-word');

const app = express();
const englishWords = isWord('american-english');

app.use(cors());
// Define an endpoint to check if a word is English
app.get('/check-word', (req, res) => {
    const word = req.query.word;
    const isEnglishWord = englishWords.check(word.toLowerCase());
    res.json({ word, isEnglishWord });
});

// Start the server
const PORT = 5000;
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});