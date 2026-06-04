import type { UserAccount } from "../components/types";

const PASSWORD_PREFIX = "kryostock-local-hash-v2:";
const LEGACY_PASSWORD_PREFIX = "kryostock-local-hash-v1:";

export function normalizeEmail(value: string): string {
  return value.trim().toLowerCase();
}

export function createPasswordSalt(): string {
  if (typeof crypto !== "undefined" && "getRandomValues" in crypto) {
    const bytes = new Uint32Array(2);
    crypto.getRandomValues(bytes);
    return `${bytes[0].toString(16)}${bytes[1].toString(16)}`;
  }
  return `${Date.now().toString(16)}${Math.floor(performance.now() * 1000).toString(16)}`;
}

function legacyHash(password: string): string {
  let hash = 5381;
  const input = `kryostock:${password}`;
  for (let i = 0; i < input.length; i += 1) hash = (hash * 33) ^ input.charCodeAt(i);
  return `${LEGACY_PASSWORD_PREFIX}${(hash >>> 0).toString(16)}`;
}

export function hashPassword(password: string, salt = "default-local-salt"): string {
  // Hash local com salt por usuário para evitar senha em texto puro neste app portátil.
  // Não substitui autenticação profissional de produção.
  let hash = 2166136261;
  const input = `kryostock:${salt}:${password}`;
  for (let i = 0; i < input.length; i += 1) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return `${PASSWORD_PREFIX}${(hash >>> 0).toString(16)}`;
}

export function verifyPassword(user: UserAccount, password: string): boolean {
  if (user.passwordHash?.startsWith(PASSWORD_PREFIX)) {
    return user.passwordHash === hashPassword(password, user.passwordSalt || "default-local-salt");
  }
  if (user.passwordHash?.startsWith(LEGACY_PASSWORD_PREFIX)) return user.passwordHash === legacyHash(password);
  // Compatibilidade com dados antigos que possuíam password em texto puro.
  return user.password === password;
}

export function hasPasswordHash(user: UserAccount): boolean {
  return Boolean(user.passwordHash?.startsWith(PASSWORD_PREFIX) || user.passwordHash?.startsWith(LEGACY_PASSWORD_PREFIX));
}

export function migrateUserPassword(user: UserAccount): UserAccount {
  if (user.passwordHash?.startsWith(PASSWORD_PREFIX)) return user;
  if (user.password) {
    const { password, ...rest } = user;
    const salt = user.passwordSalt || createPasswordSalt();
    return { ...rest, passwordSalt: salt, passwordHash: hashPassword(password, salt), updatedAt: new Date().toISOString() };
  }
  return user;
}

export function findUserByEmail(users: UserAccount[], email: string): UserAccount | undefined {
  const normalized = normalizeEmail(email);
  return users.find((user) => normalizeEmail(user.email) === normalized);
}
