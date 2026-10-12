# Requerimientos de producto

## Objetivo
Mantener visible la navegación administrativa para usuarios con rol `admin` en todas las rutas de la aplicación que puedan usar, incluida `/propiedades`, y ocultarla para usuarios sin ese rol.

## Requisitos funcionales

### RF-01: Visibilidad de navegación administrativa para administradores
La navegación administrativa debe mostrarse a usuarios autenticados con rol `admin` en todas las rutas que puedan usar, tengan o no prefijo `/admin`.

**Criterios de aceptación:**
- Dado un usuario autenticado con rol admin, cuando accede directamente a `/propiedades`, entonces ve la navegación administrativa.
- Dado un usuario autenticado con rol admin, cuando navega entre rutas de la aplicación que puede usar, incluidas rutas sin prefijo `/admin`, entonces la navegación administrativa permanece visible.
- Dado un usuario autenticado con rol admin, cuando recarga una ruta de la aplicación que puede usar, entonces la navegación administrativa sigue visible.

### RF-02: Restricción de visibilidad según el rol
La navegación administrativa debe mostrarse únicamente a usuarios con rol `admin`.

**Criterios de aceptación:**
- Dado un usuario autenticado sin rol admin, cuando accede a una ruta que puede usar, entonces no ve la navegación administrativa.
- Dado un usuario autenticado sin rol admin, cuando recarga esa ruta o navega a otra que puede usar, entonces la navegación administrativa continúa oculta.

## Atributos de calidad
- **Seguridad:** respetar los roles existentes.
- **Rendimiento:** no introducir cargas adicionales perceptibles.
- **Accesibilidad:** conservar el comportamiento accesible existente.
- **Mantenibilidad:** mantener coherente la condición de visibilidad.

## Restricciones y reglas de negocio
- Mantener el stack Next.js 16, NextAuth v5 y los roles `admin`/`user`.
- No alterar permisos ni crear rutas nuevas.

## Fuera de alcance
- Cambios en el contenido, diseño u orden de la navegación.
- Modificación de roles o permisos.
