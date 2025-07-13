import { faGraduationCap, faLightbulb, faRocket } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import clsx from "clsx";
import { memo, useState } from "react";

import { Tooltip } from "@/components/ui/Tooltip";

type ComplexityLevel = 'beginner' | 'intermediate' | 'advanced';

type EducationalTooltipProps = {
  concept: string;
  level?: ComplexityLevel;
  children: React.ReactNode;
  className?: string;
}

// Base de conocimientos educativos
const EDUCATIONAL_CONTENT = {
  'register': {
    beginner: 'Un registro es como una caja pequeña donde la CPU guarda datos temporalmente. Es muy rápido de acceder.',
    intermediate: 'Los registros son memoria de acceso rápido dentro de la CPU. Son más rápidos que la RAM pero tienen menos capacidad.',
    advanced: 'Registros de propósito general (AL, BL, CL, DL) para operaciones aritméticas. Cada uno puede almacenar 8 bits.'
  },
  'memory': {
    beginner: 'La memoria RAM es como un gran almacén donde se guardan programas y datos. Cada ubicación tiene una dirección única.',
    intermediate: 'Memoria de acceso aleatorio (RAM) de 256 bytes. La CPU puede leer y escribir en cualquier dirección.',
    advanced: 'Memoria principal de 256 bytes con direccionamiento de 8 bits (00-FF). Organizada en celdas de 8 bits cada una.'
  },
  'alu': {
    beginner: 'La ALU (Unidad Aritmético-Lógica) es el "cerebro matemático" de la CPU. Realiza sumas, restas y comparaciones.',
    intermediate: 'Arithmetic Logic Unit procesa operaciones matemáticas y lógicas. Recibe operandos y devuelve resultados.',
    advanced: 'ALU de 8 bits que ejecuta operaciones: ADD, SUB, AND, OR, XOR, NOT, CMP. Incluye flags de estado (Z, N, C).'
  },
  'bus': {
    beginner: 'Los buses son como "carreteras" por donde viajan los datos entre los componentes de la computadora.',
    intermediate: 'Buses de datos y control conectan CPU, memoria y periféricos. El bus de datos transporta información.',
    advanced: 'Bus de datos de 8 bits bidireccional, bus de direcciones de 8 bits, y líneas de control para sincronización.'
  },
  'instruction': {
    beginner: 'Una instrucción es un comando que le dice a la CPU qué operación realizar, como sumar dos números.',
    intermediate: 'Cada instrucción tiene un código de operación (opcode) y operandos. La CPU las ejecuta secuencialmente.',
    advanced: 'Formato de instrucción: opcode (1 byte) + operandos. Ejemplos: MOV, ADD, JMP, CALL. Ciclo fetch-decode-execute.'
  },
  'program-counter': {
    beginner: 'El contador de programa (IP) indica qué instrucción ejecutar a continuación. Se incrementa automáticamente.',
    intermediate: 'Program Counter (IP) contiene la dirección de la siguiente instrucción. Se actualiza en cada ciclo.',
    advanced: 'Instruction Pointer (IP) de 8 bits. Incrementa en 1-2 bytes según el tamaño de la instrucción actual.'
  },
  'flags': {
    beginner: 'Las banderas son indicadores que muestran el resultado de operaciones, como si el resultado fue cero.',
    intermediate: 'Flags de estado: Zero (Z), Negative (N), Carry (C). Se actualizan automáticamente en operaciones.',
    advanced: 'Flags de 1 bit: Z (resultado cero), N (resultado negativo), C (acarreo/overflow). Controlan saltos condicionales.'
  },
  'stack': {
    beginner: 'La pila es como una pila de platos. Solo puedes agregar o quitar del tope. Útil para guardar direcciones de retorno.',
    intermediate: 'Stack Pointer (SP) apunta al tope de la pila. PUSH agrega datos, POP los retira. LIFO (Last In, First Out).',
    advanced: 'Pila de 256 bytes con SP de 8 bits. PUSH decrementa SP, POP lo incrementa. Usada para CALL/RET y variables locales.'
  },
  'interrupt': {
    beginner: 'Una interrupción es como un timbre que interrumpe lo que está haciendo la CPU para atender algo urgente.',
    intermediate: 'Las interrupciones permiten que dispositivos externos notifiquen a la CPU eventos importantes.',
    advanced: 'Sistema de interrupciones con PIC (Programmable Interrupt Controller). IRET retorna de la rutina de interrupción.'
  },
  'peripheral': {
    beginner: 'Los periféricos son dispositivos externos como teclado, pantalla y LEDs que se conectan a la computadora.',
    intermediate: 'Periféricos se comunican con la CPU a través de puertos de entrada/salida (I/O).',
    advanced: 'Sistema de I/O con PIO (Programmable I/O) y módulos específicos para cada periférico.'
  },
  'assembly': {
    beginner: 'El lenguaje ensamblador es un lenguaje de programación que usa palabras en lugar de números para las instrucciones.',
    intermediate: 'Cada instrucción de ensamblador se traduce a código de máquina. El ensamblador hace esta traducción.',
    advanced: 'Sintaxis: etiqueta, mnemónico, operandos, comentarios. Directivas como ORG, DB, DW para datos.'
  },
  'addressing': {
    beginner: 'El direccionamiento es cómo la CPU encuentra los datos que necesita en la memoria.',
    intermediate: 'Modos de direccionamiento: inmediato, directo, indirecto. Cada uno accede a datos de forma diferente.',
    advanced: 'Direccionamiento inmediato (valor en instrucción), directo (dirección en instrucción), indirecto (dirección en registro).'
  }
} as const;

const LEVEL_ICONS = {
  beginner: faLightbulb,
  intermediate: faGraduationCap,
  advanced: faRocket
};

const LEVEL_COLORS = {
  beginner: 'text-blue-400',
  intermediate: 'text-yellow-400',
  advanced: 'text-purple-400'
};

export const EducationalTooltip = memo(({ 
  concept, 
  level = 'beginner',
  children,
  className 
}: EducationalTooltipProps) => {
  const [currentLevel, setCurrentLevel] = useState<ComplexityLevel>(level);
  
  const content = EDUCATIONAL_CONTENT[concept as keyof typeof EDUCATIONAL_CONTENT];
  if (!content) {
    console.warn(`No educational content found for concept: ${concept}`);
    return <>{children}</>;
  }

  const explanation = content[currentLevel];
  const IconComponent = LEVEL_ICONS[currentLevel];

  const tooltipContent = (
    <div className="max-w-xs p-3">
      <div className="mb-2 flex items-center gap-2">
        <FontAwesomeIcon 
          icon={IconComponent} 
          className={clsx("text-sm", LEVEL_COLORS[currentLevel])} 
        />
        <span className={clsx("text-sm font-medium", LEVEL_COLORS[currentLevel])}>
          Nivel {currentLevel === 'beginner' ? 'Básico' : currentLevel === 'intermediate' ? 'Intermedio' : 'Avanzado'}
        </span>
      </div>
      <p className="mb-3 text-sm text-stone-300">{explanation}</p>
      
      {/* Selector de nivel */}
      <div className="flex gap-1">
        {(['beginner', 'intermediate', 'advanced'] as const).map((lvl) => (
          <button
            key={lvl}
            onClick={(e) => {
              e.stopPropagation();
              setCurrentLevel(lvl);
            }}
            className={clsx(
              "rounded px-2 py-1 text-xs transition-colors",
              currentLevel === lvl 
                ? "bg-mantis-600 text-white" 
                : "bg-stone-700 text-stone-400 hover:bg-stone-600"
            )}
          >
            {lvl === 'beginner' ? 'B' : lvl === 'intermediate' ? 'I' : 'A'}
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <Tooltip content={tooltipContent as any} position="top">
      <span className={clsx("inline-flex cursor-help items-center gap-1", className)}>
        {children}
        <FontAwesomeIcon 
          icon={faLightbulb} 
          className="text-xs text-mantis-400 opacity-70 transition-opacity hover:opacity-100" 
        />
      </span>
    </Tooltip>
  );
});

EducationalTooltip.displayName = 'EducationalTooltip'; 