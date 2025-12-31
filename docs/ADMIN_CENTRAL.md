# Admin Central (Nolvax)

Este modulo es 100% online. No hay modo offline: el estado siempre se carga y se guarda en Supabase.

## Estado y persistencia
- Tabla remota: `nolvax_admin_state` (row id `main`).
- El estado incluye `companies` y `users`.
- El bloque `meta` (plantillas, biblioteca, auditoria) se guarda dentro de `companies` como un registro oculto:
  - `id = "__meta__"`, `type = "meta"`, `data = meta`.

## Flujo general
1) `auth.js` valida sesion y rol.
2) `core.js` carga el estado remoto y habilita realtime/polling.
3) `app.js` ejecuta renders e init de los modulos.
4) Cada accion llama a `N.data.saveState()` para persistir cambios.

## Modulos principales
- `core.js`: state, formatos, realtime y guardado remoto.
- `auth.js`: login, logout y validacion de rol.
- `users.js`: alta de usuarios, invitaciones, reenviar, filtros y acciones.
- `companies.js`: alta de empresas, store_id, defaults de modulos/suscripcion/soporte.
- `support.js`: tickets, salud del cliente y plantillas.
- `analytics.js`: analitica individual + masiva, biblioteca de productos y plantillas.
- `modules.js`: toggles de modulos por empresa.
- `subscription.js`: plan, renovacion y kill switch por empresa.
- `audit.js`: timeline de auditoria (Panel/Auditoria).
- `vendedor.js`: pipeline de ventas, comisiones y clientes asignados.

## Roles y accesos
- Owner / Superusuario / Staff: acceso a este panel.
- Vendedor: acceso a `vendedor.html` y sus clientes asignados.
- Cliente: nunca accede a este panel.
