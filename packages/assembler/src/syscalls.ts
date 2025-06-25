import { Byte } from "@vonsim/common/byte";

/**
 * This is a map of syscall numbers to their addresses.
 *
 * @see {@link https://vonsim.github.io/docs/cpu/#llamadas-al-sistema}.
 */
export const syscalls = [
  [0, Byte.fromUnsigned(0xa0, 8)],
  [3, Byte.fromUnsigned(0xb0, 8)],
  [6, Byte.fromUnsigned(0xc0, 8)],
  [7, Byte.fromUnsigned(0xd0, 8)],
] as const;

export type Syscalls = typeof syscalls;
export type SyscallNumber = Syscalls[number][0];

/**
 * Set of reserved addresses for syscalls.
 * These are addresses of the interrupt vector table that point to a syscall.
 */
export const reservedAddressesForSyscalls: ReadonlySet<number> = new Set(
  ...syscalls.map(([n]) => {
    // Each element of the interrupt vector table is 1 byte.
    return [n];
  }),
);
