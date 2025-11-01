import { IOAddress, MemoryAddress } from "@vonsim/common/address";
import dedent from "dedent";

import type { Locale } from "..";

const maxAddress = MemoryAddress.from(MemoryAddress.MAX_ADDRESS).toString();

export const spanish: Locale = {
  generics: {
    clean: "Limpiar",
    "io-register": (name: string, address: any) =>
      `Registro ${name} (${IOAddress.format(address)})`,
    "byte-representation": {
      hex: "Hexadecimal",
      bin: "Binario",
      uint: "Entero sin signo",
      int: "Entero con signo",
      "safe-ascii": "ASCII",
    },
  },

  update: {
    "update-available": "¡Hay una nueva versión disponible!",
    "new-version-available": "Hay una nueva versión disponible en el repositorio.",
    "local-update": "Se ha detectado una nueva versión local.",
    reload: "Actualizar",
  },

  messages: {
    "assemble-error": "Error de ensamblado. Solucione los errores y vuelva a intentar.",
    "invalid-action": "Acción inválida.",
    "keyboard-input-required": "Ingrese un carácter por teclado",
    "keyboard-input-description":
      "El programa está esperando que ingrese un carácter usando el teclado virtual.",
  },

  editor: {
    lintSummary: (n: number) =>
      n === 0 ? "Listo para compilar" : n === 1 ? "Hay un error" : `Hay ${n} errores`,
    files: {
      unsupported: "Tu navegador no soporta la “FileSystem API”",
      "no-file": "No hay ningún archivo abierto",
      open: "Abrir",
      unsaved: "Hay cambios sin guardar, ¿desea descartarlos?",
      "open-error": "Error al abrir el archivo",
      save: "Guardar",
      "save-as": "Guardar como",
      "save-error": "Error al guardar el archivo",
    },
    example: dedent`
      ; ¡Bienvenido a VonSim 8!
      ; Este es un ejemplo de código que suma dos variables z = x + y      
        x  db 3
        y  db 2
        z  db 0
        mov al, x
        add al, y
        mov z, al
        hlt
    `,
  },

  control: {
    action: {
      start: "Iniciar",
      continue: "Continuar",
      running: "Ejecutando...",
      run: {
        "cycle-change": "Ciclo",
        "end-of-instruction": "Instrucción",
        infinity: "Final",
      },
      stop: "Detener",
      reset: "Reiniciar",
      pause: "Pausar",
    },
    tabs: {
      editor: "Editor",
      computer: "Computadora",
    },
    zoom: {
      in: "Acercar",
      out: "Alejar",
    },
  },

  computer: {
    cpu: {
      name: "CPU",
      register: (register: string) => `Registro ${register}`,
      "control-unit": "Unidad de control",
      decoder: "Decodificador",
      stats: "Estadísticas CPU",
      "instruction-cycle": "Ciclo de instrucción",
      status: {
        fetching: "Captación instrucción...",
        "fetching-operands": "Leyendo operandos...",
        "fetching-operands-completed": "Operandos obtenidos",
        executing: "Ejecutando...",
        writeback: "Escribiendo resultados...",
        interrupt: "Manejando interrupción...",
        stopped: "Detenido",
        "stopped-error": "Error",
        "waiting-for-input": "Esperando tecla...",
        int6: "Ejecutando INT 6...",
        int7: "Ejecutando INT 7...",
      },
      "total-cycles": "Total de ciclos",
      "instruction-count": "Recuento de instrucciones",
      cpi: "Ciclos por instrucción (CPI)",
      "cpi-help":
        "Promedio de ciclos de reloj por instrucción ejecutada (CPI = ciclos totales / instrucciones totales)",
      "cpu-time": "Tiempo de CPU",
      "cpu-time-help":
        "Tiempo total de CPU = ciclos totales × tiempo de ciclo (actual: {cycleTime} ms)",
    },

    memory: {
      name: "Memoria",
      cell: (address: any) => `Celda ${MemoryAddress.format(address)}`,
      "fix-address": "Fijar dirección",
      "unfix-address": "Desfijar dirección",
      "address-must-be-integer": "El valor de inicio debe ser un número entero hexadecimal.",
      "address-out-of-range": `El valor de inicio debe ser menor o igual a ${maxAddress}.`,
      "address-increment": "Incrementar dirección (Page Up)",
      "address-decrement": "Decrementar dirección (Page Down)",
    },

    "chip-select": {
      name: "Chip select",
      mem: "mem",
      pic: "pic",
      timer: "timer",
      pio: "pio",
      handshake: "handshake",
    },

    bus: {
      "read-memory": "LEER MEMORIA",
      "write-memory": "ESCRIBIR MEMORIA",
    },

    f10: "Tecla F10",
    keyboard: "Teclado",
    leds: "Leds",
    printer: { name: "Impresora", buffer: "Buffer" },
    screen: "Pantalla",
    switches: "Llaves",

    handshake: { name: "Handshake", data: "Dato", state: "Estado" },
    pic: "PIC",
    pio: { name: "PIO", port: (port: string) => `Puerto ${port}` },
    timer: "Timer",
  },

  settings: {
    title: "Configuración",

    instructionCycle: {
      label: "Ciclo de Instrucción",
    },

    statsCPU: {
      label: "Estadísticas CPU",
    },

    flags: {
      label: "Banderas",
      description: "Selecciona qué banderas mostrar en la ALU.",
    },

    language: {
      label: "Idioma",
    },

    editorFontSize: {
      label: "Tamaño de fuente del editor",
      increase: "Aumentar",
      decrease: "Disminuir",
    },

    dataOnLoad: {
      label: "Memoria al cargar",
      description: "Qué hacer con la memoria al cargar un nuevo programa.",

      randomize: "Aleatoria",
      clean: "Vaciar",
      unchanged: "Reusar",
    },

    devices: {
      label: "Dispositivos",
      description: "Qué dispositivos deben estar habilitados.",

      "keyboard-and-screen": "Teclado y pantalla",
      pic: {
        label: "PIC",
        description: "También agrega un timer y la tecla F10.",
      },
      pio: {
        label: "PIO",
        "switches-and-leds": "Llaves y Leds",
        printer: "Impresora",
        null: "Desconectado",
      },
      handshake: {
        label: "Handshake",
        printer: "Impresora",
        null: "Desconectado",
      },
    },

    animations: {
      label: "Animaciones",
      description: ["Habilitación de animaciones."].join(" "),
    },

    speeds: {
      executionUnit: "Velocidad de simulación",
      clockSpeed: "Velocidad del reloj",
      printerSpeed: "Velocidad de impresión",
    },

    filters: {
      label: "Filtros",
      description: "Filtros aplicados a la página. Útil cuando se usa un proyector.",
      revert: "Revertir a los valores por defecto",
      brightness: "Brillo",
      contrast: "Contraste",
      invert: "Invertir",
      saturation: "Saturación",
    },

    reset: "Restablecer configuración",
  },

  footer: {
    documentation: "Documentación",
    copyright: "III-LIDI, FI, UNLP, UNER",

    issue: {
      report: "Reportar un error",
      body: (settings: any, program: string) => dedent`
        <!-- Por favor, describa el problema que está teniendo en la mayor cantidad de detalle posible. -->
        <!-- Por sobre todo, agregue los pasos para reproducir el problema. -->

        <details>
          <summary>Información extra (POR FAVOR, NO BORRAR)</summary>

          **Versión**: [${__COMMIT_HASH__}](https://github.com/ruiz-jose/VonSim8/commit/${__COMMIT_HASH__})

          #### Programa

          \`\`\`asm
          ${program
            .split("\n")
            .map(line => line.trim())
            .join("\n")}
          \`\`\`

          #### Configuración

          \`\`\`json
          ${JSON.stringify(settings, null, 2)}
          \`\`\`
          
        </details>
      `,
    },
  },
};
