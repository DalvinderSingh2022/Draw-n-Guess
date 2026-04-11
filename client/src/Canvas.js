import React, { useCallback, useEffect, useRef, useState } from "react";
import { socket, useGame } from "./hooks/useGame";

import { FaPaintBrush } from "react-icons/fa";
import { FaEraser } from "react-icons/fa6";
import { FaRedo } from "react-icons/fa";
import { FaUndo } from "react-icons/fa";
import { FaTrash } from "react-icons/fa6";

const colors = [
  "black",
  "brown",
  "red",
  "pink",
  "blue",
  "cyan",
  "green",
  "Aquamarine",
  "yellow",
  "purple",
];

const Canvas = () => {
  const { room, setRoom } = useGame();
  const [turn, setTurn] = useState(false);

  const [activeColor, setActiveColor] = useState("black");
  const [activeWidth, setActiveWidth] = useState(5);
  const [isBrush, setIsBrush] = useState(true);

  const isDrawingRef = useRef(false);
  const drawingColorRef = useRef("black");
  const drawingWidthRef = useRef(5);
  const drawingRecordRef = useRef([]);
  const drawingIndexRef = useRef(-1);
  const previousColorRef = useRef("black");

  const canvasRef = useRef(null);
  const contextRef = useRef(null);

  const changeColor = (color) => {
    drawingColorRef.current = color;
    setActiveColor(color);
  };

  const changeWidth = (width) => {
    drawingWidthRef.current = width;
    setActiveWidth(width);
  };

  const changeTool = (brush) => {
    setIsBrush(brush);
    if (brush) {
      drawingColorRef.current = previousColorRef.current;
      setActiveColor(previousColorRef.current);
    } else {
      previousColorRef.current =
        drawingColorRef.current !== "white"
          ? drawingColorRef.current
          : previousColorRef.current;
      drawingColorRef.current = "white";
      setActiveColor("white");
    }
  };

  const changeCanvas = useCallback((canvasImage) => {
    if (!contextRef.current) return;
    const newImage = new Image();
    newImage.src = canvasImage;
    newImage.onload = () => {
      contextRef.current.clearRect(
        0,
        0,
        canvasRef.current.width,
        canvasRef.current.height,
      );
      contextRef.current.drawImage(newImage, 0, 0);
    };
  }, []);

  const handleUndo = () => {
    if (drawingIndexRef.current >= 0) {
      drawingIndexRef.current = Math.max(0, drawingIndexRef.current - 1);
      const imageData = drawingRecordRef.current[drawingIndexRef.current];
      changeCanvas(imageData);
      socket.emit("change canvas", imageData);
    }
  };

  const handleRedo = () => {
    if (drawingIndexRef.current < drawingRecordRef.current.length - 1) {
      drawingIndexRef.current++;
      const imageData = drawingRecordRef.current[drawingIndexRef.current];
      changeCanvas(imageData);
      socket.emit("change canvas", imageData);
    }
  };

  const handleClearCanvas = () => {
    if (room) {
      contextRef.current.fillStyle = "white";
      contextRef.current.fillRect(
        0,
        0,
        canvasRef.current.width,
        canvasRef.current.height,
      );

      const imageData = canvasRef.current.toDataURL("image/jpeg", 0.5);
      drawingRecordRef.current.push(imageData);
      drawingIndexRef.current++;

      socket.emit("change canvas", imageData);
    }
  };

  const startDrawing = useCallback((e) => {
    isDrawingRef.current = true;
    const x = e.clientX - canvasRef.current.offsetLeft;
    const y = e.clientY - canvasRef.current.offsetTop + window.scrollY;

    contextRef.current.beginPath();
    contextRef.current.moveTo(x, y);

    socket.emit("draw-line", {
      x,
      y,
      color: drawingColorRef.current,
      width: drawingWidthRef.current,
      type: "start",
    });

    e.preventDefault();
  }, []);

  const drawing = useCallback((e) => {
    if (isDrawingRef.current) {
      const x = e.clientX - canvasRef.current.offsetLeft;
      const y = e.clientY - canvasRef.current.offsetTop + window.scrollY;

      contextRef.current.lineTo(x, y);
      contextRef.current.strokeStyle = drawingColorRef.current;
      contextRef.current.lineWidth = drawingWidthRef.current;
      contextRef.current.lineCap = "round";
      contextRef.current.lineJoin = "round";
      contextRef.current.stroke();

      socket.emit("draw-line", {
        x,
        y,
        color: drawingColorRef.current,
        width: drawingWidthRef.current,
        type: "draw",
      });

      e.preventDefault();
    }
  }, []);

  const stopDrawing = useCallback(
    (e) => {
      if (isDrawingRef.current && room) {
        contextRef.current.closePath();
        isDrawingRef.current = false;

        const imageData = canvasRef.current.toDataURL("image/jpeg", 0.5);
        drawingRecordRef.current.push(imageData);
        drawingIndexRef.current++;

        socket.emit("draw-line", { type: "stop" });
        socket.emit("change canvas", imageData);

        if (e) e.preventDefault();
      }
    },
    [room],
  );

  useEffect(() => {
    socket.emit("get room");
    socket.on("updated room", (room) => {
      setRoom(room);
      setTurn(room.players[room.turnIndex - 1]?.id === socket.id);
    });

    return () => socket.off("updated room");
  }, [setRoom]);

  useEffect(() => {
    const canvas = canvasRef.current;
    canvas.width = Math.min(940, window.innerWidth - 40);
    canvas.height = 520;

    contextRef.current = canvas.getContext("2d");
    const context = contextRef.current;
    context.fillStyle = "white";
    context.fillRect(0, 0, canvas.width, canvas.height);

    drawingIndexRef.current = 0;
    drawingRecordRef.current = [canvas.toDataURL("image/jpeg", 0.5)];

    const handleDrawLine = (data) => {
      if (turn) return;
      const { x, y, color, width, type } = data;
      if (type === "start") {
        contextRef.current.beginPath();
        contextRef.current.moveTo(x, y);
      } else if (type === "draw") {
        contextRef.current.lineTo(x, y);
        contextRef.current.strokeStyle = color;
        contextRef.current.lineWidth = width;
        contextRef.current.lineCap = "round";
        contextRef.current.lineJoin = "round";
        contextRef.current.stroke();
      } else if (type === "stop") {
        contextRef.current.closePath();
      }
    };

    socket.on("draw-line", handleDrawLine);
    socket.on("new canvas", (canvasImage) => {
      if (!turn) changeCanvas(canvasImage);
    });

    if (turn) {
      canvas.addEventListener("mousedown", startDrawing);
      canvas.addEventListener("mousemove", drawing);
      canvas.addEventListener("mouseup", stopDrawing);
      canvas.addEventListener("mouseout", stopDrawing);
    }

    return () => {
      socket.off("draw-line");
      socket.off("new canvas");
      canvas.removeEventListener("mousedown", startDrawing);
      canvas.removeEventListener("mousemove", drawing);
      canvas.removeEventListener("mouseup", stopDrawing);
      canvas.removeEventListener("mouseout", stopDrawing);
    };
  }, [turn, startDrawing, drawing, stopDrawing, changeCanvas]);

  return (
    <div className="flex flex-col items-center m-auto">
      <canvas
        className="border-b-4 rounded-lg my-2 primary"
        ref={canvasRef}
      ></canvas>
      {turn && (
        <div className="flex flex-col md:flex-row gap-6 justify-between p-4 mb-2 container">
          <div className="grid grid-flow-col justify-center gap-2 md:gap-1 cursor-pointer md:pt-2">
            {colors.map((color) => (
              <button
                key={color}
                onClick={() => changeColor(color)}
                style={{ backgroundColor: color }}
                className={`${color === activeColor ? "primary" : ""} border-4 button rounded-full aspect-square p-3 w-8`}
              ></button>
            ))}
            <button
              onClick={() => changeTool(false)}
              className={`${!isBrush ? "secondary" : "primary"} cursor-pointer button p-3 rounded-full row-span-2 h-12 m-auto grid place-items-center`}
            >
              <FaEraser className="bg-transparent cursor-default" />
            </button>
            <button
              onClick={() => changeTool(true)}
              className={`${isBrush ? "secondary" : "primary"} cursor-pointer button p-3 rounded-full row-span-2 h-12 m-auto grid place-items-center`}
            >
              <FaPaintBrush className="bg-transparent cursor-default" />
            </button>
          </div>

          <div className="flex md:w-fit justify-center items-center gap-2">
            <button
              className="button primary rounded-full w-12 aspect-square cursor-pointer grid place-items-center"
              onClick={handleUndo}
            >
              <FaUndo />
            </button>
            <button
              className="button primary rounded-full w-12 aspect-square cursor-pointer grid place-items-center"
              onClick={handleClearCanvas}
            >
              <FaTrash />
            </button>
            <button
              className="button primary rounded-full w-12 aspect-square cursor-pointer grid place-items-center"
              onClick={handleRedo}
            >
              <FaRedo />
            </button>
          </div>
          <div className="flex items-center justify-center gap-1 w-full md:w-fit h-fit md:h-20 cursor-pointer">
            {[5, 15, 30, 50, 100].map((width, index) => (
              <button
                key={width}
                onClick={() => changeWidth(width)}
                className={`${width === activeWidth ? "secondary" : "primary"} button rounded-full w-12 aspect-square cursor-pointer grid place-items-center`}
              >
                <div
                  style={{ width: `${index * 6 + 10}px` }}
                  className={`cursor-default aspect-square rounded-full bg-black/80`}
                ></div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Canvas;
