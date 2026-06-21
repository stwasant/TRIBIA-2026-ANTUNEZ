# ⚽ TRIBIA 2026 — Pronósticos Mundial de Fútbol

Aplicación web para gestionar pronósticos del **Mundial de Fútbol 2026** (USA · México · Canadá).

🔗 **Demo:** https://[tu-usuario].github.io/TRIBIA-2026-ANTUNEZ/

---

## 🎯 Características

- **👥 Múltiples usuarios** — Crea participantes con nombre y avatar emoji
- **⚽ Todos los partidos** — Los 104 partidos del Mundial (grupos + eliminatorias)
- **🎯 Pronósticos** — Predice el marcador de cada partido antes de que empiece
- **🏆 Ranking en tiempo real** — Tabla de posiciones con puntos actualizados
- **⚙️ Panel Admin** — Ingresa resultados y calcula puntos automáticamente
- **📥 Importar/Exportar** — Sincroniza datos entre dispositivos via JSON
- **💾 Persistencia local** — Datos guardados en localStorage

## 📊 Sistema de Puntos

| Resultado | Puntos |
|-----------|--------|
| 🎯 Marcador exacto (ej: predices 2-1, sale 2-1) | **3 puntos** |
| ✅ Solo el ganador correcto (ej: predices 1-0, sale 3-0) | **1 punto** |
| ❌ Pronóstico fallido | **0 puntos** |

## 🚀 Instalación local

```bash
git clone https://github.com/[tu-usuario]/TRIBIA-2026-ANTUNEZ.git
cd TRIBIA-2026-ANTUNEZ
npm install
npm run dev
```

## 🌐 Deploy en GitHub Pages

El proyecto se despliega automáticamente en GitHub Pages al hacer push a `main`.

1. Ve a **Settings > Pages** en tu repositorio
2. Selecciona **Source: GitHub Actions**
3. Haz push a `main` y espera el workflow

## 🛠️ Tecnologías

- **React 18** + **Vite**
- **Tailwind CSS** — Estilos
- **Zustand** — Estado global
- **React Router** — Navegación
- **localStorage** — Persistencia de datos

## 📱 Páginas

| Ruta | Descripción |
|------|-------------|
| `/` | 🏆 Tabla de posiciones / Ranking |
| `/partidos` | ⚽ Todos los partidos por grupo/fase |
| `/pronosticos` | 🎯 Mis pronósticos / ver de otros |
| `/usuarios` | 👥 Gestión de participantes |
| `/admin` | ⚙️ Resultados + Importar/Exportar |

---

Hecho con ❤️ para la familia Antunez · Mundial 2026
