/**
 * @fileoverview
 * This file contains the logic to paint movement of data between registers
 * inside the CPU. These paths are stored in a undirected graph, and the
 * shortest path between two registers is calculated using a simple BFS.
 *
 * It doesn't require Dijkstra's algorithm because there is only one path
 * between any two registers.
 *
 * I've used graphology because seems to be the most popular graph library
 * for JS, and it's well documented.
 *
 * @see {@link https://graphology.github.io/}
 */

import { UndirectedGraph } from "graphology";
import { bidirectional } from "graphology-shortest-path/unweighted";
import { useAtomValue } from "jotai";

import { animated, getSpring } from "@/computer/shared/springs";

import type { PhysicalRegister } from "./state";
import { cycleAtom } from "./state";

type Node = { position: [x: number, y: number] };

const dataBus = new UndirectedGraph<Node>({ allowSelfLoops: false });

// These are the endpoints of the bus
dataBus.addNode("MBR", { position: [615, 249] }); // Actualizado centro del MBR a x=615
dataBus.addNode("MBR bottom", { position: [615, 274] }); // Nodo de salida inferior - coincide con línea gris estática
dataBus.addNode("MBR reg input", { position: [595, 249] }); // Nodo de entrada desde registros al MBR (1cm antes del MBR)
dataBus.addNode("AL", { position: [455, 45] }); // Ajustado para el centro del registro de 8 bits
dataBus.addNode("BL", { position: [455, 85] }); // Ajustado para el centro del registro de 8 bits
dataBus.addNode("CL", { position: [455, 125] }); // Ajustado para el centro del registro de 8 bits
dataBus.addNode("DL", { position: [455, 165] }); // Ajustado para el centro del registro de 8 bits
dataBus.addNode("id", { position: [455, 205] });
dataBus.addNode("SP", { position: [455, 309] });
dataBus.addNode("IP", { position: [455, 349] }); // Más centrado visualmente respecto al registro IP
dataBus.addNode("ri", { position: [455, 388] });
dataBus.addNode("ri out", { position: [480, 388] }); // Nodo salida de ri
dataBus.addNode("MAR", { position: [630, 349] }); // Movido más a la izquierda para centrar en el registro MAR
dataBus.addNode("result", { position: [272, 115] });
dataBus.addNode("NodoRegIn", { position: [390, 115] }); // Antes: [370, 115]
dataBus.addNode("NodoRegOut", { position: [550, 115] }); // Nodo de unión para salidas de registros
dataBus.addNode("FLAGS", { position: [250, 225] });
// Nodo IR actualizado a la nueva posición visual (alineado debajo de FLAG)
dataBus.addNode("IR", { position: [250, 275] }); // Ajusta el valor de y según la posición real
// Nodo de unión para la animación MBR→IR, alineado con el nuevo IR
dataBus.addNode("IR mbr join", { position: [250, 250] }); // IR ahora más a la derecha
dataBus.addNode("left", { position: [130, 85] });
dataBus.addNode("right", { position: [125, 145] });
dataBus.addNode("left end", { position: [220, 85] }); // Nodo final en la entrada izquierda de la ALU
dataBus.addNode("right end", { position: [220, 145] }); // Nodo final en la entrada derecha de la ALU
dataBus.addNode("result start", { position: [280, 115] }); // Nodo inicial del bus de resultado
dataBus.addNode("rmbr", { position: [250, 390] });
dataBus.addNode("bleft1", { position: [550, 16] });
dataBus.addNode("bleft2", { position: [90, 16] });
dataBus.addNode("bleft3", { position: [90, 85] });

// These are the intermediate nodes
dataBus.addNode("CL join", { position: [425, 125] }); // Ajustado para conectar con el registro de 8 bits
dataBus.addNode("AL join", { position: [425, 45] }); // Ajustado para conectar con el registro de 8 bits
dataBus.addNode("BL join", { position: [425, 85] }); // Ajustado para conectar con el registro de 8 bits
dataBus.addNode("MBR top", { position: [615, 215] }); // Nodo de entrada superior - más arriba para simular entrada
dataBus.addNode("DL join", { position: [425, 165] }); // Ajustado para conectar con el registro de 8 bits
dataBus.addNode("id join", { position: [425, 205] }); // Alineado con AL join
dataBus.addNode("data mbr join", { position: [390, 250] });
// Nodos intermedios para conexión con ángulos de 90 grados desde registros al MBR
dataBus.addNode("mbr approach horizontal", { position: [580, 250] }); // Punto horizontal antes del MBR (1cm antes)
dataBus.addNode("mbr approach vertical", { position: [580, 215] }); // Punto vertical para subir hacia MBR top
dataBus.addNode("mbr top approach", { position: [600, 215] }); // Punto de aproximación hacia la entrada superior (más a la derecha)
dataBus.addNode("mbr top entry", { position: [615, 215] }); // Punto de entrada específico a MBR top (coincide con MBR top)
// Nodos para la ruta MBR bottom → IR siguiendo el camino del bus gris
dataBus.addNode("mbr bottom exit", { position: [615, 285] }); // Punto de salida inferior (siguiendo bus gris)
dataBus.addNode("mbr to bus horizontal", { position: [585, 285] }); // Punto donde se conecta con el bus horizontal
dataBus.addNode("mbr to bus join", { position: [585, 250] }); // Punto donde sube al bus principal horizontal
dataBus.addNode("mbr to cpu center", { position: [390, 250] }); // Punto en el centro de la CPU (data mbr join)
dataBus.addNode("mbr to ir horizontal", { position: [250, 250] }); // Punto horizontal hacia IR (siguiendo línea gris 390->250)
dataBus.addNode("mbr to ir vertical end", { position: [250, 272] }); // Final de la línea gris vertical
dataBus.addNode("mbr to ir approach", { position: [250, 275] }); // Punto de aproximación a IR (directamente al centro del registro IR)
// Nodos para la ruta MBR bottom → ri siguiendo el mismo camino inicial que MBR→IR
dataBus.addNode("mbr to ri vertical", { position: [390, 388] }); // Punto donde baja hacia ri desde el centro de CPU
dataBus.addNode("SP join", { position: [425, 309] });
dataBus.addNode("IP join", { position: [390, 349] }); // Alineado con data mbr join y NodoRegIn
dataBus.addNode("ri join", { position: [425, 388] });
dataBus.addNode("MAR join1", { position: [550, 388] });
dataBus.addNode("MAR join2", { position: [550, 349] });
dataBus.addNode("result mbr join", { position: [370, 250] });
dataBus.addNode("FLAGS mbr join", { position: [155, 250] }); // FLAGS sigue a la izquierda
dataBus.addNode("left join", { position: [30, 85] });
dataBus.addNode("right join", { position: [90, 145] });
dataBus.addNode("operands mbr join", { position: [90, 250] });
dataBus.addNode("outr mbr join", { position: [550, 250] });
dataBus.addNode("mbr reg join", { position: [390, 250] });
dataBus.addNode("MBR join", { position: [390, 250] }); // Alias para compatibilidad

// Añadir nodos de unión para los registros AL, BL, CL, DL e id
dataBus.addNode("AL out", { position: [483, 45] }); // Lado izquierdo del registro AL
dataBus.addNode("BL out", { position: [483, 85] }); // Lado izquierdo del registro BL
dataBus.addNode("CL out", { position: [483, 125] }); // Lado izquierdo del registro CL
dataBus.addNode("DL out", { position: [483, 165] }); // Lado izquierdo del registro DL
dataBus.addNode("id out", { position: [483, 205] }); // Lado izquierdo del registro id
dataBus.addNode("MBR out", { position: [626, 249] }); // Nodo de salida de MBR
dataBus.addNode("MBR out join", { position: [550, 250] }); // Nodo de unión de salida de MBR
dataBus.addNode("SP out", { position: [510, 309] });
dataBus.addNode("IP out", { position: [510, 349] }); // Más a la derecha, borde derecho del registro IP
dataBus.addNode("IP out join", { position: [550, 349] });
dataBus.addNode("ri out join", { position: [525, 388] });
dataBus.addNode("SP out join", { position: [525, 309] });

// Añadir nodos de unión para los buses de salida en la parte posterior de los registros
dataBus.addNode("AL out join", { position: [525, 45] }); // 60 unidades a la derecha de AL out
dataBus.addNode("BL out join", { position: [525, 85] }); // 60 unidades a la derecha de BL out
dataBus.addNode("CL out join", { position: [525, 125] }); // 60 unidades a la derecha de CL out
dataBus.addNode("DL out join", { position: [525, 165] }); // 60 unidades a la derecha de DL out
dataBus.addNode("id out join", { position: [521, 205] }); // 60 unidades a la derecha de id out

dataBus.addUndirectedEdge("AL", "AL out");
dataBus.addUndirectedEdge("BL", "BL out");
dataBus.addUndirectedEdge("CL", "CL out");
dataBus.addUndirectedEdge("DL", "DL out");
dataBus.addUndirectedEdge("id", "id out");

dataBus.addUndirectedEdge("IP", "IP out");
dataBus.addUndirectedEdge("SP", "SP out");

// Crear las aristas necesarias para conectar estos nodos de unión con los buses de salida
dataBus.addUndirectedEdge("AL out", "AL out join");
dataBus.addUndirectedEdge("BL out", "BL out join");
dataBus.addUndirectedEdge("BL out", "mbr approach horizontal"); // Conexión directa para ruta BL→MBR evitando NodoRegIn
dataBus.addUndirectedEdge("CL out", "CL out join");
dataBus.addUndirectedEdge("DL out", "DL out join");
dataBus.addUndirectedEdge("id out", "id out join");

// Conectar los registros al NodoRegOut
dataBus.addUndirectedEdge("AL out join", "NodoRegOut");
dataBus.addUndirectedEdge("BL out join", "NodoRegOut");
dataBus.addUndirectedEdge("CL out join", "NodoRegOut");
dataBus.addUndirectedEdge("DL out join", "NodoRegOut");
dataBus.addUndirectedEdge("id out join", "NodoRegOut");

// Conectar NodoRegOut a los destinos
dataBus.addUndirectedEdge("NodoRegOut", "outr mbr join");
dataBus.addUndirectedEdge("NodoRegOut", "bleft1");
dataBus.addUndirectedEdge("bleft1", "bleft2");
dataBus.addUndirectedEdge("bleft2", "bleft3");
dataBus.addUndirectedEdge("bleft3", "left");
dataBus.addUndirectedEdge("left", "left end"); // Conectar left con left end

dataBus.addUndirectedEdge("IP out join", "outr mbr join");
dataBus.addUndirectedEdge("ri out join", "outr mbr join");
dataBus.addUndirectedEdge("SP out join", "outr mbr join");
dataBus.addUndirectedEdge("SP out join", "MAR join2");
dataBus.addUndirectedEdge("outr mbr join", "MAR join2"); // Conexión directa para animación MBR→MAR por bus gris

/*
  dataBus.addUndirectedEdge("AL out join", "left");
  dataBus.addUndirectedEdge("BL out join", "left");
  dataBus.addUndirectedEdge("CL out join", "left");
  dataBus.addUndirectedEdge("DL out join", "left");
dataBus.addUndirectedEdge("id out join", "left");
*/
dataBus.addUndirectedEdge("outr mbr join", "data mbr join"); // Conexión directa para evitar FLAGS
dataBus.addUndirectedEdge("MBR", "outr mbr join");
dataBus.addUndirectedEdge("MBR", "MBR out");
dataBus.addUndirectedEdge("MBR out", "MBR out join");
dataBus.addUndirectedEdge("MBR out join", "NodoRegOut");
dataBus.addUndirectedEdge("MBR out", "outr mbr join");

dataBus.addUndirectedEdge("mbr reg join", "NodoRegIn");
// Conexiones para el alias "MBR join"
dataBus.addUndirectedEdge("outr mbr join", "MBR join");
dataBus.addUndirectedEdge("MBR join", "NodoRegIn");
dataBus.addUndirectedEdge("NodoRegIn", "AL join");
dataBus.addUndirectedEdge("NodoRegIn", "BL join");
dataBus.addUndirectedEdge("NodoRegIn", "CL join");
dataBus.addUndirectedEdge("NodoRegIn", "DL join");
dataBus.addUndirectedEdge("NodoRegIn", "id join");
dataBus.addUndirectedEdge("outr mbr join", "operands mbr join");

// Conexión del bus de resultado desde data mbr join hasta el registro destino
// Nota: Estas conexiones ya existen más abajo, no las duplicamos

// These are the lines
dataBus.addUndirectedEdge("AL join", "AL");
dataBus.addUndirectedEdge("BL join", "BL");
dataBus.addUndirectedEdge("CL join", "CL");
dataBus.addUndirectedEdge("DL join", "DL");
dataBus.addUndirectedEdge("id join", "id");
dataBus.addUndirectedEdge("id join", "data mbr join");
dataBus.addUndirectedEdge("MBR", "data mbr join");
dataBus.addUndirectedEdge("MBR", "MBR top"); // Conectar MBR centro con MBR superior
dataBus.addUndirectedEdge("MBR", "MBR bottom"); // Conectar MBR centro con MBR inferior
dataBus.addUndirectedEdge("MBR", "MBR reg input"); // Conectar MBR centro con entrada desde registros
dataBus.addUndirectedEdge("NodoRegOut", "MBR reg input"); // Conexión directa para escritura de registros a memoria
// Conexiones para entrada al MBR por la parte superior (simplificado)
dataBus.addUndirectedEdge("outr mbr join", "mbr approach horizontal"); // Desde outr mbr join hacia el punto horizontal
dataBus.addUndirectedEdge("mbr approach horizontal", "mbr approach vertical"); // Ángulo 90° hacia arriba
dataBus.addUndirectedEdge("mbr approach vertical", "mbr top approach"); // Ángulo 90° hacia la derecha
dataBus.addUndirectedEdge("mbr top approach", "mbr top entry"); // Conectar con el punto de entrada
dataBus.addUndirectedEdge("mbr top entry", "MBR top"); // Conexión final a MBR top
// Conexiones para salida del MBR por la parte inferior hacia IR (siguiendo bus gris)
dataBus.addUndirectedEdge("MBR bottom", "mbr bottom exit"); // Desde MBR bottom hacia punto de salida
dataBus.addUndirectedEdge("mbr bottom exit", "mbr to bus horizontal"); // Línea horizontal hacia conexión con bus
dataBus.addUndirectedEdge("mbr to bus horizontal", "mbr to bus join"); // Línea vertical hacia bus principal
dataBus.addUndirectedEdge("mbr to bus join", "mbr to cpu center"); // Línea horizontal hacia centro de CPU (580->390)
dataBus.addUndirectedEdge("mbr to cpu center", "mbr to ir horizontal"); // Línea horizontal desde centro hacia IR (390->250)
dataBus.addUndirectedEdge("mbr to ir horizontal", "mbr to ir vertical end"); // Línea vertical siguiendo bus gris hasta Y=272
dataBus.addUndirectedEdge("mbr to ir vertical end", "mbr to ir approach"); // Pequeña extensión hasta centro de IR
dataBus.addUndirectedEdge("mbr to ir approach", "IR"); // Conexión final a IR
// Conexión adicional para ruta MBR→ri usando el mismo camino inicial
dataBus.addUndirectedEdge("mbr to cpu center", "mbr to ri vertical"); // Desde centro CPU baja hacia ri
dataBus.addUndirectedEdge("mbr to ri vertical", "ri"); // Conexión final a ri
dataBus.addUndirectedEdge("data mbr join", "NodoRegIn");

dataBus.addUndirectedEdge("IP", "IP join");
dataBus.addUndirectedEdge("SP", "SP join");
dataBus.addUndirectedEdge("ri", "ri join");
dataBus.addUndirectedEdge("ri", "ri out"); // Conectar ri con ri out
dataBus.addUndirectedEdge("ri out", "ri out join"); // Conectar ri out con ri out join
dataBus.addUndirectedEdge("MAR join1", "ri");
dataBus.addUndirectedEdge("MAR join2", "MAR join1");
dataBus.addUndirectedEdge("MAR", "MAR join2");
dataBus.addUndirectedEdge("IP join", "SP join");
dataBus.addUndirectedEdge("SP join", "ri join");

dataBus.addUndirectedEdge("result start", "result");
dataBus.addUndirectedEdge("result", "NodoRegIn");

dataBus.addUndirectedEdge("FLAGS", "FLAGS mbr join");
dataBus.addUndirectedEdge("FLAGS mbr join", "data mbr join");

dataBus.addUndirectedEdge("IR", "IR mbr join");
dataBus.addUndirectedEdge("IR mbr join", "FLAGS mbr join");

dataBus.addUndirectedEdge("left", "left join");
dataBus.addUndirectedEdge("right", "right join");
dataBus.addUndirectedEdge("left join", "right join");
dataBus.addUndirectedEdge("right join", "operands mbr join");
dataBus.addUndirectedEdge("right", "right end"); // Conectar right con right end
//dataBus.addUndirectedEdge("operands mbr join", "IR mbr join");

// Añadir nodos virtuales para separar visualmente los caminos de left y right cuando ambos vienen del MBR
// Estos nodos solo se usan para animación, no afectan la lógica del bus real
// Posiciones desplazadas verticalmente para evitar superposición
// Nodo para left (más arriba)
dataBus.addNode("NodoRegOutLeft", { position: [550, 90] });
dataBus.addUndirectedEdge("MBR out join", "NodoRegOutLeft");
dataBus.addUndirectedEdge("NodoRegOutLeft", "bleft1");
// Nodo para right (más abajo)
dataBus.addNode("NodoRegOutRight", { position: [550, 140] });
dataBus.addUndirectedEdge("MBR out join", "NodoRegOutRight");
dataBus.addUndirectedEdge("NodoRegOutRight", "outr mbr join");

// Nodos virtuales para separar horizontalmente el tramo NodoRegOut -> outr mbr join
// Nodo para right (a la izquierda, 10px a la izquierda del centro)
dataBus.addNode("NodoRegOutToRight", { position: [540, 115] });
dataBus.addUndirectedEdge("NodoRegOut", "NodoRegOutToRight");
dataBus.addUndirectedEdge("NodoRegOutToRight", "outr mbr join");
// Nodo para left (a la derecha, 10px a la derecha del centro)
dataBus.addNode("outr mbr join left", { position: [560, 250] });
dataBus.addNode("NodoRegOutToLeft", { position: [560, 115] });
dataBus.addUndirectedEdge("outr mbr join left", "NodoRegOutToLeft");
dataBus.addUndirectedEdge("NodoRegOutToLeft", "NodoRegOut");

export type DataRegister =
  | PhysicalRegister
  | "MBR"
  | "MBR top"
  | "MBR bottom"
  | "result start"
  | "left end"
  | "right end";

/**
 * Genera una animación simultánea para left y right cuando ambos son destinos
 * @param from Registro origen
 * @param instruction Instrucción actual
 * @param mode Modo de la instrucción
 * @returns Path SVG combinado para la animación simultánea
 */
export function generateSimultaneousLeftRightPath(
  from: DataRegister,
  instruction?: string,
  mode?: string,
): string {
  // Normalizar nombres de registros para evitar subniveles
  const normalizeRegister = (reg: string): string => {
    return reg.replace(/\.(l|h)$/, "");
  };

  const normalizedFrom = normalizeRegister(from);

  // Verificar que el nodo origen existe
  if (!dataBus.hasNode(normalizedFrom)) {
    console.warn(`Nodo origen '${normalizedFrom}' no existe en el grafo`);
    return "";
  }

  // Generar paths separados para left y right que terminen en la ALU
  const leftPath = generateDataPath(from, "left end", instruction, mode, {
    separateMBRPaths: true,
    direction: "left",
  });
  const rightPath = generateDataPath(from, "right end", instruction, mode, {
    separateMBRPaths: true,
    direction: "right",
  });

  // Si ambos paths son válidos, combinarlos en una sola animación
  if (leftPath && rightPath) {
    // Combinar los paths usando el operador SVG "|" para múltiples paths
    return `${leftPath} ${rightPath}`;
  }

  // Si solo uno es válido, devolver ese
  return leftPath || rightPath || "";
}

/**
 * Given two registers, returns the shortest path between them.
 * These registers must belong to {@link DataRegister}.
 * @returns The path as a SVG path.
 * @throws If there is no path between the two registers.
 */
export function generateDataPath(
  from: DataRegister,
  to: DataRegister,
  instruction?: string,
  mode?: string,
  options?: { separateMBRPaths?: boolean; direction?: "left" | "right" },
): string {
  console.log("🔍 generateDataPath llamado con:", { from, to, instruction, mode, options });
  // Normalizar nombres de registros para evitar subniveles
  const normalizeRegister = (reg: string): string => {
    // Eliminar sufijos como .l, .h para usar el registro base
    let base = reg.replace(/\.(l|h)$/, "");
    // Solo normalizar a mayúsculas los registros que están en el grafo en mayúsculas
    const upperCaseRegisters = [
      "MBR",
      "AL",
      "BL",
      "CL",
      "DL",
      "SP",
      "IP",
      "MAR",
      "FLAGS",
      "IR",
      "RESULT",
    ];
    if (upperCaseRegisters.includes(base.toUpperCase())) {
      base = base.toUpperCase();
    }
    // Los registros que están en minúsculas en el grafo deben mantenerse así
    return base;
  };

  const normalizedFrom = normalizeRegister(from);
  const normalizedTo = normalizeRegister(to);

  // Lista de registros válidos
  const registers = [
    "AL",
    "BL",
    "CL",
    "DL",
    "id",
    "SP",
    "IP",
    "ri",
    "MAR",
    "MBR",
    "left",
    "right",
    "left end",
    "right end",
  ];

  console.log("🔍 Debug inicial:", {
    normalizedFrom,
    normalizedTo,
    instruction,
    mode,
    isFromRegister: registers.includes(normalizedFrom),
    isToMBR: normalizedTo === "MBR",
    condition: registers.includes(normalizedFrom) && normalizedTo === "MBR",
  });

  let path: string[] = [];

  // Path especial: ri -> MAR para modo mem<-imd (DEBE ir ANTES de la verificación de MAR)
  console.log("🔍 Evaluando condición ri → MAR:", {
    normalizedFrom,
    normalizedTo,
    mode,
    condition: normalizedFrom === "ri" && normalizedTo === "MAR" && mode === "mem<-imd",
  });
  if (normalizedFrom === "ri" && normalizedTo === "MAR" && mode === "mem<-imd") {
    // Ruta directa desde ri hasta MAR para instrucciones con modo directo e inmediato
    console.log("🎯 Usando ruta especial ri → MAR:", "M 455 388 H 550 V 348 H 580");
    return "M 455 388 H 550 V 348 H 580";
  }

  // Path especial: MBR -> RI para instrucciones con direccionamiento directo + inmediato (ruta que pasa por IP join)
  if (
    normalizedFrom === "MBR" &&
    normalizedTo === "ri" &&
    (instruction?.startsWith("MOV") ||
      instruction?.startsWith("ADD") ||
      instruction?.startsWith("SUB") ||
      instruction?.startsWith("CMP") ||
      instruction?.startsWith("AND") ||
      instruction?.startsWith("OR") ||
      instruction?.startsWith("XOR")) &&
    mode === "mem<-imd"
  ) {
    console.log(
      "🎯 Usando ruta especial MBR → ri (direccionamiento directo + inmediato pasando por IP join)",
    );
    // Ruta: MBR → mbr reg join → IP join → ri join → ri
    // Posiciones: [620,250] → [390,250] → [390,349] → [390,388] → [455,388]
    return "M 620 250 H 390 V 349 V 388 H 455";
  }

  // Path especial: ri -> left end para animaciones simultáneas
  if (normalizedFrom === "ri" && normalizedTo === "left end") {
    console.log("🎯 Usando ruta especial ri → left end");
    // Ruta: ri → ri out → ri out join → NodoRegOut → bleft1 → bleft2 → bleft3 → left → left end
    return "M 455 388 H 480 H 550 H 590 V 250 H 30 V 85 H 125 H 220";
  }

  // Path especial: ri -> right end para animaciones simultáneas
  if (normalizedFrom === "ri" && normalizedTo === "right end") {
    console.log("🎯 Usando ruta especial ri → right end");
    // Ruta: ri → ri out → ri out join → outr mbr join → mbr reg join → IR mbr join → operands mbr join → right join → right → right end
    return "M 455 388 H 480 H 550 V 250 H 390 H 250 H 90 V 145 H 125 H 220";
  }

  // Verificar que los nodos existen en el grafo antes de calcular la ruta
  if (!dataBus.hasNode(normalizedFrom)) {
    console.warn(`Nodo origen '${normalizedFrom}' no existe en el grafo`);
    return "";
  }

  if (!dataBus.hasNode(normalizedTo)) {
    console.warn(`Nodo destino '${normalizedTo}' no existe en el grafo`);
    return "";
  }
  // Si el origen o destino es MAR, no se debe mostrar animación del DataBus
  if (normalizedFrom === "MAR" || normalizedTo === "MAR") {
    return "";
  }

  // CASO ESPECIAL PRIORITARIO: MBR → IR (debe ejecutarse ANTES que cualquier otra lógica)
  if (normalizedFrom === "MBR" && normalizedTo === "IR") {
    // Usar la nueva ruta que sigue exactamente el camino del bus gris pasando por el centro de la CPU:
    // MBR bottom → mbr bottom exit → mbr to bus horizontal → mbr to bus join → mbr to cpu center → mbr to ir horizontal → mbr to ir vertical end → mbr to ir approach → IR
    const path = [
      "MBR bottom",
      "mbr bottom exit",
      "mbr to bus horizontal",
      "mbr to bus join",
      "mbr to cpu center",
      "mbr to ir horizontal",
      "mbr to ir vertical end",
      "mbr to ir approach",
      "IR",
    ];
    // Generar el path SVG
    const start = dataBus.getNodeAttribute(path[0], "position");
    let d = `M ${start[0]} ${start[1]}`;
    for (let i = 1; i < path.length; i++) {
      const [x, y] = dataBus.getNodeAttribute(path[i], "position");
      d += ` L ${x} ${y}`;
    }
    return d;
  }

  // Lógica de rutas
  // Detectar caso especial: ambos operandos desde MBR a left y right
  // Si options.separateMBRPaths está activo y from === "MBR" y (to === "left" o to === "right")
  if (options?.separateMBRPaths && from === "MBR" && (to === "left" || to === "right")) {
    if (to === "left") {
      path = [
        normalizedFrom,
        `${normalizedFrom} out`,
        `${normalizedFrom} out join`,
        "outr mbr join left",
        "NodoRegOutToLeft",
        "NodoRegOut",
        "bleft1",
        "bleft2",
        "bleft3",
        "left",
        "left end",
      ];
    } else if (to === "right") {
      // Path especial para right desde MBR: evitar NodoRegOut y NodoRegOutToRight
      path = [
        normalizedFrom,
        `${normalizedFrom} out`,
        `${normalizedFrom} out join`,
        "outr mbr join",
        "mbr reg join",
        "IR mbr join",
        "operands mbr join",
        "right join",
        "right",
        "right end",
      ];
    }
  } else if (normalizedTo === "left") {
    path = [
      normalizedFrom,
      `${normalizedFrom} out`,
      `${normalizedFrom} out join`,
      "NodoRegOut",
      "bleft1",
      "bleft2",
      "bleft3",
      "left",
      "left end", // Terminar en la entrada izquierda de la ALU
    ];
  } else if (normalizedTo === "right") {
    // Si es MBR → right, bajar primero y luego ir a la derecha, evitando la altura de salidas de registros
    if (normalizedFrom === "MBR") {
      // Añadimos un nodo virtual para el desvío hacia abajo (por ejemplo, x=620, y=300)
      const downNode = "MBR_down300";
      if (!dataBus.hasNode(downNode)) {
        dataBus.addNode(downNode, { position: [620, 300] });
        dataBus.addUndirectedEdge("MBR", downNode);
      }
      // Ahora ir a la derecha (x=125, y=300), luego subir a right
      const rightNode = "MBR_right125_300";
      if (!dataBus.hasNode(rightNode)) {
        dataBus.addNode(rightNode, { position: [125, 300] });
        dataBus.addUndirectedEdge(downNode, rightNode);
      }
      // Finalmente subir a right (iniciando desde MBR bottom)
      path = ["MBR bottom", "MBR", downNode, rightNode, "right", "right end"];
    } else {
      path = [
        normalizedFrom,
        `${normalizedFrom} out`,
        `${normalizedFrom} out join`,
        "NodoRegOut",
        "outr mbr join",
        "mbr reg join",
        "IR mbr join",
        "operands mbr join",
        "right join",
        "right",
        "right end",
      ];
    }
  } else if (normalizedFrom === "BL" && normalizedTo === "ri") {
    // Caso específico: BL → ri (pero la animación va a MAR)
    // Ruta especial: BL → BL out → BL out join → NodoRegOut → outr mbr join → MAR join2 → MAR
    path = ["BL", "BL out", "BL out join", "NodoRegOut", "outr mbr join", "MAR join2", "MAR"];
  } else if (normalizedFrom === "MBR" && normalizedTo === "id" && mode === "mem<-imd") {
    // Caso específico: MBR → id (ruta completa con id join alineado)
    // Ruta: MBR bottom → MBR → mbr reg join → NodoRegIn → id join → id (salida desde parte inferior)
    console.log("🎯 Caso específico MBR → id detectado");
    const pathNodes = ["MBR bottom", "MBR", "mbr reg join", "NodoRegIn", "id join", "id"];
    const start = dataBus.getNodeAttribute(pathNodes[0], "position");
    let d = `M ${start[0]} ${start[1]}`;
    for (let i = 1; i < pathNodes.length; i++) {
      const [x, y] = dataBus.getNodeAttribute(pathNodes[i], "position");
      d += ` L ${x} ${y}`;
    }
    console.log("🎯 Path definido para MBR → id:", d);
    return d;
  } else if (normalizedFrom === "MBR" && normalizedTo === "BL") {
    // Caso especial: MBR → BL, animación parte desde MBR bottom y sigue el bus gris horizontal y vertical hasta BL
    // Ruta: MBR bottom → mbr bottom exit → mbr to bus horizontal → mbr to bus join → outr mbr join → NodoRegOut → BL out join → BL out → BL
    path = [
      "MBR bottom",
      "mbr bottom exit",
      "mbr to bus horizontal",
      "mbr to bus join",
      "outr mbr join",
      "mbr reg join",
      "NodoRegIn",
      "BL join",
      "BL",
    ];
    console.log(
      "🎯 Path definido para MBR → BL (animación desde MBR bottom, ingresando por mbr reg join, NodoRegIn, BL join):",
      path,
    );
  } else if (normalizedFrom === "MBR" && ["AL", "BL", "CL", "DL", "id"].includes(normalizedTo)) {
    // Caso unificado: MBR → AL, BL, CL, DL, id. Para animación, comienza desde MBR bottom, pasa por mbr bottom exit, mbr to bus horizontal, mbr to bus join, outr mbr join, mbr reg join, NodoRegIn, registro join, registro
    path = [
      "MBR bottom",
      "mbr bottom exit",
      "mbr to bus horizontal",
      "mbr to bus join",
      "outr mbr join",
      "mbr reg join",
      "NodoRegIn",
      `${normalizedTo} join`,
      normalizedTo,
    ];
    console.log(
      `🎯 Path definido para MBR → ${normalizedTo} (animación desde MBR bottom, pasando por bus gris y nodos de entrada):`,
      path,
    );
  } else if (normalizedFrom === "BL" && normalizedTo === "MBR") {
    // Caso específico: BL → MBR (evitar NodoRegIn y mbr reg join)
    // Ruta directa: BL → BL out → mbr approach horizontal → mbr approach vertical → mbr top approach → mbr top entry → MBR top → MBR
    console.log("🎯 Caso específico BL → MBR detectado - evitando NodoRegIn y mbr reg join");
    path = [
      "BL",
      "BL out",
      "mbr approach horizontal",
      "mbr approach vertical",
      "mbr top approach",
      "mbr top entry",
      "MBR top",
      "MBR",
    ];
    console.log("🎯 Path definido para BL → MBR:", path);
  } else if (
    registers.includes(normalizedFrom) &&
    normalizedTo === "MBR" &&
    instruction?.toUpperCase() === "MOV"
  ) {
    // Prioridad: MOV registro→MBR debe usar la ruta corta por la parte superior
    console.log(
      "🎯 Usando ruta prioritaria para MOV registro→MBR (evitando NodoRegOut y NodoRegIn)",
    );
    path = [
      normalizedFrom,
      `${normalizedFrom} out`,
      `${normalizedFrom} out join`,
      "NodoRegOut",
      "outr mbr join",
      "mbr approach horizontal",
      "mbr approach vertical",
      "mbr top approach",
      "mbr top entry",
      "MBR top",
      "MBR",
    ];
  } else if (registers.includes(normalizedFrom) && registers.includes(normalizedTo)) {
    // Si el destino es SP, IP o ri, pasar por NodoRegIn
    if (["SP", "IP", "ri"].includes(normalizedTo)) {
      path = [
        normalizedFrom,
        `${normalizedFrom} out`,
        `${normalizedFrom} out join`,
        "NodoRegOut",
        "outr mbr join",
        "mbr reg join",
        "NodoRegIn",
        `${normalizedTo} join`,
        normalizedTo,
      ];
    } else {
      // Recorrido explícito: X, X out, X out join, NodoRegOut, outr mbr join, mbr reg join, NodoRegIn, Y join, Y
      path = [
        normalizedFrom,
        `${normalizedFrom} out`,
        `${normalizedFrom} out join`,
        "NodoRegOut",
        "outr mbr join",
        "mbr reg join",
        "NodoRegIn",
        `${normalizedTo} join`,
        normalizedTo,
      ];
    }
  } else if (registers.includes(normalizedFrom) && normalizedTo === "MBR") {
    // Caso genérico: registro → MBR por la parte superior
    path = [
      normalizedFrom,
      `${normalizedFrom} out`,
      `${normalizedFrom} out join`,
      "NodoRegOut",
      "outr mbr join",
      "mbr approach horizontal",
      "mbr approach vertical",
      "mbr top approach",
      "mbr top entry",
      "MBR top",
      "MBR",
    ];
  } else if (normalizedFrom === "MBR" && normalizedTo === "ri") {
    // Casos específicos para MBR -> ri según instrucción y modo
    if (["JMP", "JC", "JZ"].includes(instruction ?? "")) {
      // Para saltos, animar MBR bottom -> salida inferior -> centro CPU -> IP (usando misma ruta inicial que MBR→IR)
      path = [
        "MBR bottom",
        "mbr bottom exit",
        "mbr to bus horizontal",
        "mbr to bus join",
        "mbr to cpu center",
        "IP join",
        "IP",
      ];
    } else if ((instruction === "MOV" || instruction === "INT") && mode === "mem<-imd") {
      // Para instrucciones MOV/INT con modo mem<-imd, usar ruta desde borde inferior -> centro CPU -> ri
      path = [
        "MBR bottom",
        "mbr bottom exit",
        "mbr to bus horizontal",
        "mbr to bus join",
        "mbr to cpu center",
        "mbr to ri vertical",
        "ri",
      ];
    } else if (mode === "mem<-imd" && (instruction === "ADD" || instruction === "SUB")) {
      // Para instrucciones ADD/SUB con modo mem<-imd, usar ruta desde borde inferior -> centro CPU -> ri
      path = [
        "MBR bottom",
        "mbr bottom exit",
        "mbr to bus horizontal",
        "mbr to bus join",
        "mbr to cpu center",
        "mbr to ri vertical",
        "ri",
      ];
    } else {
      // Para otros casos, usar la ruta del AddressBus (showpath2): MBR -> MAR
      return "M 594 249 H 550 V 348 H 580";
    }
    // Generar el path SVG
    const start = dataBus.getNodeAttribute(path[0], "position");
    let d = `M ${start[0]} ${start[1]}`;
    for (let i = 1; i < path.length; i++) {
      const [x, y] = dataBus.getNodeAttribute(path[i], "position");
      d += ` L ${x} ${y}`;
    }
    return d;
  } else {
    try {
      path = bidirectional(dataBus, normalizedFrom, normalizedTo) || [];
    } catch (error) {
      console.warn(`Error calculando ruta de ${normalizedFrom} a ${normalizedTo}:`, error);
      return "";
    }
  }

  // Path especial: MBR -> IP (siempre evitar NodoRegIn y NodoRegOut)
  if (normalizedFrom === "MBR" && normalizedTo === "IP") {
    const start = dataBus.getNodeAttribute("MBR bottom", "position");
    const exit = dataBus.getNodeAttribute("mbr bottom exit", "position");
    const horizontal = dataBus.getNodeAttribute("mbr to bus horizontal", "position");
    const busJoin = dataBus.getNodeAttribute("mbr to bus join", "position");
    const center = dataBus.getNodeAttribute("mbr to cpu center", "position");
    const end = dataBus.getNodeAttribute("IP", "position");
    // Línea desde MBR bottom → mbr bottom exit → mbr to bus horizontal → mbr to bus join → mbr to cpu center → IP
    console.log("🎯 Usando ruta especial MBR → IP desde MBR bottom (similar a MBR → IR)");
    return `M ${start[0]} ${start[1]} L ${exit[0]} ${exit[1]} L ${horizontal[0]} ${horizontal[1]} L ${busJoin[0]} ${busJoin[1]} L ${center[0]} ${center[1]} L ${center[0]} ${end[1]} L ${end[0]} ${end[1]}`;
  }

  // (Deshabilitado) Path especial: ri -> IP (no mostrar animación por ahora)
  // if (normalizedFrom === "ri" && normalizedTo === "IP" && ["JMP", "JC", "JZ"].includes(instruction ?? "")) {
  //   path = ["ri", ...]; // No habilitar animación por ahora
  //   // return ...
  // }

  // Path especial: ri -> IP (siempre)
  if (normalizedFrom === "ri" && normalizedTo === "IP") {
    // Ruta: ri → ri out → ri out join → outr mbr join (bus central a altura MBR) → mbr reg join → NodoRegIn → IP join → IP
    console.log("🎯 Usando ruta especial ri → IP pasando por bus central a altura MBR");
    return "M 455 388 H 480 H 525 H 550 V 250 H 390 H 390 V 349 H 455";
  }

  // Resto de la lógica específica de instrucciones usando nombres normalizados
  // (Las rutas ri → IP se manejan arriba con la ruta especial que pasa por el bus central)

  if (
    normalizedFrom === "MBR" &&
    normalizedTo === "ri" &&
    ["JMP", "JZ", "JC"].includes(instruction ?? "")
  ) {
    return "";
  }

  if (normalizedFrom === "MBR" && normalizedTo === "ri" && instruction === "CALL") {
    path = [
      "MBR bottom",
      "mbr bottom exit",
      "mbr to bus horizontal",
      "mbr to bus join",
      "mbr to cpu center",
      "mbr to ri vertical",
      "ri",
    ];
  }

  if (
    normalizedFrom === "IP" &&
    normalizedTo === "MBR" &&
    (instruction === "INT" || instruction === "CALL")
  ) {
    // Ruta IP → MBR entrando por la parte superior (como memoria → MBR)
    return "M 510 349 H 550 V 233 H 615 V 249";
  }

  if (path.length === 0) {
    console.warn(`No se encontró ruta de ${normalizedFrom} a ${normalizedTo}`);
    return "";
  }

  // Verificar que todos los nodos en el path existan
  for (const node of path) {
    if (!dataBus.hasNode(node)) {
      console.error(`❌ Nodo "${node}" no existe en el grafo. Path completo:`, path);
      return "";
    }
  }

  // Generar el path SVG
  const start = dataBus.getNodeAttribute(path[0], "position");
  let d = `M ${start[0]} ${start[1]}`;

  for (let i = 1; i < path.length; i++) {
    const [x, y] = dataBus.getNodeAttribute(path[i], "position");
    d += ` L ${x} ${y}`;
  }

  console.log("🎯 generateDataPath retornando:", d);
  console.log("🎯 Path completo:", path);
  // Log específico para MBR → id
  if (normalizedFrom === "MBR" && normalizedTo === "id") {
    console.log("🎯 Path SVG generado para MBR → id:", d);
  }
  return d;
}

/**
 * Genera la ruta MBR→MAR desde el punto de salida inferior del MBR
 * Para mantener consistencia con otras animaciones que salen del MBR
 * Sigue exactamente el bus gris de la CPU sin salirse de él
 */
export function generateMBRtoMARPath(): string {
  // Ruta: MBR bottom → mbr bottom exit → mbr to bus horizontal → mbr to bus join → outr mbr join → MAR join2 → MAR
  // Esta ruta sigue exactamente el camino del bus gris interno de la CPU
  const mbrBottom = [615, 274]; // MBR bottom
  const mbrBottomExit = [615, 285]; // mbr bottom exit
  const mbrToBusHorizontal = [580, 285]; // mbr to bus horizontal
  const mbrToBusJoin = [580, 250]; // mbr to bus join (punto donde sube al bus principal)
  const outrMbrJoin = [550, 250]; // outr mbr join (nodo central del bus)
  const marJoin2 = [550, 349]; // MAR join2
  const mar = [630, 349]; // MAR (centrado en el registro MAR)

  return `M ${mbrBottom[0]} ${mbrBottom[1]} L ${mbrBottomExit[0]} ${mbrBottomExit[1]} L ${mbrToBusHorizontal[0]} ${mbrToBusHorizontal[1]} L ${mbrToBusJoin[0]} ${mbrToBusJoin[1]} L ${outrMbrJoin[0]} ${outrMbrJoin[1]} L ${marJoin2[0]} ${marJoin2[1]} L ${mar[0]} ${mar[1]}`;
}

type DataBusProps = {
  showSP: boolean;
  showid: boolean;
  showri: boolean;
};

/**
 * DataBus component, to be used inside <CPU />
 */
export function DataBus({ showSP, showid, showri }: DataBusProps) {
  const { path, ...style } = getSpring("cpu.internalBus.data");
  // Agrego el spring del bus de dirección (MBR→MAR)
  const { path: addressPath, ...addressStyle } = getSpring("cpu.internalBus.address");

  // Obtener el estado del ciclo para determinar la fase actual
  const cycle = useAtomValue(cycleAtom);

  // Determinar si estamos en la fase de escritura
  const isWritebackPhase = cycle?.phase === "writeback";

  // Determinar el color del bus de datos según la fase
  const getDataBusColor = () => {
    if (isWritebackPhase) {
      return "stroke-purple-400 drop-shadow-[0_0_8px_rgba(168,85,247,0.6)]";
    }
    return "stroke-mantis-400 drop-shadow-[0_0_8px_rgba(34,197,94,0.6)]";
  };

  const getDataBusGlowColor = () => {
    if (isWritebackPhase) {
      return "stroke-purple-300";
    }
    return "stroke-mantis-300";
  };

  return (
    <svg viewBox="0 0 650 500" className="pointer-events-none absolute inset-0 z-30">
      <path
        className="fill-none stroke-stone-700 stroke-bus"
        strokeLinejoin="round"
        d={[
          // ALU registers
          "M 220 145 H 90", // left
          "V 250 H 580", // Long path hacia MBR, termina mucho antes del registro para evitar superposición (movido de 600 a 580)
          "M 90 145 H 90", // right
          "M 272 115 H 390", // result (más a la derecha, sin bajar)
          "M 250 225 V 250", // flags
          "M 580 250 H 390", // Línea horizontal desde el final del bus principal hasta el centro de la CPU
          "M 390 250 H 250", // Línea horizontal desde el centro de la CPU hasta el área de IR
          // Internal ALU
          //"M 85 85 H 220", // left
          //"M 85 145 H 220", // right
          //"M 272 115 h 100", // result
          "M 250 145 v 46", // flags
          // Decoder
          "M 250 250 V 272", // IR (vertical junto a IR)
          "M 250 300 V 320", // vertical bajo IR, alineado con IR
          // Address registers
          // "M 430 349 H 421", // ri (eliminado)
          // "V 250", // Long path to MBR, eliminado
          "M 451 349 H 390 V 250", // IP alineado y vertical hasta data mbr join/NodoRegIn
          showSP ? "M 390 349 L 425 309 L 455 309" : "", // SP alineado, // línea recta de IP join a SP join y luego a SP
          showri ? "M 390 349 L 425 388 L 455 388" : "", // ri alineado, igual que SP
          // Data registers - ajustados para conectar con registros más pequeños
          "M 455 45 H 425", // AL - ajustado
          //"V 170", // Long path to MBR, here to get nice joins
          "M 455 85 H 425", // BL - ajustado
          "M 455 125 H 425", // CL - ajustado
          "M 455 165 H 425", // DL - ajustado
          showid ? "M 455 205 H 425" : "", // id - ajustado para conectar con registro redimensionado
          // Output buses - eliminados para evitar redundancia visual
          // Las conexiones ahora se manejan desde NodoRegOut directamente
          //showri ? "M 550 388 H 480" : "", // ri out - ajustado para conectar con registro redimensionado
          //"M 550 10 V 250", // Vertical join for output buses
          "M 550 40 V 250", // Vertical join for output buses
          // "M 550 45 H 492", // Connect to data mbr join
          // Connect output buses to left of ALU
          "M 550 45 V 16 H 90 V 84 H 220", // out to left
          /*"M 550 12 V 60", // BX out to left
          "M 555 10 H 100 V 84", // CX out to left
          "M 555 10 H 100 V 84", // DX out to left*/
          //"M 510 205 H 60", // id out to left
          "M 390 250 V 115", // línea vertical que conecta el bus central con NodoRegIn
          "M 390 115 L 425 45 L 455 45", // línea recta de NodoRegIn a AL join y luego a AL
          "M 390 115 L 425 85 L 455 85", // línea recta de NodoRegIn a BL join y luego a BL
          "M 390 115 L 425 125 L 455 125", // línea recta de NodoRegIn a CL join y luego a CL
          "M 390 115 L 425 165 L 455 165", // línea recta de NodoRegIn a DL join y luego a DL
          showid ? "M 390 115 L 425 205 L 451 205" : "", // línea recta de NodoRegIn a id join y luego a id
          // Líneas para NodoRegOut - estética profesional similar al bus de entrada
          "M 550 115 L 525 45 L 445 45", // línea recta de NodoRegOut a AL out join y luego a AL out
          "M 550 115 L 525 85 L 445 85", // línea recta de NodoRegOut a BL out join y luego a BL out
          "M 550 115 L 525 125 L 445 125", // línea recta de NodoRegOut a CL out join y luego a CL out
          "M 550 115 L 525 165 L 445 165", // línea recta de NodoRegOut a DL out join y luego a DL out
          showid ? "M 550 115 L 521 205 L 441 205" : "", // línea recta de NodoRegOut a id out join y luego a id out
          // Nueva ruta con ángulos de 90 grados hacia el MBR (entrada superior)
          "M 550 250 H 585 V 222 H 615", // Línea desde outr mbr join hacia MBR top con ángulos de 90 grados
          // Nueva ruta con ángulos de 90 grados desde el MBR (salida inferior)
          "M 550 250 H 585 V 285 H 700", // Línea desde MBR bottom hacia MBR out join con ángulos de 90 grados
          "M 645 249 V 222 H 615 V 233", // Path para lectura: CPU boundary -> sube más arriba -> centro MBR -> baja hasta entrada superior
          "M 615 274 V 285 H 645 V 249", // Path para escritura: desde parte inferior MBR -> baja más -> sale horizontalmente -> memoria
          // Elimino cualquier línea que conecte outr mbr join (x=540,250) y outr mbr join left (x=560,250)
        ].join(" ")}
      />
      {/* Círculos de los nodos (ANTES de las animaciones para que queden DEBAJO) */}
      {/* Círculos de los nodos principales, siempre detrás de las animaciones */}
      <circle cx={390} cy={115} r={8} fill="#292524" stroke="#44403c" strokeWidth={2} />
      <circle cx={550} cy={115} r={8} fill="#292524" stroke="#44403c" strokeWidth={2} />
      <circle cx={250} cy={250} r={8} fill="#292524" stroke="#44403c" strokeWidth={2} />
      <circle cx={390} cy={250} r={8} fill="#292524" stroke="#44403c" strokeWidth={2} />
      <circle cx={550} cy={250} r={8} fill="#292524" stroke="#44403c" strokeWidth={2} />
      <circle cx={550} cy={348} r={8} fill="#292524" stroke="#44403c" strokeWidth={2} />
      {/* Círculos de MBR top y MBR bottom, siempre detrás de las animaciones */}
      <circle cx={615} cy={222} r={8} fill="#292524" stroke="#44403c" strokeWidth={2} />{" "}
      {/* MBR top */}
      <circle cx={615} cy={287} r={8} fill="#292524" stroke="#44403c" strokeWidth={2} />{" "}
      {/* MBR bottom */}
      {/* Círculo del nodo IP join - solo visible cuando showri es true */}
      {(showri || showSP) && (
        <circle cx={390} cy={349} r={8} fill="#292524" stroke="#44403c" strokeWidth={2} />
      )}
      {/* Path animado del bus de datos (verde/violeta según fase) - DESPUÉS para estar ENCIMA */}
      <animated.path
        d={path}
        className={`fill-none stroke-[3px] ${getDataBusColor()}`}
        strokeLinejoin="round"
        pathLength={1}
        strokeDasharray={1}
        style={style}
      />
      {/* Efecto de brillo adicional para el bus de datos interno */}
      <animated.path
        d={path}
        className={`fill-none stroke-1 opacity-50 ${getDataBusGlowColor()}`}
        strokeLinejoin="round"
        pathLength={1}
        strokeDasharray={1}
        style={style}
      />
      {/* Path animado del bus de dirección (MBR→MAR) SIEMPRE visible y encima del gris */}
      <animated.path
        d={addressPath}
        className="fill-none stroke-[#3B82F6] stroke-[3px] drop-shadow-[0_0_8px_rgba(59,130,246,0.6)]"
        strokeLinejoin="round"
        pathLength={1}
        strokeDasharray={1}
        style={addressStyle}
      />
      {/* Efecto de brillo adicional para el bus de dirección */}
      <animated.path
        d={addressPath}
        className="fill-none stroke-[#60A5FA] stroke-1 opacity-50"
        strokeLinejoin="round"
        pathLength={1}
        strokeDasharray={1}
        style={addressStyle}
      />
    </svg>
  );
}
