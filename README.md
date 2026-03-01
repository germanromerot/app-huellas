# Huellas – Sistema de Gestión de Turnos

**Huellas** es una aplicación web para la gestión de turnos de una veterinaria y centro de estética animal. Permite a los clientes reservar turnos online y a los administradores gestionar las reservas desde un panel privado.

El sistema fue desarrollado utilizando HTML, CSS y JavaScript modular (sin frameworks), con persistencia de datos en el navegador mediante localStorage.

## Características

- Reserva de turnos online
- Panel de administración
- Control de disponibilidad horaria
- Prevención de solapamientos
- Validaciones de negocio
- Persistencia en navegador
- Arquitectura modular en Vanilla JavaScript

## Tecnologías Utilizadas

- HTML5
- CSS3
- JavaScript (ES6 modular)
- LocalStorage


## 📁 Estructura del Proyecto
```
admin.css
admin.html
index.css
index.html
img/
src/
  app.js                   // Lógica principal de la homepage (UI, reservas y navegación).
  admin.js                 // Lógica del panel administrador (login, filtros y gestión de reservas).
  core/
    config/
      constants.js         // Configuración global: claves, horarios, tipos y valores por defecto.
      catalog.js           // Listado de servicios y profesionales.
      auth.js              // Credenciales para acceso admin.
    shared/
      datetime.js          // Utilidades comunes de fechas y horas.
      text.js              // Utilidades de texto y sanitización para render HTML.
      sort.js              // Utilidades de ordenamiento de colecciones de reservas.
    reservations/
      rules.js             // Reglas y validaciones de negocio para reservas.
      slots.js             // Cálculo de franjas horarias y disponibilidad.
      overlap.js           // Reglas para detectar solapamientos entre reservas.
      factory.js           // Construcción y normalización de objetos de reserva.
      filters.js           // Filtrado de reservas.
      status.js            // Manejo de estados de reserva y cancelaciones.
    storage/
      reservationsStore.js // Persistencia de reservas en almacenamiento local.
      sessionStore.js      // Persistencia y consulta de sesión admin.
    seed/
      seedReservations.js  // Generación y carga inicial de datos de ejemplo.
__tests__/
  core/
    shared/
      datetime.test.js
      text.test.js
      sort.test.js
    reservations/
      rules.test.js
      slots.test.js
      overlap.test.js
      factory.test.js
      filters.test.js
      status.test.js
```

## Sitio Público (`index.html`)

El sitio público permite a los usuarios conocer los servicios y reservar turnos.

### Secciones

#### Home
- Navegación principal
- Banner
- Carrusel de imágenes

#### Servicios
- Listado de servicios disponibles

#### Profesionales
- Listado de profesionales
- Filtro por tipo:
  - Veterinaria
  - Estética

#### Reserva de Turnos
- Formulario de reserva
- Selección de:
  - Servicio
  - Profesional
  - Fecha
  - Hora
- Validaciones automáticas
- Confirmación previa
- Modal de reserva exitosa

---

## Panel Administrador (`admin.html`)

Permite administrar todas las reservas registradas.

### Funcionalidades

#### Autenticación
- Login de administrador

#### Gestión de reservas
- Listado de reservas
- Filtros:
  - Por servicio
  - Por fecha
  - Búsqueda por texto

#### Indicadores
- Total de reservas
- Reservas de veterinaria
- Reservas de estética

#### Acciones
- Cancelación de reservas

#### Estados vacíos
- Mensaje contextual cuando no hay reservas que coincidan con los filtros seleccionados

---

## Funcionalidades Técnicas

### Gestión de Turnos

- Reserva por servicio, profesional, fecha y hora
- Control de disponibilidad por franja horaria
- Prevención de turnos superpuestos

### Validaciones de Negocio

- Campos obligatorios
- Fecha futura obligatoria
- Horario de atención válido
- Compatibilidad servicio-profesional

### Validación de Teléfono

Se valida y normaliza el formato de teléfonos uruguayos: `09N NNN NNN`.

Ejemplos válidos:
`099 123 456`
`99 123 456`
`+598 99 123 456`
`598 99 123 456`