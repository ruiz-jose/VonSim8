import {
  faChartLine,
  faCogs,
  faDatabase,
  faGraduationCap,
  faLightbulb,
  faMicrochip,
  faStar,
  faTrophy,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import clsx from "clsx";
import { memo, useCallback, useEffect, useState } from "react";

import { Button } from "@/components/ui/Button";

// Tipos de logros
type AchievementType =
  | "concept_mastered"
  | "instructions_executed"
  | "programs_written"
  | "time_spent"
  | "tutorials_completed";

type Achievement = {
  id: string;
  type: AchievementType;
  title: string;
  description: string;
  icon: any;
  requirement: number;
  current: number;
  unlocked: boolean;
  points: number;
};

type LearningLevel = {
  id: string;
  name: string;
  description: string;
  concepts: string[];
  requiredPoints: number;
  unlocked: boolean;
  completed: boolean;
};

type EducationalProgressProps = {
  className?: string;
  isVisible?: boolean;
  onClose?: () => void;
};

// Logros disponibles
const ACHIEVEMENTS: Achievement[] = [
  {
    id: "first_program",
    type: "programs_written",
    title: "Primer Programa",
    description: "Escribe tu primer programa en ensamblador",
    icon: faLightbulb,
    requirement: 1,
    current: 0,
    unlocked: false,
    points: 10,
  },
  {
    id: "instruction_master",
    type: "instructions_executed",
    title: "Maestro de Instrucciones",
    description: "Ejecuta 100 instrucciones",
    icon: faMicrochip,
    requirement: 100,
    current: 0,
    unlocked: false,
    points: 25,
  },
  {
    id: "memory_explorer",
    type: "concept_mastered",
    title: "Explorador de Memoria",
    description: "Comprende el funcionamiento de la memoria RAM",
    icon: faDatabase,
    requirement: 1,
    current: 0,
    unlocked: false,
    points: 15,
  },
  {
    id: "cpu_architect",
    type: "concept_mastered",
    title: "Arquitecto de CPU",
    description: "Domina los conceptos de arquitectura de CPU",
    icon: faCogs,
    requirement: 1,
    current: 0,
    unlocked: false,
    points: 30,
  },
  {
    id: "persistent_learner",
    type: "time_spent",
    title: "Estudiante Persistente",
    description: "Pasa 30 minutos aprendiendo",
    icon: faGraduationCap,
    requirement: 30,
    current: 0,
    unlocked: false,
    points: 20,
  },
];

// Niveles de aprendizaje
const LEARNING_LEVELS: LearningLevel[] = [
  {
    id: "beginner",
    name: "Principiante",
    description: "Conceptos básicos de programación y arquitectura",
    concepts: ["register", "memory", "instruction"],
    requiredPoints: 0,
    unlocked: true,
    completed: false,
  },
  {
    id: "intermediate",
    name: "Intermedio",
    description: "Operaciones aritméticas y lógicas",
    concepts: ["alu", "bus", "program-counter"],
    requiredPoints: 50,
    unlocked: false,
    completed: false,
  },
  {
    id: "advanced",
    name: "Avanzado",
    description: "Interrupciones y programación compleja",
    concepts: ["flags", "stack", "interrupts"],
    requiredPoints: 100,
    unlocked: false,
    completed: false,
  },
];

export const EducationalProgress = memo(
  ({ className, isVisible = false, onClose }: EducationalProgressProps) => {
    const [achievements, setAchievements] = useState<Achievement[]>(ACHIEVEMENTS);
    const [levels, setLevels] = useState<LearningLevel[]>(LEARNING_LEVELS);
    const [totalPoints, setTotalPoints] = useState(0);
    const [sessionTime, setSessionTime] = useState(0);

    // Cargar progreso guardado
    useEffect(() => {
      const savedProgress = localStorage.getItem("vonsim8-educational-progress");
      if (savedProgress) {
        try {
          const data = JSON.parse(savedProgress) as {
            achievements?: Achievement[];
            levels?: LearningLevel[];
            totalPoints?: number;
            sessionTime?: number;
          };
          setAchievements(data.achievements || ACHIEVEMENTS);
          setLevels(data.levels || LEARNING_LEVELS);
          setTotalPoints(data.totalPoints || 0);
          setSessionTime(data.sessionTime || 0);
        } catch {
          // Si hay error, usar valores por defecto
        }
      }
    }, []);

    // Guardar progreso
    const saveProgress = useCallback(() => {
      const progress = {
        achievements,
        levels,
        totalPoints,
        sessionTime,
        lastSaved: Date.now(),
      };
      localStorage.setItem("vonsim8-educational-progress", JSON.stringify(progress));
    }, [achievements, levels, totalPoints, sessionTime]);

    // Actualizar progreso
    const updateProgress = useCallback((type: AchievementType, value: number) => {
      setAchievements(prev => {
        const updated = prev.map(achievement => {
          if (achievement.type === type) {
            const newCurrent = Math.min(achievement.current + value, achievement.requirement);
            const wasUnlocked = achievement.unlocked;
            const isUnlocked = newCurrent >= achievement.requirement;

            // Si se desbloquea un logro, mostrar notificación
            if (!wasUnlocked && isUnlocked) {
              showAchievementNotification(achievement);
            }

            return {
              ...achievement,
              current: newCurrent,
              unlocked: isUnlocked,
            };
          }
          return achievement;
        });

        // Calcular puntos totales
        const newTotalPoints = updated
          .filter(a => a.unlocked)
          .reduce((sum, a) => sum + a.points, 0);

        setTotalPoints(newTotalPoints);

        // Verificar niveles desbloqueados
        setLevels(prev =>
          prev.map(level => ({
            ...level,
            unlocked: newTotalPoints >= level.requiredPoints,
          })),
        );

        return updated;
      });
    }, []);

    // Mostrar notificación de logro
    const showAchievementNotification = (achievement: Achievement) => {
      // Crear notificación temporal
      const notification = document.createElement("div");
      notification.className = clsx(
        "fixed right-4 top-4 z-50 rounded-lg border-2 p-4 shadow-lg",
        "animate-slide-in-right bg-mantis-500 text-white",
      );
      notification.innerHTML = `
      <div class="flex items-center gap-3">
        <FontAwesomeIcon icon="${achievement.icon}" class="text-2xl" />
        <div>
          <div class="font-bold">¡Logro Desbloqueado!</div>
          <div class="text-sm">${achievement.title}</div>
        </div>
      </div>
    `;

      document.body.appendChild(notification);

      setTimeout(() => {
        notification.remove();
      }, 3000);
    };

    // Escuchar eventos de progreso
    useEffect(() => {
      const handleProgressEvent = (event: CustomEvent) => {
        const { type, value = 1 } = event.detail;
        updateProgress(type, value);
      };

      window.addEventListener("educational-progress", handleProgressEvent as EventListener);
      return () =>
        window.removeEventListener("educational-progress", handleProgressEvent as EventListener);
    }, [updateProgress]);

    // Timer de sesión
    useEffect(() => {
      const timer = setInterval(() => {
        setSessionTime(prev => {
          const newTime = prev + 1;
          // Actualizar logro de tiempo cada minuto
          if (newTime % 60 === 0) {
            updateProgress("time_spent", 1);
          }
          return newTime;
        });
      }, 1000);

      return () => clearInterval(timer);
    }, [updateProgress]);

    // Guardar progreso automáticamente
    useEffect(() => {
      const saveInterval = setInterval(saveProgress, 30000); // Cada 30 segundos
      return () => clearInterval(saveInterval);
    }, [saveProgress]);

    if (!isVisible) {
      return null;
    }

    const unlockedAchievements = achievements.filter(a => a.unlocked);
    const unlockedLevels = levels.filter(l => l.unlocked);

    return (
      <div
        className={clsx(
          "fixed bottom-20 right-4 z-50 h-80 w-96 rounded-lg border border-stone-600 bg-stone-900 shadow-xl",
          className,
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-stone-600 p-3">
          <h3 className="flex items-center gap-2 text-sm font-semibold text-mantis-400">
            <FontAwesomeIcon icon={faTrophy} />
            Progreso Educativo
          </h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-xs text-stone-400 hover:text-white"
          >
            ×
          </Button>
        </div>

        {/* Contenido */}
        <div className="h-64 space-y-3 overflow-y-auto p-3">
          {/* Puntos totales */}
          <div className="rounded-lg bg-stone-800 p-3 text-center">
            <div className="text-2xl font-bold text-mantis-400">{totalPoints}</div>
            <div className="text-xs text-stone-400">Puntos Totales</div>
          </div>

          {/* Niveles */}
          <div>
            <h4 className="mb-1 flex items-center gap-2 text-sm font-medium text-stone-300">
              <FontAwesomeIcon icon={faGraduationCap} />
              Niveles de Aprendizaje
            </h4>
            <div className="space-y-1">
              {levels.map(level => (
                <div
                  key={level.id}
                  className={clsx(
                    "rounded border p-2 text-xs",
                    level.unlocked
                      ? "border-mantis-400 bg-mantis-400/10 text-mantis-400"
                      : "border-stone-600 bg-stone-800 text-stone-500",
                  )}
                >
                  <div className="font-medium">{level.name}</div>
                  <div className="text-stone-400">{level.description}</div>
                  {!level.unlocked && (
                    <div className="mt-1 text-stone-500">
                      Requiere {level.requiredPoints} puntos
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Logros */}
          <div>
            <h4 className="mb-1 flex items-center gap-2 text-sm font-medium text-stone-300">
              <FontAwesomeIcon icon={faStar} />
              Logros ({unlockedAchievements.length}/{achievements.length})
            </h4>
            <div className="space-y-1">
              {achievements.map(achievement => (
                <div
                  key={achievement.id}
                  className={clsx(
                    "rounded border p-2 text-xs",
                    achievement.unlocked
                      ? "border-mantis-400 bg-mantis-400/10"
                      : "border-stone-600 bg-stone-800",
                  )}
                >
                  <div className="flex items-center gap-2">
                    <FontAwesomeIcon
                      icon={achievement.icon}
                      className={achievement.unlocked ? "text-mantis-400" : "text-stone-500"}
                    />
                    <div className="flex-1">
                      <div
                        className={clsx(
                          "font-medium",
                          achievement.unlocked ? "text-mantis-400" : "text-stone-400",
                        )}
                      >
                        {achievement.title}
                      </div>
                      <div className="text-stone-500">{achievement.description}</div>
                      <div className="mt-1">
                        <div className="h-1 w-full rounded-full bg-stone-700">
                          <div
                            className="h-1 rounded-full bg-mantis-400 transition-all duration-300"
                            style={{
                              width: `${(achievement.current / achievement.requirement) * 100}%`,
                            }}
                          />
                        </div>
                        <div className="mt-1 text-stone-500">
                          {achievement.current}/{achievement.requirement}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Estadísticas de sesión */}
          <div>
            <h4 className="mb-1 flex items-center gap-2 text-sm font-medium text-stone-300">
              <FontAwesomeIcon icon={faChartLine} />
              Estadísticas
            </h4>
            <div className="text-xs text-stone-400">
              <div>
                Tiempo de sesión: {Math.floor(sessionTime / 60)}m {sessionTime % 60}s
              </div>
              <div>
                Niveles completados: {unlockedLevels.length}/{levels.length}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  },
);

EducationalProgress.displayName = "EducationalProgress";

// Función helper para emitir eventos de progreso
export const emitProgressEvent = (type: AchievementType, value = 1) => {
  window.dispatchEvent(
    new CustomEvent("educational-progress", {
      detail: { type, value },
    }),
  );
};
