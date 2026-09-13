import { PrismaClient } from "@prisma/client";
import { sembrarDemo } from "../src/lib/seed-demo";

// CANDADO DE SEGURIDAD: el seed BORRA todos los datos, así que solo corre si
// DEMO=true. Nunca debe ejecutarse contra la base de datos del cliente.
if (process.env.DEMO !== "true") {
  console.error(
    "❌ El seed solo corre en modo demo. Ejecuta con DEMO=true y la URL de la base de datos DEMO."
  );
  process.exit(1);
}

const prisma = new PrismaClient();

sembrarDemo(prisma)
  .then((resumen) => {
    console.log("✅ Datos de demo sembrados:", resumen);
  })
  .catch((e) => {
    console.error("Error al sembrar la demo:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
