import { randomBytes } from 'crypto';

// Function to generate a unique session ID
export function generateSessionId(): string {
  return randomBytes(32).toString('hex'); // Generates a 64-character hexadecimal string
}
