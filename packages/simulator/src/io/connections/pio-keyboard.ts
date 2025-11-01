import { Byte } from "@vonsim/common/byte";

import { ComponentInit } from "../../component";
import type { EventGenerator } from "../../events";
import { Keyboard } from "../devices/keyboard";
import { PIO, PIORegister } from "../modules/pio";

/**
 * PIO for the keyboard.
 *
 * - Port 32h (CA): Status register (1 if key available, 0 otherwise)
 * - Port 30h (PA): Data register (ASCII code of the pressed key)
 *
 * @see
 * - {@link PIO}.
 * - {@link https://vonsim.github.io/en/io/devices/keyboard}.
 *
 * ---
 * This class is: MUTABLE
 */
export class PIOKeyboard extends PIO {
  readonly keyboard: Keyboard;
  #lastChar: Byte<8> | null = null;

  constructor(options: ComponentInit) {
    super(options);

    this.keyboard = new Keyboard(options);

    // Inicializar todos los puertos en 0
    this.PA = Byte.fromUnsigned(0, 8);
    this.PB = Byte.fromUnsigned(0, 8);
    this.CA = Byte.fromUnsigned(0, 8);
    this.CB = Byte.fromUnsigned(0, 8);
  }

  /**
   * Guarda la tecla presionada en los puertos del PIO.
   * Llamado desde el exterior cuando el usuario presiona una tecla.
   * IMPORTANTE: Este método escribe directamente en los puertos para que
   * la memoria de E/S refleje el cambio y la CPU pueda leerlo con IN.
   */
  *setKeyPressed(char: Byte<8>): EventGenerator {
    this.#lastChar = char;

    // Escribir directamente en los puertos usando write() para que
    // se emitan los eventos correctos y la memoria de E/S se actualice

    // CA (32h): Estado = 1 (tecla disponible)
    yield* this.write("CA", Byte.fromUnsigned(1, 8));

    // PA (30h): Código ASCII de la tecla
    yield* this.write("PA", char);
  }

  *read(register: PIORegister): EventGenerator<Byte<8>> {
    yield { type: "pio:read", register };

    let value: Byte<8>;

    if (register === "CA") {
      // CA (32h): Estado del teclado (0 = sin tecla, 1 = tecla disponible)
      // IMPORTANTE: Solo emitir evento de espera si NO hay tecla disponible
      if (this.CA.isZero()) {
        // Emitir evento para que aparezca el mensaje de ingresar tecla
        yield { type: "keyboard:listen-key" };
        // Después del yield, el usuario habrá presionado una tecla
        // y setKeyPressed habrá sido llamado (como generador),
        // estableciendo CA=1 y PA=carácter en los puertos
        // Los eventos pio:register.update ya fueron emitidos por write()
      }
      value = this.CA;
    } else if (register === "PA") {
      // PA (30h): Código ASCII de la tecla
      value = this.PA;

      // Después de leer el carácter, limpiar el estado usando write()
      // para que se emitan los eventos correctos
      yield* this.write("CA", Byte.fromUnsigned(0, 8));
      yield* this.write("PA", Byte.fromUnsigned(0, 8));
      this.#lastChar = null;
    } else if (register === "PB") {
      value = this.PB;
    } else if (register === "CB") {
      value = this.CB;
    } else {
      return register; // Exhaustive check
    }

    yield { type: "pio:read.ok", value };
    return value;
  }

  *updatePort(): EventGenerator {
    // El teclado no necesita actualizar puertos
    // ya que solo es de entrada
  }
}
