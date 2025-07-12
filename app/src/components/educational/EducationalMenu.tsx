import { memo, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { 
  faGraduationCap, 
  faTrophy, 
  faPlay, 
  faEye, 
  faBook,
  faLightbulb,
  faChartLine,
  faCogs
} from "@fortawesome/free-solid-svg-icons";
import clsx from "clsx";

import { Button } from "@/components/ui/Button";
import { EducationalProgress } from "./EducationalProgress";
import { InteractiveTutorial, AVAILABLE_TUTORIALS } from "./InteractiveTutorial";
import { ConceptVisualizer } from "./ConceptVisualizer";

interface EducationalMenuProps {
  className?: string;
  isOpen?: boolean;
  onClose?: () => void;
  onShowProgress?: () => void;
}

export const EducationalMenu = memo(({ className, isOpen = false, onClose, onShowProgress }: EducationalMenuProps) => {
  const [tutorialsExpanded, setTutorialsExpanded] = useState(false);
  const [visualizationsExpanded, setVisualizationsExpanded] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);
  const [showVisualizer, setShowVisualizer] = useState(false);
  const [selectedTutorial, setSelectedTutorial] = useState<string | null>(null);
  const [selectedConcept, setSelectedConcept] = useState<string | null>(null);

  const handleTutorialSelect = (tutorialId: string) => {
    console.log('Tutorial seleccionado:', tutorialId);
    setSelectedTutorial(tutorialId);
    setShowTutorial(true);
    // No cerrar el menú cuando se selecciona un tutorial
  };

  const handleVisualizerSelect = (concept: string) => {
    setSelectedConcept(concept);
    setShowVisualizer(true);
    // No cerrar el menú cuando se selecciona una visualización
  };

  const handleTutorialComplete = (tutorialId: string) => {
    setShowTutorial(false);
    setSelectedTutorial(null);
    // Aquí se podría emitir un evento de progreso
  };

  const handleVisualizerClose = () => {
    setShowVisualizer(false);
    setSelectedConcept(null);
  };

  const menuItems = [
    {
      id: 'progress',
      title: 'Progreso Educativo',
      description: 'Ver logros y estadísticas de aprendizaje',
      icon: faTrophy,
      color: 'text-yellow-400',
      action: () => onShowProgress?.()
    },
    {
      id: 'tutorials',
      title: 'Tutoriales Interactivos',
      description: 'Aprende paso a paso con ejercicios',
      icon: faBook,
      color: 'text-blue-400',
      action: () => setTutorialsExpanded(!tutorialsExpanded)
    },
    {
      id: 'visualizations',
      title: 'Visualizaciones',
      description: 'Ver conceptos en acción',
      icon: faEye,
      color: 'text-green-400',
      action: () => setVisualizationsExpanded(!visualizationsExpanded)
    },
    {
      id: 'concepts',
      title: 'Conceptos Educativos',
      description: 'Explorar tooltips informativos',
      icon: faLightbulb,
      color: 'text-purple-400',
      action: () => {
        // Mostrar información sobre tooltips
        alert('Haz hover sobre los elementos de la interfaz para ver explicaciones educativas. Los tooltips se adaptan a tu nivel de conocimiento.');
        onClose?.();
      }
    }
  ];

  const tutorialItems = [
    {
      id: 'cpu-basics',
      title: 'Fundamentos de la CPU',
      description: 'Conceptos básicos de CPU y registros',
      difficulty: 'Básico',
      duration: '10 min'
    },
    {
      id: 'memory-basics',
      title: 'Memoria RAM',
      description: 'Funcionamiento de la memoria principal',
      difficulty: 'Básico',
      duration: '8 min'
    },
    {
      id: 'instruction-cycle',
      title: 'Ciclo de Instrucción',
      description: 'Fases fetch-decode-execute',
      difficulty: 'Intermedio',
      duration: '15 min'
    }
  ];

  const visualizationItems = [
    {
      id: 'fetch-decode-execute',
      title: 'Ciclo Fetch-Decode-Execute',
      description: 'Visualiza las tres fases del ciclo de instrucción'
    },
    {
      id: 'memory-access',
      title: 'Acceso a Memoria',
      description: 'Cómo la CPU lee y escribe en memoria RAM'
    },
    {
      id: 'register-transfer',
      title: 'Transferencia entre Registros',
      description: 'Movimiento de datos entre registros de la CPU'
    },
    {
      id: 'alu-operation',
      title: 'Operación ALU',
      description: 'Proceso de operación aritmética o lógica'
    },
    {
      id: 'bus-communication',
      title: 'Comunicación por Bus',
      description: 'Cómo los componentes se comunican a través del bus'
    }
  ];

  return (
    <>
      {/* Menú desplegable */}
      {isOpen && (
        <div className="fixed bottom-12 left-1/2 transform -translate-x-1/2 z-50">
          <div className="bg-stone-900 border border-stone-600 rounded-lg shadow-xl p-4 min-w-80">
            <div className="text-center mb-4">
              <h3 className="text-lg font-semibold text-mantis-400 mb-1">
                Centro de Aprendizaje
              </h3>
              <p className="text-sm text-stone-400">
                Explora herramientas educativas interactivas
              </p>
            </div>

            <div className="space-y-2">
              {menuItems.map((item) => (
                <div key={item.id}>
                  {item.id === 'tutorials' ? (
                    <div>
                      <button
                        onClick={item.action}
                        className={clsx(
                          "w-full text-left p-3 rounded-lg border border-stone-600 hover:bg-stone-800",
                          "transition-all duration-200 flex items-center gap-3"
                        )}
                      >
                        <FontAwesomeIcon icon={item.icon} className={clsx("text-lg", item.color)} />
                        <div className="flex-1">
                          <div className="font-medium text-white">{item.title}</div>
                          <div className="text-sm text-stone-400">{item.description}</div>
                        </div>
                        <FontAwesomeIcon 
                          icon={tutorialsExpanded ? faPlay : faPlay} 
                          className={clsx("text-stone-400 text-sm", tutorialsExpanded && "text-blue-400")} 
                        />
                      </button>
                      
                      {/* Submenú de tutoriales */}
                      {tutorialsExpanded && (
                        <div className="mt-2 ml-8 space-y-1">
                          {tutorialItems.map((tutorial) => (
                            <button
                              key={tutorial.id}
                              onClick={() => handleTutorialSelect(tutorial.id)}
                              className="w-full text-left p-2 rounded border border-stone-700 hover:bg-stone-800 transition-colors"
                            >
                              <div className="flex items-center justify-between">
                                <div>
                                  <div className="text-sm font-medium text-white">{tutorial.title}</div>
                                  <div className="text-xs text-stone-400">{tutorial.description}</div>
                                </div>
                                <div className="text-right">
                                  <div className="text-xs text-blue-400">{tutorial.difficulty}</div>
                                  <div className="text-xs text-stone-500">{tutorial.duration}</div>
                                </div>
                              </div>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : item.id === 'visualizations' ? (
                    <div>
                      <button
                        onClick={item.action}
                        className={clsx(
                          "w-full text-left p-3 rounded-lg border border-stone-600 hover:bg-stone-800",
                          "transition-all duration-200 flex items-center gap-3"
                        )}
                      >
                        <FontAwesomeIcon icon={item.icon} className={clsx("text-lg", item.color)} />
                        <div className="flex-1">
                          <div className="font-medium text-white">{item.title}</div>
                          <div className="text-sm text-stone-400">{item.description}</div>
                        </div>
                        <FontAwesomeIcon 
                          icon={visualizationsExpanded ? faEye : faEye} 
                          className={clsx("text-stone-400 text-sm", visualizationsExpanded && "text-green-400")} 
                        />
                      </button>
                      
                      {/* Submenú de visualizaciones */}
                      {visualizationsExpanded && (
                        <div className="mt-2 ml-8 space-y-1">
                          {visualizationItems.map((viz) => (
                            <button
                              key={viz.id}
                              onClick={() => handleVisualizerSelect(viz.id)}
                              className="w-full text-left p-2 rounded border border-stone-700 hover:bg-stone-800 transition-colors"
                            >
                              <div>
                                <div className="text-sm font-medium text-white">{viz.title}</div>
                                <div className="text-xs text-stone-400">{viz.description}</div>
                              </div>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    <button
                      onClick={item.action}
                      className={clsx(
                        "w-full text-left p-3 rounded-lg border border-stone-600 hover:bg-stone-800",
                        "transition-all duration-200 flex items-center gap-3"
                      )}
                    >
                      <FontAwesomeIcon icon={item.icon} className={clsx("text-lg", item.color)} />
                      <div className="flex-1">
                        <div className="font-medium text-white">{item.title}</div>
                        <div className="text-sm text-stone-400">{item.description}</div>
                      </div>
                    </button>
                  )}
                </div>
              ))}
            </div>

            {/* Footer */}
            <div className="mt-4 pt-3 border-t border-stone-600">
              <div className="flex items-center justify-between text-xs text-stone-400">
                <span>Herramientas educativas</span>
                <span>VonSim8</span>
              </div>
            </div>
          </div>
        </div>
      )}



      {showTutorial && selectedTutorial && (() => {
        const tutorial = AVAILABLE_TUTORIALS.find(t => t.id === selectedTutorial);
        console.log('Tutorial encontrado:', tutorial);
        if (!tutorial) {
          console.error('Tutorial no encontrado:', selectedTutorial);
          return null;
        }
        return (
          <InteractiveTutorial
            tutorial={tutorial}
            onComplete={handleTutorialComplete}
            onClose={() => {
              console.log('Cerrando tutorial');
              setShowTutorial(false);
              setSelectedTutorial(null);
            }}
          />
        );
      })()}

      {showVisualizer && selectedConcept && (
        <ConceptVisualizer
          concept={selectedConcept as any}
          onClose={handleVisualizerClose}
        />
      )}
    </>
  );
});

EducationalMenu.displayName = 'EducationalMenu'; 