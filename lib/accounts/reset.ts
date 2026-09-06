import "server-only";
import { accountStore } from "@/lib/accounts/store";
import { hashPassword } from "@/lib/accounts/password";
import { createResetToken, findValidResetToken, markResetTokenUsed } from "@/lib/accounts/reset-token-store";
import { sendPasswordResetEmail } from "@/lib/integrations/notify";
import { siteConfig } from "@/lib/site-config";
import { AccountRole } from "@/types/account";

/**
 * lib/accounts/reset.ts
 * ---------------------------------------------------------------------
 * requestPasswordReset always returns { success: true } regardless of
 * whether the email/role combination matches a real account — this is
 * deliberate, to avoid letting the reset form be used to check which
 * emails have accounts. The actual email is only sent when a match is
 * found; a non-match just silently does nothing.
 * ---------------------------------------------------------------------
 */

export async function requestPasswordReset(email: string, role: AccountRole): Promise<{ success: true }> {
  const account = await accountStore.findByEmail(email.trim().toLowerCase());

  if (account && account.role === role) {
    const { rawToken } = await createResetToken(account.id);
    const resetUrl = `${siteConfig.brand.baseUrl}/reset-password?token=${rawToken}`;
    await sendPasswordResetEmail(account.email, resetUrl);
  }

  // Always success, on purpose — see file header.
  return { success: true };
}

export interface CompleteResetResult {
  success: boolean;
  error?: string;
  role?: AccountRole;
}

export async function completePasswordReset(
  rawToken: string,
  newPassword: string
): Promise<CompleteResetResult> {
  if (newPassword.length < 8) {
    return { success: false, error: "Password must be at least 8 characters." };
  }

  const valid = await findValidResetToken(rawToken);
  if (!valid) {
    return { success: false, error: "This reset link is invalid or has expired. Request a new one." };
  }

  const account = await accountStore.findById(valid.accountId);
  if (!account) {
    return { success: false, error: "This reset link is invalid or has expired. Request a new one." };
  }

  const passwordHash = await hashPassword(newPassword);
  await accountStore.updatePassword(account.id, passwordHash);
  await markResetTokenUsed(rawToken);

  return { success: true, role: account.role };
}
