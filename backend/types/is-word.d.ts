declare module 'is-word' {
    function isWord(dictionary: string): {
        check: (word: string) => boolean;
    };
    export = isWord;
} 