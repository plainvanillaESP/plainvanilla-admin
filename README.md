# Plain Vanilla Admin Portal

Portal de administración de Plain Vanilla con integración Microsoft 365.

## 🚀 Funcionalidades

- **Autenticación Microsoft** - Login con cuentas de @plainvanilla.ai
- **Gestión de Proyectos** - Crear y gestionar proyectos de clientes
- **Integración Microsoft 365**:
  - SharePoint (documentos)
  - Planner (tareas)
  - Calendar (hitos)
  - Teams (comunicación)

## 📋 Requisitos

- Node.js 20+
- App registrada en Azure AD
- Certificado SSL

## ⚙️ Configuración

1. Copia `.env.example` a `.env`
2. Rellena las credenciales de Azure AD
3. Genera `SESSION_SECRET` con `openssl rand -hex 32`

## 🏃 Desarrollo local

```bash
npm install
npm run dev
```

## 🚢 Deploy

El deploy es automático vía GitHub Actions al hacer push a `main`.

### Configuración inicial del servidor

Ver `docs/SETUP.md` para la configuración inicial.

### Secret necesario en GitHub

`SSH_PRIVATE_KEY` - Clave privada SSH para acceder al servidor.

## 📁 Estructura

```
├── src/
│   ├── index.js      # Servidor Express
│   ├── auth.js       # Autenticación Microsoft
│   └── graph.js      # Microsoft Graph API
├── public/
│   └── admin/        # Frontend React
├── .github/
│   └── workflows/    # GitHub Actions
└── data/             # Datos locales (gitignored)
```

## 🔗 URLs

- **Admin**: https://admin.plainvanilla.ai/admin/
- **Login**: https://admin.plainvanilla.ai/auth/login
- **Health**: https://admin.plainvanilla.ai/health

## 📝 Licencia

Privado - Plain Vanilla Solutions
