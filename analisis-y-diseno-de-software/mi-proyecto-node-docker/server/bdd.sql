-- ======================================================================
-- Re-init limpio (en orden correcto por FKs)
-- ======================================================================
DROP TABLE IF EXISTS user_simulation CASCADE;
DROP TABLE IF EXISTS solicitud_prestamo CASCADE;
DROP TABLE IF EXISTS usuario CASCADE;

-- Para UUID (gen_random_uuid)
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ======================================================================
-- Tabla: usuario
-- ======================================================================
CREATE TABLE usuario (
  rut_cliente       VARCHAR(12) PRIMARY KEY,  -- Formato: 12.345.678-9
  nombre_cliente    VARCHAR(50)  NOT NULL,
  apellido_cliente  VARCHAR(50)  NOT NULL,
  email             VARCHAR(100) NOT NULL UNIQUE,
  contrasena        TEXT         NOT NULL,
  autenticador      VARCHAR(6),
  
  -- NUEVAS COLUMNAS PARA LOS DOCUMENTOS (BLOBs en PostgreSQL)
  doc_frontal_bin   BYTEA,       -- El archivo binario de la cara frontal
  doc_frontal_mime  VARCHAR(50), -- El formato (ej: 'image/png')
  doc_trasera_bin   BYTEA,       -- El archivo binario de la cara trasera
  doc_trasera_mime  VARCHAR(50), -- El formato (ej: 'image/png')
  
  created_at        TIMESTAMPTZ  NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ  NOT NULL DEFAULT now()
);

-- Actualiza updated_at automáticamente
CREATE OR REPLACE FUNCTION set_updated_at() RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_usuario_updated ON usuario;
CREATE TRIGGER trg_usuario_updated
BEFORE UPDATE ON usuario
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ======================================================================
-- Función: Validar RUT chileno (CORREGIDA)
-- ======================================================================
CREATE OR REPLACE FUNCTION validar_rut(rut_completo VARCHAR) 
RETURNS BOOLEAN AS $$
DECLARE
  rut_numeros   VARCHAR;
  dv_ingresado  VARCHAR;
  dv_calculado  VARCHAR;
  suma          INT := 0;
  multiplicador INT := 2;
  i             INT;
  resto         INT;
BEGIN
  -- Remover puntos y guión
  rut_completo := REPLACE(REPLACE(rut_completo, '.', ''), '-', '');
  
  -- Largo mínimo: 1 número + 1 DV
  IF LENGTH(rut_completo) < 2 THEN
    RETURN FALSE;
  END IF;

  -- Separar cuerpo y DV
  rut_numeros  := SUBSTRING(rut_completo FROM 1 FOR LENGTH(rut_completo) - 1);
  dv_ingresado := UPPER(SUBSTRING(rut_completo FROM LENGTH(rut_completo) FOR 1));

  -- Validar que el cuerpo sea numérico
  IF rut_numeros !~ '^[0-9]+$' THEN
    RETURN FALSE;
  END IF;

  -- Cálculo correcto del DV (de derecha a izquierda)
  FOR i IN REVERSE LENGTH(rut_numeros)..1 LOOP
    suma := suma + (SUBSTRING(rut_numeros FROM i FOR 1)::INT * multiplicador);
    
    -- Ciclo 2,3,4,5,6,7,2,3,4...
    multiplicador := multiplicador + 1;
    IF multiplicador > 7 THEN
      multiplicador := 2;
    END IF;
  END LOOP;

  resto := 11 - (suma % 11);

  IF resto = 11 THEN
    dv_calculado := '0';
  ELSIF resto = 10 THEN
    dv_calculado := 'K';
  ELSE
    dv_calculado := resto::VARCHAR;
  END IF;

  RETURN dv_ingresado = dv_calculado;
END;
$$ LANGUAGE plpgsql IMMUTABLE;


-- Trigger para validar RUT antes de insertar/actualizar
CREATE OR REPLACE FUNCTION validar_rut_trigger() RETURNS TRIGGER AS $$
BEGIN
  IF NOT validar_rut(NEW.rut_cliente) THEN
    RAISE EXCEPTION 'RUT_INVALIDO: El dígito verificador no es válido';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_validar_rut ON usuario;
CREATE TRIGGER trg_validar_rut
BEFORE INSERT OR UPDATE ON usuario
FOR EACH ROW EXECUTE FUNCTION validar_rut_trigger();

-- ======================================================================
-- Tabla: solicitud_prestamo
-- ======================================================================
CREATE TABLE solicitud_prestamo (
  id_solicitud     SERIAL PRIMARY KEY,
  rut_cliente      VARCHAR(12) NOT NULL REFERENCES usuario(rut_cliente) ON DELETE CASCADE,
  monto_cliente    NUMERIC(12,2) NOT NULL CHECK (monto_cliente > 0),
  cant_cuotas      INT NOT NULL CHECK (cant_cuotas > 0),
  fecha_solicitud  TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Índices útiles
CREATE INDEX IF NOT EXISTS idx_solicitud_rut ON solicitud_prestamo(rut_cliente);
CREATE INDEX IF NOT EXISTS idx_solicitud_fecha ON solicitud_prestamo(fecha_solicitud);

-- Trigger updated_at
DROP TRIGGER IF EXISTS trg_solicitud_updated ON solicitud_prestamo;
CREATE TRIGGER trg_solicitud_updated
BEFORE UPDATE ON solicitud_prestamo
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ======================================================================
-- Tabla: user_simulation  (simulaciones guardadas por usuario)
-- ======================================================================
CREATE TABLE user_simulation (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rut_cliente   VARCHAR(12) NOT NULL REFERENCES usuario(rut_cliente) ON DELETE CASCADE,
  data          JSONB NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_user_simulation_rut ON user_simulation(rut_cliente);
CREATE INDEX IF NOT EXISTS idx_user_simulation_created ON user_simulation(created_at);

-- Límite de 5 simulaciones por usuario (concurrency-safe)
CREATE OR REPLACE FUNCTION enforce_sim_limit() RETURNS TRIGGER AS $$
DECLARE
  cnt INT;
BEGIN
  SELECT COUNT(*) INTO cnt FROM user_simulation WHERE rut_cliente = NEW.rut_cliente;
  IF cnt >= 5 THEN
    RAISE EXCEPTION 'SIM_LIMIT_REACHED';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_enforce_sim_limit ON user_simulation;
CREATE TRIGGER trg_enforce_sim_limit
BEFORE INSERT ON user_simulation
FOR EACH ROW EXECUTE FUNCTION enforce_sim_limit();