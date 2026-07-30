// Shared by the server actions that set passwords and by the client forms that
// show the rule text, so the two can't drift. Deliberately dependency-free
// (TextEncoder, not Buffer) so it's safe to import from a Client Component.

export const PASSWORD_MIN_LENGTH = 10;

// bcrypt silently truncates anything past 72 bytes, so a longer password would
// authenticate on its first 72 bytes alone. Reject instead of quietly cutting.
export const PASSWORD_MAX_BYTES = 72;

export const PASSWORD_RULE_TEXT = `At least ${PASSWORD_MIN_LENGTH} characters, including one letter and one number.`;

export function validateNewPassword(password: string, confirmPassword: string): string | null {
  if (!password) {
    return "Enter a new password.";
  }
  if (password.length < PASSWORD_MIN_LENGTH) {
    return `The new password must be at least ${PASSWORD_MIN_LENGTH} characters.`;
  }
  if (new TextEncoder().encode(password).length > PASSWORD_MAX_BYTES) {
    return `The new password is too long (limit ${PASSWORD_MAX_BYTES} bytes).`;
  }
  if (!/[A-Za-z]/.test(password) || !/[0-9]/.test(password)) {
    return "The new password must include at least one letter and one number.";
  }
  if (password !== confirmPassword) {
    return "The two new password entries don't match.";
  }
  return null;
}
