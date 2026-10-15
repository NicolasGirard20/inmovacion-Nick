CREATE TABLE "horarios_base_abogacia" (
    "id" TEXT NOT NULL,
    "diaSemana" INTEGER NOT NULL,
    "horaInicio" VARCHAR(5) NOT NULL,
    "horaFin" VARCHAR(5) NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "horarios_base_abogacia_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "horarios_base_abogacia_diaSemana_key"
ON "horarios_base_abogacia"("diaSemana");

CREATE TABLE "bloques_ocupados_abogacia" (
    "id" TEXT NOT NULL,
    "fecha" DATE NOT NULL,
    "horaInicio" VARCHAR(5) NOT NULL,
    "horaFin" VARCHAR(5) NOT NULL,
    "motivo" VARCHAR(160),
    "creadoPorId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bloques_ocupados_abogacia_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "bloques_ocupados_abogacia_fecha_idx"
ON "bloques_ocupados_abogacia"("fecha");

ALTER TABLE "bloques_ocupados_abogacia"
ADD CONSTRAINT "bloques_ocupados_abogacia_creadoPorId_fkey"
FOREIGN KEY ("creadoPorId") REFERENCES "users"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;
