import { faBook, faEye, faPlay, faTrophy } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import clsx from "clsx";
import { memo, useState } from "react";

import { ConceptVisualizer } from "./ConceptVisualizer";
import { AVAILABLE_TUTORIALS, InteractiveTutorial } from "./InteractiveTutorial";

type EducationalMenuProps = {
  className?: string;
  isOpen?: boolean;
  onClose?: () => void;
  onShowProgress?: () => void;
};

export const EducationalMenu = memo(({ isOpen = false, onShowProgress }: EducationalMenuProps) => {
  const [tutorialsExpanded, setTutorialsExpanded] = useState(false);
  const [visualizationsExpanded] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);
  const [showVisualizer, setShowVisualizer] = useState(false);
  const [selectedTutorial, setSelectedTutorial] = useState<string | null>(null);
  const [selectedConcept, setSelectedConcept] = useState<string | null>(null);

  const handleTutorialSelect = (tutorialId: string) => {
    console.log("Tutorial seleccionado:", tutorialId);
    setSelectedTutorial(tutorialId);
    setShowTutorial(true);
    // No cerrar el menú cuando se selecciona un tutorial
  };

  const handleVisualizerSelect = (concept: string) => {
    setSelectedConcept(concept);
    setShowVisualizer(true);
    // No cerrar el menú cuando se selecciona una visualización
  };

  const handleTutorialComplete = () => {
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
      id: "progress",
      title: "Progreso Educativo",
      description: "Ver logros y estadísticas de aprendizaje",
      icon: faTrophy,
      color: "text-yellow-400",
      action: () => onShowProgress?.(),
    },
    {
      id: "tutorials",
      title: "Tutoriales Interactivos",
      description: "Aprende paso a paso con ejercicios",
      icon: faBook,
      color: "text-blue-400",
      action: () => setTutorialsExpanded(!tutorialsExpanded),
    },
    // Eliminada la opción de conceptos educativos
  ];

  const tutorialItems = [
    {
      id: "cpu-basics",
      title: "Fundamentos de la CPU",
      description: "Conceptos básicos de CPU y registros",
      difficulty: "Básico",
      duration: "10 min",
    },
    {
      id: "memory-basics",
      title: "Memoria RAM",
      description: "Funcionamiento de la memoria principal",
      difficulty: "Básico",
      duration: "8 min",
    },
    {
      id: "instruction-cycle",
      title: "Ciclo de Instrucción",
      description: "Fases fetch-decode-execute",
      difficulty: "Intermedio",
      duration: "15 min",
    },
  ];

  const visualizationItems = [
    {
      id: "fetch-decode-execute",
      title: "Ciclo Fetch-Decode-Execute",
      description: "Visualiza las tres fases del ciclo de instrucción",
    },
    {
      id: "memory-access",
      title: "Acceso a Memoria",
      description: "Cómo la CPU lee y escribe en memoria RAM",
    },
    {
      id: "register-transfer",
      title: "Transferencia entre Registros",
      description: "Movimiento de datos entre registros de la CPU",
    },
    {
      id: "alu-operation",
      title: "Operación ALU",
      description: "Proceso de operación aritmética o lógica",
    },
    {
      id: "bus-communication",
      title: "Comunicación por Bus",
      description: "Cómo los componentes se comunican a través del bus",
    },
  ];

  return (
    <>
      {/* Menú desplegable */}
      {isOpen && (
        <div className="fixed bottom-12 left-1/2 z-50 -translate-x-1/2">
          <div className="min-w-80 rounded-lg border border-stone-600 bg-stone-900 p-4 shadow-xl">
            <div className="mb-4 text-center">
              <h3 className="mb-1 text-lg font-semibold text-mantis-400">Centro de Aprendizaje</h3>
              <p className="text-sm text-stone-400">Explora herramientas educativas interactivas</p>
            </div>

            <div className="space-y-2">
              {menuItems.map(item => (
                <div key={item.id}>
                  {item.id === "tutorials" ? (
                    <div>
                      <button
                        onClick={item.action}
                        className={clsx(
                          "w-full rounded-lg border border-stone-600 p-3 text-left hover:bg-stone-800",
                          "flex items-center gap-3 transition-all duration-200",
                        )}
                      >
                        <FontAwesomeIcon icon={item.icon} className={clsx("text-lg", item.color)} />
                        <div className="flex-1">
                          <div className="font-medium text-white">{item.title}</div>
                          <div className="text-sm text-stone-400">{item.description}</div>
                        </div>
                        <FontAwesomeIcon
                          icon={tutorialsExpanded ? faPlay : faPlay}
                          className={clsx(
                            "text-sm text-stone-400",
                            tutorialsExpanded && "text-blue-400",
                          )}
                        />
                      </button>

                      {/* Submenú de tutoriales */}
                      {tutorialsExpanded && (
                        <div className="ml-8 mt-2 space-y-1">
                          {tutorialItems.map(tutorial => (
                            <button
                              key={tutorial.id}
                              onClick={() => handleTutorialSelect(tutorial.id)}
                              className="w-full rounded border border-stone-700 p-2 text-left transition-colors hover:bg-stone-800"
                            >
                              <div className="flex items-center justify-between">
                                <div>
                                  <div className="text-sm font-medium text-white">
                                    {tutorial.title}
                                  </div>
                                  <div className="text-xs text-stone-400">
                                    {tutorial.description}
                                  </div>
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
                  ) : item.id === "visualizations" ? (
                    <div>
                      <button
                        onClick={item.action}
                        className={clsx(
                          "w-full rounded-lg border border-stone-600 p-3 text-left hover:bg-stone-800",
                          "flex items-center gap-3 transition-all duration-200",
                        )}
                      >
                        <FontAwesomeIcon icon={item.icon} className={clsx("text-lg", item.color)} />
                        <div className="flex-1">
                          <div className="font-medium text-white">{item.title}</div>
                          <div className="text-sm text-stone-400">{item.description}</div>
                        </div>
                        <FontAwesomeIcon
                          icon={visualizationsExpanded ? faEye : faEye}
                          className={clsx(
                            "text-sm text-stone-400",
                            visualizationsExpanded && "text-green-400",
                          )}
                        />
                      </button>

                      {/* Submenú de visualizaciones */}
                      {visualizationsExpanded && (
                        <div className="ml-8 mt-2 space-y-1">
                          {visualizationItems.map(viz => (
                            <button
                              key={viz.id}
                              onClick={() => handleVisualizerSelect(viz.id)}
                              className="w-full rounded border border-stone-700 p-2 text-left transition-colors hover:bg-stone-800"
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
                        "w-full rounded-lg border border-stone-600 p-3 text-left hover:bg-stone-800",
                        "flex items-center gap-3 transition-all duration-200",
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
            <div className="mt-4 border-t border-stone-600 pt-3">
              <div className="flex items-center justify-between text-xs text-stone-400">
                <span>Herramientas educativas</span>
                <span>VonSim8</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {showTutorial &&
        selectedTutorial &&
        (() => {
          const tutorial = AVAILABLE_TUTORIALS.find(t => t.id === selectedTutorial);
          console.log("Tutorial encontrado:", tutorial);
          if (!tutorial) {
            console.error("Tutorial no encontrado:", selectedTutorial);
            return null;
          }
          return (
            <InteractiveTutorial
              tutorial={tutorial}
              onComplete={handleTutorialComplete}
              onClose={() => {
                console.log("Cerrando tutorial");
                setShowTutorial(false);
                setSelectedTutorial(null);
              }}
            />
          );
        })()}

      {showVisualizer && selectedConcept && (
        <ConceptVisualizer concept={selectedConcept as any} onClose={handleVisualizerClose} />
      )}
    </>
  );
});

EducationalMenu.displayName = "EducationalMenu";
