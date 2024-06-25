import React, { useCallback, useEffect, useRef, useState } from 'react';
import { socket } from './App';

import { FaPaintBrush } from "react-icons/fa";
import { FaEraser } from "react-icons/fa6";
import { FaRedo } from "react-icons/fa";
import { FaUndo } from "react-icons/fa";
import { FaTrash } from "react-icons/fa6";

let isDrawing = false;
let drawingRecord = [];
let drawingIndex = -1;
let drawingColor = "black";
let drawingWidth = 5;
let isBrush = true;
let previousColor;
const colors = ["black", "brown", "red", "pink", "blue", "cyan", "green", "Aquamarine", "yellow", "purple"];

const Canvas = () => {
    const [room, setRoom] = useState(null);
    const [turn, setTurn] = useState(false);
    const canvasRef = useRef(null);
    const contextRef = useRef(null);

    const changeColor = (e) => {
        drawingColor = e.target.style.backgroundColor;
        for (let i = 0; i < colors.length; i++) {
            e.target.parentNode.childNodes[i].classList.remove("primary");
        }
        e.target.classList.add("primary");
    }

    const changeWidth = (e) => {
        drawingWidth = e.target.getAttribute("data-width");
        if (e.target.type) {
            for (let i = 0; i < e.target.parentNode.childNodes.length; i++) {
                e.target.parentNode.childNodes[i].classList.remove("secondary");
                e.target.parentNode.childNodes[i].classList.add("primary");
            };
            e.target.classList.remove("primary");
            e.target.classList.add("secondary");
        }
    }

    const changeTool = (e, value) => {
        isBrush = value;

        if (value && e.target.type) {
            e.target.parentNode.childNodes[e.target.parentNode.childNodes.length - 2].classList.remove("secondary");
            e.target.parentNode.childNodes[e.target.parentNode.childNodes.length - 2].classList.add("primary");
            drawingColor = previousColor || drawingColor;
        } else {
            e.target.parentNode.childNodes[e.target.parentNode.childNodes.length - 1].classList.remove("secondary");
            e.target.parentNode.childNodes[e.target.parentNode.childNodes.length - 1].classList.add("primary");
            previousColor = drawingColor !== "white" ? drawingColor : previousColor;
            drawingColor = "white";
        }

        e.target.classList.remove("primary");
        e.target.classList.add("secondary");
    }

    const changeCanvas = (canvasImage) => {
        const newImage = new Image();
        newImage.src = canvasImage.replace(/^data:image\/png;base64,/, '');

        newImage.onload = () => contextRef.current.drawImage(newImage, 0, 0);
    }

    const handleUndo = () => {
        if (drawingIndex >= 0) {
            drawingIndex = drawingIndex <= 0 ? 0 : drawingIndex - 1;
            changeCanvas(drawingRecord[drawingIndex]);
            socket.emit("change canvas", drawingRecord[drawingIndex], room.id);
        }
    }

    const handleRedo = () => {
        if (drawingIndex < drawingRecord.length) {
            drawingIndex = drawingIndex >= drawingRecord.length - 1 ? drawingRecord.length - 1 : drawingIndex + 1;
            changeCanvas(drawingRecord[drawingIndex]);
            socket.emit("change canvas", drawingRecord[drawingIndex], room.id);
        }
    }

    const handleClearCanvas = () => {
        if (room) {
            contextRef.current.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
            contextRef.current.fillStyle = "white";
            contextRef.current.fillRect(0, 0, canvasRef.current.width, canvasRef.current.height);
            drawingRecord.push(canvasRef.current.toDataURL("image/jpeg", 1));
            drawingIndex++;

            socket.emit("change canvas", canvasRef.current.toDataURL("image/jpeg", 1), room.id);
        }
    }

    const startDrawing = useCallback((e) => {
        isDrawing = true;
        contextRef.current.beginPath();
        contextRef.current.moveTo(e.clientX - canvasRef.current.offsetLeft, e.clientY - canvasRef.current.offsetTop + window.scrollY);

        e.preventDefault();
    }, [])

    const drawing = useCallback((e) => {
        if (isDrawing) {
            contextRef.current.lineTo(e.clientX - canvasRef.current.offsetLeft, e.clientY - canvasRef.current.offsetTop + window.scrollY);
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
            drawingRecord.push(canvasRef.current.toDataURL("image/jpeg", 1));
            drawingIndex++;

            socket.emit("change canvas", drawingRecord[drawingIndex], room.id);

            e.preventDefault();
        }
    }, [room]);

    useEffect(() => {
        socket.on("updated room", (room) => {
            setRoom(room);
            setTurn(room.players[room.turnIndex - 1]?.id === socket.id);
        });

        return () => socket.off("updated room");
    }, []);

    useEffect(() => {
        const canvas = canvasRef.current;
        canvas.width = Math.min(940, window.innerWidth - 40);
        canvas.height = 520;

        contextRef.current = canvas.getContext("2d");
        const context = contextRef.current;
        context.fillStyle = "white";
        context.fillRect(0, 0, canvas.width, canvas.height);
        drawingIndex = 0;
        drawingRecord = [canvasRef.current.toDataURL("image/jpeg", 1)];

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
            changeCanvas(canvasImage);
        });

        return () => socket.off("new canvas");
    }, []);

    return (
        <div className='flex flex-col items-center m-auto'>
            <canvas className='border-b-4 rounded-lg my-2 primary' ref={canvasRef}></canvas>
            {turn &&
                <div className='flex flex-col md:flex-row gap-6 justify-between p-4 mb-2 container'>
                    <div className="grid w-full md:w-fit grid-rows-2 grid-flow-col gap-2 md:gap-1 h-fit md:h-20 cursor-pointer md:pt-2">
                        {colors.map(color =>
                            <button key={color} onClick={event => changeColor(event)} style={{ backgroundColor: color, borderWidth: "4px" }} className={`${color === drawingColor ? "primary" : ""} button rounded-full aspect-square p-3`}></button>
                        )}
                        <button onClick={(e) => changeTool(e, false)} className={`${isBrush ? "primary" : "secondary"} cursor-pointer button p-3 rounded-full row-span-2 h-12 m-auto grid place-items-center`}><FaEraser className='bg-transparent cursor-default' /></button>
                        <button onClick={(e) => changeTool(e, true)} className={`${!isBrush ? "primary" : "secondary"} cursor-pointer button p-3 rounded-full row-span-2 h-12 m-auto grid place-items-center`}><FaPaintBrush className='bg-transparent cursor-default' /></button>
                    </div>

                    <div className="flex w-full md:w-fit justify-center items-center gap-4 h-fit md:h-20 cursor-pointer">
                        <button className='button primary p-3 rounded-full' onClick={handleUndo}><FaUndo /></button>
                        <button className='button primary p-3 rounded-full' onClick={handleClearCanvas}><FaTrash /></button>
                        <button className='button primary p-3 rounded-full' onClick={handleRedo}><FaRedo /></button>
                    </div>
                    <div className="flex items-center justify-center gap-2 w-full md:w-fit h-fit md:h-20 cursor-pointer">
                        {[5, 15, 30, 50, 100].map((width, index) =>
                            <button key={width} data-width={width} onClick={event => changeWidth(event)} className={`${width !== drawingWidth ? "primary" : "secondary"} h-12 button aspect-square rounded-full grid place-items-center`}>
                                <div style={{ width: `${(index * 6 + 10)}px` }} className={`cursor-default aspect-square rounded-full bg-black/80`}></div>
                            </button>
                        )}
                    </div>
                </div>
            }
        </div >
    )
}

export default Canvas;