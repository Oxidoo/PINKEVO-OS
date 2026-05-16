import { describe, expect, it } from "vitest";
import { hasRole, ROLE_GROUPS } from "@/lib/auth/rbac";

describe("hasRole", () => {
  it("allows a role within the allowed set", () => {
    expect(hasRole("admin", ROLE_GROUPS.admins)).toBe(true);
    expect(hasRole("manager", ROLE_GROUPS.managers)).toBe(true);
  });

  it("rejects a role outside the allowed set", () => {
    expect(hasRole("viewer", ROLE_GROUPS.admins)).toBe(false);
    expect(hasRole("sales", ROLE_GROUPS.admins)).toBe(false);
  });

  it("handles null/undefined safely", () => {
    expect(hasRole(null, ROLE_GROUPS.everyone)).toBe(false);
    expect(hasRole(undefined, ROLE_GROUPS.admins)).toBe(false);
  });
});
