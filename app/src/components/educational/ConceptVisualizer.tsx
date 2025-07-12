import { memo, useState, useEffect, useCallback } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { 
  faPlay, 
  faPause, 
  faRotateLeft,
  faExpand,
  faCompress,
  faInfoCircle
} from "@fortawesome/free-solid-svg-icons";
import clsx from "clsx";

import { Button } from "@/components/ui/Button";

interface VisualStep {
  id: string;
  title: string;
  description: string;
  duration: number;
  animation: {
    type: 'highlight' | 'flow' | 'transform' | 'sequence';
    targets: string[];
    data?: any;
  };
}

interface ConceptVisualizerProps {
  concept: 'fetch-decode-execute' | 'memory-access' | 'register-transfer' | 'alu-operation' | 'bus-communication';
  onClose?: () => void;
  className?: string;
}

// Definiciones de visualizaciones por concepto
const VISUALIZATIONS = {
  'fetch-decode-execute': {
    title: 'Ciclo Fetch-Decode-Execute',
    description: 'Visualiza las tres fases del ciclo de instrucción',
    steps: [
      {
        id: 'fetch',
        title: 'Fase Fetch',
        description: 'La CPU lee la instrucción desde memoria',
        duration: 2000,
        animation: {
          type: 'flow',
          targets: ['IP', 'MAR', 'MBR'],
          data: { from: 'IP', to: 'MBR', value: 'A1' }
        }
      },
      {
        id: 'decode',
        title: 'Fase Decode',
        description: 'La CPU interpreta la instrucción',
        duration: 2000,
        animation: {
          type: 'highlight',
          targets: ['IR'],
          data: { instruction: 'MOV AL, 5' }
        }
      },
      {
        id: 'execute',
        title: 'Fase Execute',
        description: 'La CPU ejecuta la operación',
        duration: 2000,
        animation: {
          type: 'transform',
          targets: ['AL'],
          data: { newValue: '05' }
        }
      }
    ]
  },
  'memory-access': {
    title: 'Acceso a Memoria',
    description: 'Cómo la CPU lee y escribe en memoria RAM',
    steps: [
      {
        id: 'address-setup',
        title: 'Configurar Dirección',
        description: 'La CPU coloca la dirección en el MAR',
        duration: 1500,
        animation: {
          type: 'highlight',
          targets: ['MAR'],
          data: { address: 'A0' }
        }
      },
      {
        id: 'memory-read',
        title: 'Lectura de Memoria',
        description: 'El contenido se transfiere al MBR',
        duration: 1500,
        animation: {
          type: 'flow',
          targets: ['memory-cell-A0', 'MBR'],
          data: { from: 'memory', to: 'MBR', value: '42' }
        }
      },
      {
        id: 'data-transfer',
        title: 'Transferencia de Datos',
        description: 'Los datos se mueven al registro destino',
        duration: 1500,
                  animation: {
            type: 'flow',
            targets: ['MBR', 'AL'],
            data: { from: 'MBR', to: 'AL', value: '42' }
          }
      }
    ]
  },
  'register-transfer': {
    title: 'Transferencia entre Registros',
    description: 'Movimiento de datos entre registros de la CPU',
    steps: [
      {
        id: 'source-read',
        title: 'Leer Registro Origen',
        description: 'El valor se lee del registro origen',
        duration: 1000,
        animation: {
          type: 'highlight',
          targets: ['AL'],
          data: { value: '25' }
        }
      },
      {
        id: 'bus-transfer',
        title: 'Transferencia por Bus',
        description: 'Los datos viajan por el bus interno',
        duration: 1500,
        animation: {
          type: 'flow',
          targets: ['AL', 'BL'],
          data: { from: 'AL', to: 'BL', value: '25' }
        }
      },
      {
        id: 'destination-write',
        title: 'Escribir Registro Destino',
        description: 'El valor se almacena en el registro destino',
        duration: 1000,
        animation: {
          type: 'transform',
          targets: ['BL'],
          data: { newValue: '25' }
        }
      }
    ]
  },
  'alu-operation': {
    title: 'Operación ALU',
    description: 'Proceso de operación aritmética o lógica',
    steps: [
      {
        id: 'operand-load',
        title: 'Cargar Operandos',
        description: 'Los operandos se cargan en la ALU',
        duration: 1500,
        animation: {
          type: 'highlight',
          targets: ['AL', 'BL'],
          data: { operand1: '10', operand2: '05' }
        }
      },
      {
        id: 'operation-execute',
        title: 'Ejecutar Operación',
        description: 'La ALU realiza la operación',
        duration: 2000,
        animation: {
          type: 'sequence',
          targets: ['ALU'],
          data: { operation: 'ADD', result: '15' }
        }
      },
      {
        id: 'result-store',
        title: 'Almacenar Resultado',
        description: 'El resultado se guarda en el registro destino',
        duration: 1500,
        animation: {
          type: 'transform',
          targets: ['AL'],
          data: { newValue: '15' }
        }
      }
    ]
  },
  'bus-communication': {
    title: 'Comunicación por Bus',
    description: 'Cómo los componentes se comunican a través del bus',
    steps: [
      {
        id: 'bus-request',
        title: 'Solicitud de Bus',
        description: 'Un componente solicita acceso al bus',
        duration: 1000,
        animation: {
          type: 'highlight',
          targets: ['CPU'],
          data: { requesting: true }
        }
      },
      {
        id: 'bus-grant',
        title: 'Concesión de Bus',
        description: 'El bus se concede al componente solicitante',
        duration: 1000,
        animation: {
          type: 'highlight',
          targets: ['data-bus'],
          data: { granted: true }
        }
      },
      {
        id: 'data-transfer',
        title: 'Transferencia de Datos',
        description: 'Los datos se transfieren por el bus',
        duration: 2000,
        animation: {
          type: 'flow',
          targets: ['data-bus'],
          data: { data: 'A1B2', direction: 'CPU-to-Memory' }
        }
      },
      {
        id: 'bus-release',
        title: 'Liberación de Bus',
        description: 'El bus se libera para otros componentes',
        duration: 1000,
        animation: {
          type: 'highlight',
          targets: ['data-bus'],
          data: { released: true }
        }
      }
    ]
  }
};

export const ConceptVisualizer = memo(({ 
  concept, 
  onClose,
  className 
}: ConceptVisualizerProps) => {
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
      case 'highlight':
        return (
          <div className="relative">
            {targets.map((target, index) => (
              <div
                key={index}
                className="absolute inset-0 border-2 border-mantis-400 bg-mantis-400/20 rounded animate-pulse"
                style={{
                  animationDelay: `${index * 200}ms`
                }}
              />
            ))}
            {data && (
              <div className="absolute top-2 right-2 bg-mantis-500 text-white px-2 py-1 rounded text-xs">
                {Object.entries(data).map(([key, value]) => (
                  <div key={key}>{key}: {String(value)}</div>
                ))}
              </div>
            )}
          </div>
        );

      case 'flow':
        return (
          <div className="relative">
            <svg className="absolute inset-0 w-full h-full">
              <defs>
                <linearGradient id="flowGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#10b981" stopOpacity="0.8" />
                  <stop offset="50%" stopColor="#10b981" stopOpacity="1" />
                  <stop offset="100%" stopColor="#10b981" stopOpacity="0.8" />
                </linearGradient>
              </defs>
              
              <path
                d={`M ${('from' in data && data.from) || '0,0'} L ${('to' in data && data.to) || '100,100'}`}
                stroke="url(#flowGradient)"
                strokeWidth="3"
                strokeDasharray="10,5"
                className="animate-pulse"
              />
            </svg>
            
            {'value' in data && data.value && (
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                <div className="bg-mantis-500 text-white px-2 py-1 rounded text-xs font-mono">
                  {data.value}
                </div>
              </div>
            )}
          </div>
        );

      case 'transform':
        return (
          <div className="relative">
            {targets.map((target, index) => (
              <div
                key={index}
                className="absolute inset-0 bg-mantis-400/30 rounded animate-ping"
                style={{
                  animationDelay: `${index * 300}ms`
                }}
              />
            ))}
            {'newValue' in data && data.newValue && (
              <div className="absolute top-2 left-2 bg-mantis-500 text-white px-2 py-1 rounded text-xs font-mono">
                Nuevo: {data.newValue}
              </div>
            )}
          </div>
        );

      case 'sequence':
        return (
          <div className="relative">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="bg-mantis-500 text-white px-4 py-2 rounded-lg text-sm font-mono">
                {'operation' in data && data.operation ? data.operation : 'Operación'}
              </div>
            </div>
            {'result' in data && data.result && (
              <div className="absolute bottom-2 right-2 bg-green-500 text-white px-2 py-1 rounded text-xs font-mono">
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
    <div className={clsx(
      "fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4",
      isFullscreen && "p-0",
      className
    )}>
      <div className={clsx(
        "bg-stone-900 border border-stone-600 rounded-lg shadow-xl",
        isFullscreen ? "w-full h-full" : "max-w-4xl w-full max-h-[90vh]"
      )}>
        {/* Header */}
        <div className="p-4 border-b border-stone-600">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-lg font-semibold text-mantis-400">
              {visualization.title}
            </h2>
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
            <span>Paso {currentStepIndex + 1} de {visualization.steps.length}</span>
            <span>•</span>
            <span>{currentStep.duration / 1000}s</span>
          </div>

          {/* Progress bar */}
          <div className="mt-3 w-full bg-stone-700 rounded-full h-2">
            <div 
              className="bg-mantis-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${((currentStepIndex + 1) / visualization.steps.length) * 100}%` }}
            />
          </div>
        </div>

        {/* Content */}
        <div className="p-4 flex-1">
          <div className="mb-4">
            <h3 className="text-md font-medium text-white mb-2">
              {currentStep.title}
            </h3>
            <p className="text-stone-300 text-sm">
              {currentStep.description}
            </p>
          </div>

          {/* Visualization area */}
          <div className="relative bg-stone-800 rounded-lg border border-stone-600 h-64 overflow-hidden">
            {renderAnimation()}
            
            {/* Info overlay */}
            {showInfo && (
              <div className="absolute top-2 left-2 bg-stone-900/90 border border-stone-600 rounded p-3 max-w-xs">
                <h4 className="font-medium text-mantis-400 mb-2">Información</h4>
                <p className="text-xs text-stone-300">
                  {visualization.description}
                </p>
                <div className="mt-2 text-xs text-stone-400">
                  <div>Tipo de animación: {currentStep.animation.type}</div>
                  <div>Elementos: {currentStep.animation.targets.join(', ')}</div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Controls */}
        <div className="p-4 border-t border-stone-600">
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
                {isPlaying ? 'Pausar' : 'Reproducir'}
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

ConceptVisualizer.displayName = 'ConceptVisualizer'; 