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

import type { PhysicalRegister } from "@vonsim/simulator/cpu";
import { UndirectedGraph } from "graphology";
import { bidirectional } from "graphology-shortest-path/unweighted";

import { animated, getSpring } from "@/computer/shared/springs";

type Node = { position: [x: number, y: number] };

const dataBus = new UndirectedGraph<Node>({ allowSelfLoops: false });

// These are the endpoints of the bus
dataBus.addNode("MBR", { position: [620, 250] });
dataBus.addNode("AX", { position: [455, 45] }); // Ajustado para el centro del registro más pequeño
dataBus.addNode("BX", { position: [455, 85] }); // Ajustado para el centro del registro más pequeño
dataBus.addNode("CX", { position: [455, 125] }); // Ajustado para el centro del registro más pequeño
dataBus.addNode("DX", { position: [455, 165] }); // Ajustado para el centro del registro más pequeño
dataBus.addNode("id", { position: [451, 205] });
dataBus.addNode("SP", { position: [451, 309] });
dataBus.addNode("IP", { position: [451, 349] });
dataBus.addNode("ri", { position: [451, 388] });
dataBus.addNode("MAR", { position: [698, 349] });
dataBus.addNode("result", { position: [272, 115] });
dataBus.addNode("ALUresult", { position: [370, 115] });
dataBus.addNode("FLAGS", { position: [250, 225] });
dataBus.addNode("IR", { position: [205, 272] });
dataBus.addNode("left", { position: [130, 85] });
dataBus.addNode("right", { position: [125, 145] });
dataBus.addNode("rmbr", { position: [250, 390] });
dataBus.addNode("bleft1", { position: [550, 16] });
dataBus.addNode("bleft2", { position: [90, 16] });
dataBus.addNode("bleft3", { position: [90, 85] });

// These are the intermediate nodes
dataBus.addNode("AX join", { position: [425, 45] }); // Ajustado para conectar con el registro más pequeño
dataBus.addNode("BX join", { position: [425, 85] }); // Ajustado para conectar con el registro más pequeño
dataBus.addNode("CX join", { position: [425, 125] }); // Ajustado para conectar con el registro más pequeño
dataBus.addNode("DX join", { position: [425, 165] }); // Ajustado para conectar con el registro más pequeño
dataBus.addNode("id join", { position: [421, 205] });
dataBus.addNode("data mbr join", { position: [421, 250] });
dataBus.addNode("SP join", { position: [421, 309] });
dataBus.addNode("IP join", { position: [421, 349] });
dataBus.addNode("ri join", { position: [421, 388] });
dataBus.addNode("MAR join1", { position: [550, 388] });
dataBus.addNode("MAR join2", { position: [550, 349] });
dataBus.addNode("addresses mbr join", { position: [421, 250] });
dataBus.addNode("result mbr join", { position: [370, 250] });
dataBus.addNode("FLAGS mbr join", { position: [250, 250] });
dataBus.addNode("IR mbr join", { position: [205, 250] });
dataBus.addNode("left join", { position: [30, 85] });
dataBus.addNode("right join", { position: [90, 145] });
dataBus.addNode("operands mbr join", { position: [90, 250] });
dataBus.addNode("outr mbr join", { position: [550, 250] });
dataBus.addNode("mbr reg join", { position: [421, 250] });

// Añadir nodos de unión para los registros AX, BX, CX, DX e id
dataBus.addNode("AX out", { position: [465, 45] }); // Ajustado para la salida del registro más pequeño
dataBus.addNode("BX out", { position: [465, 85] }); // Ajustado para la salida del registro más pequeño
dataBus.addNode("CX out", { position: [465, 125] }); // Ajustado para la salida del registro más pequeño
dataBus.addNode("DX out", { position: [465, 165] }); // Ajustado para la salida del registro más pequeño
dataBus.addNode("id out", { position: [510, 205] });

dataBus.addNode("SP out", { position: [510, 309] });
dataBus.addNode("IP out", { position: [510, 349] });

// Añadir nodos de unión para los buses de salida en la parte posterior de los registros
dataBus.addNode("AX out join", { position: [550, 45] });
dataBus.addNode("BX out join", { position: [550, 85] });
dataBus.addNode("CX out join", { position: [550, 125] });
dataBus.addNode("DX out join", { position: [550, 165] });
dataBus.addNode("id out join", { position: [550, 205] });

dataBus.addNode("SP out join", { position: [550, 309] });
dataBus.addNode("IP out join", { position: [550, 349] });
dataBus.addNode("ri out join", { position: [550, 388] });

dataBus.addUndirectedEdge("AX", "AX out");
dataBus.addUndirectedEdge("BX", "BX out");
dataBus.addUndirectedEdge("CX", "CX out");
dataBus.addUndirectedEdge("DX", "DX out");
dataBus.addUndirectedEdge("id", "id out");

dataBus.addUndirectedEdge("IP", "IP out");
dataBus.addUndirectedEdge("SP", "SP out");

// Crear las aristas necesarias para conectar estos nodos de unión con los buses de salida
dataBus.addUndirectedEdge("AX out", "AX out join");
dataBus.addUndirectedEdge("BX out", "BX out join");
dataBus.addUndirectedEdge("CX out", "CX out join");
dataBus.addUndirectedEdge("DX out", "DX out join");
dataBus.addUndirectedEdge("id out", "id out join");

dataBus.addUndirectedEdge("AX out join", "outr mbr join");
dataBus.addUndirectedEdge("BX out join", "outr mbr join");
dataBus.addUndirectedEdge("CX out join", "outr mbr join");
dataBus.addUndirectedEdge("DX out join", "outr mbr join");
dataBus.addUndirectedEdge("id out join", "outr mbr join");

dataBus.addUndirectedEdge("AX out join", "bleft1");
dataBus.addUndirectedEdge("BX out join", "bleft1");
dataBus.addUndirectedEdge("CX out join", "bleft1");
dataBus.addUndirectedEdge("DX out join", "bleft1");
dataBus.addUndirectedEdge("id out join", "bleft1");
dataBus.addUndirectedEdge("bleft1", "bleft2");
dataBus.addUndirectedEdge("bleft2", "bleft3");
dataBus.addUndirectedEdge("bleft3", "left");

dataBus.addUndirectedEdge("IP out join", "outr mbr join");
dataBus.addUndirectedEdge("ri out join", "outr mbr join");
dataBus.addUndirectedEdge("SP out join", "outr mbr join");
dataBus.addUndirectedEdge("SP out join", "MAR join2");

/*
dataBus.addUndirectedEdge("AX out join", "left");
dataBus.addUndirectedEdge("BX out join", "left");
dataBus.addUndirectedEdge("CX out join", "left");
dataBus.addUndirectedEdge("DX out join", "left");
dataBus.addUndirectedEdge("id out join", "left");
*/
dataBus.addUndirectedEdge("outr mbr join", "mbr reg join");
dataBus.addUndirectedEdge("MBR", "outr mbr join");


dataBus.addUndirectedEdge("mbr reg join", "AX join");
dataBus.addUndirectedEdge("mbr reg join", "BX join");
dataBus.addUndirectedEdge("mbr reg join", "CX join");
dataBus.addUndirectedEdge("mbr reg join", "DX join");
dataBus.addUndirectedEdge("mbr reg join", "id join");
dataBus.addUndirectedEdge("outr mbr join", "operands mbr join");


// These are the lines
dataBus.addUndirectedEdge("AX join", "AX");
dataBus.addUndirectedEdge("BX join", "BX");
dataBus.addUndirectedEdge("CX join", "CX");
dataBus.addUndirectedEdge("DX join", "DX");
dataBus.addUndirectedEdge("id join", "data mbr join");
dataBus.addUndirectedEdge("MBR", "data mbr join");
//dataBus.addUndirectedEdge("data mbr join", "MBR");

dataBus.addUndirectedEdge("IP", "IP join");
dataBus.addUndirectedEdge("SP", "SP join");
dataBus.addUndirectedEdge("ri", "ri join");
dataBus.addUndirectedEdge("MAR join1", "ri");
dataBus.addUndirectedEdge("MAR join2", "MAR join1");
dataBus.addUndirectedEdge("MAR", "MAR join2");
dataBus.addUndirectedEdge("IP join", "SP join");
dataBus.addUndirectedEdge("SP join", "ri join");
dataBus.addUndirectedEdge("IP join", "addresses mbr join");
dataBus.addUndirectedEdge("addresses mbr join", "data mbr join");

dataBus.addUndirectedEdge("result", "ALUresult");
dataBus.addUndirectedEdge("ALUresult", "result mbr join");
dataBus.addUndirectedEdge("result mbr join", "addresses mbr join");

dataBus.addUndirectedEdge("FLAGS", "FLAGS mbr join");
dataBus.addUndirectedEdge("FLAGS mbr join", "result mbr join");

dataBus.addUndirectedEdge("IR", "IR mbr join");
dataBus.addUndirectedEdge("IR mbr join", "FLAGS mbr join");

dataBus.addUndirectedEdge("left", "left join");
dataBus.addUndirectedEdge("right", "right join");
dataBus.addUndirectedEdge("left join", "right join");
dataBus.addUndirectedEdge("right join", "operands mbr join");
//dataBus.addUndirectedEdge("operands mbr join", "IR mbr join");

export type DataRegister = PhysicalRegister | "MBR";

/**
 * Given two registers, returns the shortest path between them.
 * These registers must belong to {@link DataRegister}.
 * @returns The path as a SVG path.
 * @throws If there is no path between the two registers.
 */
export function generateDataPath(from: DataRegister, to: DataRegister, instruction?: string, mode?: string): string {
  console.log("from:", from);
  console.log("to:", to);

  const intermediatePath = (from: DataRegister, to: DataRegister): string[] => {
    if (to === "left") {
      return [
        from,
        "bleft1", // Añadir el nodo bleft1
        "bleft2", // Añadir el nodo bleft2
        "bleft3", // Añadir el nodo bleft3
        "left", // Añadir el nodo left join
        `${from} out`,
        `${from} out join`,
        "outr mbr join",
        "mbr reg join",
        `${to} join`,
        to,
      ];
    }
    return [
      from,
      `${from} out`,
      `${from} out join`,
      "outr mbr join",
      "mbr reg join",
      `${to} join`,
      to,
    ];
  };
  
  let path: string[] = [];
  
  const registers = ["AX", "BX", "CX", "DX", "id"];
  if (from === "MBR" && to === "left") {
    // Definir el camino desde MBR hasta left pasando por outr mbr join
    path = ["MBR", "outr mbr join", "bleft1", "bleft2", "bleft3", "left"];
  } else if (from === "MBR" && to === "ri") {
    path = ["MBR", "outr mbr join", "SP out join", "MAR join2", "MAR"];
  } else if (from === "MBR" && registers.includes(to)) {
      path = ["MBR", "mbr reg join", `${to} join`, to];
  } else if (registers.includes(from) && registers.includes(to)) {
    path = intermediatePath(from, to);
  } else if (from === "IP" && to === "id") {
    path = ["IP out", "IP out join", "outr mbr join", "mbr reg join", "id join", "id"];
  } else if (from === "id" && to === "ri") {
    path = ["id out", "id out join", "outr mbr join", "MAR join2", "MAR"];
  } else if (from === "BX" && to === "ri") {
    path = ["BX out", "BX out join", "outr mbr join", "MAR join2", "MAR"];
  } else if (from === "id" && to === "MBR") {
    path = ["id out", "id out join", "outr mbr join", "MBR"];
  } else if (from === "id" && to === "IP" && instruction === "RET") {
    path = ["MBR", "mbr reg join", "IP join", "IP"];
  } else {
    path = bidirectional(dataBus, from, to) || [];
  }


  /*if (from === "id" && to === "ri" && (instruction === "MOV" && mode === "mem<-imd")) {
    return "";
  }*/
  // Reemplazar 'ri' por 'MAR' si el destino es 'ri'
  /*if (to === "ri" && instruction === "MOV" && mode === "mem<-imd") {
      path = ["MBR", "mbr reg join", "ir join", "IP"];
  }*/

  // Cambiar la animación si from es "ri" y to es "IP"
  if (from === "ri" && to === "IP") {
    path = ["MBR", "mbr reg join", "IP join", "IP"];
  }

  if (from === "ri" && to === "IP" &&  instruction === "CALL") {
    path = ["ri","ri out join", "outr mbr join", "mbr reg join", "IP join", "IP"];
  }

  // No dibujar la animación si from es "MBR" y to es "ri" y la instrucción es JMP, JZ, JC o MOV con mode "mem<-imd"
  if (from === "MBR" && to === "ri" && ["JMP", "JZ", "JC"].includes(instruction ?? "")) {
    return "";
  }

  // No dibujar la animación si la instrucción es MOV con mode "mem<-imd"
  if (from === "MBR" && to === "ri" && instruction === "CALL") {
    path = ["MBR", "mbr reg join", "ri join", "ri"];
  }

  // No dibujar la animación si la instrucción es MOV con mode "mem<-imd"
  if (from === "MBR" && to === "ri" && (instruction === "MOV" || instruction === "INT") && mode === "mem<-imd") {
    path = ["MBR", "mbr reg join", "ri join", "ri"];
  }

    // No dibujar la animación si la instrucción es MOV con mode "mem<-imd"
  if (from === "IP" && to === "MBR" && (instruction === "INT" || instruction === "CALL")) {
    return "M 510 349 H 550 V 250 H 620";
  }

  // No dibujar la animación si la instrucción es MOV con mode "mem<-imd"
 if (from === "MBR" && to === "ri" && mode === "mem<-imd" &&
  (instruction === "ADD" || 
   instruction === "SUB")) {
    path = ["MBR", "mbr reg join", "ri join", "ri"];
 //  path = ["MBR", "outr mbr join", "SP out join", "MAR join2", "MAR"];
 }

  if (path.length === 0) throw new Error(`No path from ${from} to ${to}`);

  const start = dataBus.getNodeAttribute(path[0], "position");
  console.log("start:", start);
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
          "M 272 115 H 370 V 250", // result
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
          //"M 451 309 H 421", // SP          
          showSP ? "M 451 309 H 421" : "M 451 309", // SP
          showri ? "M 451 388 H 421 V 300" : "", // ri
          // Data registers - ajustados para conectar con registros más pequeños
          "M 455 45 H 425", // AX - ajustado
          "V 250", // Long path to MBR, here to get nice joins
          "M 455 85 H 425", // BX - ajustado
          "M 455 125 H 425", // CX - ajustado
          "M 455 165 H 425", // DX - ajustado
          showid ? "M 451 205 H 421" : "",// id
          // Output buses - ajustados para registros más pequeños
          "M 550 45 H 465", // AX out - ajustado
          "M 550 85 H 465", // BX out - ajustado
          "M 550 125 H 465", // CX out - ajustado
          "M 550 165 H 465", // DX out - ajustado
          showid ? "M 550 205 H 510" : "", // id out
         //"M 550 10 V 250", // Vertical join for output buses
          "M 550 40 V 250", // Vertical join for output buses
         // "M 550 45 H 492", // Connect to data mbr join
          // Connect output buses to left of ALU
          "M 550 45 V 16 H 90 V 84 H 220", // out to left
          /*"M 550 12 V 60", // BX out to left
          "M 555 10 H 100 V 84", // CX out to left
          "M 555 10 H 100 V 84", // DX out to left*/
          //"M 510 205 H 60", // id out to left
        ].join(" ")}
      />

      <animated.path
        d={path}
        className="fill-none stroke-mantis-400 stroke-bus"
        strokeLinejoin="round"
        pathLength={1}
        strokeDasharray={1}
        style={style}
      />
    </svg>
  );
}
