import type { Permission, User } from "./types";

export const permissionOrder: Permission[] = [
  "dashboard.view", "clients.view", "clients.manage", "appointments.view",
  "appointments.manage", "kitchens.view", "properties.view", "properties.manage",
  "properties.publish",
];

export const permissionPresets = {
  reception: ["dashboard.view", "clients.view", "clients.manage", "appointments.view", "appointments.manage"],
  commercial: ["dashboard.view", "clients.view", "clients.manage", "appointments.view", "appointments.manage", "kitchens.view"],
  operations: ["dashboard.view", "appointments.view", "appointments.manage", "kitchens.view"],
} satisfies Record<string, Permission[]>;

export function can(user: User, permission: Permission): boolean {
  return user.role === "owner" || user.permissions.includes(permission);
}

export function normalizePermissions(values: Permission[]): Permission[] {
  const selected = new Set(values);
  if (!selected.has("clients.view")) selected.delete("clients.manage");
  if (!selected.has("appointments.view")) selected.delete("appointments.manage");
  if (!selected.has("properties.view")) {
    selected.delete("properties.manage"); selected.delete("properties.publish");
  }
  if (!selected.has("properties.manage")) selected.delete("properties.publish");
  return permissionOrder.filter(permission => selected.has(permission));
}

export function secureTemporaryPassword(random = crypto.getRandomValues.bind(crypto)): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%";
  const bytes = new Uint32Array(20);
  random(bytes);
  return Array.from(bytes, value => alphabet[value % alphabet.length]).join("");
}

export function accessLabel(user: User): string {
  if (user.role === "owner") return "Propietario";
  for (const [key, permissions] of Object.entries(permissionPresets)) {
    if (permissionOrder.filter(item => user.permissions.includes(item)).join() === permissions.join()) {
      return key === "reception" ? "Recepción" : key === "commercial" ? "Comercial" : "Operaciones";
    }
  }
  return "Personalizado";
}
