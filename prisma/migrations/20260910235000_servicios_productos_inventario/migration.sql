-- Separar "servicios" (con comisión) de "productos de venta" (inventario, sin comisión)
-- SIN perder datos: la tabla actual "Producto" (servicios como Consulta) se renombra a "Servicio".

-- 1) "Producto" actual → "Servicio" (conserva las filas existentes).
ALTER TABLE "Producto" RENAME TO "Servicio";
ALTER TABLE "Servicio" RENAME CONSTRAINT "Producto_pkey" TO "Servicio_pkey";

-- 2) En "Pago", la columna "productoId" (que apuntaba a esos servicios) → "servicioId".
ALTER TABLE "Pago" RENAME COLUMN "productoId" TO "servicioId";
ALTER TABLE "Pago" RENAME CONSTRAINT "Pago_productoId_fkey" TO "Pago_servicioId_fkey";

-- 3) Nueva tabla "Producto" para productos de venta (inventario, utilidad, sin comisión).
CREATE TABLE "Producto" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "precioVenta" DECIMAL(10,2) NOT NULL,
    "costo" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "stock" INTEGER NOT NULL DEFAULT 0,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Producto_pkey" PRIMARY KEY ("id")
);

-- 4) "Pago": columnas para ventas de producto.
ALTER TABLE "Pago" ADD COLUMN "productoId" TEXT;
ALTER TABLE "Pago" ADD COLUMN "utilidad" DECIMAL(10,2) NOT NULL DEFAULT 0;
ALTER TABLE "Pago" ADD COLUMN "cantidad" INTEGER NOT NULL DEFAULT 1;

-- 5) FK de la venta hacia el nuevo "Producto".
ALTER TABLE "Pago" ADD CONSTRAINT "Pago_productoId_fkey" FOREIGN KEY ("productoId") REFERENCES "Producto"("id") ON DELETE SET NULL ON UPDATE CASCADE;
