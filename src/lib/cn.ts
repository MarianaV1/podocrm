import clsx, { type ClassValue } from "clsx";

// Compone clases de Tailwind condicionalmente.
export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}
