import { Request, Response } from 'express';
import isWord from 'is-word';

const englishWords = isWord('american-english');

interface WordRequest extends Request {
    query: {
        word?: string;
    };
}

export const checkWord = (req: WordRequest, res: Response) => {
    const word = req.query.word;
    const isEnglishWord = englishWords.check(word?.toLowerCase() || '');
    return res.json({ word, isEnglishWord });
}; 