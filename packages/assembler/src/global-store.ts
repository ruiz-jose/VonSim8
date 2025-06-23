import { MemoryAddress } from "@vonsim/common/address";
import { forEachWithErrors } from "@vonsim/common/loops";

import { AssemblerError } from "./error";
import type { Constant, Statement } from "./statements";
import { reservedAddressesForSyscalls } from "./syscalls";

type LabelsMap = Map<
  string,
  | { type: "DB" | "DW" | "instruction"; address: MemoryAddress }
  | { type: "EQU"; constant: Constant }
>;

/**
 * The Global Store™
 *
 * This class is used to store labels, constants and reserved memory.
 *
 * Since the assembler is a single-pass assembler, we can't compute the addresses of labels
 * until we have parsed the whole program. This class is used to store the labels and constants
 * until we can compute their addresses.
 *
 * Our main limitation is that we need to know the length of each instruction to compute the
 * address of each one (and hence, the address of each label).
 *
 * Why? For instance:
 *
 * ```vonsim
 * mov al, label
 * ```
 *
 * If `label` is a constant, the instruction is a MOV reg<-imd (3 bytes).
 * However, if `label` points to a DB, the instruction is a MOV reg<-mem (direct) (4 bytes).
 *
 * So, we need to know at least the type of each label to compute the addresses. This is,
 * whether it is a constant (or points to an instruction) or a DB/DW.
 *
 * That's why we have two methods: `loadStatements` and `computeAddresses`.
 *
 * The first one initializes the store: it loads the labels and constants from the statements.
 * It mainly checks for duplicated labels and stores the constants (without evaluating them).
 *
 * The second one computes the addresses of the labels and stores them in the store.
 *
 * By the end of the second method, the store is ready to be used by {@link DataDirective}
 * and {@link Instruction} to evaluate their operands.
 */
export class GlobalStore {
  private readonly codeMemory = new Set<number>();
  private readonly labels: LabelsMap = new Map();
  private hasORG = false; // Nueva propiedad para almacenar si tiene la directiva ORG
  

  #statementsLoaded = false;
  #computedAddresses = false;

  /**
   * Loads the label types from the given statements
   * @returns Errors that occurred while loading the label types
   */
  loadStatements(statements: Statement[]): AssemblerError<any>[] {
    if (this.#statementsLoaded) {
      throw new Error("Tried to load statements twice");
    }

    this.#statementsLoaded = true;
    this.labels.clear();
    const errors: AssemblerError<any>[] = [];

    for (const statement of statements) {
      if (!("label" in statement)) continue;
      if (!statement.label) continue;

      if (this.labels.has(statement.label)) {
        errors.push(new AssemblerError("duplicated-label", statement.label).at(statement.position));
        continue;
      }

      if (statement.isInstruction()) {
        this.labels.set(statement.label, {
          type: "instruction",
          address: MemoryAddress.from(0),
        });
      } else if (statement.directive === "EQU") {
        this.labels.set(statement.label, {
          type: "EQU",
          constant: statement,
        });
      } else {
        this.labels.set(statement.label, {
          type: statement.directive,
          address: MemoryAddress.from(0),
        });
      }
    }

    return errors;
  }

  computeAddresses(statements: Statement[]): AssemblerError<any>[] {
    if (this.#computedAddresses) {
      throw new Error("Tried to compute addresses twice");
    }

    this.#computedAddresses = true;
    this.codeMemory.clear();
    const occupiedMemory = new Set<number>();

    // Verificar si el programa contiene la instrucción INT
    const hasINT = statements.some(statement => statement.isInstruction() && statement.instruction === "INT");

    // Verificar si el programa contiene la directiva ORG
    this.hasORG = statements.some(statement => statement.isOriginChange());

     // Validar si `this.hasORG` es `true` pero la primera línea no es una directiva ORG
    if (this.hasORG && !statements[0].isOriginChange()) {
      throw new AssemblerError("missing-org").at(statements[0].position);
    }
    
    // Determinar la dirección inicial del código
    let codePointer = hasINT || this.hasORG ? 0x20 : 0x00; // Comienza en 20h si hay INT o ORG, de lo contrario en 0x00
    let dataPointer: number | null = null;
    let lastCodeAddress: number = codePointer;

    // Separar las instrucciones y los datos
    const instructionStatements: Statement[] = [];
    const directiveStatements: Statement[] = [];
    const dataStatements: Statement[] = [];

    for (const statement of statements) {
      if (statement.isInstruction()) {
        instructionStatements.push(statement);
      } else if (statement.isOriginChange()) {
        directiveStatements.push(statement);
      } else if (statement.isDataDirective()) {
        dataStatements.push(statement);
      }
    }

    if (this.hasORG) {
    const errors: AssemblerError<any>[] = [];
    // --- NUEVO: Guardar rangos de secciones para detectar solapamientos ---
    type SectionRange = { start: number, end: number, statement: Statement };
    const sectionRanges: SectionRange[] = [];
    // --- FIN NUEVO ---

    forEachWithErrors(
      statements,
      statement => {
        if (statement.isEnd()) return;
        if (statement.isDataDirective() && statement.directive === "EQU") return;

        if (statement.isOriginChange()) {
          const address = statement.newAddress;
          codePointer = address;
          return;
        }  

        const pointer = codePointer;
        if (pointer === null) {
          throw new AssemblerError("missing-org").at(statement);
        }

        const length = statement.length;
        const start = pointer;
        const end = pointer + length - 1;

        // --- NUEVO: Validar solapamiento de secciones ---
        for (const range of sectionRanges) {
          if (Math.max(start, range.start) <= Math.min(end, range.end)) {
            errors.push(
              new AssemblerError(
                "occupied-address",
                MemoryAddress.from(start)
              ).at(statement)
            );
            return; // No cargar esta sección
          }
        }
        sectionRanges.push({ start, end, statement });
        // --- FIN NUEVO ---

        for (let i = 0; i < length; i++) {
          if (!MemoryAddress.inRange(pointer + i)) {
            throw new AssemblerError("instruction-out-of-range", pointer + i).at(statement);
          }
          const address = MemoryAddress.from(pointer + i);

          if (occupiedMemory.has(address.value)) {
            throw new AssemblerError("occupied-address", address).at(statement);
          }

          if (hasINT) {
            if (reservedAddressesForSyscalls.has(address.value)) {
              throw new AssemblerError("reserved-address", address).at(statement);
            }
          }

          occupiedMemory.add(address.value);
          if (statement.isInstruction()) this.codeMemory.add(address.value);
        }

        const startAddress = MemoryAddress.from(pointer);
        statement.setStart(startAddress);
        if (statement.label) {
          this.labels.set(statement.label, {
            type: statement.isInstruction() ? "instruction" : statement.directive,
            address: startAddress,
          });
        }
        if (statement.isDataDirective() || statement.isInstruction()) {
          codePointer += length;
          lastCodeAddress = Math.max(lastCodeAddress, codePointer); // Actualizar la última dirección usada por el código
        }
      },
      AssemblerError.from,
    );
    return errors;
    } else {
    const errors = forEachWithErrors(
      [...instructionStatements, ...directiveStatements, ...dataStatements], // Procesar primero las instrucciones y luego los datos
      //statements,
      statement => {
       // if (statement.isEnd()) return;
        if (statement.isDataDirective() && statement.directive === "EQU") return;

        if (statement.isOriginChange()) {
          const address = statement.newAddress;
          if (address < 0x20) {
            dataPointer = address;
          } else {
            codePointer = address;
          }
          return;
        }
       
        let pointer: number;
        if (statement.isDataDirective()) {
          if (dataPointer === null) {
            // Si no se ha definido ORG para datos, los colocamos después del código
            dataPointer = lastCodeAddress;
          }          
          pointer = dataPointer;
        } else if (statement.isInstruction()) {
          pointer = codePointer;
        } else {
          throw new AssemblerError("missing-org").at(statement);
        }

        const length = statement.length;

        for (let i = 0; i < length; i++) {
          if (!MemoryAddress.inRange(pointer + i)) {
            throw new AssemblerError("instruction-out-of-range", pointer + i).at(statement);
          }
          const address = MemoryAddress.from(pointer + i);

          if (occupiedMemory.has(address.value)) {
            throw new AssemblerError("occupied-address", address).at(statement);
          }

          if (hasINT) {
            if (reservedAddressesForSyscalls.has(address.value)) {
              throw new AssemblerError("reserved-address", address).at(statement);
            }
          }

          occupiedMemory.add(address.value);
          if (statement.isInstruction()) this.codeMemory.add(address.value);
        }

        const startAddress = MemoryAddress.from(pointer);
        statement.setStart(startAddress);
        if (statement.label) {
          this.labels.set(statement.label, {
            type: statement.isInstruction() ? "instruction" : statement.directive,
            address: startAddress,
          });
        }
        if (statement.isDataDirective()) {
          if (dataPointer === null) {
            throw new Error("Data pointer is null");
          }
          dataPointer += length;
        } else if (statement.isInstruction()) {
          codePointer += length;
          lastCodeAddress = Math.max(lastCodeAddress, codePointer); // Actualizar la última dirección usada por el código
        }
      },
      AssemblerError.from,
    );
    return errors;
    }

  }

  /**
   * @returns Whether the label is defined.
   */
  labelExists(label: string) {
    if (!this.#statementsLoaded) {
      throw new Error("Tried to check if label exists before loading statements");
    }

    return this.labels.has(label);
  }

  /**
   * @returns What the label points to.
   */
  getLabelType(label: string) {
    if (!this.#statementsLoaded) {
      throw new Error("Tried to get type of label before loading statements");
    }

    return this.labels.get(label)?.type;
  }

  /**
   * @returns The value of the label.
   *          If the label is a constant, this is the value of the constant.
   *          Otherwise, this is the address of the data or instruction.
   */
  getLabelValue(label: string) {
    if (!this.#statementsLoaded) {
      throw new Error("Tried to get type of label before loading statements");
    }

    const data = this.labels.get(label);
    if (!data) return undefined;

    if (data.type === "EQU") {
      return data.constant.evaluate(this);
    } else {
      if (!this.#computedAddresses) {
        throw new Error("Tried to get address of label before computing addresses");
      }

      return data.address.value;
    }
  }

  /**
   * Tells whether the given address is reserved by an instruction.
   * @returns Whether the given address is reserved.
   */
  addressIsReserved(address: MemoryAddress | number): boolean {
    if (address instanceof MemoryAddress) address = address.value;
    return this.codeMemory.has(address);
  }

  hasOriginDirective(): boolean {
    return this.hasORG;
  }
}
