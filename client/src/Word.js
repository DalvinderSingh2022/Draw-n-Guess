import React, { useEffect, useState } from 'react';
import { socket } from './App';

const Word = () => {
    const [word, setWord] = useState('');
    const [show, setShow] = useState(false);

    useEffect(() => {
        socket.on("new word", (word, show) => {
            setWord(word);
            setShow(show);
        });

        return () => socket.off("new word");
    }, []);

    return (
        <>{word && word.split('').map(alphabet => show ? (alphabet + " ") : "_ ")}{word && ("- " + word.length)}</>
    )
}

export default Word;