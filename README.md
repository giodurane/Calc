# Calc — Calculadora de Horas Sexagesimal y Decimal

[![License: GPL v3](https://img.shields.io/badge/License-GPLv3-blue.svg)](./LICENSE)
[![GitHub Pages](https://img.shields.io/badge/Demo-GitHub%20Pages-1d4ed8.svg)](https://giodurane.github.io/Calc/)
[![PWA Ready](https://img.shields.io/badge/PWA-iOS%20%7C%20Android%20%7C%20Desktop-0f9d58.svg)](./manifest.json)
[![Zero Dependencies](https://img.shields.io/badge/Dependencies-0-5a6270.svg)](#arquitectura)

Aplicación web progresiva (**PWA**) ligera, rápida y sin dependencias para sumar, restar y convertir bloques de tiempo en formato **sexagesimal (`HH:MM`)** y **decimal (`0.00 h`)** en tiempo real.

👉 **Para utilizarla:** [https://giodurane.github.io/Calc/](https://giodurane.github.io/Calc/)

---

## Características principales

- **Entrada sexagesimal natural desde `00:00`**: desplazamiento de dígitos de derecha a izquierda sin necesidad de escribir `:` manualmente, con normalización automática de minutos `≥ 60`.
- **Conversión simultánea**: alterna en cualquier momento entre **Normal (`HH:MM`)** y **Decimal (`0.00`)** conservando el valor en pantalla y visualizando su equivalencia al instante.
- **Accesos rápidos**: botones dedicados `+15m`, `+30m`, `+1h` y `+2h` para registrar o acumular bloques frecuentes en un toque.
- **Libro de bloques registrados**:
  - Tarjetas de resumen en vivo: **Sumado (+)**, **Restado (−)** y **Balance neto** (en `HH:MM` y decimal).
  - **Inversión instantánea**: haz clic sobre el signo `+` / `−` de cualquier bloque para invertirlo y recalcular el total al momento.
  - **Deshacer (`↶` / `Ctrl+Z`)**: historial de hasta 50 acciones para revertir altas, inversiones, borrados o limpiezas.
  - **Exportación**: copia del resumen al portapapeles y descarga en **CSV (UTF-8 con BOM)** compatible con Excel y LibreOffice Calc.
  - **Persistencia local**: los bloques y preferencias de tema se guardan automáticamente en `localStorage`.
- **Cálculo por rango horario (`inicio → fin`)**: desplegable para calcular la duración entre dos horas (incluyendo turnos nocturnos que cruzan la medianoche, marcados con `+1d`).
- **Modo Claro y Oscuro**: detección automática de la preferencia del sistema operativo y selector manual persistente.
- **Multidispositivo y Offline (PWA)**: interfaz adaptable para PC, iPad y móvil, instalable en la pantalla de inicio y operativa sin conexión mediante Service Worker.

---

## Cómo funciona la entrada `00:00`

En modo **Normal (`HH:MM`)**, la pantalla siempre parte de `00:00` y los dígitos entran de derecha a izquierda:

| Secuencia tecleada | Pantalla (`HH:MM`) | Equivalencia decimal |
| :--- | :---: | :---: |
| *(inicio)* | `00:00` | `0.00 h` |
| `1` | `00:01` | `0.02 h` |
| `1` `5` | `00:15` | `0.25 h` |
| `1` `1` `5` | `01:15` | `1.25 h` |
| `1` `1` `5` `0` | `11:50` | `11.83 h` |
| `2` `00` | `02:00` | `2.00 h` |

---

## Instalación en móvil, tablet y escritorio

La aplicación está publicada en GitHub Pages lista para instalarse como app independiente (sin barra de navegador y con funcionamiento sin conexión):

- **iOS / iPadOS (Safari):** abre [giodurane.github.io/Calc](https://giodurane.github.io/Calc/), pulsa **Compartir** y selecciona **Añadir a pantalla de inicio**.
- **Android (Chrome / Edge):** abre la URL, pulsa el menú **⋮** y selecciona **Instalar aplicación**.
- **PC (Chrome / Edge):** haz clic en el icono de instalación en la barra de direcciones.

---

## Atajos de teclado

| Tecla | Acción |
| :--- | :--- |
| `0` – `9` | Introducir dígitos |
| `.` o `,` | Separador decimal *(en modo Decimal)* |
| `+` / `-` | Sumar / restar bloque |
| `Enter` o `=` | Registrar bloque actual |
| `Backspace` | Borrar último dígito |
| `Delete` o `Esc` | Limpiar entrada actual (`C`) |
| `M` | Alternar entre Normal (`HH:MM`) y Decimal (`0.00`) |
| `Ctrl+Z` / `⌘+Z` | Deshacer última acción |

---

## Arquitectura

Proyecto construido con **HTML5, CSS3 y JavaScript (ES Modules)** sin frameworks ni pasos de compilación:

```text
Calc/
├── index.html             # Estructura semántica y metadatos PWA
├── manifest.json          # Manifiesto Web App (iOS/Android/Desktop)
├── sw.js                  # Service Worker para caché offline
├── css/
│   └── styles.css         # Sistema de diseño Light/Dark y layout responsivo
├── js/
│   ├── calculator.js      # Motor puro de cálculo sexagesimal/decimal y CSV
│   └── app.js             # Controlador de interfaz, teclado y persistencia
├── assets/
│   ├── icon.svg           # Icono vectorial
│   ├── icon-180.png       # Icono iOS/iPadOS (apple-touch-icon)
│   ├── icon-192.png       # Icono PWA Android
│   └── icon-512.png       # Icono PWA alta resolución / maskable
├── tests/
│   └── calculator.test.js # Pruebas unitarias con node:test
└── LICENSE                # GNU General Public License v3.0
```

---

## Desarrollo local y pruebas

```bash
# Clonar el repositorio
git clone https://github.com/giodurane/Calc.git
cd Calc

# Ejecutar pruebas unitarias (Node.js 18+)
node --test tests/calculator.test.js

# Levantar un servidor estático local
python3 -m http.server 8080
```

---

## Privacidad

Los cálculos y bloques registrados se guardan exclusivamente en tu navegador (`localStorage`) y nunca se envían a ningún servidor. La versión publicada en GitHub Pages utiliza únicamente [GoatCounter](https://www.goatcounter.com/) para estadísticas agregadas de visitas, sin cookies ni rastreo de datos personales.

---

## Autoría y Licencia

Desarrollado por **Giovanny Duran** ([@giodurane](https://github.com/giodurane)).

Este programa es software libre: puedes redistribuirlo y/o modificarlo bajo los términos de la **GNU General Public License v3.0 (GPL-3.0)** publicada por la Free Software Foundation. Consulta el archivo [LICENSE](./LICENSE) para más detalles.
