require('dotenv').config();
const express = require('express');
const session = require('express-session');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const auth = require('./auth');
const graph = require('./graph');

const app = express();
const PORT = process.env.PORT || 3001;

// Asegurar que existen los directorios
const DATA_PATH = process.env.DATA_PATH || './data';
if (!fs.existsSync(DATA_PATH)) {
  fs.mkdirSync(DATA_PATH, { recursive: true });
}

// Middleware
app.use(cors());
app.use(express.json());
app.use(cookieParser());
app.use(session({
  secret: process.env.SESSION_SECRET || 'dev-secret-change-in-prod',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000 // 24 horas
  }
}));

// Servir archivos estáticos del admin
app.use('/admin', express.static(path.join(__dirname, '../public/admin')));

// ============================================
// RUTAS DE AUTENTICACIÓN
// ============================================

// Iniciar login con Microsoft
app.get('/auth/login', async (req, res) => {
  try {
    const authUrl = await auth.getAuthUrl();
    res.redirect(authUrl);
  } catch (error) {
    console.error('Error iniciando login:', error);
    res.status(500).json({ error: 'Error iniciando autenticación' });
  }
});

// Callback de Microsoft después del login
app.get('/auth/callback', async (req, res) => {
  try {
    const { code, error, error_description } = req.query;
    
    if (error) {
      console.error('Error de OAuth:', error, error_description);
      return res.status(400).send(`
        <h1>Error de autenticación</h1>
        <p>${error_description || error}</p>
        <a href="/admin/">Volver</a>
      `);
    }
    
    if (!code) {
      return res.status(400).json({ error: 'No se recibió código de autorización' });
    }

    const tokenResponse = await auth.getTokenFromCode(code);
    const userInfo = await graph.getMe(tokenResponse.accessToken);

    // Verificar dominio permitido
    const allowedDomain = process.env.ALLOWED_DOMAIN;
    const userEmail = userInfo.mail || userInfo.userPrincipalName;
    
    if (allowedDomain && !userEmail?.toLowerCase().endsWith(`@${allowedDomain.toLowerCase()}`)) {
      return res.status(403).send(`
        <html>
        <head><title>Acceso denegado</title></head>
        <body style="font-family: sans-serif; padding: 40px; text-align: center;">
          <h1>⛔ Acceso denegado</h1>
          <p>Solo usuarios de <strong>@${allowedDomain}</strong> pueden acceder.</p>
          <p style="color: gray;">Tu cuenta: ${userEmail}</p>
          <a href="/auth/login">Intentar con otra cuenta</a>
        </body>
        </html>
      `);
    }

    // Guardar en sesión
    req.session.user = {
      id: userInfo.id,
      name: userInfo.displayName,
      email: userEmail,
      accessToken: tokenResponse.accessToken,
      refreshToken: tokenResponse.refreshToken,
      expiresAt: Date.now() + (tokenResponse.expiresIn * 1000)
    };

    res.redirect('/admin/');
  } catch (error) {
    console.error('Error en callback:', error);
    res.status(500).send(`
      <html>
      <head><title>Error</title></head>
      <body style="font-family: sans-serif; padding: 40px; text-align: center;">
        <h1>❌ Error de autenticación</h1>
        <p>${error.message}</p>
        <a href="/admin/">Volver</a>
      </body>
      </html>
    `);
  }
});

// Cerrar sesión
app.get('/auth/logout', (req, res) => {
  req.session.destroy();
  res.redirect('/admin/');
});

// Obtener usuario actual
app.get('/api/me', requireAuth, (req, res) => {
  res.json({
    id: req.session.user.id,
    name: req.session.user.name,
    email: req.session.user.email
  });
});

// ============================================
// MIDDLEWARE DE AUTENTICACIÓN
// ============================================

function requireAuth(req, res, next) {
  if (!req.session.user) {
    return res.status(401).json({ error: 'No autenticado' });
  }
  
  // Verificar si el token ha expirado
  if (Date.now() > req.session.user.expiresAt) {
    return res.status(401).json({ error: 'Sesión expirada' });
  }
  
  next();
}

// ============================================
// RUTAS DE PROYECTOS
// ============================================

const projectsFile = path.join(DATA_PATH, 'projects.json');

function loadProjects() {
  if (!fs.existsSync(projectsFile)) {
    return [];
  }
  try {
    return JSON.parse(fs.readFileSync(projectsFile, 'utf8'));
  } catch (error) {
    console.error('Error leyendo projects.json:', error);
    return [];
  }
}

function saveProjects(projects) {
  fs.writeFileSync(projectsFile, JSON.stringify(projects, null, 2));
}

// Listar proyectos
app.get('/api/projects', requireAuth, (req, res) => {
  const projects = loadProjects();
  res.json(projects);
});

// Crear proyecto
app.post('/api/projects', requireAuth, async (req, res) => {
  try {
    const { name, client, description } = req.body;
    
    if (!name || !client) {
      return res.status(400).json({ error: 'Nombre y cliente son requeridos' });
    }

    const projects = loadProjects();
    const slug = name.toLowerCase()
      .replace(/[áàäâ]/g, 'a')
      .replace(/[éèëê]/g, 'e')
      .replace(/[íìïî]/g, 'i')
      .replace(/[óòöô]/g, 'o')
      .replace(/[úùüû]/g, 'u')
      .replace(/ñ/g, 'n')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');

    const project = {
      id: require('uuid').v4(),
      name,
      slug,
      client,
      description: description || '',
      status: 'active',
      createdAt: new Date().toISOString(),
      createdBy: req.session.user.email,
      sharepoint: null,
      planner: null,
      team: []
    };

    projects.push(project);
    saveProjects(projects);

    console.log(`✅ Proyecto creado: ${name} por ${req.session.user.email}`);
    res.status(201).json(project);
  } catch (error) {
    console.error('Error creando proyecto:', error);
    res.status(500).json({ error: 'Error creando proyecto' });
  }
});

// Obtener un proyecto
app.get('/api/projects/:id', requireAuth, (req, res) => {
  const projects = loadProjects();
  const project = projects.find(p => p.id === req.params.id);
  
  if (!project) {
    return res.status(404).json({ error: 'Proyecto no encontrado' });
  }
  
  res.json(project);
});

// Actualizar proyecto
app.put('/api/projects/:id', requireAuth, (req, res) => {
  const projects = loadProjects();
  const index = projects.findIndex(p => p.id === req.params.id);
  
  if (index === -1) {
    return res.status(404).json({ error: 'Proyecto no encontrado' });
  }

  projects[index] = {
    ...projects[index],
    ...req.body,
    id: projects[index].id,
    updatedAt: new Date().toISOString()
  };

  saveProjects(projects);
  res.json(projects[index]);
});

// Eliminar proyecto
app.delete('/api/projects/:id', requireAuth, (req, res) => {
  let projects = loadProjects();
  const index = projects.findIndex(p => p.id === req.params.id);
  
  if (index === -1) {
    return res.status(404).json({ error: 'Proyecto no encontrado' });
  }

  const deleted = projects.splice(index, 1);
  saveProjects(projects);
  console.log(`🗑️ Proyecto eliminado: ${deleted[0].name}`);
  res.json({ success: true });
});

// ============================================
// MICROSOFT GRAPH API ROUTES
// ============================================

// Obtener sitio raíz de SharePoint
app.get('/api/sharepoint/root', requireAuth, async (req, res) => {
  try {
    const site = await graph.getRootSite(req.session.user.accessToken);
    res.json(site);
  } catch (error) {
    console.error('Error obteniendo SharePoint:', error);
    res.status(500).json({ error: error.message });
  }
});

// Listar equipos de Teams
app.get('/api/teams', requireAuth, async (req, res) => {
  try {
    const teams = await graph.listMyTeams(req.session.user.accessToken);
    res.json(teams);
  } catch (error) {
    console.error('Error obteniendo Teams:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================
// HEALTH CHECK
// ============================================

app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    version: require('../package.json').version
  });
});

// Redirigir raíz a /admin/
app.get('/', (req, res) => {
  res.redirect('/admin/');
});

// ============================================
// INICIAR SERVIDOR
// ============================================

app.listen(PORT, () => {
  console.log('');
  console.log('🟣 ====================================');
  console.log('🟣  Plain Vanilla Admin Portal');
  console.log('🟣 ====================================');
  console.log(`📡 Puerto: ${PORT}`);
  console.log(`📁 Datos: ${DATA_PATH}`);
  console.log(`🔐 Login: ${process.env.BASE_URL}/auth/login`);
  console.log(`🌐 Admin: ${process.env.BASE_URL}/admin/`);
  console.log('');
});
