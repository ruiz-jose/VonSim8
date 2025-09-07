import type { Byte } from "@vonsim/common/byte";
import clsx from "clsx";
import { useAtomValue } from "jotai";
import { useCallback, useEffect, useState } from "react";

import { animated, getSpring } from "@/computer/shared/springs";
import { useSettings } from "@/lib/settings";

import { type DataRegister, generateDataPath } from "./DataBus";
import { aluOperationAtom, connectScreenAndKeyboardAtom, cycleAtom, mayUsePICAtom, registerAtoms } from "./state";

/**
 * ALU component, to be used inside <CPU />
 */
export function ALU() {
  const FLAGS = useAtomValue(registerAtoms.FLAGS);
  const result = useAtomValue(registerAtoms.result);
  const left = useAtomValue(registerAtoms.left);
  const right = useAtomValue(registerAtoms.right);
  const operation = useAtomValue(aluOperationAtom);
  const cycle = useAtomValue(cycleAtom);
  const [showOperation, setShowOperation] = useState(false);
  const [leftPath, setLeftPath] = useState("");
  const [rightPath, setRightPath] = useState("");
  const [resultPath, setResultPath] = useState("");
  const [leftSource, setLeftSource] = useState("");
  const [rightSource, setRightSource] = useState("");
  const [resultDestination, setResultDestination] = useState("");

  const connectScreenAndKeyboard = useAtomValue(connectScreenAndKeyboardAtom);
  const mayUsePIC = useAtomValue(mayUsePICAtom);
  const [settings] = useSettings();

  // Obtener la instrucción completa desde el ciclo actual (memorizada)
  const getCurrentInstruction = useCallback(() => {
    if (cycle && "metadata" in cycle && cycle.metadata) {
      const instruction = `${cycle.metadata.name}${cycle.metadata.operands.length ? " " + cycle.metadata.operands.join(", ") : ""}`;
      return instruction;
    }
    return "";
  }, [cycle]);

  // Función para determinar si una instrucción involucra la ALU
  const involvesALU = (instruction: string): boolean => {
    const aluInstructions = ["ADD", "SUB", "CMP", "AND", "OR", "XOR"];
    return aluInstructions.some(aluInst => instruction.startsWith(aluInst));
  };

  // Función para detectar los registros origen y destino basándose en la instrucción
  const detectRegisters = (
    instruction: string,
  ): { left: string; right: string; destination: string } => {
    // Por defecto, asumimos AL y BL para la mayoría de operaciones
    let leftReg = "AL";
    let rightReg = "BL";
    let destReg = "AL"; // Por defecto, el resultado va al primer operando

    // Detectar patrones específicos en la instrucción
    // Patrón general para instrucciones de dos operandos: INSTRUCCIÓN REG1, REG2
    const patterns = [
      /ADD\s+([[\]A-Z0-9]+),\s*([[\]A-Z0-9]+)/,
      /SUB\s+([[\]A-Z0-9]+),\s*([[\]A-Z0-9]+)/,
      /CMP\s+([[\]A-Z0-9]+),\s*([[\]A-Z0-9]+)/,
      /AND\s+([[\]A-Z0-9]+),\s*([[\]A-Z0-9]+)/,
      /OR\s+([[\]A-Z0-9]+),\s*([[\]A-Z0-9]+)/,
      /XOR\s+([[\]A-Z0-9]+),\s*([[\]A-Z0-9]+)/,
    ];

    // Detectar instrucciones aritméticas con destino en memoria (directo o indirecto) y fuente inmediato (decimal o hexadecimal)
    // Ejemplo: ADD [1000], 5   | ADD [BX], 02h   | ADD 1000h, 5   | ADD [BX], 0x02
    const aluMemImmediatePattern =
      /^(ADD|SUB|CMP|AND|OR|XOR)\s+(\[[^\]]+\]|[0-9A-F]+h?)\s*,\s*([0-9A-F]+h?|0x[0-9A-F]+)$/i;
    const matchMemImmediate = instruction.match(aluMemImmediatePattern);
    if (matchMemImmediate) {
      return { left: "mbr", right: "id", destination: "mbr" };
    }
    for (const pattern of patterns) {
      const match = instruction.match(pattern);
      if (match) {
        leftReg = match[1]; // Primer operando va a left
        rightReg = match[2]; // Segundo operando va a right
        // Si el primer operando contiene corchetes, usar MBR como fuente
        if (/\[.*\]/.test(leftReg)) {
          leftReg = "MBR";
        }
        // Si el segundo operando contiene corchetes, usar MBR como fuente
        if (/\[.*\]/.test(rightReg)) {
          rightReg = "MBR";
        }
        destReg = match[1]; // El resultado va al primer operando (destino)
        break;
      }
    }

    // Validar que los registros son válidos (AL, BL, CL, DL, MBR)
    const validRegisters = ["AL", "BL", "CL", "DL", "MBR"];
    if (!validRegisters.includes(leftReg)) {
      leftReg = "AL";
    }
    if (!validRegisters.includes(rightReg)) {
      rightReg = "BL";
    }
    if (!validRegisters.includes(destReg)) {
      destReg = "AL";
    }

    return { left: leftReg, right: rightReg, destination: destReg };
  };

  useEffect(() => {
    const handleInstruction = (instruction: string) => {
      console.log("🎯 handleInstruction llamado con:", instruction);
      // Usar la instrucción completa del ciclo actual para detectar registros
      const fullInstruction = getCurrentInstruction();
      const instructionToUse = fullInstruction || instruction;
      console.log("🎯 Instrucción completa a usar:", instructionToUse);
      if (instruction) {
        // Verificar si la instrucción involucra la ALU
        const isALUInstruction = involvesALU(instructionToUse);

        if (isALUInstruction) {
          setShowOperation(true);
          // Detectar dinámicamente ambos registros origen y destino usando la función parametrizada
          const {
            left: leftReg,
            right: rightReg,
            destination: destReg,
          } = detectRegisters(instructionToUse);
          console.log("🎯 Registros detectados:", {
            left: leftReg,
            right: rightReg,
            destination: destReg,
          });
          setLeftSource(leftReg);
          setRightSource(rightReg);
          setResultDestination(destReg);

          // Generar paths dinámicos para los buses de entrada
          let leftPathSVG, rightPathSVG;
          if (leftReg === "MBR" && rightReg !== "MBR") {
            leftPathSVG = generateDataPath(
              leftReg as DataRegister,
              "left",
              instruction,
              undefined,
              { separateMBRPaths: true, direction: "left" },
            );
            rightPathSVG = generateDataPath(rightReg as DataRegister, "right", instruction);
          } else if (rightReg === "MBR" && leftReg !== "MBR") {
            leftPathSVG = generateDataPath(leftReg as DataRegister, "left", instruction);
            rightPathSVG = generateDataPath(
              rightReg as DataRegister,
              "right",
              instruction,
              undefined,
              { separateMBRPaths: true, direction: "right" },
            );
          } else {
            leftPathSVG = generateDataPath(leftReg as DataRegister, "left", instruction);
            rightPathSVG = generateDataPath(rightReg as DataRegister, "right", instruction);
          }

          // Para debugging: usar paths hardcodeados si los dinámicos fallan
          const fallbackLeftPath =
            "M 455 45 L 465 45 L 550 45 L 550 16 L 90 16 L 90 85 L 130 85 L 220 85";
          const fallbackRightPath =
            "M 455 85 L 465 85 L 550 85 L 550 250 L 90 250 L 90 145 L 125 145 L 220 145";

          // Usar los paths dinámicos si están disponibles, sino usar los hardcodeados
          setLeftPath(leftPathSVG || fallbackLeftPath);
          setRightPath(rightPathSVG || fallbackRightPath);
          // NO establecer el path de resultado para evitar la animación del bus de resultado
          setResultPath("");
        } else {
          // Si no es una instrucción de ALU, ocultar todo
          setShowOperation(false);
          setLeftPath("");
          setRightPath("");
          setResultPath("");
          setLeftSource("");
          setRightSource("");
          setResultDestination("");
        }
      } else {
        // Si no hay instrucción, ocultar todo
        setShowOperation(false);
        setLeftPath("");
        setRightPath("");
        setResultPath("");
        setLeftSource("");
        setRightSource("");
        setResultDestination("");
      }
    };

    const eventListener = (event: Event) => {
      const customEvent = event as CustomEvent;
      // Usar la instrucción completa del ciclo actual en lugar de solo la instrucción del evento
      const fullInstruction = getCurrentInstruction();
      handleInstruction(fullInstruction || customEvent.detail.instruction);
    };

    // Listener para cuando se ejecuta la ALU (mantener por compatibilidad)
    const aluEventListener = (event: Event) => {
      const customEvent = event as CustomEvent;
      if (customEvent.detail && customEvent.detail.instruction) {
        // Usar la instrucción completa del ciclo actual en lugar de solo la instrucción del evento
        const fullInstruction = getCurrentInstruction();
        handleInstruction(fullInstruction || customEvent.detail.instruction);
      }
    };

    window.addEventListener("instructionChange", eventListener as EventListener);
    window.addEventListener("cpu:alu.execute", aluEventListener as EventListener);

    return () => {
      window.removeEventListener("instructionChange", eventListener);
      window.removeEventListener("cpu:alu.execute", aluEventListener);
    };
  }, [cycle, getCurrentInstruction]); // Agregar getCurrentInstruction como dependencia

  // https://vonsim.github.io/docs/cpu/#flags
  const CF = (FLAGS as Byte<16>).bit(1);
  const ZF = (FLAGS as Byte<16>).bit(0);
  const SF = (FLAGS as Byte<16>).bit(3);
  const IF = (FLAGS as Byte<16>).bit(4);
  const OF = (FLAGS as Byte<16>).bit(2);

  return (
    <>
      <svg viewBox="0 0 650 500" className="pointer-events-none absolute inset-0">
        {/* Buses de entrada parametrizados usando paths dinámicos */}
        {/* Bus izquierdo (AL) - Verde más brillante */}
        {leftPath && (
          <animated.path
            className="fill-none stroke-green-400 stroke-[3px] drop-shadow-[0_0_8px_rgba(34,197,94,0.6)]"
            strokeLinejoin="round"
            d={leftPath}
            pathLength={1}
            strokeDasharray={1}
            style={getSpring("cpu.alu.operands")}
          />
        )}
        {/* Bus derecho (BL) - Azul más brillante */}
        {rightPath && (
          <animated.path
            className="fill-none stroke-blue-400 stroke-[3px] drop-shadow-[0_0_8px_rgba(59,130,246,0.6)]"
            strokeLinejoin="round"
            d={rightPath}
            pathLength={1}
            strokeDasharray={1}
            style={getSpring("cpu.alu.operands")}
          />
        )}

        {/* Bus de resultado - Naranja/Ambar más brillante */}
        {resultPath && (
          <animated.path
            className="fill-none stroke-amber-400 stroke-[3px] drop-shadow-[0_0_8px_rgba(251,191,36,0.6)]"
            strokeLinejoin="round"
            d={resultPath}
            pathLength={1}
            strokeDasharray={1}
            style={getSpring("cpu.alu.results")}
          />
        )}

        {/* Efectos de brillo adicionales para los buses */}
        {leftPath && (
          <animated.path
            className="fill-none stroke-green-300 stroke-1 opacity-50"
            strokeLinejoin="round"
            d={leftPath}
            pathLength={1}
            strokeDasharray={1}
            style={getSpring("cpu.alu.operands")}
          />
        )}
        {rightPath && (
          <animated.path
            className="fill-none stroke-blue-300 stroke-1 opacity-50"
            strokeLinejoin="round"
            d={rightPath}
            pathLength={1}
            strokeDasharray={1}
            style={getSpring("cpu.alu.operands")}
          />
        )}
        {resultPath && (
          <animated.path
            className="fill-none stroke-amber-300 stroke-1 opacity-50"
            strokeLinejoin="round"
            d={resultPath}
            pathLength={1}
            strokeDasharray={1}
            style={getSpring("cpu.alu.results")}
          />
        )}

        {/* Etiquetas de los registros fuente - sincronizadas con la animación del operando */}
        {leftSource && rightSource && showOperation && leftPath && rightPath && (
          <animated.text
            x="125"
            y="65"
            fill="#34D399"
            fontSize="12"
            fontWeight="bold"
            style={{
              opacity: getSpring("cpu.alu.leftText").opacity,
            }}
          >
            {leftSource} = {(left as Byte<16>).low.toString("hex")}
          </animated.text>
        )}
        {leftSource && rightSource && showOperation && leftPath && rightPath && (
          <animated.text
            x="125"
            y="168"
            fill="#60A5FA"
            fontSize="12"
            fontWeight="bold"
            style={{
              opacity: getSpring("cpu.alu.rightText").opacity,
            }}
          >
            {rightSource} = {(right as Byte<16>).low.toString("hex")}
          </animated.text>
        )}

        {/* Etiqueta del registro destino con valor - sincronizada con la animación del engranaje */}
        {resultDestination && showOperation && (
          <animated.text
            x="310"
            y="95"
            fill="#A855F7"
            fontSize="12"
            fontWeight="bold"
            style={{
              ...getSpring("cpu.alu.cog"),
              opacity: getSpring("cpu.alu.resultText").opacity,
            }}
          >
            {resultDestination} = {(result as Byte<16>).low.toString("hex")}
          </animated.text>
        )}

        {/* ALU con gradiente mejorado */}
        <defs>
          <linearGradient id="aluGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#374151" />
            <stop offset="50%" stopColor="#4B5563" />
            <stop offset="100%" stopColor="#1F2937" />
          </linearGradient>
          <filter id="aluShadow">
            <feDropShadow dx="2" dy="2" stdDeviation="3" floodColor="rgba(0,0,0,0.3)" />
          </filter>
        </defs>

        {/* ALU más grande */}
        <path
          d="M 220 60 v 50 l 20 12 l -20 12 v 50 l 60 -36 v -52 Z"
          fill="url(#aluGradient)"
          stroke="#6B7280"
          strokeWidth="2"
          strokeLinejoin="round"
          filter="url(#aluShadow)"
        />

        {/* Etiqueta ALU centrada */}
        <text x="250" y="105" fill="#E5E7EB" fontSize="12" fontWeight="bold" textAnchor="middle">
          ALU
        </text>
      </svg>

      <animated.span
        className="icon-[lucide--settings] absolute left-[244px] top-[120px] block size-5 text-stone-300"
        style={{
          transform: getSpring("cpu.alu.cog").rot.to(t => `rotate(${t * 60}deg)`),
        }}
      />

      {showOperation && (
        <animated.span
          className="absolute left-[244px] top-[40px] z-30 flex w-min items-center rounded-md border border-stone-600 px-2 py-1 font-mono leading-none"
          style={getSpring("cpu.alu.operation")}
        >
          {operation}
        </animated.span>
      )}

      {/* Flags mejoradas */}
      <animated.div
        className={clsx(
          "absolute flex items-center justify-center gap-0.5 rounded border-2 border-amber-400 bg-transparent font-bold text-stone-200 shadow-lg ring-1 ring-amber-300",
          settings.flagsVisibility === "SF_OF_CF_ZF"
            ? "left-[210px] top-[190px] min-h-[40px] min-w-[60px] px-2"
            : "left-[230px] top-[190px] min-h-[40px] min-w-[40px] px-1",
        )}
        style={getSpring("cpu.FLAGS")}
      >
        <span className="pointer-events-none absolute left-0.5 top-0.5 rounded bg-stone-900/80 px-0.5 text-[7px] font-bold text-stone-300">
          FLAGS
        </span>

        {/* Contenido centrado en el registro */}
        <div className="mt-3 flex items-center gap-0.5">
          {(connectScreenAndKeyboard || mayUsePIC || settings.flagsVisibility === "IF_CF_ZF" || settings.flagsVisibility === "IF_SF_OF_CF_ZF") && (
            <span
              className={clsx(
                "rounded border px-0.5 py-0 text-[10px] font-bold transition-all duration-200",
                IF
                  ? "border-amber-400 bg-amber-400 text-stone-950 shadow-[0_0_4px_rgba(251,191,36,0.6)]"
                  : "border-stone-600 bg-stone-800 text-stone-300",
              )}
            >
              I
            </span>
          )}

          {(settings.flagsVisibility === "SF_OF_CF_ZF" || settings.flagsVisibility === "IF_SF_OF_CF_ZF") && (
            <>
              <span
                className={clsx(
                  "rounded border px-0.5 py-0 text-[10px] font-bold transition-all duration-200",
                  SF
                    ? "border-amber-400 bg-amber-400 text-stone-950 shadow-[0_0_4px_rgba(251,191,36,0.6)]"
                    : "border-stone-600 bg-stone-800 text-stone-300",
                )}
              >
                S
              </span>
              <span
                className={clsx(
                  "rounded border px-0.5 py-0 text-[10px] font-bold transition-all duration-200",
                  OF
                    ? "border-amber-400 bg-amber-400 text-stone-950 shadow-[0_0_4px_rgba(251,191,36,0.6)]"
                    : "border-stone-600 bg-stone-800 text-stone-300",
                )}
              >
                O
              </span>
            </>
          )}

          <span
            className={clsx(
              "rounded border px-0.5 py-0 text-[10px] font-bold transition-all duration-200",
              CF
                ? "border-amber-400 bg-amber-400 text-stone-950 shadow-[0_0_4px_rgba(251,191,36,0.6)]"
                : "border-stone-600 bg-stone-800 text-stone-300",
            )}
          >
            C
          </span>
          <span
            className={clsx(
              "rounded border px-0.5 py-0 text-[10px] font-bold transition-all duration-200",
              ZF
                ? "border-yellow-400 bg-yellow-400 text-stone-950 shadow-[0_0_4px_rgba(250,204,21,0.6)]"
                : "border-stone-600 bg-stone-800 text-stone-300",
            )}
          >
            Z
          </span>
        </div>
      </animated.div>
    </>
  );
}
