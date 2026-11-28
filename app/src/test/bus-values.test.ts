import { Byte } from "@vonsim/common/byte";
import { describe, expect, it, vi } from "vitest";

import { MBRAtom, registerAtoms } from "@/computer/cpu/state";
import {
  busValueAtoms,
  resolvePathValue,
  startBusValue,
  tagPathSource,
} from "@/computer/shared/bus-values";
import { store } from "@/lib/jotai";

// El setup global simula jotai; acá hace falta el store real
vi.unmock("jotai");

describe("valor que viaja por el bus", () => {
  it("lee el valor del registro de origen al arrancar la animación", () => {
    store.set(registerAtoms.AL, Byte.fromUnsigned(0x0a, 8));
    const path = tagPathSource("M 0 0 L 10 0", "AL");
    expect(resolvePathValue(path)).toBe("0Ah");

    startBusValue("cpu.internalBus.data.path", path);
    expect(store.get(busValueAtoms["cpu.internalBus.data"])).toEqual({ path, text: "0Ah" });
  });

  it("muestra el byte bajo de los registros de 16 bits y del MBR", () => {
    store.set(registerAtoms.IP, Byte.fromUnsigned(0x21, 16));
    expect(resolvePathValue(tagPathSource("M 1 1 L 2 2", "IP"))).toBe("21h");
    store.set(MBRAtom, Byte.fromUnsigned(0xf1, 8));
    expect(resolvePathValue(tagPathSource("M 3 3 L 4 4", "MBR"))).toBe("F1h");
  });

  it("acepta un valor ya conocido (dato leído de memoria)", () => {
    const path = tagPathSource("M 5 5 L 6 6", Byte.fromUnsigned(0x3c, 8));
    startBusValue("bus.data.path", path);
    expect(store.get(busValueAtoms["bus.data"])?.text).toBe("3Ch");
  });

  it("no muestra nada si no se sabe de dónde sale el dato", () => {
    startBusValue("bus.address.path", "M 9 9 L 8 8");
    expect(store.get(busValueAtoms["bus.address"])).toBeNull();
    // Otras animaciones no tocan los valores
    startBusValue("cpu.alu.operands.opacity", 1);
    expect(store.get(busValueAtoms["bus.address"])).toBeNull();
  });
});
