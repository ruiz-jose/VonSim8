import { useAtomValue } from "jotai";
import { useState, useEffect } from "react";

import { useTranslate } from "@/lib/i18n";

import { cycleCountAtom, instructionCountAtom } from "./state";

export function CPUStats() {
  const translate = useTranslate();
  const cycleCount = useAtomValue(cycleCountAtom);
  const instructionCount = useAtomValue(instructionCountAtom);

  const [position, setPosition] = useState({ x: 900, y: 600 }); // Posición inicial
  const [isDragging, setIsDragging] = useState(false); // Estado de arrastre
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 }); // Offset del mouse al arrastrar

  // Función para manejar el inicio del arrastre
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragOffset({
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    });
  };

  // Función para manejar el movimiento del mouse
  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging) return;
    setPosition({
      x: e.clientX - dragOffset.x,
      y: e.clientY - dragOffset.y,
    });
  };

  // Función para manejar el fin del arrastre
  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Agregar y eliminar eventos globales para el arrastre
  useEffect(() => {
    if (isDragging) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
    } else {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    }
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging]);

  return (
    <div
      className="absolute z-10 h-min w-[180px] rounded-lg border border-stone-600 bg-stone-900 [&_*]:z-20"
      style={{ left: `${position.x}px`, top: `${position.y}px` }} // Posición dinámica
    >
      <span
        className="mb-2 block h-min w-full rounded-br-lg rounded-tl-lg border-b border-r border-stone-600 bg-blue-500 px-2 py-1 text-lg text-white cursor-move"
        onMouseDown={handleMouseDown} // Iniciar arrastre
      >
        {translate("computer.cpu.stats")}
      </span>
      <hr className="border-stone-600" />
      <div className="flex flex-col w-full items-start py-2 px-2">
        <div className="text-white pl-1 text-sm text-left">
          <div className="mb-1">Clock: {cycleCount}</div>
          <div>Instrucciones: {instructionCount}</div>
        </div>
      </div>
    </div>
  );
}