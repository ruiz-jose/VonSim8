import {
  faCheck,
  faGraduationCap,
  faLightbulb,
  faRocket,
  faStepBackward,
  faStepForward,
  faTimes,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import clsx from "clsx";
import { memo, useCallback, useEffect, useState } from "react";

import { Button } from "@/components/ui/Button";

type TutorialStep = {
  id: string;
  title: string;
  description: string;
  content: string;
  type: "explanation" | "interactive" | "exercise" | "quiz";
  // Se eliminó la opción de ver conceptos en acción y visualizaciones
  exercise?: {
    question: string;
    options?: string[];
    correctAnswer: string | number;
    explanation: string;
  };
  hints?: string[];
  completed: boolean;
};

type Tutorial = {
  id: string;
  title: string;
  description: string;
  difficulty: "beginner" | "intermediate" | "advanced";
  // Se eliminó el campo concepts y cualquier referencia a visualizaciones
  steps: TutorialStep[];
  estimatedTime: number; // en minutos
};

type InteractiveTutorialProps = {
  tutorial: Tutorial;
  onComplete?: (tutorialId: string) => void;
  onClose?: () => void;
  className?: string;
};

// Tutoriales disponibles
export const AVAILABLE_TUTORIALS: Tutorial[] = [
  {
    id: "cpu-components",
    title: "Componentes de la CPU",
    description:
      "Aprende sobre los componentes principales de la CPU: ALU, Unidad de Control y registros",
    difficulty: "beginner",
    estimatedTime: 12,
    steps: [
      {
        id: "intro",
        title: "Introducción a la CPU",
        description: "¿Qué es una CPU y para qué sirve?",
        content:
          "La CPU (Unidad Central de Procesamiento) es el cerebro de la computadora. Se encarga de ejecutar instrucciones y procesar datos. En VonSim8, se basa en el procesador Intel 8086 de 16 bits, pero por simplicidad usamos registros de 8 bits.",
        type: "explanation",
        completed: false,
      },
      {
        id: "alu",
        title: "ALU (Unidad Aritmético-Lógica)",
        description: "El componente que ejecuta operaciones matemáticas y lógicas",
        content:
          "La ALU ejecuta operaciones aritméticas (como ADD + y SUB —) y lógicas. Es el componente que realiza los cálculos dentro de la CPU. En el diagrama, puedes ver la ALU representada como un bloque azul con un ícono de engranaje.",
        type: "explanation",
        completed: false,
      },
      {
        id: "control-unit",
        title: "Unidad de Control (UC)",
        description: "Coordina el funcionamiento de todos los componentes",
        content:
          "La Unidad de Control coordina el funcionamiento de todos los componentes internos de la CPU. Contiene el decodificador que interpreta las instrucciones y genera las señales de control necesarias para ejecutar cada operación.",
        type: "explanation",
        completed: false,
      },
      {
        id: "flags",
        title: "Registro de Flags",
        description: "Indicadores del estado de las operaciones",
        content:
          "El registro FLAGS contiene indicadores del estado de las operaciones. Los flags más importantes son C (Carry) y Z (Zero). El flag Carry indica si hubo acarreo en una operación, y el flag Zero indica si el resultado fue cero.",
        type: "explanation",
        completed: false,
      },
      {
        id: "cpu-quiz",
        title: "Evaluación: Componentes de la CPU",
        description: "Pon a prueba tu conocimiento sobre los componentes de la CPU",
        type: "quiz",
        content: "",
        exercise: {
          question:
            "¿Cuál de estos componentes ejecuta las operaciones aritméticas y lógicas en la CPU?",
          options: ["Unidad de Control", "ALU", "Registros", "Memoria"],
          correctAnswer: 1,
          explanation:
            "La ALU (Unidad Aritmético-Lógica) es específicamente la responsable de ejecutar operaciones matemáticas y lógicas dentro de la CPU.",
        },
        completed: false,
      },
    ],
  },
  {
    id: "registers",
    title: "Registros de la CPU",
    description: "Comprende los diferentes tipos de registros y sus funciones",
    difficulty: "beginner",
    estimatedTime: 15,
    steps: [
      {
        id: "registers-intro",
        title: "¿Qué son los Registros?",
        description: "Memoria rápida dentro de la CPU",
        content:
          "Los registros son espacios de almacenamiento (memoria) dentro de la CPU. Son más rápidos que la RAM pero tienen menos capacidad. Se utilizan para almacenar datos temporalmente durante la ejecución de instrucciones.",
        type: "explanation",
        completed: false,
      },
      {
        id: "general-purpose",
        title: "Registros de Propósito General",
        description: "AL, BL, CL, DL - registros para datos",
        content:
          "Los registros de propósito general (AL, BL, CL, DL) son utilizados por las instrucciones como operandos. Pueden almacenar datos, direcciones o resultados de operaciones. En VonSim8, cada uno puede almacenar 8 bits (1 byte).",
        type: "explanation",
        completed: false,
      },
      {
        id: "instruction-pointer",
        title: "Puntero de Instrucción (IP)",
        description: "Contiene la dirección de la próxima instrucción",
        content:
          "El Puntero de Instrucción (IP) contiene la dirección de la próxima instrucción que se ejecutará. Se incrementa automáticamente después de cada instrucción para apuntar a la siguiente en memoria.",
        type: "explanation",
        completed: false,
      },
      {
        id: "instruction-register",
        title: "Registro de Instrucción (IR)",
        description: "Contiene la instrucción en curso",
        content:
          "El Registro de Instrucción (IR) contiene la instrucción en curso para su decodificación y ejecución. Es donde la CPU almacena temporalmente la instrucción que está procesando.",
        type: "explanation",
        completed: false,
      },
      {
        id: "memory-registers",
        title: "Registros de Memoria",
        description: "MAR y MBR - para comunicación con memoria",
        content:
          "MAR (Memory Address Register) contiene la dirección de memoria donde se desea leer o escribir. MBR (Memory Buffer Register) contiene datos que se transfieren hacia o desde la memoria. Estos registros facilitan la comunicación entre la CPU y la memoria RAM.",
        type: "explanation",
        completed: false,
      },
      {
        id: "registers-quiz",
        title: "Evaluación: Registros",
        description: "Pon a prueba tu conocimiento sobre los registros",
        type: "quiz",
        content: "Responde correctamente para continuar con el tutorial.",
        exercise: {
          question:
            "¿Cuál de estos registros contiene la dirección de la próxima instrucción a ejecutar?",
          options: ["IR", "IP", "MAR", "MBR"],
          correctAnswer: 1,
          explanation:
            "El Puntero de Instrucción (IP) es el registro que contiene la dirección de la próxima instrucción que se ejecutará.",
        },
        completed: false,
      },
    ],
  },
  {
    id: "memory",
    title: "Memoria RAM",
    description: "Comprende cómo funciona la memoria principal y su acceso",
    difficulty: "beginner",
    estimatedTime: 10,
    steps: [
      {
        id: "memory-intro",
        title: "¿Qué es la Memoria RAM?",
        description: "La memoria de acceso aleatorio",
        content:
          "La memoria RAM (Random Access Memory) está compuesta por 256 celdas, cada una de 1 byte. Las direcciones y contenidos están representados en hexadecimal. Es donde se almacenan programas y datos temporalmente durante la ejecución.",
        type: "explanation",
        completed: false,
      },
      {
        id: "memory-addressing",
        title: "Dirección de Memoria",
        description: "Cómo se forman las direcciones",
        content:
          "La dirección de memoria se expresa en hexadecimal y se forma combinando el número de fila y columna. Por ejemplo: la dirección 12h se obtiene de la intersección de la fila 1 y la columna 2 en la matriz de memoria.",
        type: "explanation",
        completed: false,
      },
      {
        id: "data-bus",
        title: "Bus de Datos",
        description: "Transferencia bidireccional de datos",
        content:
          "El bus de datos transfiere información entre la CPU y memoria en ambos sentidos. Es bidireccional, permitiendo tanto la lectura como la escritura de datos en memoria.",
        type: "explanation",
        completed: false,
      },
      {
        id: "address-bus",
        title: "Bus de Direcciones",
        description: "Envío de direcciones a memoria",
        content:
          "El bus de direcciones envía desde la CPU a la memoria la dirección de la celda a leer o escribir. Es unidireccional, ya que solo la CPU puede especificar direcciones de memoria.",
        type: "explanation",
        completed: false,
      },
      {
        id: "control-bus",
        title: "Buses de Control",
        description: "Señales de control para memoria",
        content:
          "Los buses de control transmiten las órdenes de lectura o escritura hacia la memoria. Estas señales indican a la memoria qué operación realizar (leer o escribir) en la dirección especificada.",
        type: "explanation",
        completed: false,
      },
      {
        id: "memory-quiz",
        title: "Evaluación: Memoria",
        description: "Pon a prueba tu conocimiento sobre memoria",
        type: "quiz",
        content: "Responde correctamente para continuar con el tutorial.",
        exercise: {
          question: "¿Cuántas celdas de memoria tiene VonSim8 y cuánto almacena cada una?",
          options: [
            "128 celdas de 2 bytes",
            "256 celdas de 1 byte",
            "512 celdas de 1 byte",
            "256 celdas de 2 bytes",
          ],
          correctAnswer: 1,
          explanation:
            "VonSim8 tiene 256 celdas de memoria, cada una capaz de almacenar 1 byte (8 bits) de información.",
        },
        completed: false,
      },
    ],
  },
  {
    id: "cpu-basics",
    title: "Fundamentos de la CPU",
    description: "Aprende cómo funciona una CPU y sus componentes principales",
    difficulty: "beginner",
    estimatedTime: 10,
    steps: [
      {
        id: "intro",
        title: "Introducción a la CPU",
        description: "¿Qué es una CPU y para qué sirve?",
        content:
          "La CPU (Unidad Central de Procesamiento) es el cerebro de la computadora. Se encarga de ejecutar instrucciones y procesar datos.",
        type: "explanation",
        completed: false,
      },
      {
        id: "registers",
        title: "Registros de la CPU",
        description: "Los registros son memoria rápida dentro de la CPU",
        content:
          "Los registros almacenan datos temporalmente durante la ejecución. Son más rápidos que la RAM pero tienen menos capacidad.",
        type: "explanation",
        completed: false,
      },
      {
        id: "program-counter",
        title: "Puntero de Instrucción",
        description: "El IP indica la siguiente instrucción a ejecutar",
        content:
          "El Puntero de Instrucción (IP) se incrementa automáticamente después de cada instrucción.",
        type: "explanation",
        completed: false,
      },
    ],
  },
];

export const InteractiveTutorial = memo(
  ({ tutorial, onComplete, onClose, className }: InteractiveTutorialProps) => {
    const [currentStepIndex, setCurrentStepIndex] = useState(0);
    const [steps, setSteps] = useState<TutorialStep[]>(tutorial.steps);
    const [isPlaying, setIsPlaying] = useState(false);
    const [showHints, setShowHints] = useState(false);
    const [userAnswer, setUserAnswer] = useState<string>("");
    const [answerFeedback, setAnswerFeedback] = useState<{
      correct: boolean;
      message: string;
    } | null>(null);

    const currentStep = steps[currentStepIndex];
    const isFirstStep = currentStepIndex === 0;
    const isLastStep = currentStepIndex === steps.length - 1;
    const completedSteps = steps.filter(s => s.completed).length;
    const progress = (completedSteps / steps.length) * 100;

    const completeTutorial = useCallback(() => {
      onComplete?.(tutorial.id);
    }, [tutorial.id, onComplete]);

    const nextStep = useCallback(() => {
      if (!isLastStep) {
        setCurrentStepIndex(prev => prev + 1);
        setAnswerFeedback(null);
        setUserAnswer("");
      } else {
        completeTutorial();
      }
    }, [isLastStep, completeTutorial]);

    const prevStep = useCallback(() => {
      if (!isFirstStep) {
        setCurrentStepIndex(prev => prev - 1);
        setAnswerFeedback(null);
        setUserAnswer("");
      }
    }, [isFirstStep]);

    const completeStep = useCallback(() => {
      setSteps(prev =>
        prev.map((step, index) =>
          index === currentStepIndex ? { ...step, completed: true } : step,
        ),
      );
    }, [currentStepIndex]);

    const handleAnswerSubmit = useCallback(() => {
      if (!currentStep.exercise) return;

      const isCorrect = userAnswer === currentStep.exercise.correctAnswer.toString();
      setAnswerFeedback({
        correct: isCorrect,
        message: isCorrect ? "¡Correcto!" : `Incorrecto. ${currentStep.exercise.explanation}`,
      });

      if (isCorrect) {
        completeStep();
        setTimeout(() => {
          nextStep();
        }, 2000);
      }
    }, [currentStep, userAnswer, completeStep, nextStep]);

    // Auto-advance cuando está en modo reproducción
    useEffect(() => {
      if (isPlaying && currentStep.type === "explanation") {
        const timer = setTimeout(() => {
          if (!isLastStep) {
            nextStep();
          } else {
            setIsPlaying(false);
          }
        }, 5000); // 5 segundos por paso explicativo

        return () => clearTimeout(timer);
      }
    }, [isPlaying, currentStepIndex, isLastStep, currentStep.type, nextStep]);

    const getDifficultyColor = (difficulty: string) => {
      switch (difficulty) {
        case "beginner":
          return "text-blue-400";
        case "intermediate":
          return "text-yellow-400";
        case "advanced":
          return "text-purple-400";
        default:
          return "text-stone-400";
      }
    };

    const getDifficultyIcon = (difficulty: string) => {
      switch (difficulty) {
        case "beginner":
          return faLightbulb;
        case "intermediate":
          return faGraduationCap;
        case "advanced":
          return faRocket;
        default:
          return faLightbulb;
      }
    };

    return (
      <div
        className={clsx(
          "fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4",
          className,
        )}
      >
        <div className="max-h-[90vh] w-full max-w-2xl overflow-hidden rounded-lg border border-stone-600 bg-stone-900 shadow-xl">
          {/* Header */}
          <div className="border-b border-stone-600 p-4">
            <div className="mb-2 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-mantis-400">{tutorial.title}</h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="text-stone-400 hover:text-white"
              >
                ×
              </Button>
            </div>

            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-2">
                <FontAwesomeIcon
                  icon={getDifficultyIcon(tutorial.difficulty)}
                  className={getDifficultyColor(tutorial.difficulty)}
                />
                <span className={getDifficultyColor(tutorial.difficulty)}>
                  {tutorial.difficulty === "beginner"
                    ? "Básico"
                    : tutorial.difficulty === "intermediate"
                      ? "Intermedio"
                      : "Avanzado"}
                </span>
              </div>
              <span className="text-stone-400">•</span>
              <span className="text-stone-400">{tutorial.estimatedTime} min</span>
              <span className="text-stone-400">•</span>
              <span className="text-stone-400">
                Paso {currentStepIndex + 1} de {steps.length}
              </span>
            </div>

            {/* Progress bar */}
            <div className="mt-3 h-2 w-full rounded-full bg-stone-700">
              <div
                className="h-2 rounded-full bg-mantis-500 transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {/* Content */}
          <div className="max-h-96 overflow-y-auto p-4">
            <div className="mb-4">
              <h3 className="mb-2 text-base font-medium text-white">{currentStep.title}</h3>
              <p className="mb-3 text-sm text-stone-300">{currentStep.description}</p>
              <div className="text-sm leading-relaxed text-stone-400">{currentStep.content}</div>
            </div>

            {/* Exercise/Quiz content */}
            {currentStep.type === "exercise" || currentStep.type === "quiz" ? (
              <div className="rounded-lg border border-stone-600 bg-stone-800 p-4">
                <h4 className="mb-3 font-medium text-white">{currentStep.exercise?.question}</h4>

                {currentStep.exercise?.options ? (
                  <div className="space-y-2">
                    {currentStep.exercise.options.map((option, index) => (
                      <label
                        key={index}
                        className={clsx(
                          "flex cursor-pointer items-center gap-3 rounded border p-3 transition-colors",
                          userAnswer === index.toString()
                            ? "border-mantis-400 bg-mantis-400/20"
                            : "border-stone-600 bg-stone-700 hover:bg-stone-600",
                        )}
                      >
                        <input
                          type="radio"
                          name="answer"
                          value={index.toString()}
                          checked={userAnswer === index.toString()}
                          onChange={e => setUserAnswer(e.target.value)}
                          className="text-mantis-400"
                        />
                        <span className="text-stone-300">{option}</span>
                      </label>
                    ))}
                  </div>
                ) : (
                  <input
                    type="text"
                    value={userAnswer}
                    onChange={e => setUserAnswer(e.target.value)}
                    placeholder="Escribe tu respuesta..."
                    className="w-full rounded border border-stone-600 bg-stone-700 p-2 text-white"
                  />
                )}

                {/* Feedback */}
                {answerFeedback && (
                  <div
                    className={clsx(
                      "mt-3 rounded border p-3",
                      answerFeedback.correct
                        ? "border-green-400 bg-green-400/20 text-green-400"
                        : "border-red-400 bg-red-400/20 text-red-400",
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <FontAwesomeIcon icon={answerFeedback.correct ? faCheck : faTimes} />
                      {answerFeedback.message}
                    </div>
                  </div>
                )}

                {/* Hints */}
                {currentStep.hints && currentStep.hints.length > 0 && (
                  <div className="mt-3">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowHints(!showHints)}
                      className="text-mantis-400 hover:text-mantis-300"
                    >
                      <FontAwesomeIcon icon={faLightbulb} className="mr-2" />
                      {showHints ? "Ocultar" : "Mostrar"} Pistas
                    </Button>

                    {showHints && (
                      <div className="mt-2 rounded border border-stone-600 bg-stone-700 p-3">
                        <ul className="space-y-1 text-sm text-stone-300">
                          {currentStep.hints.map((hint, index) => (
                            <li key={index}>• {hint}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : null}
          </div>

          {/* Footer */}
          <div className="border-t border-stone-600 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={prevStep}
                  disabled={isFirstStep}
                  className="flex items-center gap-1"
                >
                  <FontAwesomeIcon icon={faStepBackward} />
                  Anterior
                </Button>

                {/* El botón Reproducir/Pausar ha sido eliminado para Fundamentos de la CPU */}
              </div>

              <div className="flex items-center gap-2">
                {currentStep.type === "exercise" || currentStep.type === "quiz" ? (
                  <Button
                    size="sm"
                    onClick={handleAnswerSubmit}
                    disabled={!userAnswer}
                    className="bg-mantis-600 hover:bg-mantis-700"
                  >
                    Verificar Respuesta
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    onClick={nextStep}
                    className="flex items-center gap-1 bg-mantis-600 hover:bg-mantis-700"
                  >
                    {isLastStep ? "Completar Tutorial" : "Siguiente"}
                    {!isLastStep && <FontAwesomeIcon icon={faStepForward} />}
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  },
);

InteractiveTutorial.displayName = "InteractiveTutorial";
