# Calc — Calculadora de Horas Sexagesimal y Decimal

Aplicación web responsiva para sumar y restar bloques de tiempo en formato **sexagesimal (`HH:MM`)** y **decimal (`0.00 h`)** al instante.

## Características

- **Entrada sexagesimal desde `00:00`**: empieza siempre en `00:00` y desplaza los dígitos de derecha a izquierda (`1` → `00:01`, `115` → `01:15`, `1150` → `11:50`).
- **Modo Normal (`HH:MM`) y Decimal (`0.00`)**: cambia entre ambos modos conservando el valor en pantalla y viendo la equivalencia en tiempo real.
- **Botones de acceso rápido**: `+15m`, `+30m`, `+1h` y `+2h`.
- **Bloques registrados y resumen en vivo**:
  - Tarjetas de **Sumado (+)**, **Restado (−)** y **Balance neto** (en `HH:MM` y decimal).
  - **Invertir bloque con un clic**: pulsa el botón `+` / `−` de cualquier registro para invertirlo y recalcular el total al instante.
  - **Deshacer (`↶` / `Ctrl+Z`)**: historial de deshacer para añadir, invertir, eliminar o limpiar bloques.
  - **Copiar resumen** y **exportar a CSV** (compatible con Excel/Calc en UTF-8).
  - Persistencia automática en el navegador (`localStorage`).
- **Calcular bloque por hora inicio → fin**: desplegable para calcular la duración entre dos horas (incluidos turnos nocturnos que cruzan la medianoche) y sumarla o restarla como bloque.
- **Light y Dark mode**: detección automática del sistema y cambio manual persistente.
- **Compatible con PC, iPad y móvil**: diseño adaptable y listo para instalar como Web App (`manifest.json`).

## Atajos de teclado

- `0–9`: escribir dígitos
- `+` / `-`: sumar o restar bloque
- `Enter` o `=`: registrar bloque actual
- `Backspace`: borrar último dígito
- `Delete` / `Esc`: limpiar entrada (`C`)
- `M`: alternar entre Normal (`HH:MM`) y Decimal (`0.00`)
- `Ctrl+Z`: deshacer

## Ejecución local y pruebas

```bash
# Servir en local
python3 -m http.server 8080

# Ejecutar pruebas unitarias
node --test tests/calculator.test.js
```

## Licencia

Distribuido bajo **GNU General Public License v3.0 (GPL-3.0)**. Consulta el archivo [LICENSE](./LICENSE).
