import React, { useEffect, useState } from "react";
import { socket } from "./hooks/useGame";

const WordChoice = () => {
  const [options, setOptions] = useState([]);
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    const handleChooseWord = (wordOptions, chooseTime) => {
      setOptions(wordOptions);
      setSeconds(chooseTime);
    };

    const handleChooseTimer = (time) => setSeconds(time);

    const handleClose = () => {
      setOptions([]);
      setSeconds(0);
    };

    socket.on("choose word", handleChooseWord);
    socket.on("choose timer", handleChooseTimer);
    socket.on("close word choice", handleClose);
    socket.on("leaved", handleClose);

    return () => {
      socket.off("choose word", handleChooseWord);
      socket.off("choose timer", handleChooseTimer);
      socket.off("close word choice", handleClose);
      socket.off("leaved", handleClose);
    };
  }, []);

  const selectWord = (word) => {
    socket.emit("word chosen", word);
    setOptions([]);
  };

  if (options.length === 0) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-white p-8 rounded-2xl shadow-2xl flex flex-col items-center gap-6 max-w-md w-full mx-4">
        <div className="flex flex-col items-center gap-2">
          <h2 className="text-2xl font-bold text-gray-800">
            Pick a word to draw
          </h2>
          <p className="text-sm text-gray-500">
            First word is picked for you when time runs out
          </p>
        </div>

        <span className="secondary border-b-4  font-bold w-14 text-xl text-bold aspect-square grid place-items-center rounded-full ">
          {seconds}
        </span>

        <div className="flex flex-col w-full gap-3">
          {options.map((word) => (
            <button
              key={word}
              onClick={() => selectWord(word)}
              className="w-full py-3 px-6 text-lg font-semibold bg-orange-500 hover:bg-orange-600 text-white rounded-xl transition-colors shadow-md"
            >
              {word}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default WordChoice;
