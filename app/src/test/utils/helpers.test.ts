import { describe, expect, it, vi, beforeEach } from 'vitest';

// Tests para funciones helper y utilidades
describe('Utility Functions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // El mock de @/lib/i18n ha sido eliminado para evitar conflicto con el mock global

  describe('Number Utilities', () => {
    it('should convert decimal to hexadecimal', () => {
      const toHex = (num: number): string => num.toString(16).toUpperCase().padStart(2, '0');
      
      expect(toHex(0)).toBe('00');
      expect(toHex(255)).toBe('FF');
      expect(toHex(16)).toBe('10');
      expect(toHex(42)).toBe('2A');
    });

    it('should convert hexadecimal to decimal', () => {
      const fromHex = (hex: string): number => parseInt(hex, 16);
      
      expect(fromHex('00')).toBe(0);
      expect(fromHex('FF')).toBe(255);
      expect(fromHex('10')).toBe(16);
      expect(fromHex('2A')).toBe(42);
    });

    it('should validate 8-bit values', () => {
      const isValid8Bit = (value: number): boolean => {
        return Number.isInteger(value) && value >= 0 && value <= 255;
      };
      
      expect(isValid8Bit(0)).toBe(true);
      expect(isValid8Bit(255)).toBe(true);
      expect(isValid8Bit(128)).toBe(true);
      expect(isValid8Bit(-1)).toBe(false);
      expect(isValid8Bit(256)).toBe(false);
      expect(isValid8Bit(3.14)).toBe(false);
    });

    it('should handle bitwise operations', () => {
      const setBit = (value: number, bit: number): number => value | (1 << bit);
      const clearBit = (value: number, bit: number): number => value & ~(1 << bit);
      const getBit = (value: number, bit: number): boolean => (value & (1 << bit)) !== 0;
      
      let value = 0;
      
      // Set bits
      value = setBit(value, 0); // 00000001
      expect(value).toBe(1);
      expect(getBit(value, 0)).toBe(true);
      
      value = setBit(value, 3); // 00001001
      expect(value).toBe(9);
      expect(getBit(value, 3)).toBe(true);
      
      // Clear bits
      value = clearBit(value, 0); // 00001000
      expect(value).toBe(8);
      expect(getBit(value, 0)).toBe(false);
    });
  });

  describe('String Utilities', () => {
    it('should pad strings correctly', () => {
      const padLeft = (str: string, length: number, char: string = '0'): string => {
        return str.padStart(length, char);
      };
      
      expect(padLeft('42', 4)).toBe('0042');
      expect(padLeft('FF', 2)).toBe('FF');
      expect(padLeft('A', 3, ' ')).toBe('  A');
    });

    it('should format assembly code', () => {
      const formatAssembly = (instruction: string, operands: string[] = []): string => {
        if (operands.length === 0) return instruction.toUpperCase();
        return `${instruction.toUpperCase()} ${operands.join(', ')}`;
      };
      
      expect(formatAssembly('mov', ['A', '5'])).toBe('MOV A, 5');
      expect(formatAssembly('add', ['A', 'B'])).toBe('ADD A, B');
      expect(formatAssembly('hlt')).toBe('HLT');
    });

    it('should validate assembly labels', () => {
      const isValidLabel = (label: string): boolean => {
        return /^[A-Za-z_][A-Za-z0-9_]*$/.test(label) && label.length <= 16;
      };
      
      expect(isValidLabel('START')).toBe(true);
      expect(isValidLabel('loop1')).toBe(true);
      expect(isValidLabel('_temp')).toBe(true);
      expect(isValidLabel('1label')).toBe(false);
      expect(isValidLabel('')).toBe(false);
      expect(isValidLabel('very_long_label_name')).toBe(false);
    });
  });

  describe('Array Utilities', () => {
    it('should create memory array', () => {
      const createMemory = (size: number, defaultValue: number = 0): number[] => {
        return new Array(size).fill(defaultValue);
      };
      
      const memory = createMemory(256);
      expect(memory).toHaveLength(256);
      expect(memory.every(byte => byte === 0)).toBe(true);
      
      const customMemory = createMemory(16, 0xFF);
      expect(customMemory).toHaveLength(16);
      expect(customMemory.every(byte => byte === 0xFF)).toBe(true);
    });

    it('should find patterns in arrays', () => {
      const findPattern = (array: number[], pattern: number[]): number => {
        for (let i = 0; i <= array.length - pattern.length; i++) {
          if (pattern.every((val, j) => array[i + j] === val)) {
            return i;
          }
        }
        return -1;
      };
      
      const data = [0x01, 0x02, 0x03, 0x04, 0x05];
      expect(findPattern(data, [0x02, 0x03])).toBe(1);
      expect(findPattern(data, [0x01, 0x02, 0x03])).toBe(0);
      expect(findPattern(data, [0x06])).toBe(-1);
    });

    it('should copy array ranges', () => {
      const copyRange = (source: number[], start: number, end: number): number[] => {
        return source.slice(start, end);
      };
      
      const data = [0x01, 0x02, 0x03, 0x04, 0x05];
      expect(copyRange(data, 1, 4)).toEqual([0x02, 0x03, 0x04]);
      expect(copyRange(data, 0, 2)).toEqual([0x01, 0x02]);
      expect(copyRange(data, 3, 3)).toEqual([]);
    });
  });

  describe('Validation Utilities', () => {
    it('should validate memory addresses', () => {
      const isValidAddress = (address: number): boolean => {
        return Number.isInteger(address) && address >= 0 && address <= 255;
      };
      
      expect(isValidAddress(0)).toBe(true);
      expect(isValidAddress(255)).toBe(true);
      expect(isValidAddress(128)).toBe(true);
      expect(isValidAddress(-1)).toBe(false);
      expect(isValidAddress(256)).toBe(false);
      expect(isValidAddress(3.14)).toBe(false);
    });

    it('should validate register names', () => {
      const validRegisters = ['A', 'B', 'C', 'D', 'PC', 'SP'];
      const isValidRegister = (name: string): boolean => {
        return validRegisters.includes(name.toUpperCase());
      };
      
      expect(isValidRegister('A')).toBe(true);
      expect(isValidRegister('a')).toBe(true);
      expect(isValidRegister('PC')).toBe(true);
      expect(isValidRegister('X')).toBe(false);
      expect(isValidRegister('')).toBe(false);
    });

    it('should validate instruction formats', () => {
      const validateInstruction = (instruction: string, operands: string[]): boolean => {
        const validInstructions = ['MOV', 'ADD', 'SUB', 'HLT', 'JMP', 'JZ'];
        const isValid = validInstructions.includes(instruction.toUpperCase());
        
        if (!isValid) return false;
        
        // Validar número de operandos según la instrucción
        switch (instruction.toUpperCase()) {
          case 'MOV':
            return operands.length === 2;
          case 'ADD':
          case 'SUB':
            return operands.length === 2;
          case 'HLT':
            return operands.length === 0;
          case 'JMP':
          case 'JZ':
            return operands.length === 1;
          default:
            return false;
        }
      };
      
      expect(validateInstruction('MOV', ['A', '5'])).toBe(true);
      expect(validateInstruction('ADD', ['A', 'B'])).toBe(true);
      expect(validateInstruction('HLT', [])).toBe(true);
      expect(validateInstruction('MOV', ['A'])).toBe(false);
      expect(validateInstruction('INVALID', [])).toBe(false);
    });
  });

  describe('Performance Utilities', () => {
    it('should measure execution time', () => {
      const measureTime = <T>(fn: () => T): { result: T; time: number } => {
        const start = performance.now();
        const result = fn();
        const end = performance.now();
        return { result, time: end - start };
      };
      
      const { result, time } = measureTime(() => {
        let sum = 0;
        for (let i = 0; i < 1000; i++) {
          sum += i;
        }
        return sum;
      });
      
      expect(result).toBe(499500);
      expect(time).toBeGreaterThan(0);
      expect(time).toBeLessThan(100); // Debería ser muy rápido
    });

    it('should debounce function calls', () => {
      let callCount = 0;
      const testFn = () => { callCount++; };
      
      const debounce = (fn: Function, delay: number) => {
        let timeoutId: NodeJS.Timeout;
        return (...args: any[]) => {
          clearTimeout(timeoutId);
          timeoutId = setTimeout(() => fn(...args), delay);
        };
      };
      
      const debouncedFn = debounce(testFn, 100);
      
      // Llamar múltiples veces rápidamente
      debouncedFn();
      debouncedFn();
      debouncedFn();
      
      expect(callCount).toBe(0); // No debería haberse llamado aún
      
      // Esperar a que se ejecute
      return new Promise(resolve => {
        setTimeout(() => {
          expect(callCount).toBe(1); // Solo debería haberse llamado una vez
          resolve(undefined);
        }, 150);
      });
    });
  });

  describe('Error Handling Utilities', () => {
    it('should create custom errors', () => {
      class SimulationError extends Error {
        constructor(
          message: string,
          public code: string,
          public address?: number
        ) {
          super(message);
          this.name = 'SimulationError';
        }
      }
      
      const error = new SimulationError('Invalid instruction', 'INVALID_INSTRUCTION', 0x10);
      
      expect(error.message).toBe('Invalid instruction');
      expect(error.code).toBe('INVALID_INSTRUCTION');
      expect(error.address).toBe(0x10);
      expect(error.name).toBe('SimulationError');
    });

    it('should handle errors gracefully', () => {
      const safeExecute = <T>(fn: () => T, fallback: T): T => {
        try {
          return fn();
        } catch (error) {
          return fallback;
        }
      };
      
      expect(safeExecute(() => 42, 0)).toBe(42);
      expect(safeExecute(() => { throw new Error('Test'); }, 0)).toBe(0);
    });

    it('should validate error conditions', () => {
      const validateSimulationState = (state: any): boolean => {
        if (!state || typeof state !== 'object') return false;
        if (!state.registers || !state.memory) return false;
        if (!Array.isArray(state.memory) || state.memory.length !== 256) return false;
        return true;
      };
      
      const validState = {
        registers: { A: 0, B: 0 },
        memory: new Array(256).fill(0)
      };
      
      expect(validateSimulationState(validState)).toBe(true);
      expect(validateSimulationState(null)).toBe(false);
      expect(validateSimulationState({})).toBe(false);
      expect(validateSimulationState({ registers: {}, memory: [1, 2, 3] })).toBe(false);
    });
  });
}); 