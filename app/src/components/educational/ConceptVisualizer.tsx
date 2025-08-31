import {
  faCompress,
  faExpand,
  faInfoCircle,
  faPause,
  faPlay,
  faRotateLeft,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import clsx from "clsx";
import { memo, useCallback, useEffect, useState } from "react";

import { Button } from "@/components/ui/Button";

type ConceptVisualizerProps = {
  concept:
    | "fetch-decode-execute"
    | "memory-access"
    | "register-transfer"
    | "alu-operation"
    | "bus-communication"
    | "cpu-components"
    | "registers-overview"
    | "memory-structure";
  onClose?: () => void;
  className?: string;
};

// Definiciones de visualizaciones por concepto
const VISUALIZATIONS = {
  "cpu-components": {
    title: "Componentes de la CPU",
    description:
      "Visualiza los componentes principales de la CPU: ALU, Unidad de Control y registros",
    steps: [
      {
        id: "overview",
        title: "Vista General de la CPU",
        description: "Estructura general de la CPU VonSim8",
        duration: 3000,
        animation: {
          type: "highlight",
          targets: ["CPU-container"],
          data: {
            title: "CPU",
            description:
              "Se basa en el procesador Intel 8086 de 16 bits, pero por simplicidad usamos registros de 8 bits.",
          },
        },
      },
      {
        id: "alu",
        title: "ALU (Unidad Aritmético-Lógica)",
        description: "Ejecuta operaciones aritméticas y lógicas",
        duration: 2500,
        animation: {
          type: "highlight",
          targets: ["ALU"],
          data: {
            description: "Ejecuta operaciones aritméticas (como ADD + y SUB —) y lógicas.",
            icon: "⚙️",
          },
        },
      },
      {
        id: "control-unit",
        title: "Unidad de Control",
        description: "Coordina el funcionamiento de todos los componentes",
        duration: 2500,
        animation: {
          type: "highlight",
          targets: ["control-unit"],
          data: {
            description: "Coordina el funcionamiento de todos los componentes internos de la CPU.",
            components: ["Decodificador", "INSTRUCCIÓN"],
          },
        },
      },
      {
        id: "flags",
        title: "Registro de Flags",
        description: "Indicadores del estado de las operaciones",
        duration: 2000,
        animation: {
          type: "highlight",
          targets: ["FLAGS"],
          data: {
            description: "Contiene indicadores del estado: C (Carry) y Z (Zero)",
            flags: ["C", "Z"],
          },
        },
      },
    ],
  },
  "registers-overview": {
    title: "Registros de la CPU",
    description: "Visualiza los diferentes tipos de registros y sus funciones",
    steps: [
      {
        id: "general-purpose",
        title: "Registros de Propósito General",
        description: "AL, BL, CL, DL - registros para datos",
        duration: 2500,
        animation: {
          type: "highlight",
          targets: ["AL", "BL", "CL", "DL"],
          data: {
            description:
              "Las instrucciones utilizan estos registros como operandos: AL, BL, CL, DL.",
            registers: ["AL", "BL", "CL", "DL"],
          },
        },
      },
      {
        id: "instruction-pointer",
        title: "Puntero de Instrucción (IP)",
        description: "Contiene la dirección de la próxima instrucción",
        duration: 2000,
        animation: {
          type: "highlight",
          targets: ["IP"],
          data: {
            description: "Contiene la dirección de la próxima instrucción que se ejecutará.",
            color: "red",
          },
        },
      },
      {
        id: "instruction-register",
        title: "Registro de Instrucción (IR)",
        description: "Contiene la instrucción en curso",
        duration: 2000,
        animation: {
          type: "highlight",
          targets: ["IR"],
          data: {
            description: "Contiene la instrucción en curso para su decodificación y ejecución.",
            color: "purple",
          },
        },
      },
      {
        id: "memory-registers",
        title: "Registros de Memoria",
        description: "MAR y MBR - para comunicación con memoria",
        duration: 2500,
        animation: {
          type: "highlight",
          targets: ["MAR", "MBR"],
          data: {
            description: "MAR: dirección de memoria. MBR: datos transferidos.",
            registers: ["MAR", "MBR"],
          },
        },
      },
    ],
  },
  "memory-structure": {
    title: "Estructura de Memoria",
    description: "Visualiza la organización de la memoria RAM y los buses",
    steps: [
      {
        id: "memory-grid",
        title: "Matriz de Memoria",
        description: "256 celdas organizadas en 16x16",
        duration: 3000,
        animation: {
          type: "highlight",
          targets: ["memory-grid"],
          data: {
            description:
              "Compuesta por 256 celdas, cada una de 1 byte. Las direcciones y contenidos están representados en hexadecimal.",
            size: "16x16",
            cells: 256,
          },
        },
      },
      {
        id: "addressing",
        title: "Dirección de Memoria",
        description: "Formación de direcciones hexadecimales",
        duration: 2500,
        animation: {
          type: "highlight",
          targets: ["address-example"],
          data: {
            description:
              "La dirección 12h se obtiene de la intersección de la fila 1 y la columna 2.",
            example: "12h = fila 1, columna 2",
          },
        },
      },
      {
        id: "data-bus",
        title: "Bus de Datos",
        description: "Transferencia bidireccional de datos",
        duration: 2000,
        animation: {
          type: "flow",
          targets: ["data-bus"],
          data: {
            description: "Transfiere entre CPU y memoria en ambos sentidos. Es bidireccional.",
            direction: "bidirectional",
          },
        },
      },
      {
        id: "address-bus",
        title: "Bus de Direcciones",
        description: "Envío de direcciones a memoria",
        duration: 2000,
        animation: {
          type: "flow",
          targets: ["address-bus"],
          data: {
            description:
              "Envía desde la CPU a la memoria la dirección de la celda a leer o escribir. Es unidireccional.",
            direction: "unidirectional",
          },
        },
      },
      {
        id: "control-bus",
        title: "Buses de Control",
        description: "Señales de control para memoria",
        duration: 2000,
        animation: {
          type: "highlight",
          targets: ["control-bus"],
          data: {
            description: "Transmiten las órdenes de lectura o escritura hacia la memoria.",
            signals: ["rd", "wr"],
          },
        },
      },
    ],
  },
  "fetch-decode-execute": {
    title: "Ciclo Fetch-Decode-Execute",
    description: "Visualiza las tres fases del ciclo de instrucción",
    steps: [
      {
        id: "fetch",
        title: "Fase Fetch",
        description: "La CPU lee la instrucción desde memoria",
        duration: 2000,
        animation: {
          type: "flow",
          targets: ["IP", "MAR", "MBR"],
          data: { from: "IP", to: "MBR", value: "A1" },
        },
      },
      {
        id: "decode",
        title: "Fase Decode",
        description: "La CPU interpreta la instrucción",
        duration: 2000,
        animation: {
          type: "highlight",
          targets: ["IR"],
          data: { instruction: "MOV AL, 5" },
        },
      },
      {
        id: "execute",
        title: "Fase Execute",
        description: "La CPU ejecuta la operación",
        duration: 2000,
        animation: {
          type: "transform",
          targets: ["AL"],
          data: { newValue: "05" },
        },
      },
    ],
  },
  "memory-access": {
    title: "Acceso a Memoria",
    description: "Cómo la CPU lee y escribe en memoria RAM",
    steps: [
      {
        id: "address-setup",
        title: "Configurar Dirección",
        description: "La CPU coloca la dirección en el MAR",
        duration: 1500,
        animation: {
          type: "highlight",
          targets: ["MAR"],
          data: { address: "A0" },
        },
      },
      {
        id: "memory-read",
        title: "Lectura de Memoria",
        description: "El contenido se transfiere al MBR",
        duration: 1500,
        animation: {
          type: "flow",
          targets: ["memory-cell-A0", "MBR"],
          data: { from: "memory", to: "MBR", value: "42" },
        },
      },
      {
        id: "data-transfer",
        title: "Transferencia de Datos",
        description: "Los datos se mueven al registro destino",
        duration: 1500,
        animation: {
          type: "flow",
          targets: ["MBR", "AL"],
          data: { from: "MBR", to: "AL", value: "42" },
        },
      },
    ],
  },
  "register-transfer": {
    title: "Transferencia entre Registros",
    description: "Movimiento de datos entre registros de la CPU",
    steps: [
      {
        id: "source-read",
        title: "Leer Registro Origen",
        description: "El valor se lee del registro origen",
        duration: 1000,
        animation: {
          type: "highlight",
          targets: ["AL"],
          data: { value: "25" },
        },
      },
      {
        id: "bus-transfer",
        title: "Transferencia por Bus",
        description: "Los datos viajan por el bus interno",
        duration: 1500,
        animation: {
          type: "flow",
          targets: ["AL", "BL"],
          data: { from: "AL", to: "BL", value: "25" },
        },
      },
      {
        id: "destination-write",
        title: "Escribir Registro Destino",
        description: "El valor se almacena en el registro destino",
        duration: 1000,
        animation: {
          type: "transform",
          targets: ["BL"],
          data: { newValue: "25" },
        },
      },
    ],
  },
  "alu-operation": {
    title: "Operación ALU",
    description: "Proceso de operación aritmética o lógica",
    steps: [
      {
        id: "operand-load",
        title: "Cargar Operandos",
        description: "Los operandos se cargan en la ALU",
        duration: 1500,
        animation: {
          type: "highlight",
          targets: ["AL", "BL"],
          data: { operand1: "10", operand2: "05" },
        },
      },
      {
        id: "operation-execute",
        title: "Ejecutar Operación",
        description: "La ALU realiza la operación",
        duration: 2000,
        animation: {
          type: "sequence",
          targets: ["ALU"],
          data: { operation: "ADD", result: "15" },
        },
      },
      {
        id: "result-store",
        title: "Almacenar Resultado",
        description: "El resultado se guarda en el registro destino",
        duration: 1500,
        animation: {
          type: "transform",
          targets: ["AL"],
          data: { newValue: "15" },
        },
      },
    ],
  },
  "bus-communication": {
    title: "Comunicación por Bus",
    description: "Cómo los componentes se comunican a través del bus",
    steps: [
      {
        id: "bus-request",
        title: "Solicitud de Bus",
        description: "Un componente solicita acceso al bus",
        duration: 1000,
        animation: {
          type: "highlight",
          targets: ["CPU"],
          data: { requesting: true },
        },
      },
      {
        id: "bus-grant",
        title: "Concesión de Bus",
        description: "El bus se concede al componente solicitante",
        duration: 1000,
        animation: {
          type: "highlight",
          targets: ["data-bus"],
          data: { granted: true },
        },
      },
      {
        id: "data-transfer",
        title: "Transferencia de Datos",
        description: "Los datos se transfieren por el bus",
        duration: 2000,
        animation: {
          type: "flow",
          targets: ["data-bus"],
          data: { data: "A1B2", direction: "CPU-to-Memory" },
        },
      },
      {
        id: "bus-release",
        title: "Liberación de Bus",
        description: "El bus se libera para otros componentes",
        duration: 1000,
        animation: {
          type: "highlight",
          targets: ["data-bus"],
          data: { released: true },
        },
      },
    ],
  },
};

export const ConceptVisualizer = memo(({ concept, onClose, className }: ConceptVisualizerProps) => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showInfo, setShowInfo] = useState(false);

  const visualization = VISUALIZATIONS[concept];
  const currentStep = visualization.steps[currentStepIndex];
  const isFirstStep = currentStepIndex === 0;
  const isLastStep = currentStepIndex === visualization.steps.length - 1;

  // Auto-advance cuando está reproduciendo
  useEffect(() => {
    if (isPlaying) {
      const timer = setTimeout(() => {
        if (!isLastStep) {
          setCurrentStepIndex(prev => prev + 1);
        } else {
          setIsPlaying(false);
        }
      }, currentStep.duration);

      return () => clearTimeout(timer);
    }
  }, [isPlaying, currentStepIndex, isLastStep, currentStep.duration]);

  const nextStep = useCallback(() => {
    if (!isLastStep) {
      setCurrentStepIndex(prev => prev + 1);
    }
  }, [isLastStep]);

  const prevStep = useCallback(() => {
    if (!isFirstStep) {
      setCurrentStepIndex(prev => prev - 1);
    }
  }, [isFirstStep]);

  const reset = useCallback(() => {
    setCurrentStepIndex(0);
    setIsPlaying(false);
  }, []);

  const togglePlay = useCallback(() => {
    setIsPlaying(!isPlaying);
  }, [isPlaying]);

  const toggleFullscreen = useCallback(() => {
    setIsFullscreen(!isFullscreen);
  }, [isFullscreen]);

  // Renderizar animación según el tipo
  const renderAnimation = () => {
    const { type, targets, data } = currentStep.animation;

    switch (type) {
      case "highlight":
        return (
          <div className="relative">
            {targets.map((target, index) => (
              <div
                key={index}
                className="absolute inset-0 animate-pulse rounded border-2 border-mantis-400 bg-mantis-400/20"
                style={{
                  animationDelay: `${index * 200}ms`,
                }}
              />
            ))}
            {data && (
              <div className="absolute right-2 top-2 rounded bg-mantis-500 px-2 py-1 text-xs text-white">
                {Object.entries(data).map(([key, value]) => (
                  <div key={key}>
                    {key}: {String(value)}
                  </div>
                ))}
              </div>
            )}
          </div>
        );

      case "flow":
        return (
          <div className="relative">
            <svg className="absolute inset-0 size-full">
              <defs>
                <linearGradient id="flowGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#10b981" stopOpacity="0.8" />
                  <stop offset="50%" stopColor="#10b981" stopOpacity="1" />
                  <stop offset="100%" stopColor="#10b981" stopOpacity="0.8" />
                </linearGradient>
              </defs>

              <path
                d={`M ${("from" in data && data.from) || "0,0"} L ${("to" in data && data.to) || "100,100"}`}
                stroke="url(#flowGradient)"
                strokeWidth="3"
                strokeDasharray="10,5"
                className="animate-pulse"
              />
            </svg>

            {"value" in data && data.value && (
              <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
                <div className="rounded bg-mantis-500 px-2 py-1 font-mono text-xs text-white">
                  {data.value}
                </div>
              </div>
            )}
          </div>
        );

      case "transform":
        return (
          <div className="relative">
            {targets.map((target, index) => (
              <div
                key={index}
                className="absolute inset-0 animate-ping rounded bg-mantis-400/30"
                style={{
                  animationDelay: `${index * 300}ms`,
                }}
              />
            ))}
            {"newValue" in data && data.newValue && (
              <div className="absolute left-2 top-2 rounded bg-mantis-500 px-2 py-1 font-mono text-xs text-white">
                Nuevo: {data.newValue}
              </div>
            )}
          </div>
        );

      case "sequence":
        return (
          <div className="relative">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="rounded-lg bg-mantis-500 px-4 py-2 font-mono text-sm text-white">
                {"operation" in data && data.operation ? data.operation : "Operación"}
              </div>
            </div>
            {"result" in data && data.result && (
              <div className="absolute bottom-2 right-2 rounded bg-green-500 px-2 py-1 font-mono text-xs text-white">
                = {data.result}
              </div>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div
      className={clsx(
        "fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4",
        isFullscreen && "p-0",
        className,
      )}
    >
      <div
        className={clsx(
          "rounded-lg border border-stone-600 bg-stone-900 shadow-xl",
          isFullscreen ? "size-full" : "max-h-[90vh] w-full max-w-4xl",
        )}
      >
        {/* Header */}
        <div className="border-b border-stone-600 p-4">
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-mantis-400">{visualization.title}</h2>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowInfo(!showInfo)}
                className="text-stone-400 hover:text-mantis-400"
              >
                <FontAwesomeIcon icon={faInfoCircle} />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleFullscreen}
                className="text-stone-400 hover:text-mantis-400"
              >
                <FontAwesomeIcon icon={isFullscreen ? faCompress : faExpand} />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="text-stone-400 hover:text-white"
              >
                ×
              </Button>
            </div>
          </div>

          <div className="flex items-center gap-4 text-sm text-stone-400">
            <span>
              Paso {currentStepIndex + 1} de {visualization.steps.length}
            </span>
            <span>•</span>
            <span>{currentStep.duration / 1000}s</span>
          </div>

          {/* Progress bar */}
          <div className="mt-3 h-2 w-full rounded-full bg-stone-700">
            <div
              className="h-2 rounded-full bg-mantis-500 transition-all duration-300"
              style={{ width: `${((currentStepIndex + 1) / visualization.steps.length) * 100}%` }}
            />
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 p-4">
          <div className="mb-4">
            <h3 className="mb-2 text-base font-medium text-white">{currentStep.title}</h3>
            <p className="text-sm text-stone-300">{currentStep.description}</p>
          </div>

          {/* Visualization area */}
          <div className="relative h-64 overflow-hidden rounded-lg border border-stone-600 bg-stone-800">
            {renderAnimation()}

            {/* Info overlay */}
            {showInfo && (
              <div className="absolute left-2 top-2 max-w-xs rounded border border-stone-600 bg-stone-900/90 p-3">
                <h4 className="mb-2 font-medium text-mantis-400">Información</h4>
                <p className="text-xs text-stone-300">{visualization.description}</p>
                <div className="mt-2 text-xs text-stone-400">
                  <div>Tipo de animación: {currentStep.animation.type}</div>
                  <div>Elementos: {currentStep.animation.targets.join(", ")}</div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Controls */}
        <div className="border-t border-stone-600 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={reset}
                className="flex items-center gap-1"
              >
                <FontAwesomeIcon icon={faRotateLeft} />
                Reiniciar
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={prevStep}
                disabled={isFirstStep}
                className="flex items-center gap-1"
              >
                Anterior
              </Button>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={togglePlay}
                className="flex items-center gap-1"
              >
                <FontAwesomeIcon icon={isPlaying ? faPause : faPlay} />
                {isPlaying ? "Pausar" : "Reproducir"}
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={nextStep}
                disabled={isLastStep}
                className="flex items-center gap-1"
              >
                Siguiente
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

ConceptVisualizer.displayName = "ConceptVisualizer";
