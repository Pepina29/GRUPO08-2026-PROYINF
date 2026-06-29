import { API_ENDPOINTS } from '@/config/api';

export interface LoginData {
  rut: string; // Cambiado de number a string
  password: string;
}

export interface RegisterData {
  rut: string; // Cambiado de number a string
  nombre: string;
  apellido: string;
  email: string;
  password: string;
}

export interface User {
  rut: string; // Cambiado de number a string
  nombre_cliente: string;
  apellido_cliente: string;
  email_cliente: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Función para validar formato de RUT chileno
 * Acepta: 12345678-9 o 12.345.678-9
 */
export function validarFormatoRut(rut: string): boolean {
  const rutLimpio = rut.replace(/\./g, '').replace(/\s/g, '');
  const regex = /^(\d{1,8})-([0-9kK])$/;
  return regex.test(rutLimpio);
}

/**
 * Función para calcular dígito verificador de RUT chileno
 */
export function calcularDV(rutSinDV: string): string {
  const rutNumeros = rutSinDV.replace(/\./g, '').replace(/-/g, '');

  let suma = 0;
  let multiplicador = 2;

  for (let i = rutNumeros.length - 1; i >= 0; i--) {
    suma += parseInt(rutNumeros[i], 10) * multiplicador;
    multiplicador = multiplicador === 7 ? 2 : multiplicador + 1;
  }

  const resto = 11 - (suma % 11);

  if (resto === 11) return '0';
  if (resto === 10) return 'K';
  return resto.toString();
}

/**
 * Función para validar dígito verificador de RUT
 */
export function validarRut(rut: string): boolean {
  if (!validarFormatoRut(rut)) return false;

  const rutLimpio = rut.replace(/\./g, '').replace(/-/g, '');
  const dvIngresado = rutLimpio.slice(-1).toUpperCase();
  const rutNumeros = rutLimpio.slice(0, -1);

  const dvCalculado = calcularDV(rutNumeros);

  return dvIngresado === dvCalculado;
}

/**
 * Función auxiliar para formatear el número del RUT con puntos.
 * Evita usar una expresión regular con posible backtracking.
 *
 * Entrada: 12345678
 * Salida: 12.345.678
 */
function formatearNumeroRut(numero: string): string {
  const partes: string[] = [];

  for (let i = numero.length; i > 0; i -= 3) {
    const inicio = Math.max(i - 3, 0);
    partes.unshift(numero.slice(inicio, i));
  }

  return partes.join('.');
}

/**
 * Función para formatear RUT con puntos y guión
 * Entrada: 123456789 o 12345678-9
 * Salida: 12.345.678-9
 */
export function formatearRut(rut: string): string {
  // Remover puntos, guiones y espacios existentes
  const rutLimpio = rut.replace(/\./g, '').replace(/-/g, '').replace(/\s/g, '');

  if (rutLimpio.length < 2) return rut;

  // Separar número y dígito verificador
  const dv = rutLimpio.slice(-1);
  const numero = rutLimpio.slice(0, -1);

  // Formatear con puntos de derecha a izquierda cada 3 dígitos
  const numeroFormateado = formatearNumeroRut(numero);

  return `${numeroFormateado}-${dv}`;
}

/**
 * Función para limpiar RUT (mantener solo números, K y guión)
 */
export function limpiarRut(rut: string): string {
  return rut.replace(/[^0-9kK-]/g, '');
}

// Login
export const login = async (data: LoginData): Promise<ApiResponse<User>> => {
  try {
    // Validar RUT antes de enviar
    if (!validarRut(data.rut)) {
      return {
        success: false,
        error: 'El RUT ingresado no es válido',
      };
    }

    const response = await fetch(API_ENDPOINTS.login, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        rut: formatearRut(data.rut),
        password: data.password,
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: result.error || 'Error al iniciar sesión',
      };
    }

    return {
      success: true,
      data: result.user,
    };
  } catch (error) {
    console.error('Error en login:', error);
    return {
      success: false,
      error: 'Error de conexión con el servidor',
    };
  }
};

// Registro
export const register = async (data: RegisterData): Promise<ApiResponse<User>> => {
  try {
    // Validar RUT antes de enviar
    if (!validarRut(data.rut)) {
      return {
        success: false,
        error: 'El RUT ingresado no es válido',
      };
    }

    const response = await fetch(API_ENDPOINTS.register, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        rut: formatearRut(data.rut),
        nombre: data.nombre,
        apellido: data.apellido,
        email: data.email,
        password: data.password,
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: result.error || 'Error al registrarse',
      };
    }

    return {
      success: true,
      data: result.user,
    };
  } catch (error) {
    console.error('Error en registro:', error);
    return {
      success: false,
      error: 'Error de conexión con el servidor',
    };
  }
};