import React, { useEffect, useState } from "react";
import { socket } from "./hooks/useGame";

const Clock = () => {
  const [time, setTimer] = useState(null);

  useEffect(() => {
    socket.on("set clock", (time) => {
      setTimer(time);
    });

    return () => socket.off("set clock");
  }, []);

  if (time >= 0) {
    return (
      <span className="secondary border-b-4  font-bold w-14 text-xl text-bold aspect-square grid place-items-center rounded-full ">
        {time}
      </span>
    );
  }

  return null;
};

export default Clock;
