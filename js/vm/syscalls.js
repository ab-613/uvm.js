// File: js/vm/syscalls.js
/**
 * Universal Virtual Machine System Calls (V-OS Syscalls)
 */

export const SYSCALL = {
  PRINT: 0x01,       // Prints argument to stdout / virtual console
  INPUT: 0x02,       // Requests user input from UI (cooperatively suspends)
  SLEEP: 0x03,       // Suspends execution for specified milliseconds
  TIME: 0x04,        // High-resolution timestamp
  RANDOM: 0x05,      // Random float between 0 and 1
  STR: 0x06,         // Convert value to string
  INT: 0x07,         // Convert value to integer
  LEN: 0x08,         // Get length of array/string/object
};

export const SYSCALL_NAMES = Object.fromEntries(
  Object.entries(SYSCALL).map(([name, code]) => [code, name])
);
