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
  private _hasORG20hAtStart = false; // Nueva propiedad para almacenar si tiene ORG 20h al inicio
  private _mayUsePIC = false; // Nueva propiedad para almacenar si puede usar PIC

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
    const hasINT = statements.some(
      statement => statement.isInstruction() && statement.instruction === "INT",
    );

    // Verificar si el programa contiene la directiva ORG
    this.hasORG = statements.some(statement => statement.isOriginChange());

    // NUEVA LÓGICA: Permitir rutinas específicas con ORG sin requerir ORG al inicio
    const hasSpecificORG = statements.some((statement, index) => 
      statement.isOriginChange() && index > 0
    );

    // Verificar si hay ORG 20h específicamente al inicio
    const hasORG20hAtStart = statements[0]?.isOriginChange() && statements[0].newAddress === 0x20;
    this._hasORG20hAtStart = hasORG20hAtStart;

    console.log("DEBUG ASSEMBLER:", { 
      hasORG: this.hasORG, 
      hasORG20hAtStart, 
      firstStatement: statements[0]?.isOriginChange() ? statements[0].newAddress : "no ORG" 
    });

    // Solo validar ORG al inicio si no hay rutinas específicas con ORG Y no hay ORG 20h al inicio
    if (this.hasORG && !hasSpecificORG && !statements[0].isOriginChange()) {
      throw new AssemblerError("missing-org").at(statements[0].position);
    }

    // Verificar si el programa contiene la instrucción INT
    const hasINTInstruction = statements.some(stmt => 
      stmt.isInstruction() && stmt.instruction === "INT"
    );

    // Detectar si el programa puede usar PIC (SOLO PIC, no otros dispositivos)
    // Buscar instrucciones IN/OUT que usen direcciones PIC (0x20-0x2B)
    const mayUsePIC = statements.some(stmt => {
      if (!stmt.isInstruction() || (stmt.instruction !== "IN" && stmt.instruction !== "OUT")) {
        return false;
      }
      // Verificar si usa direcciones PIC específicamente
      const usesPICAddresses = stmt.operands.some((operand: any) => {
        // Caso 1: Número directo
        if (operand.type === "number-expression" && typeof operand.value?.value === "number") {
          const addr = operand.value.value;
          // Solo PIC: 0x20-0x2B
          const isPIC = addr >= 0x20 && addr <= 0x2B;
          if (isPIC) {
            console.log(`🎯 ASSEMBLER: Detectado uso de PIC (directo) - ${stmt.instruction} ${addr.toString(16)}h`);
          }
          return isPIC;
        }
        // Caso 2: Identificador (constante EQU) - Solo revisar constantes conocidas
        if (operand.type === "identifier") {
          const constName = operand.value;
          // Constantes PIC conocidas
          const picConstants = {
            'IMR': 0x21, 'EOI': 0x20, 'INT0': 0x24, 'INT1': 0x25, 'INT2': 0x26, 
            'INT3': 0x27, 'INT4': 0x28, 'INT5': 0x29, 'INT6': 0x2A, 'INT7': 0x2B
          };
          if (picConstants.hasOwnProperty(constName)) {
            const addr = picConstants[constName as keyof typeof picConstants];
            console.log(`🎯 ASSEMBLER: Detectado uso de PIC (constante conocida ${constName}) - ${stmt.instruction} ${constName}(${addr.toString(16)}h)`);
            return true;
          }
        }
        return false;
      });
      return usesPICAddresses;
    });

    // Almacenar la información sobre el uso del PIC
    this._mayUsePIC = mayUsePIC;

    // Determinar la dirección inicial del código principal
    // Si hay ORG 20h al inicio específicamente, usar 0x20
    // Si tiene instrucción INT O puede usar PIC, usar 0x08
    // En todos los otros casos, usar 0x00
    let mainCodePointer: number;
    if (hasORG20hAtStart) {
      mainCodePointer = 0x20;
    } else if (hasINTInstruction || mayUsePIC) {
      mainCodePointer = 0x08;
    } else {
      mainCodePointer = 0x00;
    }

    console.log("DEBUG ASSEMBLER mainCodePointer:", { 
      hasORG20hAtStart, 
      hasINTInstruction, 
      mayUsePIC,
      mainCodePointer: '0x' + mainCodePointer.toString(16).padStart(2, '0'),
      strategy: hasORG20hAtStart ? "ORG 20h" : 
                (hasINTInstruction || mayUsePIC) ? "reserve interrupt space (INT/PIC)" : "start at 00h"
    });
    let codePointer = mainCodePointer;
    let dataPointer: number | null = null;
    let lastCodeAddress: number = mainCodePointer;
    let mainCodeEndAddress: number = mainCodePointer; // Rastrea el final del código principal

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

    // NUEVA LÓGICA: Manejar rutinas con ORG específico
    if (hasSpecificORG || this.hasORG) {
      const errors: AssemblerError<any>[] = [];
      // --- NUEVO: Guardar rangos de secciones para detectar solapamientos ---
      type SectionRange = { start: number; end: number; statement: Statement };
      const sectionRanges: SectionRange[] = [];
      // --- FIN NUEVO ---

      // Si no hay ORG al inicio, comenzar con el puntero principal
      if (!statements[0]?.isOriginChange()) {
        codePointer = mainCodePointer;
      }

      // Procesar en el siguiente orden para separar código principal de rutinas específicas:
      // 1. Instrucciones del código principal (incluyendo las que vienen después de ORG 20h inicial)
      // 2. Datos (después del código principal)
      // 3. Rutinas con ORG específico (ORG que no son 20h al inicio)
      
      const mainCodeStatements: Statement[] = [];
      const dataStatements: Statement[] = [];
      const orgRoutineStatements: Statement[] = [];
      
      let currentlyInMainCode = true; // Empezamos en código principal
      let hasSeenInitialORG = false;  // Para rastrear si hemos visto el ORG inicial (20h)
      
      // Clasificar statements
      for (const statement of statements) {
        if (statement.isOriginChange()) {
          // Si es el primer ORG y es 20h, es parte del código principal
          if (!hasSeenInitialORG && statement.newAddress === 0x20) {
            hasSeenInitialORG = true;
            currentlyInMainCode = true;
            orgRoutineStatements.push(statement); // El ORG en sí va a las rutinas para el procesamiento
          } 
          // Cualquier otro ORG (incluyendo el primero si no es 20h) es una rutina específica
          else {
            currentlyInMainCode = false;
            orgRoutineStatements.push(statement);
          }
        } else if (statement.isInstruction()) {
          if (currentlyInMainCode) {
            mainCodeStatements.push(statement);
          } else {
            orgRoutineStatements.push(statement);
          }
        } else if (statement.isDataDirective()) {
          dataStatements.push(statement); // Todos los datos van después del código principal
        } else if (statement.isEnd()) {
          orgRoutineStatements.push(statement);
        }
      }
      
      // Orden final: código principal → datos → rutinas ORG
      const orderedStatements: Statement[] = [];
      orderedStatements.push(...mainCodeStatements, ...dataStatements, ...orgRoutineStatements);

      forEachWithErrors(
        orderedStatements,
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
                new AssemblerError("occupied-address", MemoryAddress.from(start)).at(statement),
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
            // Si es una instrucción del código principal (no de rutina ORG específica)
            if (statement.isInstruction() && mainCodeStatements.includes(statement)) {
              mainCodeEndAddress = codePointer + length;
            }
            
            // Manejar puntero de datos
            if (statement.isDataDirective() && dataPointer === null) {
              dataPointer = mainCodeEndAddress; // Los datos van después del código principal
              codePointer = dataPointer;
            }
            
            codePointer += length;
            lastCodeAddress = Math.max(lastCodeAddress, codePointer);
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

  hasORG20hAtStart(): boolean {
    return this._hasORG20hAtStart;
  }

  mayUsePIC(): boolean {
    return this._mayUsePIC;
  }
}
