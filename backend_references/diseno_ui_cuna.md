# Diseño de UI/UX - Módulo Cuna

## 1. Concepto Visual y Estilo
**Filosofía:** "Serenidad y Eficiencia".
El diseño debe transmitir calma (contexto de cuidado de niños) pero con una eficiencia administrativa absoluta.

*   **Estilo Base:** Glassmorphism moderno sobre fondo limpio.
*   **Paleta de Colores:**
    *   *Primario:* Soft Teal / Aquamarine (Calma, Cuidado).
    *   *Secundario:* Deep Navy (Autoridad, Administrativo - Heredado del sistema principal).
    *   *Acento:* Coral Suave (Para alertas y notificaciones importantes sin ser agresivo).
    *   *Fondo:* Off-white o gradientes muy sutiles para evitar fatiga visual.
*   **Tipografía:** Inter o Outfit (Moderna, legible, geométrica).
*   **Componentes Clave:** Tarjetas con sombra suave, bordes redondeados (20px), botones con micro-interacciones.

---

## 2. Mapa de Navegación (Sitemap)

### Área Común (Layout)
*   Sidebar / Navbar colapsable.
*   Indicador de Rol activo (Servidora vs Responsable).
*   Acceso rápido a "Inbox" (Icono de campana/mensaje con badge).

### Rol: Servidora de Cuna
1.  **Home / Mi Tablero**
    *   Tarjeta Hero: "Tu próximo turno" (Fecha, Compañera, Estado).
    *   Resumen del Mes: Calendario mini visualizando sus asignaciones.
    *   Accesos rápidos: "Solicitar Cambio", "Ver Calendario Completo".
2.  **Mis Turnos (Calendario)**
    *   Vista de Lista o Calendario.
    *   Estado de cada turno: "Confirmado", "Pendiente", "Realizado".
3.  **Inbox (Comunicación)**
    *   Chat directo con Responsable.
    *   Hilos separados por contexto (ej. "Solicitud cambio 12 Oct").

### Rol: Responsable de Cuna
1.  **Dashboard de Mando**
    *   KPIs: % Cobertura del mes, Solicitudes pendientes, Alertas de escasez.
    *   Timeline: Próximos 2 turnos (Viernes/Domingo) con estado de staff.
2.  **Planificador Maestro (The Scheduler)**
    *   Vista de Calendario Grande.
    *   Funcionalidad Drag & Drop para asignar servidoras.
    *   Indicadores visuales de conflictos (Rojo si < 2 personas).
    *   Botón "Generar Borrador Automático".
3.  **Directorio de Personal**
    *   Lista de servidoras activas.
    *   Historial individual (veces servidas este mes).
4.  **Centro de Solicitudes & Inbox**
    *   Bandeja unificada de mensajes.
    *   Panel de aprobación/rechazo de cambios.
5.  **Bitácora de Auditoría**
    *   Timeline vertical de acciones del sistema.

---

## 3. Flujos Críticos (Wireflow)

### Flujo A: Servidora solicita cambio
1.  Servidora entra a **"Mis Turnos"**.
2.  Selecciona el turno del Viernes 15.
3.  Clic en **"Solicitar Cambio"**.
4.  Modal: Selecciona motivo y (opcional) propone reemplazo.
5.  Sistema: Crea hilo en **Inbox** y notifica a Responsable.
6.  Estado del turno cambia a "Solicitud Pendiente" (Amarillo).

### Flujo B: Responsable genera mes
1.  Entra a **"Planificador"**.
2.  Selecciona Mes (ej. Noviembre).
3.  Clic **"Generar Propuesta"**.
4.  Sistema llena slots respetando reglas.
5.  Responsable ajusta manualmente (Drag & drop).
6.  Clic **"Publicar Calendario"**.
7.  Sistema notifica a todas las servidoras asignadas.

---

## 4. Componentes UI Específicos

*   **La Tarjeta de Turno (Turn Card):**
    *   Muestra Fecha y Hora.
    *   Avatares de las 2 servidoras.
    *   Estado (Icono).
    *   Acciones contextuales (según rol).
*   **El Chat Contextual:**
    *   Header: "Asunto: Turno Viernes 15".
    *   Body: Mensajes tipo chat moderno (burbujas).
    *   Footer: Input de texto + Botones de acción rápida (Aprobar/Rechazar para Responsable).
