import { charToDecimal, decimalToChar, displayCharacter } from "./ascii";

export type ByteSize = 8 | 16;
export type AnyByte = Byte<8> | Byte<16>;

/**
 * The representation of a byte.
 * - `hex`: hexadecimal (base 16)
 * - `bin`: binary (base 2)
 * - `int`: signed integer (base 10, 2's complement)
 * - `uint`: unsigned integer (base 10)
 * - `ascii`: ASCII character(s)
 * - `safe-ascii`: ASCII character(s) that can be displayed ({@link displayCharacter})
 */
export type ByteRepresentation = "hex" | "bin" | "int" | "uint" | "ascii" | "safe-ascii";

/**
 * General purpose byte.
 * Bytes can either 8 bits or 16 bits.
 * The value stored will ALWAYS be in range.
 *
 * ---
 * This class is: IMMUTABLE
 */
export class Byte<TSize extends ByteSize> {
  /**
   * The unsigned value of the byte.
   */
  #value: number;

  /**
   * The size of the byte.
   */
  #size: TSize;

  /**
   * Wraps a number into a byte.
   *
   * WARNING: This does not check if the number fits.
   * You should always use `Byte.fromUnsigned` or `Byte.fromSigned` instead.
   *
   * @param input An integer between `Byte.minSignedValue(size)` and `Byte.maxValue(size)`.
   * @param size The size of the byte.
   */
  private constructor(input: number, size: TSize) {
    // This ensures that the value is stored as an integer.
    this.#value = input | 0;
    this.#size = size;
  }

  get size(): TSize {
    return this.#size;
  }

  is8bits(): this is Byte<8> {
    return this.#size === 8;
  }

  is16bits(): this is Byte<16> {
    return this.#size === 16;
  }

  /**
   * Unsigned integer.
   * @returns The byte interpreted as a unsigned integer.
   */
  get unsigned(): number {
    return this.#value;
  }

  /**
   * Signed integer in 2's complement.
   * @returns The byte interpreted as a signed integer.
   */
  get signed(): number {
    if (this.#value <= Byte.maxSignedValue(this.#size)) return this.#value;
    else return this.#value - (Byte.maxValue(this.#size) + 1);
  }

  /**
   * Return the low byte of the word (little endian).
   * If the byte is already 8 bits, it returns itself.
   */
  get low(): Byte<8> {
    if (this.is8bits()) return this;
    else return Byte.fromUnsigned(this.#value & Byte.maxValue(8), 8);
  }

  /**
   * Return the high byte of the word (little endian).
   * If the byte is already 8 bits, it returns 0.
   */
  get high(): Byte<8> {
    if (this.is8bits()) return new Byte(0, 8);
    else return Byte.fromUnsigned((this.#value >> 8) & Byte.maxValue(8), 8);
  }

  /**
   * Returns the same byte but with its low part replaced.
   * @param byte The new low part.
   * @returns A new byte.
   */
  withLow(byte: Byte<8>): Byte<TSize> {
    if (byte.is16bits()) throw new TypeError("Byte must be 8 bits");
    return Byte.fromUnsigned((this.#value & ~Byte.maxValue(8)) | byte.unsigned, this.#size);
  }

  /**
   * Returns the same byte but with its high part replaced.
   * @param byte The new high part.
   * @returns A new byte.
   */
  withHigh(byte: Byte<8>): Byte<16> {
    if (byte.is16bits()) throw new TypeError("Byte must be 8 bits");
    return Byte.fromUnsigned((this.#value & Byte.maxValue(8)) | (byte.unsigned << 8), 16);
  }

  /**
   * Gets the bit at the given index.
   * @param index Which bit to set (0 = least significat bit).
   * @returns true if the bit is 1, false otherwise.
   */
  bit(index: number): boolean {
    if (!Number.isSafeInteger(index) || index < 0 || index >= this.#size) {
      throw new RangeError(`Index ${index} out of bounds for byte of size ${this.#size}`);
    }

    return (this.#value & (1 << index)) !== 0;
  }

  /**
   * Returns the same byte but with the bit at the given index replaced.
   * @param index Which bit to set (0 = least significat bit).
   * @param value Wheather to set that bit to 1 (true) or 0 (false).
   * @returns A new byte.
   */
  withBit(index: number, value: boolean): Byte<TSize> {
    if (!Number.isSafeInteger(index) || index < 0 || index >= this.#size) {
      throw new RangeError(`Index ${index} out of bounds for byte of size ${this.#size}`);
    }

    if (value) return Byte.fromUnsigned(this.#value | (1 << index), this.#size); // Set bit
    else return Byte.fromUnsigned(this.#value & ~(1 << index), this.#size); // Clear bit
  }

  /**
   * Returns a new byte of the same size that is the sum of the two bytes.
   * @param other A byte or a number.
   * @throws If the sum does not fit in a byte.
   * @returns A new byte.
   */
  add(other: AnyByte | number): Byte<TSize> {
    other = Number(other);
    return Byte.fromUnsigned(this.#value + other, this.#size);
  }

  /**
   * @returns Whether the Byte is zero or not.
   */
  isZero(): boolean {
    return this.unsigned === 0;
  }

  /**
   * Returns whether this byte is equal to the other byte.
   * If the other byte is a number, if it is signed, it will be compared against this.signed,
   * otherwise it will be compared against this.unsigned.
   * @param other A byte or a number.
   * @returns Whether the two bytes are equal.
   */
  equals(other: AnyByte | number): boolean {
    if (typeof other === "number") {
      if (other < 0) return this.signed === other;
      else return this.unsigned === other;
    } else {
      return this.#value === other.#value;
    }
  }

  /**
   * Returns the byte as a Uint8Array.
   */
  toUint8Array(): Uint8Array {
    if (this.is8bits()) {
      return new Uint8Array([this.unsigned]);
    } else {
      // Little endian
      return new Uint8Array([this.low.unsigned, this.high.unsigned]);
    }
  }

  /**
   * Returns the byte as a boolean array.
   */
  toArray(): boolean[] {
    const array = new Array<boolean>(this.#size);
    for (let i = 0; i < this.#size; i++) {
      array[i] = this.bit(i);
    }
    return array;
  }

  /**
   * Returns the byte as a string.
   * @param [representation="int"] The representation to use.
   */
  toString(representation: ByteRepresentation = "int"): string {
    switch (representation) {
      case "hex": {
        return this.#value
          .toString(16)
          .padStart(this.#size / 4, "0")
          .toUpperCase();
      }

      case "bin": {
        return this.#value.toString(2).padStart(this.#size, "0");
      }

      case "int": {
        return this.signed.toString(10);
      }

      case "uint": {
        return this.unsigned.toString(10);
      }

      case "ascii": {
        if (this.#size === 8) return decimalToChar(this.#value) ?? "---";
        else return this.low.toString("ascii") + this.high.toString("ascii");
      }

      case "safe-ascii": {
        if (this.#size === 8) return displayCharacter(this.#value) ?? "---";
        else return this.low.toString("safe-ascii") + " " + this.high.toString("safe-ascii");
      }
    }
  }

  /**
   * Returns the byte as a JSON number.
   * Useful for serialization.
   */
  toJSON(): number {
    return this.#value;
  }

  /**
   * Returns the value of the byte.
   * Useful when calling `Number(byte)`.
   */
  valueOf(): number {
    return this.#value;
  }

  // #=========================================================================#
  // # Static methods                                                          #
  // #=========================================================================#

  static minValue(): number {
    return 0;
  }

  static maxValue(size: ByteSize): number {
    return 2 ** size - 1;
  }

  static minSignedValue(size: ByteSize): number {
    return -(2 ** (size - 1));
  }

  static maxSignedValue(size: ByteSize): number {
    return 2 ** (size - 1) - 1;
  }

  /**
   * Whether the given number fits in a byte.
   * @param value An integer (signed or unsigned)
   * @param size The size of the byte that the number should fit in.
   * @returns whether the number fits in a byte.
   */
  static fits(value: number, size: ByteSize): boolean {
    return (
      Number.isSafeInteger(value) &&
      value >= Byte.minSignedValue(size) &&
      value <= Byte.maxValue(size)
    );
  }

  /**
   * Whether the given unsigned number fits in a byte.
   * @param value An integer (unsigned)
   * @param size The size of the byte that the number should fit in.
   * @returns whether the number fits in a byte.
   */
  static fitsUnsigned(value: number, size: ByteSize): boolean {
    return Number.isSafeInteger(value) && value >= Byte.minValue() && value <= Byte.maxValue(size);
  }

  /**
   * Whether the given signed number fits in a byte.
   * @param value An integer (signed)
   * @param size The size of the byte that the number should fit in.
   * @returns whether the number fits in a byte.
   */
  static fitsSigned(value: number, size: ByteSize): boolean {
    return (
      Number.isSafeInteger(value) &&
      value >= Byte.minSignedValue(size) &&
      value <= Byte.maxSignedValue(size)
    );
  }

  /**
   * @param number A unsigned integer.
   * @param size The size of the byte.
   * @returns A byte with the given value (unsigned binary)
   * @throws If the number does not fit in a byte.
   */
  static fromUnsigned<TSize extends ByteSize>(value: number, size: TSize): Byte<TSize> {
    if (!Byte.fitsUnsigned(value, size)) {
      throw new RangeError(`Value ${value} does not fit in a ${size}-bit byte.`);
    }

    return new Byte(value, size);
  }

  /**
   * @param number A signed integer.
   * @param size The size of the byte.
   * @returns A byte with the given value (2's complement)
   * @throws If the number does not fit in a byte.
   */
  static fromSigned<TSize extends ByteSize>(value: number, size: TSize): Byte<TSize> {
    if (!Byte.fitsSigned(value, size)) {
      throw new RangeError(`Value ${value} does not fit in a ${size}-bit byte.`);
    }

    if (value < 0) return new Byte(value + Byte.maxValue(size) + 1, size);
    else return new Byte(value, size);
  }

  /**
   * Converts a number to a byte. If the number is negative, it will be interpreted as a signed number.
   * @param number An integer
   * @param size The size of the byte.
   * @returns A byte with the given value.
   * @throws If the number does not fit in a byte.
   */
  static fromNumber<TSize extends ByteSize>(number: number, size: TSize): Byte<TSize> {
    if (number < 0) return Byte.fromSigned(number, size);
    else return Byte.fromUnsigned(number, size);
  }

  /**
   * Converts a character to a byte using the ASCII table.
   * @param char A character
   * @returns The byte corresponding to the character.
   * @throws If the character is not in the ASCII table.
   */
  static fromChar(char: string): Byte<8> {
    const code = charToDecimal(char) ?? -1;
    return Byte.fromUnsigned(code, 8);
  }

  /**
   * @param size The size of the byte.
   * @returns A random byte.
   */
  static random<TSize extends ByteSize>(size: TSize): Byte<TSize> {
    const value = Math.round(Math.random() * Byte.maxValue(size));
    return new Byte(value, size);
  }

  /**
   * @param size The size of the byte.
   * @returns A zero byte.
   */
  static zero<TSize extends ByteSize>(size: TSize): Byte<TSize> {
    return new Byte(0, size);
  }
}
