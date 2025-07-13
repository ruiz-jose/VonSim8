import { 
  faCheck,
  faGraduationCap,
  faLightbulb,
  faPause, 
  faPlay, 
  faRocket,
  faStepBackward,
  faStepForward, 
  faTimes} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import clsx from "clsx";
import { memo, useCallback,useEffect, useState } from "react";

import { Button } from "@/components/ui/Button";

type TutorialStep = {
  id: string;
  title: string;
  description: string;
  content: string;
  type: 'explanation' | 'interactive' | 'exercise' | 'quiz';
  target?: string; // Elemento a resaltar
  exercise?: {
    question: string;
    options?: string[];
    correctAnswer: string | number;
    explanation: string;
  };
  hints?: string[];
  completed: boolean;
}

type Tutorial = {
  id: string;
  title: string;
  description: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  concepts: string[];
  steps: TutorialStep[];
  estimatedTime: number; // en minutos
}

type InteractiveTutorialProps = {
  tutorial: Tutorial;
  onComplete?: (tutorialId: string) => void;
  onClose?: () => void;
  className?: string;
}

// Tutoriales disponibles
export const AVAILABLE_TUTORIALS: Tutorial[] = [
  {
    id: 'cpu-basics',
    title: 'Fundamentos de la CPU',
    description: 'Aprende cómo funciona una CPU y sus componentes principales',
    difficulty: 'beginner',
    concepts: ['register', 'alu', 'program-counter'],
    estimatedTime: 10,
    steps: [
      {
        id: 'intro',
        title: 'Introducción a la CPU',
        description: '¿Qué es una CPU y para qué sirve?',
        content: 'La CPU (Unidad Central de Procesamiento) es el cerebro de la computadora. Se encarga de ejecutar instrucciones y procesar datos.',
        type: 'explanation',
        completed: false
      },
      {
        id: 'registers',
        title: 'Registros de la CPU',
        description: 'Los registros son memoria rápida dentro de la CPU',
        content: 'Los registros almacenan datos temporalmente durante la ejecución. Son más rápidos que la RAM pero tienen menos capacidad.',
        type: 'explanation',
        target: 'cpu-component',
        completed: false
      },
      {
        id: 'alu-exercise',
        title: 'Ejercicio: ALU',
        description: 'Practica con la Unidad Aritmético-Lógica',
        content: 'La ALU realiza operaciones matemáticas y lógicas. Observa cómo cambian los valores en los registros AL, BL, CL, DL.',
        type: 'exercise',
        exercise: {
          question: '¿Qué operación realiza la ALU cuando ejecutas ADD AL, 5?',
          options: ['Suma 5 al registro AL', 'Resta 5 del registro AL', 'Multiplica AL por 5', 'Divide AL entre 5'],
          correctAnswer: 0,
          explanation: 'ADD AL, 5 suma el valor 5 al contenido actual del registro AL.'
        },
        completed: false
      },
      {
        id: 'program-counter',
        title: 'Contador de Programa',
        description: 'El IP indica la siguiente instrucción a ejecutar',
        content: 'El Program Counter (IP) se incrementa automáticamente después de cada instrucción.',
        type: 'explanation',
        target: 'cpu-component',
        completed: false
      }
    ]
  },
  {
    id: 'memory-basics',
    title: 'Memoria RAM',
    description: 'Comprende cómo funciona la memoria principal',
    difficulty: 'beginner',
    concepts: ['memory', 'bus'],
    estimatedTime: 8,
    steps: [
      {
        id: 'memory-intro',
        title: '¿Qué es la Memoria RAM?',
        description: 'La memoria de acceso aleatorio',
        content: 'La RAM almacena programas y datos temporalmente. Cada ubicación tiene una dirección única.',
        type: 'explanation',
        target: 'memory-component',
        completed: false
      },
      {
        id: 'memory-access',
        title: 'Acceso a Memoria',
        description: 'Cómo la CPU lee y escribe en memoria',
        content: 'La CPU usa el bus de direcciones para especificar qué celda de memoria acceder.',
        type: 'explanation',
        completed: false
      },
      {
        id: 'memory-quiz',
        title: 'Quiz: Direccionamiento',
        description: 'Pon a prueba tu conocimiento',
        content: 'Responde correctamente para continuar.',
        type: 'quiz',
        exercise: {
          question: '¿Cuántas direcciones de memoria tiene VonSim8?',
          options: ['128 bytes', '256 bytes', '512 bytes', '1024 bytes'],
          correctAnswer: 1,
          explanation: 'VonSim8 tiene 256 bytes de memoria (direcciones 00-FF en hexadecimal).'
        },
        completed: false
      }
    ]
  },
  {
    id: 'instruction-cycle',
    title: 'Ciclo de Instrucción',
    description: 'Fetch, Decode, Execute',
    difficulty: 'intermediate',
    concepts: ['instruction', 'program-counter'],
    estimatedTime: 15,
    steps: [
      {
        id: 'cycle-intro',
        title: 'El Ciclo de Instrucción',
        description: 'Las tres fases principales',
        content: 'Cada instrucción pasa por tres fases: Fetch (leer), Decode (interpretar), Execute (ejecutar).',
        type: 'explanation',
        completed: false
      },
      {
        id: 'fetch-phase',
        title: 'Fase Fetch',
        description: 'Leer la instrucción de memoria',
        content: 'La CPU lee la instrucción desde la dirección apuntada por el IP.',
        type: 'explanation',
        completed: false
      },
      {
        id: 'decode-phase',
        title: 'Fase Decode',
        description: 'Interpretar la instrucción',
        content: 'La CPU determina qué operación realizar y qué operandos usar.',
        type: 'explanation',
        completed: false
      },
      {
        id: 'execute-phase',
        title: 'Fase Execute',
        description: 'Ejecutar la operación',
        content: 'La CPU realiza la operación especificada por la instrucción.',
        type: 'explanation',
        completed: false
      },
      {
        id: 'cycle-exercise',
        title: 'Ejercicio: Observar el Ciclo',
        description: 'Ejecuta una instrucción paso a paso',
        content: 'Usa el botón "Por Ciclo" para ver cada fase del ciclo de instrucción.',
        type: 'exercise',
        exercise: {
          question: '¿En qué orden ocurren las fases del ciclo de instrucción?',
          options: ['Execute, Decode, Fetch', 'Fetch, Execute, Decode', 'Fetch, Decode, Execute', 'Decode, Fetch, Execute'],
          correctAnswer: 2,
          explanation: 'El orden correcto es Fetch (leer), Decode (interpretar), Execute (ejecutar).'
        },
        completed: false
      }
    ]
  }
];

export const InteractiveTutorial = memo(({ 
  tutorial, 
  onComplete, 
  onClose,
  className 
}: InteractiveTutorialProps) => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [steps, setSteps] = useState<TutorialStep[]>(tutorial.steps);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showHints, setShowHints] = useState(false);
  const [userAnswer, setUserAnswer] = useState<string>('');
  const [answerFeedback, setAnswerFeedback] = useState<{
    correct: boolean;
    message: string;
  } | null>(null);

  const currentStep = steps[currentStepIndex];
  const isFirstStep = currentStepIndex === 0;
  const isLastStep = currentStepIndex === steps.length - 1;
  const completedSteps = steps.filter(s => s.completed).length;
  const progress = (completedSteps / steps.length) * 100;

  // Auto-advance cuando está en modo reproducción
  useEffect(() => {
    if (isPlaying && currentStep.type === 'explanation') {
      const timer = setTimeout(() => {
        if (!isLastStep) {
          nextStep();
        } else {
          setIsPlaying(false);
        }
      }, 5000); // 5 segundos por paso explicativo

      return () => clearTimeout(timer);
    }
  }, [isPlaying, currentStepIndex, isLastStep]);

  const nextStep = useCallback(() => {
    if (!isLastStep) {
      setCurrentStepIndex(prev => prev + 1);
      setAnswerFeedback(null);
      setUserAnswer('');
    } else {
      completeTutorial();
    }
  }, [isLastStep]);

  const prevStep = useCallback(() => {
    if (!isFirstStep) {
      setCurrentStepIndex(prev => prev - 1);
      setAnswerFeedback(null);
      setUserAnswer('');
    }
  }, [isFirstStep]);

  const completeStep = useCallback(() => {
    setSteps(prev => prev.map((step, index) => 
      index === currentStepIndex ? { ...step, completed: true } : step
    ));
  }, [currentStepIndex]);

  const completeTutorial = useCallback(() => {
    onComplete?.(tutorial.id);
  }, [tutorial.id, onComplete]);

  const handleAnswerSubmit = useCallback(() => {
    if (!currentStep.exercise) return;

    const isCorrect = userAnswer === currentStep.exercise.correctAnswer.toString();
    setAnswerFeedback({
      correct: isCorrect,
      message: isCorrect 
        ? '¡Correcto!' 
        : `Incorrecto. ${currentStep.exercise.explanation}`
    });

    if (isCorrect) {
      completeStep();
      setTimeout(() => {
        nextStep();
      }, 2000);
    }
  }, [currentStep, userAnswer, completeStep, nextStep]);

  const togglePlay = useCallback(() => {
    setIsPlaying(!isPlaying);
  }, [isPlaying]);

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return 'text-blue-400';
      case 'intermediate': return 'text-yellow-400';
      case 'advanced': return 'text-purple-400';
      default: return 'text-stone-400';
    }
  };

  const getDifficultyIcon = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return faLightbulb;
      case 'intermediate': return faGraduationCap;
      case 'advanced': return faRocket;
      default: return faLightbulb;
    }
  };

  return (
    <div className={clsx(
      "fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4",
      className
    )}>
      <div className="max-h-[90vh] w-full max-w-2xl overflow-hidden rounded-lg border border-stone-600 bg-stone-900 shadow-xl">
        {/* Header */}
        <div className="border-b border-stone-600 p-4">
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-mantis-400">
              {tutorial.title}
            </h2>
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
                {tutorial.difficulty === 'beginner' ? 'Básico' : 
                 tutorial.difficulty === 'intermediate' ? 'Intermedio' : 'Avanzado'}
              </span>
            </div>
            <span className="text-stone-400">•</span>
            <span className="text-stone-400">{tutorial.estimatedTime} min</span>
            <span className="text-stone-400">•</span>
            <span className="text-stone-400">Paso {currentStepIndex + 1} de {steps.length}</span>
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
            <h3 className="text-md mb-2 font-medium text-white">
              {currentStep.title}
            </h3>
            <p className="mb-3 text-sm text-stone-300">
              {currentStep.description}
            </p>
            <div className="text-sm leading-relaxed text-stone-400">
              {currentStep.content}
            </div>
          </div>

          {/* Exercise/Quiz content */}
          {currentStep.type === 'exercise' || currentStep.type === 'quiz' ? (
            <div className="rounded-lg border border-stone-600 bg-stone-800 p-4">
              <h4 className="mb-3 font-medium text-white">
                {currentStep.exercise?.question}
              </h4>
              
              {currentStep.exercise?.options ? (
                <div className="space-y-2">
                  {currentStep.exercise.options.map((option, index) => (
                    <label
                      key={index}
                      className={clsx(
                        "flex cursor-pointer items-center gap-3 rounded border p-3 transition-colors",
                        userAnswer === index.toString()
                          ? "border-mantis-400 bg-mantis-400/20"
                          : "border-stone-600 bg-stone-700 hover:bg-stone-600"
                      )}
                    >
                      <input
                        type="radio"
                        name="answer"
                        value={index}
                        checked={userAnswer === index.toString()}
                        onChange={(e) => setUserAnswer(e.target.value)}
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
                  onChange={(e) => setUserAnswer(e.target.value)}
                  placeholder="Escribe tu respuesta..."
                  className="w-full rounded border border-stone-600 bg-stone-700 p-2 text-white"
                />
              )}

              {/* Feedback */}
              {answerFeedback && (
                <div className={clsx(
                  "mt-3 rounded border p-3",
                  answerFeedback.correct 
                    ? "border-green-400 bg-green-400/20 text-green-400"
                    : "border-red-400 bg-red-400/20 text-red-400"
                )}>
                  <div className="flex items-center gap-2">
                    <FontAwesomeIcon 
                      icon={answerFeedback.correct ? faCheck : faTimes} 
                    />
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
                    {showHints ? 'Ocultar' : 'Mostrar'} Pistas
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
              
              {currentStep.type === 'explanation' && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={togglePlay}
                  className="flex items-center gap-1"
                >
                  <FontAwesomeIcon icon={isPlaying ? faPause : faPlay} />
                  {isPlaying ? 'Pausar' : 'Reproducir'}
                </Button>
              )}
            </div>

            <div className="flex items-center gap-2">
              {(currentStep.type === 'exercise' || currentStep.type === 'quiz') ? (
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
                  {isLastStep ? 'Completar Tutorial' : 'Siguiente'}
                  {!isLastStep && <FontAwesomeIcon icon={faStepForward} />}
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

InteractiveTutorial.displayName = 'InteractiveTutorial'; 