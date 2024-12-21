import express, { Request, Response } from 'express';
import cors from 'cors';
import path from 'path';
import isWord from 'is-word';

interface WordRequest extends Request {
    query: {
        word?: string;
    };
}

const app = express();
const englishWords = isWord('american-english');

app.use(cors());
// Define an endpoint to check if a word is English
app.get('/check-word', (req: WordRequest, res: Response) => {
    const word = req.query.word;
    const isEnglishWord = englishWords.check(word?.toLowerCase() || '');
    return res.json({ word, isEnglishWord });
});

app.use(express.static(path.join(__dirname, 'public')));

// Start the server
const PORT = 5001;
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});