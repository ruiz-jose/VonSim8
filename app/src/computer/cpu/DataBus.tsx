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
dataBus.addNode("AX", { position: [451, 45] });
dataBus.addNode("BX", { position: [451, 85] });
dataBus.addNode("CX", { position: [451, 125] });
dataBus.addNode("DX", { position: [451, 165] });
dataBus.addNode("id", { position: [451, 205] });
dataBus.addNode("IP", { position: [451, 309] });
dataBus.addNode("SP", { position: [451, 349] });
dataBus.addNode("ri", { position: [451, 388] });
dataBus.addNode("MAR", { position: [698, 349] });
dataBus.addNode("result", { position: [370, 130] });
dataBus.addNode("FLAGS", { position: [250, 225] });
dataBus.addNode("IR", { position: [205, 272] });
dataBus.addNode("left", { position: [60, 85] });
dataBus.addNode("right", { position: [60, 145] });
dataBus.addNode("rmbr", { position: [250, 390] });

// These are the intermediate nodes
dataBus.addNode("AX join", { position: [421, 45] });
dataBus.addNode("BX join", { position: [421, 85] });
dataBus.addNode("CX join", { position: [421, 125] });
dataBus.addNode("DX join", { position: [421, 165] });
dataBus.addNode("id join", { position: [421, 205] });
dataBus.addNode("data mbr join", { position: [421, 250] });
dataBus.addNode("IP join", { position: [421, 309] });
dataBus.addNode("SP join", { position: [421, 349] });
dataBus.addNode("ri join", { position: [421, 388] });
dataBus.addNode("MAR join1", { position: [550, 388] });
dataBus.addNode("MAR join2", { position: [550, 348] });
dataBus.addNode("addresses mbr join", { position: [421, 250] });
dataBus.addNode("result mbr join", { position: [370, 250] });
dataBus.addNode("FLAGS mbr join", { position: [250, 250] });
dataBus.addNode("IR mbr join", { position: [205, 250] });
dataBus.addNode("left join", { position: [30, 85] });
dataBus.addNode("right join", { position: [30, 145] });
dataBus.addNode("operands mbr join", { position: [30, 250] });
dataBus.addNode("outr mbr join", { position: [553, 250] });
dataBus.addNode("mbr reg join", { position: [421, 250] });

// Añadir nodos de unión para los registros AX, BX, CX, DX e id
dataBus.addNode("AX out", { position: [510, 45] });
dataBus.addNode("BX out", { position: [510, 85] });
dataBus.addNode("CX out", { position: [510, 125] });
dataBus.addNode("DX out", { position: [510, 165] });
dataBus.addNode("id out", { position: [510, 205] });

// Añadir nodos de unión para los buses de salida en la parte posterior de los registros
dataBus.addNode("AX out join", { position: [553, 45] });
dataBus.addNode("BX out join", { position: [553, 85] });
dataBus.addNode("CX out join", { position: [553, 125] });
dataBus.addNode("DX out join", { position: [553, 165] });
dataBus.addNode("id out join", { position: [553, 205] });

dataBus.addUndirectedEdge("AX", "AX out");
dataBus.addUndirectedEdge("BX", "BX out");
dataBus.addUndirectedEdge("CX", "CX out");
dataBus.addUndirectedEdge("DX", "DX out");
dataBus.addUndirectedEdge("id", "id out");

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

dataBus.addUndirectedEdge("result", "result mbr join");
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
export function generateDataPath(from: DataRegister, to: DataRegister): string {
  console.log("from:", from);
  console.log("to:", to);

  const intermediatePath = (from: DataRegister, to: DataRegister): string[] => {
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
  if (from === "MBR" && registers.includes(to)) {
    path = ["MBR", "mbr reg join", `${to} join`, to];
  } else if (registers.includes(from) && registers.includes(to)) {
    path = intermediatePath(from, to);
  } else {
    path = bidirectional(dataBus, from, to) || [];
  }

  // Reemplazar 'ri' por 'MAR' si el destino es 'ri'
  if (to === "ri") {
    const riIndex = path.indexOf("ri");
    if (riIndex !== -1) {
      path.splice(riIndex, 1, "ri", "MAR join1", "MAR join2", "MAR");
    }
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

/**
 * DataBus component, to be used inside <CPU />
 */
export function DataBus() {
  const { path, ...style } = getSpring("cpu.internalBus.data");

  return (
    <svg viewBox="0 0 650 500" className="pointer-events-none absolute inset-0">
      <path
        className="fill-none stroke-stone-700 stroke-bus"
        strokeLinejoin="round"
        d={[
          // ALU registers
          "M 60 85 H 30", // left
          "V 250 H 630", // Long path to MBR, here to get nice joins
          "M 60 145 H 30", // right
          "M 370 110 V 250", // result
          "M 250 225 V 250", // flags
          // Internal ALU
          "M 33 85 H 220", // left
          "M 32 145 H 220", // right
          "M 272 115 h 100", // result
          "M 250 145 v 46", // flags
          // Decoder
          "M 205 250 V 272", // IP
          "M 205 300 V 320", // IP->decoder
          // Address registers
          "M 451 388 H 421", // ri
          "V 250", // Long path to MBR, here to get nice joins
          "M 451 349 H 421", // SP
          "M 451 309 H 421", // IP
          // Data registers
          "M 451 45 H 421", // AX     
          "V 250", // Long path to MBR, here to get nice joins
          "M 451 85 H 421", // BX
          "M 451 125 H 421", // CX
          "M 451 165 H 421", // DX
          //"M 451 205 H 421", // id
            // Output buses
          "M 550 45 H 520", // AX out
          "M 550 85 H 510", // BX out
          "M 550 125 H 510", // CX out
          "M 550 165 H 510", // DX out
         // "M 550 205 H 510", // id out
         //"M 550 10 V 250", // Vertical join for output buses
          "M 550 40 V 250", // Vertical join for output buses
         // "M 550 45 H 492", // Connect to data mbr join
          // Connect output buses to left of ALU
         /* "M 550 10 H 100 V 84", // AX out to left
          "M 555 10 H 100 V 84", // BX out to left
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
