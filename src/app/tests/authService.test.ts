import { describe, expect, it } from "vitest";
import { createPasswordSalt, hashPassword, verifyPassword } from "../services/authService";
import type { UserAccount } from "../components/types";

describe("authService", () => {
  it("verifica senha com hash local e salt", () => {
    const salt = createPasswordSalt();
    const user: UserAccount = {
      id: "u1",
      name: "Teste",
      email: "teste@kryostock.com",
      passwordSalt: salt,
      passwordHash: hashPassword("1234", salt),
      createdAt: "2026-01-01",
      updatedAt: "2026-01-01",
    };
    expect(verifyPassword(user, "1234")).toBe(true);
    expect(verifyPassword(user, "errada")).toBe(false);
  });
});
