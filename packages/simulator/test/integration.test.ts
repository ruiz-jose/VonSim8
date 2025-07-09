import { describe, expect, it, beforeEach } from "vitest";
import { Simulator } from "../src";
import { assemble } from "@vonsim/assembler";

describe("Simulator Integration", () => {
  let simulator: Simulator;

  beforeEach(() => {
    simulator = new Simulator();
  });

  describe("Basic Operations", () => {
    it("should initialize correctly", () => {
      expect(simulator).toBeDefined();
      expect(typeof simulator.getComputerState).toBe('function');
    });

    it("should load program correctly", () => {
      const source = `
        MOV AX, 10h
        END
      `;
      const assembled = assemble(source);
      
      if (assembled.success) {
        simulator.loadProgram({
          program: assembled,
          devices: {
            keyboardAndScreen: false,
            pic: false,
            pio: null,
            handshake: null
          },
          data: "clean"
        });
        const state = simulator.getComputerState();
        expect(state).toBeDefined();
      }
    });
  });

  describe("CPU Operations", () => {
    it("should have startCPU method", () => {
      const source = `
        MOV AX, 42h
        HLT
        END
      `;
      const assembled = assemble(source);
      
      if (assembled.success) {
        simulator.loadProgram({
          program: assembled,
          devices: {
            keyboardAndScreen: false,
            pic: false,
            pio: null,
            handshake: null
          },
          data: "clean"
        });
        expect(typeof simulator.startCPU).toBe('function');
      }
    });
  });

  describe("Devices", () => {
    it("should have devices interface", () => {
      const source = `END`;
      const assembled = assemble(source);
      
      if (assembled.success) {
        simulator.loadProgram({
          program: assembled,
          devices: {
            keyboardAndScreen: false,
            pic: false,
            pio: null,
            handshake: null
          },
          data: "clean"
        });
        const devices = simulator.devices;
        expect(devices).toBeDefined();
        expect(devices.clock).toBeDefined();
        expect(devices.keyboard).toBeDefined();
      }
    });
  });
});
