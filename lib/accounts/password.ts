import "server-only";
import crypto from "crypto";

/**
 * lib/accounts/password.ts
 * ---------------------------------------------------------------------
 * scrypt (Node's built-in `crypto.scrypt`, RFC 7914) instead of adding
 * bcrypt/argon2 as a dependency — same reasoning already applied to
 * Google auth (lib/integrations/google-auth.ts): a stable, unchanging,
 * well-specified primitive that doesn't need an external package or
 * native bindings. scrypt is a legitimate password-hashing choice (it's
 * memory-hard), not a corners-cut substitute.
 *
 * Stored format: "<salt-hex>:<hash-hex>" — a single string that carries
 * its own salt, so no separate salt column/field is needed anywhere this
 * is stored.
 * ---------------------------------------------------------------------
 */

const KEY_LENGTH = 64;

export function hashPassword(password: string): Promise<string> {
  const salt = crypto.randomBytes(16).toString("hex");
  return new Promise((resolve, reject) => {
    crypto.scrypt(password, salt, KEY_LENGTH, (err, derivedKey) => {
      if (err) return reject(err);
      resolve(`${salt}:${derivedKey.toString("hex")}`);
    });
  });
}

export function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [salt, hashHex] = stored.split(":");
  if (!salt || !hashHex) return Promise.resolve(false);

  return new Promise((resolve, reject) => {
    crypto.scrypt(password, salt, KEY_LENGTH, (err, derivedKey) => {
      if (err) return reject(err);
      const stored = Buffer.from(hashHex, "hex");
      // timingSafeEqual requires equal-length buffers; a length mismatch
      // means the stored hash is malformed/foreign — never a match.
      if (stored.length !== derivedKey.length) return resolve(false);
      resolve(crypto.timingSafeEqual(stored, derivedKey));
    });
  });
}
