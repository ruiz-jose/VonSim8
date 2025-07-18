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

import { animated, getSpring } from "@/computer/shared/springs";

import type { PhysicalRegister } from "./state";

type Node = { position: [x: number, y: number] };

const dataBus = new UndirectedGraph<Node>({ allowSelfLoops: false });

// These are the endpoints of the bus
dataBus.addNode("MBR", { position: [620, 250] });
dataBus.addNode("AL", { position: [455, 45] }); // Ajustado para el centro del registro de 8 bits
dataBus.addNode("BL", { position: [455, 85] }); // Ajustado para el centro del registro de 8 bits
dataBus.addNode("CL", { position: [455, 125] }); // Ajustado para el centro del registro de 8 bits
dataBus.addNode("DL", { position: [455, 165] }); // Ajustado para el centro del registro de 8 bits
dataBus.addNode("id", { position: [451, 205] });
dataBus.addNode("SP", { position: [451, 309] });
dataBus.addNode("IP", { position: [451, 349] });
dataBus.addNode("ri", { position: [451, 388] });
dataBus.addNode("MAR", { position: [698, 349] });
dataBus.addNode("result", { position: [272, 115] });
dataBus.addNode("ALUresult", { position: [390, 115] }); // Antes: [370, 115]
dataBus.addNode("FLAGS", { position: [250, 225] });
dataBus.addNode("IR", { position: [205, 272] });
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
dataBus.addNode("AL join", { position: [425, 45] }); // Ajustado para conectar con el registro de 8 bits
dataBus.addNode("BL join", { position: [425, 85] }); // Ajustado para conectar con el registro de 8 bits
dataBus.addNode("CL join", { position: [425, 125] }); // Ajustado para conectar con el registro de 8 bits
dataBus.addNode("DL join", { position: [425, 165] }); // Ajustado para conectar con el registro de 8 bits
dataBus.addNode("id join", { position: [421, 205] });
dataBus.addNode("data mbr join", { position: [421, 250] });
dataBus.addNode("SP join", { position: [421, 309] });
dataBus.addNode("IP join", { position: [421, 349] });
dataBus.addNode("ri join", { position: [421, 388] });
dataBus.addNode("MAR join1", { position: [550, 388] });
dataBus.addNode("MAR join2", { position: [550, 349] });
dataBus.addNode("result mbr join", { position: [370, 250] });
dataBus.addNode("FLAGS mbr join", { position: [250, 250] });
dataBus.addNode("IR mbr join", { position: [205, 250] });
dataBus.addNode("left join", { position: [30, 85] });
dataBus.addNode("right join", { position: [90, 145] });
dataBus.addNode("operands mbr join", { position: [90, 250] });
dataBus.addNode("outr mbr join", { position: [550, 250] });
dataBus.addNode("mbr reg join", { position: [390, 250] });

// Añadir nodos de unión para los registros AL, BL, CL, DL e id
dataBus.addNode("AL out", { position: [465, 45] }); // Ajustado para la salida del registro de 8 bits
dataBus.addNode("BL out", { position: [465, 85] }); // Ajustado para la salida del registro de 8 bits
dataBus.addNode("CL out", { position: [465, 125] }); // Ajustado para la salida del registro de 8 bits
dataBus.addNode("DL out", { position: [465, 165] }); // Ajustado para la salida del registro de 8 bits
dataBus.addNode("id out", { position: [460, 205] }); // Ajustado para conectar con el registro id redimensionado
dataBus.addNode("MBR out", { position: [630, 250] }); // Nodo de salida de MBR
dataBus.addNode("MBR out join", { position: [550, 250] }); // Nodo de unión de salida de MBR
dataBus.addNode("SP out", { position: [510, 309] });
dataBus.addNode("IP out", { position: [510, 349] });
dataBus.addNode("IP out join", { position: [550, 349] });
dataBus.addNode("ri out join", { position: [550, 388] });
dataBus.addNode("SP out join", { position: [550, 309] });

// Añadir nodos de unión para los buses de salida en la parte posterior de los registros
dataBus.addNode("AL out join", { position: [550, 45] });
dataBus.addNode("BL out join", { position: [550, 85] });
dataBus.addNode("CL out join", { position: [550, 125] });
dataBus.addNode("DL out join", { position: [550, 165] });
dataBus.addNode("id out join", { position: [550, 205] });

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
dataBus.addUndirectedEdge("CL out", "CL out join");
dataBus.addUndirectedEdge("DL out", "DL out join");
dataBus.addUndirectedEdge("id out", "id out join");

dataBus.addUndirectedEdge("AL out join", "outr mbr join");
dataBus.addUndirectedEdge("BL out join", "outr mbr join");
dataBus.addUndirectedEdge("CL out join", "outr mbr join");
dataBus.addUndirectedEdge("DL out join", "outr mbr join");
dataBus.addUndirectedEdge("id out join", "outr mbr join");

dataBus.addUndirectedEdge("AL out join", "bleft1");
dataBus.addUndirectedEdge("BL out join", "bleft1");
dataBus.addUndirectedEdge("CL out join", "bleft1");
dataBus.addUndirectedEdge("DL out join", "bleft1");
dataBus.addUndirectedEdge("id out join", "bleft1");
dataBus.addUndirectedEdge("bleft1", "bleft2");
dataBus.addUndirectedEdge("bleft2", "bleft3");
dataBus.addUndirectedEdge("bleft3", "left");
dataBus.addUndirectedEdge("left", "left end"); // Conectar left con left end

dataBus.addUndirectedEdge("IP out join", "outr mbr join");
dataBus.addUndirectedEdge("ri out join", "outr mbr join");
dataBus.addUndirectedEdge("SP out join", "outr mbr join");
dataBus.addUndirectedEdge("SP out join", "MAR join2");

/*
  dataBus.addUndirectedEdge("AL out join", "left");
  dataBus.addUndirectedEdge("BL out join", "left");
  dataBus.addUndirectedEdge("CL out join", "left");
  dataBus.addUndirectedEdge("DL out join", "left");
dataBus.addUndirectedEdge("id out join", "left");
*/
dataBus.addUndirectedEdge("outr mbr join", "mbr reg join");
dataBus.addUndirectedEdge("MBR", "outr mbr join");
dataBus.addUndirectedEdge("MBR", "MBR out");
dataBus.addUndirectedEdge("MBR out", "outr mbr join");

dataBus.addUndirectedEdge("mbr reg join", "ALUresult");
dataBus.addUndirectedEdge("ALUresult", "AL join");
dataBus.addUndirectedEdge("ALUresult", "BL join");
dataBus.addUndirectedEdge("ALUresult", "CL join");
dataBus.addUndirectedEdge("ALUresult", "DL join");
dataBus.addUndirectedEdge("ALUresult", "id join");
dataBus.addUndirectedEdge("outr mbr join", "operands mbr join");

// Conexión del bus de resultado desde data mbr join hasta el registro destino
// Nota: Estas conexiones ya existen más abajo, no las duplicamos



// These are the lines
dataBus.addUndirectedEdge("AL join", "AL");
dataBus.addUndirectedEdge("BL join", "BL");
dataBus.addUndirectedEdge("CL join", "CL");
dataBus.addUndirectedEdge("DL join", "DL");
//dataBus.addUndirectedEdge("id join", "data mbr join");
dataBus.addUndirectedEdge("MBR", "data mbr join");
dataBus.addUndirectedEdge("data mbr join", "ALUresult");


dataBus.addUndirectedEdge("IP", "IP join");
dataBus.addUndirectedEdge("SP", "SP join");
dataBus.addUndirectedEdge("ri", "ri join");
dataBus.addUndirectedEdge("MAR join1", "ri");
dataBus.addUndirectedEdge("MAR join2", "MAR join1");
dataBus.addUndirectedEdge("MAR", "MAR join2");
dataBus.addUndirectedEdge("IP join", "SP join");
dataBus.addUndirectedEdge("SP join", "ri join");

dataBus.addUndirectedEdge("result start", "result");
dataBus.addUndirectedEdge("result", "ALUresult");




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

export type DataRegister = PhysicalRegister | "MBR" | "result start";

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
): string {
  // Normalizar nombres de registros para evitar subniveles
  const normalizeRegister = (reg: string): string => {
    // Eliminar sufijos como .l, .h para usar el registro base
    return reg.replace(/\.(l|h)$/, "");
  };

  const normalizedFrom = normalizeRegister(from);
  const normalizedTo = normalizeRegister(to);

  // Lista de registros válidos
  const registers = [
    "AL", "BL", "CL", "DL", "id", "SP", "IP", "ri", "MAR"
  ];

  let path: string[] = [];

  // Verificar que los nodos existen en el grafo antes de calcular la ruta
  if (!dataBus.hasNode(normalizedFrom)) {
    console.warn(`Nodo origen '${normalizedFrom}' no existe en el grafo`);
    return "";
  }

  if (!dataBus.hasNode(normalizedTo)) {
    console.warn(`Nodo destino '${normalizedTo}' no existe en el grafo`);
    return "";
  }
    //
  // Lógica de rutas
  if (normalizedTo === "left") {
    path = [
      normalizedFrom,
      `${normalizedFrom} out`,
      `${normalizedFrom} out join`,
      "bleft1",
      "bleft2",
      "bleft3",
      "left",
      "left end", // Terminar en la entrada izquierda de la ALU
    ];
  } else if (normalizedTo === "right") {
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
      "right end", // Terminar en la entrada derecha de la ALU
    ];
  } else if (registers.includes(normalizedFrom) && registers.includes(normalizedTo)) {
    // Recorrido explícito: X, X out, X out join, outr mbr join, mbr reg join, ALUresult, Y join, Y
    path = [
      normalizedFrom,
      `${normalizedFrom} out`,
      `${normalizedFrom} out join`,
      "outr mbr join",
      "mbr reg join",
      "ALUresult",
      `${normalizedTo} join`,
      normalizedTo,
    ];
  } else if (normalizedFrom === "MBR" && normalizedTo === "left") {
    path = ["MBR", "outr mbr join", "bleft1", "bleft2", "bleft3", "left"];
  } else if (normalizedFrom === "MBR" && normalizedTo === "ri") {
    if (instruction === "CALL") {
      path = ["MBR", "mbr reg join", "ri join", "ri"];
    } else if (["JMP", "JZ", "JC"].includes(instruction ?? "")) {
      return "";
    } else if ((instruction === "MOV" || instruction === "INT") && mode === "mem<-imd") {
      path = ["MBR", "mbr reg join", "ri join", "ri"];
    } else if (mode === "mem<-imd" && (instruction === "ADD" || instruction === "SUB")) {
      path = ["MBR", "mbr reg join", "ri join", "ri"];
    } else {
      path = ["MBR","MBR out", "MBR out join", "outr mbr join", "SP out join", "MAR join2", "MAR"];
    }
  } else if (normalizedFrom === "MBR" && registers.includes(normalizedTo)) {
    path = ["MBR", "mbr reg join", "ALUresult", `${normalizedTo} join`, normalizedTo];
  } else if (normalizedFrom === "IP" && normalizedTo === "id") {
    path = ["IP out", "IP out join", "outr mbr join", "mbr reg join", "id join", "id"];
  } else if (normalizedFrom === "id" && normalizedTo === "ri") {
    path = ["id out", "id out join", "outr mbr join", "MAR join2", "MAR"];
  } else if (normalizedFrom === "BL" && normalizedTo === "ri") {
    path = ["BL out", "BL out join", "outr mbr join", "MAR join2", "MAR"];
  } else if (normalizedFrom === "id" && normalizedTo === "MBR") {
    path = ["id out", "id out join", "outr mbr join", "MBR"];
  } else if (normalizedFrom === "id" && normalizedTo === "IP" && instruction === "RET") {
    path = ["MBR", "mbr reg join", "IP join", "IP"];
  } else if (normalizedFrom === "result start" && normalizedTo === "CL") {
    path = [
      "result start",
      "result",
      "ALUresult",
      "CL join",
      "CL",
    ];
  } else if (normalizedFrom === "result start" && normalizedTo === "AL") {
    path = [
      "result start",
      "result",
      "ALUresult",
      "AL join",
      "AL",
    ];
  } else if (normalizedFrom === "result start" && normalizedTo === "BL") {
    path = [
      "result start",
      "result",
      "ALUresult",
      "BL join",
      "BL",
    ];
  } else if (normalizedFrom === "result start" && normalizedTo === "DL") {
    path = [
      "result start",
      "result",
      "ALUresult",  
      "DL join",
      "DL",
    ];
  } else if (normalizedFrom === "result start" && registers.includes(normalizedTo)) {
    // Path del bus de resultado: result start -> result -> ALUresult -> result mbr join -> registro destino
    path = [
      "result start",
      "result",
      "ALUresult",
      "result mbr join",
      `${normalizedTo} join`,
      normalizedTo,
    ];
  } else if (normalizedFrom === "MBR" && normalizedTo === "IR") {
    // Ruta explícita: MBR -> MBR out -> MBR out join -> outr mbr join -> mbr reg join -> IR mbr join -> IR
    path = [
      "MBR",
      "MBR out",
      "MBR out join",
      "outr mbr join",
      "mbr reg join",
      "IR mbr join",
      "IR"
    ];
  } else if (normalizedFrom === "MBR" && normalizedTo === "MAR") {
    // Ruta explícita: MBR -> MBR out -> MBR out join -> outr mbr join -> SP out join -> MAR join2 -> MAR
    path = [
      "MBR",
      "MBR out",
      "MBR out join",
      "outr mbr join",
      "SP out join",
      "MAR join2",
      "MAR"
    ];
    console.log("[generateDataPath] Path generado para MBR → MAR:", path);
  } else {
    try {
      path = bidirectional(dataBus, normalizedFrom, normalizedTo) || [];
    } catch (error) {
      console.warn(`Error calculando ruta de ${normalizedFrom} a ${normalizedTo}:`, error);
      return "";
    }
  }

  // Resto de la lógica específica de instrucciones usando nombres normalizados
  if (normalizedFrom === "ri" && normalizedTo === "IP") {
    path = ["MBR", "mbr reg join", "IP join", "IP"];
  }

  if (normalizedFrom === "ri" && normalizedTo === "IP" && instruction === "CALL") {
    path = ["ri", "ri out join", "outr mbr join", "mbr reg join", "IP join", "IP"];
  }

  if (
    normalizedFrom === "MBR" &&
    normalizedTo === "ri" &&
    ["JMP", "JZ", "JC"].includes(instruction ?? "")
  ) {
    return "";
  }

  if (normalizedFrom === "MBR" && normalizedTo === "ri" && instruction === "CALL") {
    path = ["MBR", "mbr reg join", "ri join", "ri"];
  }

  if (
    normalizedFrom === "MBR" &&
    normalizedTo === "ri" &&
    (instruction === "MOV" || instruction === "INT") &&
    mode === "mem<-imd"
  ) {
    path = ["MBR", "mbr reg join", "ri join", "ri"];
  }

  if (
    normalizedFrom === "IP" &&
    normalizedTo === "MBR" &&
    (instruction === "INT" || instruction === "CALL")
  ) {
    return "M 510 349 H 550 V 250 H 620";
  }

  if (
    normalizedFrom === "MBR" &&
    normalizedTo === "ri" &&
    mode === "mem<-imd" &&
    (instruction === "ADD" || instruction === "SUB")
  ) {
    path = ["MBR", "mbr reg join", "ri join", "ri"];
  }

  if (path.length === 0) {
    console.warn(`No se encontró ruta de ${normalizedFrom} a ${normalizedTo}`);
    return "";
  }

  // Generar el path SVG
  const start = dataBus.getNodeAttribute(path[0], "position");
  let d = `M ${start[0]} ${start[1]}`;

  for (let i = 1; i < path.length; i++) {
    const [x, y] = dataBus.getNodeAttribute(path[i], "position");
    d += ` L ${x} ${y}`;
  }

  return d;

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

  return (
    <svg viewBox="0 0 650 500" className="pointer-events-none absolute inset-0">
      <path
        className="fill-none stroke-stone-700 stroke-bus"
        strokeLinejoin="round"
        d={[
          // ALU registers
          "M 220 145 H 90", // left
          "V 250 H 630", // Long path to MBR, here to get nice joins
          "M 90 145 H 90", // right
          "M 272 115 H 390", // result (más a la derecha, sin bajar)
          "M 250 225 V 250", // flags
          // Internal ALU
          //"M 85 85 H 220", // left
          //"M 85 145 H 220", // right
          //"M 272 115 h 100", // result
          "M 250 145 v 46", // flags
          // Decoder
          "M 205 250 V 272", // IP
          "M 205 300 V 320", // IP->decoder
          // Address registers
          "M 430 349 H 421", // ri
          "V 250", // Long path to MBR, here to get nice joins
          "M 451 349 H 421", // IP
          showSP ? "M 451 309 H 421" : "M 451 309", // SP
          showri ? "M 470 388 H 421 V 300" : "", // ri - ajustado para conectar con registro redimensionado
          // Data registers - ajustados para conectar con registros más pequeños
          "M 455 45 H 425", // AL - ajustado
          //"V 170", // Long path to MBR, here to get nice joins
          "M 455 85 H 425", // BL - ajustado
          "M 455 125 H 425", // CL - ajustado
          "M 455 165 H 425", // DL - ajustado
          showid ? "M 455 205 H 425" : "", // id - ajustado para conectar con registro redimensionado
          // Output buses - ajustados para registros más pequeños
          "M 550 45 H 465", // AL out - ajustado
          "M 550 85 H 465", // BL out - ajustado
          "M 550 125 H 465", // CL out - ajustado
          "M 550 165 H 465", // DL out - ajustado
          showid ? "M 550 205 H 460" : "", // id out - ajustado
          showri ? "M 550 388 H 480" : "", // ri out - ajustado para conectar con registro redimensionado
          //"M 550 10 V 250", // Vertical join for output buses
          "M 550 40 V 250", // Vertical join for output buses
          // "M 550 45 H 492", // Connect to data mbr join
          // Connect output buses to left of ALU
          "M 550 45 V 16 H 90 V 84 H 220", // out to left
          /*"M 550 12 V 60", // BX out to left
          "M 555 10 H 100 V 84", // CX out to left
          "M 555 10 H 100 V 84", // DX out to left*/
          //"M 510 205 H 60", // id out to left
          "M 390 250 V 115", // línea vertical que conecta el bus central con ALUresult
          "M 390 115 L 425 45 L 455 45", // línea recta de ALUresult a AL join y luego a AL
          "M 390 115 L 425 85 L 455 85", // línea recta de ALUresult a BL join y luego a BL
          "M 390 115 L 425 125 L 455 125", // línea recta de ALUresult a CL join y luego a CL
          "M 390 115 L 425 165 L 455 165", // línea recta de ALUresult a DL join y luego a DL

        ].join(" ")}
      />

      <animated.path
        d={path}
        className="fill-none stroke-mantis-400 stroke-[3px] drop-shadow-[0_0_8px_rgba(34,197,94,0.6)]"
        strokeLinejoin="round"
        pathLength={1}
        strokeDasharray={1}
        style={style}
      />

      {/* Efecto de brillo adicional para el bus de datos interno */}
      <animated.path
        d={path}
        className="fill-none stroke-mantis-300 stroke-1 opacity-50"
        strokeLinejoin="round"
        pathLength={1}
        strokeDasharray={1}
        style={style}
      />
      <circle
        cx={390}
        cy={115}
        r={8}
        fill="#292524"
        stroke="#44403c"
        strokeWidth={2}
      />
    </svg>
  );
}
