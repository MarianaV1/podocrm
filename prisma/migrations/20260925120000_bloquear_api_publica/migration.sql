-- Bloquea el acceso directo a los datos por la API REST de Supabase (PostgREST).
--
-- Supabase da por defecto permisos completos sobre el esquema `public` a los
-- roles `anon` y `authenticated`, y las tablas que crea Prisma no tienen RLS.
-- Si la API de datos estuviera activa, cualquiera con la llave pública podría
-- leer o borrar todo sin pasar por la app.
--
-- La app no se ve afectada: Prisma se conecta como el dueño de las tablas
-- (`postgres`), que no está sujeto a RLS.

-- 1) RLS activado y sin políticas: nadie más que el dueño ve filas.
ALTER TABLE "Paciente" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "HojaClinica" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Cita" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Podologa" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Servicio" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Producto" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Pago" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "MovimientoCaja" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "GoogleConexion" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "_prisma_migrations" ENABLE ROW LEVEL SECURITY;

-- 2) Quitar los permisos de los roles públicos, también para tablas futuras.
--    (Solo existen en Supabase; en otro Postgres este bloque no hace nada.)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon')
     AND EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
    EXECUTE 'REVOKE ALL ON ALL TABLES IN SCHEMA public FROM anon, authenticated';
    EXECUTE 'REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM anon, authenticated';
    EXECUTE 'REVOKE ALL ON ALL FUNCTIONS IN SCHEMA public FROM anon, authenticated';
    EXECUTE 'ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON TABLES FROM anon, authenticated';
    EXECUTE 'ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON SEQUENCES FROM anon, authenticated';
    EXECUTE 'ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON FUNCTIONS FROM anon, authenticated';
  END IF;
END
$$;
