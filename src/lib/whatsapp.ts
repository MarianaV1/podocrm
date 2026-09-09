/**
 * Construye un enlace de WhatsApp (wa.me) a partir de un teléfono.
 * Asume números de México: si trae 10 dígitos, antepone el código de país 52.
 * Si ya viene con código de país (12+ dígitos), lo usa tal cual.
 * Devuelve null si no hay un número usable.
 */
export function whatsappUrl(
  telefono: string | null | undefined
): string | null {
  if (!telefono) return null;
  const digits = telefono.replace(/\D/g, "");
  if (digits.length < 10) return null;
  const conLada = digits.length === 10 ? `52${digits}` : digits;
  return `https://wa.me/${conLada}`;
}
