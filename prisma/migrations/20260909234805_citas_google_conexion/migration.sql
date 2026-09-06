-- CreateEnum
CREATE TYPE "EstadoCita" AS ENUM ('AGENDADA', 'LLEGO', 'NO_SHOW');

-- CreateTable
CREATE TABLE "Cita" (
    "id" TEXT NOT NULL,
    "googleEventId" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "inicio" TIMESTAMP(3) NOT NULL,
    "fin" TIMESTAMP(3),
    "estado" "EstadoCita" NOT NULL DEFAULT 'AGENDADA',
    "horaLlegada" TIMESTAMP(3),
    "notas" TEXT,
    "pacienteId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Cita_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GoogleConexion" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "accessToken" TEXT NOT NULL,
    "refreshToken" TEXT,
    "expiryDate" TIMESTAMP(3),
    "calendarId" TEXT,
    "calendarNombre" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GoogleConexion_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Cita_googleEventId_key" ON "Cita"("googleEventId");

-- CreateIndex
CREATE INDEX "Cita_inicio_idx" ON "Cita"("inicio");

-- CreateIndex
CREATE UNIQUE INDEX "GoogleConexion_userId_key" ON "GoogleConexion"("userId");

-- AddForeignKey
ALTER TABLE "Cita" ADD CONSTRAINT "Cita_pacienteId_fkey" FOREIGN KEY ("pacienteId") REFERENCES "Paciente"("id") ON DELETE SET NULL ON UPDATE CASCADE;
