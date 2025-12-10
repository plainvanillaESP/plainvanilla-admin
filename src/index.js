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

const DATA_PATH = process.env.DATA_PATH || './data';
if (!fs.existsSync(DATA_PATH)) {
  fs.mkdirSync(DATA_PATH, { recursive: true });
}

app.set('trust proxy', 1);

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(cookieParser());

app.use(session({
  secret: process.env.SESSION_SECRET || 'dev-secret-change-in-prod',
  resave: true,
  saveUninitialized: true,
  name: 'pv.sid',
  cookie: {
    secure: false,
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000
  }
}));

app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path} | Session: ${req.session?.user ? req.session.user.name : 'none'}`);
  next();
});

app.use('/admin', express.static(path.join(__dirname, '../public/admin')));

app.get('/auth/login', async (req, res) => {
  try {
    console.log('🔐 Iniciando login...');
    const authUrl = await auth.getAuthUrl();
    res.redirect(authUrl);
  } catch (error) {
    console.error('❌ Error iniciando login:', error);
    res.status(500).json({ error: 'Error iniciando autenticación' });
  }
});

app.get('/auth/callback', async (req, res) => {
  console.log('📥 Callback recibido');
  try {
    const { code, error, error_description } = req.query;
    
    if (error) {
      return res.send(`<h1>Error</h1><p>${error_description || error}</p><a href="/admin/">Volver</a>`);
    }
    
    if (!code) {
      return res.status(400).json({ error: 'No se recibió código' });
    }

    console.log('🔄 Intercambiando código...');
    const tokenResponse = await auth.getTokenFromCode(code);
    console.log('✅ Token obtenido');
    
    const userInfo = await graph.getMe(tokenResponse.accessToken);
    console.log('✅ Usuario:', userInfo.displayName);

    const allowedDomain = process.env.ALLOWED_DOMAIN;
    const userEmail = userInfo.mail || userInfo.userPrincipalName;
    
    if (allowedDomain && !userEmail?.toLowerCase().endsWith(`@${allowedDomain.toLowerCase()}`)) {
      return res.send(`<h1>Acceso denegado</h1><p>Solo @${allowedDomain}</p>`);
    }

    req.session.user = {
      id: userInfo.id,
      name: userInfo.displayName,
      email: userEmail,
      accessToken: tokenResponse.accessToken,
      expiresAt: Date.now() + 3600000
    };

    req.session.save((err) => {
      if (err) console.error('Error sesión:', err);
      console.log('✅ Sesión guardada:', req.sessionID);
      res.redirect('/admin/');
    });
  } catch (error) {
    console.error('❌ Error callback:', error.message);
    res.send(`<h1>Error</h1><pre>${error.message}</pre><a href="/admin/">Volver</a>`);
  }
});

app.get('/auth/logout', (req, res) => {
  req.session.destroy();
  res.redirect('/admin/');
});

app.get('/api/me', (req, res) => {
  console.log('📋 /api/me sessionID:', req.sessionID, 'user:', req.session?.user?.name);
  if (!req.session.user) return res.status(401).json({ error: 'No autenticado' });
  if (Date.now() > req.session.user.expiresAt) return res.status(401).json({ error: 'Sesión expirada' });
  res.json({ id: req.session.user.id, name: req.session.user.name, email: req.session.user.email });
});

function requireAuth(req, res, next) {
  if (!req.session.user) return res.status(401).json({ error: 'No autenticado' });
  next();
}

const projectsFile = path.join(DATA_PATH, 'projects.json');
function loadProjects() {
  if (!fs.existsSync(projectsFile)) return [];
  try { return JSON.parse(fs.readFileSync(projectsFile, 'utf8')); } catch { return []; }
}
function saveProjects(p) { fs.writeFileSync(projectsFile, JSON.stringify(p, null, 2)); }

app.get('/api/projects', requireAuth, (req, res) => res.json(loadProjects()));
app.post('/api/projects', requireAuth, (req, res) => {
  const { name, client, description } = req.body;
  if (!name || !client) return res.status(400).json({ error: 'Nombre y cliente requeridos' });
  const projects = loadProjects();
  const project = {
    id: require('uuid').v4(), name, client, description: description || '',
    status: 'active', createdAt: new Date().toISOString(), createdBy: req.session.user.email
  };
  projects.push(project);
  saveProjects(projects);
  res.status(201).json(project);
});

app.get('/health', (req, res) => res.json({ status: 'ok' }));
app.get('/', (req, res) => res.redirect('/admin/'));

app.listen(PORT, () => {
  console.log('🟣 Plain Vanilla Admin Portal');
  console.log(`📡 Puerto: ${PORT}`);
});
