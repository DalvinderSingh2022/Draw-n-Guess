import React, { useCallback, useEffect, useRef, useState } from 'react';
import { socket } from './App';

let drawingColor = "red";
let drawingWidth = 5;
let isDrawing = false;

const Canvas = () => {
    const [room, setRoom] = useState(null);
    const [turn, setTurn] = useState(false);
    const canvasRef = useRef(null);
    const contextRef = useRef(null);

    const handleClearCanvas = () => {
        if (room) {
            contextRef.current.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);

            contextRef.current.fillStyle = "white";
            contextRef.current.fillRect(0, 0, canvasRef.current.width, canvasRef.current.height);

            socket.emit("change canvas", canvasRef.current.toDataURL("image/jpeg", 0.5), room.id);
        }
    }

    const startDrawing = useCallback((e) => {
        isDrawing = true;
        contextRef.current.beginPath();
        contextRef.current.moveTo(e.clientX - canvasRef.current.offsetLeft, e.clientY - canvasRef.current.offsetTop);

        e.preventDefault();
    }, [])

    const drawing = useCallback((e) => {
        if (isDrawing) {
            contextRef.current.lineTo(e.clientX - canvasRef.current.offsetLeft, e.clientY - canvasRef.current.offsetTop);
            contextRef.current.strokeStyle = drawingColor;
            contextRef.current.lineWidth = drawingWidth;
            contextRef.current.lineCap = "round";
            contextRef.current.lineJoin = "round";
            contextRef.current.stroke();

            e.preventDefault();
        }
    }, []);

    const stopDrawing = useCallback((e) => {
        if (isDrawing && room) {
            contextRef.current.closePath();
            isDrawing = false;

            socket.emit("change canvas", canvasRef.current.toDataURL("image/jpeg", 1), room.id);

            e.preventDefault();
        }
    }, [room]);

    useEffect(() => {
        socket.emit("get room");
    }, [])

    useEffect(() => {
        socket.on("updated room", (room) => {
            setRoom(room);
            if (room.players[room.turnIndex].id === socket.id) {
                setTurn(true);
            }
        });

        return () => socket.off("updated room");
    }, []);

    useEffect(() => {
        const canvas = canvasRef.current;
        // canvas.width = window.innerWidth - 60;
        // canvas.height = 400;

        contextRef.current = canvas.getContext("2d");
        const context = contextRef.current;
        context.fillStyle = "white";
        context.fillRect(0, 0, canvas.width, canvas.height);

        if (turn) {
            canvas.addEventListener("mousedown", startDrawing);
            canvas.addEventListener("mousemove", drawing);
            canvas.addEventListener("mouseup", stopDrawing);
            canvas.addEventListener("mouseout", stopDrawing);

            return () => {
                canvas.removeEventListener("mousedown", startDrawing);
                canvas.removeEventListener("mousemove", drawing);
                canvas.removeEventListener("mouseup", stopDrawing);
                canvas.removeEventListener("mouseout", stopDrawing);
            }
        }
    }, [stopDrawing, drawing, startDrawing, turn]);


    useEffect(() => {
        socket.on("new canvas", (canvasImage) => {
            const newImage = new Image();
            newImage.src = canvasImage.replace(/^data:image\/png;base64,/, '');

            newImage.onload = () => contextRef.current.drawImage(newImage, 0, 0);
        });

        return () => socket.off("new canvas");
    }, []);

    return (
        <>
            <canvas id="canvas" ref={canvasRef}></canvas>
            {!turn &&
                <>
                    <button onClick={handleClearCanvas}>Clear</button>

                    <div onClick={(e) => drawingColor = e.target.style.backgroundColor} style={{ width: "40px", height: "40px", backgroundColor: "red" }}></div>
                    <div onClick={(e) => drawingColor = e.target.style.backgroundColor} style={{ width: "40px", height: "40px", backgroundColor: "blue" }}></div>
                    <div onClick={(e) => drawingColor = e.target.style.backgroundColor} style={{ width: "40px", height: "40px", backgroundColor: "green" }}></div>
                    <div onClick={(e) => drawingColor = e.target.style.backgroundColor} style={{ width: "40px", height: "40px", backgroundColor: "cyan" }}></div>

                    <input onChange={(e) => drawingColor = e.target.value} type="color" />
                    <input onChange={(e) => drawingWidth = e.target.value} type="range" min={1} max={50} />
                </>
            }
        </>
    )
}

export default Canvas;