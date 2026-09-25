// Modo demo: se activa con la variable de entorno DEMO=true (solo en el deploy
// de portafolio). Cambia el comportamiento para que un reclutador pueda probar
// todo sin registrarse ni conectar Google: login de invitado + datos ficticios.

export const IS_DEMO = process.env.DEMO === "true";

// Credenciales del usuario invitado (deben existir en Supabase Auth de la demo).
// Sin valores por defecto: si faltan, el botón de la demo muestra un error.
export const DEMO_EMAIL = process.env.DEMO_EMAIL ?? "";
export const DEMO_PASSWORD = process.env.DEMO_PASSWORD ?? "";
