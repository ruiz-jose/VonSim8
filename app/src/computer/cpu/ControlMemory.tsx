import { useAtomValue } from "jotai";
import { useEffect } from "react";

import { anim } from "@/computer/shared/animate";
import { animated, getSpring } from "@/computer/shared/springs";

import { cycleAtom } from "./state";

type ControlMemoryProps = {
  isVisible: boolean;
  onClose: () => void;
};

export function ControlMemory({ isVisible, onClose }: ControlMemoryProps) {
  const cycle = useAtomValue(cycleAtom);

  // Datos de ejemplo para la memoria de control (microprograma)
  const controlMemoryData = [
    {
      address: "00h",
      instruction: "MOV",
      microops: ["MAR←IP", "MBR←Mem[MAR]", "IR←MBR", "Decodificar"],
      description: "Transferencia de datos entre registros o memoria",
    },
    {
      address: "01h",
      instruction: "ADD",
      microops: ["MAR←IP", "MBR←Mem[MAR]", "ALU←A+B", "A←Result", "Actualizar Flags"],
      description: "Suma aritmética con actualización de flags",
    },
    {
      address: "02h",
      instruction: "SUB",
      microops: ["MAR←IP", "MBR←Mem[MAR]", "ALU←A-B", "A←Result", "Actualizar Flags"],
      description: "Resta aritmética con actualización de flags",
    },
    {
      address: "03h",
      instruction: "CMP",
      microops: ["MAR←IP", "MBR←Mem[MAR]", "ALU←A-B", "Actualizar Flags"],
      description: "Comparación sin modificar operandos",
    },
    {
      address: "04h",
      instruction: "JMP",
      microops: ["MAR←IP", "MBR←Mem[MAR]", "IP←MBR"],
      description: "Salto incondicional",
    },
    {
      address: "05h",
      instruction: "JZ",
      microops: ["MAR←IP", "MBR←Mem[MAR]", "Si Z=1: IP←MBR"],
      description: "Salto condicional si Zero=1",
    },
    {
      address: "06h",
      instruction: "CALL",
      microops: ["SP←SP-1", "Mem[SP]←IP", "IP←Address"],
      description: "Llamada a subrutina",
    },
    {
      address: "07h",
      instruction: "RET",
      microops: ["IP←Mem[SP]", "SP←SP+1"],
      description: "Retorno de subrutina",
    },
    {
      address: "08h",
      instruction: "HLT",
      microops: ["Detener CPU"],
      description: "Detener la ejecución",
    },
  ];

  // Encontrar la instrucción actual
  const currentInstruction =
    cycle && "metadata" in cycle && cycle.metadata
      ? controlMemoryData.find(item => item.instruction === cycle.metadata.name)
      : null;

  // Efecto para animar la entrada y salida
  useEffect(() => {
    if (isVisible) {
      // Animar entrada
      anim(
        [
          { key: "controlMemory.overlay.opacity", to: 1 },
          { key: "controlMemory.container.opacity", to: 1 },
          { key: "controlMemory.container.scale", to: 1 },
        ],
        { duration: 0.4, easing: "easeOutQuart" },
      );
    } else {
      // Animar salida
      anim(
        [
          { key: "controlMemory.overlay.opacity", to: 0 },
          { key: "controlMemory.container.opacity", to: 0 },
          { key: "controlMemory.container.scale", to: 0.8 },
        ],
        { duration: 0.3, easing: "easeInQuart" },
      );
    }
  }, [isVisible]);

  if (!isVisible) return null;

  return (
    <animated.div
      data-testid="modal-overlay"
      className="absolute inset-0 z-30 flex items-center justify-center bg-black/50"
      style={{
        opacity: getSpring("controlMemory.overlay").opacity,
      }}
      onClick={onClose}
    >
      <animated.div
        data-testid="modal-content"
        className="relative max-h-[80%] w-[90%] max-w-2xl overflow-hidden rounded-lg border border-mantis-500 bg-stone-900 p-4 shadow-2xl"
        style={{
          transform: getSpring("controlMemory.container").scale.to(s => `scale(${s})`),
          opacity: getSpring("controlMemory.container").opacity,
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="mb-4 flex items-center justify-between border-b border-mantis-500 pb-2">
          <h3 className="text-lg font-bold text-mantis-400">
            🧠 Memoria de Control (Microprograma)
          </h3>
          <button
            onClick={onClose}
            className="rounded-full p-1 text-stone-400 hover:bg-stone-700 hover:text-white"
          >
            ✕
          </button>
        </div>

        {/* Contenido */}
        <div className="space-y-4">
          {/* Descripción */}
          <div className="rounded border border-stone-600 bg-stone-800 p-3">
            <p className="text-sm text-stone-300">
              La memoria de control almacena las microinstrucciones que definen cómo se ejecuta cada
              instrucción. Cada entrada contiene la secuencia de microoperaciones necesarias.
            </p>
          </div>

          {/* Instrucción actual destacada */}
          {currentInstruction && (
            <div className="animate-pulse rounded border-2 border-mantis-400 bg-mantis-900/50 p-3">
              <h4 className="mb-2 font-bold text-mantis-300">
                🎯 Instrucción Actual: {currentInstruction.instruction}
              </h4>
              <div className="space-y-1">
                {currentInstruction.microops.map((microop, index) => (
                  <div key={index} className="text-sm text-stone-200">
                    <span className="text-mantis-400">•</span> {microop}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tabla de memoria de control */}
          <div className="max-h-64 overflow-y-auto rounded border border-stone-600">
            <table className="w-full text-xs">
              <thead className="sticky top-0 bg-stone-800">
                <tr className="border-b border-stone-600">
                  <th className="p-2 text-left text-mantis-400">Dirección</th>
                  <th className="p-2 text-left text-mantis-400">Instrucción</th>
                  <th className="p-2 text-left text-mantis-400">Descripción</th>
                  <th className="p-2 text-left text-mantis-400">Microoperaciones</th>
                </tr>
              </thead>
              <tbody>
                {controlMemoryData.map((item, index) => (
                  <tr
                    key={index}
                    className={`border-b border-stone-700 hover:bg-stone-800 ${
                      currentInstruction?.instruction === item.instruction
                        ? "animate-pulse border-l-4 border-mantis-400 bg-mantis-900/30"
                        : ""
                    }`}
                  >
                    <td className="p-2 font-mono text-stone-400">{item.address}</td>
                    <td className="p-2 font-mono text-stone-300">{item.instruction}</td>
                    <td className="p-2 text-xs text-stone-300">{item.description}</td>
                    <td className="p-2 text-stone-300">
                      <div className="space-y-1">
                        {item.microops.map((microop, microIndex) => (
                          <div key={microIndex} className="text-xs">
                            {microop}
                          </div>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Información adicional */}
          <div className="rounded border border-stone-600 bg-stone-800 p-3">
            <h4 className="mb-2 font-bold text-mantis-400">💡 Conceptos Clave:</h4>
            <ul className="space-y-1 text-sm text-stone-300">
              <li>
                • <strong>Microinstrucción:</strong> Comando elemental que controla una
                microoperación
              </li>
              <li>
                • <strong>Microoperación:</strong> Operación atómica como transferir datos entre
                registros
              </li>
              <li>
                • <strong>Secuencia:</strong> Orden específico de microoperaciones para cada
                instrucción
              </li>
            </ul>
          </div>
        </div>
      </animated.div>
    </animated.div>
  );
}
