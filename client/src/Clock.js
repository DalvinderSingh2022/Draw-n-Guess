import React, { useEffect, useState } from "react";
import { socket } from "./hooks/useGame";

const Clock = () => {
  const [time, setTimer] = useState(null);

  useEffect(() => {
    const handleTimer = (time) => setTimer(time);

    socket.on("set clock", handleTimer);

    return () => socket.off("set clock", handleTimer);
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
