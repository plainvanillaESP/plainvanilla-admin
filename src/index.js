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
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

app.use('/admin', express.static(path.join(__dirname, '../public/admin')));

// ============================================
// AUTH ROUTES
// ============================================

app.get('/auth/login', async (req, res) => {
  try {
    const authUrl = await auth.getAuthUrl();
    res.redirect(authUrl);
  } catch (error) {
    console.error('Error login:', error);
    res.status(500).json({ error: 'Error iniciando autenticación' });
  }
});

app.get('/auth/callback', async (req, res) => {
  try {
    const { code, error, error_description } = req.query;
    if (error) return res.send(`<h1>Error</h1><p>${error_description || error}</p><a href="/admin/">Volver</a>`);
    if (!code) return res.status(400).json({ error: 'No se recibió código' });

    const tokenResponse = await auth.getTokenFromCode(code);
    const userInfo = await graph.getMe(tokenResponse.accessToken);

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
      res.redirect('/admin/');
    });
  } catch (error) {
    console.error('Error callback:', error.message);
    res.send(`<h1>Error</h1><pre>${error.message}</pre><a href="/admin/">Volver</a>`);
  }
});

app.get('/auth/logout', (req, res) => {
  req.session.destroy();
  res.redirect('/admin/');
});

app.get('/api/me', (req, res) => {
  if (!req.session.user) return res.status(401).json({ error: 'No autenticado' });
  if (Date.now() > req.session.user.expiresAt) return res.status(401).json({ error: 'Sesión expirada' });
  res.json({ id: req.session.user.id, name: req.session.user.name, email: req.session.user.email });
});

function requireAuth(req, res, next) {
  if (!req.session.user) return res.status(401).json({ error: 'No autenticado' });
  next();
}

// ============================================
// PROJECTS CRUD
// ============================================

const projectsFile = path.join(DATA_PATH, 'projects.json');

function loadProjects() {
  if (!fs.existsSync(projectsFile)) return [];
  try { return JSON.parse(fs.readFileSync(projectsFile, 'utf8')); } catch { return []; }
}

function saveProjects(p) { 
  fs.writeFileSync(projectsFile, JSON.stringify(p, null, 2)); 
}

function getProject(id) {
  return loadProjects().find(p => p.id === id);
}

function updateProject(id, updates) {
  const projects = loadProjects();
  const index = projects.findIndex(p => p.id === id);
  if (index === -1) return null;
  projects[index] = { ...projects[index], ...updates, updatedAt: new Date().toISOString() };
  saveProjects(projects);
  return projects[index];
}

app.get('/api/projects', requireAuth, (req, res) => {
  res.json(loadProjects());
});

app.get('/api/projects/:id', requireAuth, (req, res) => {
  const project = getProject(req.params.id);
  if (!project) return res.status(404).json({ error: 'Proyecto no encontrado' });
  res.json(project);
});

app.post('/api/projects', requireAuth, async (req, res) => {
  try {
    const { name, client, clientSlug, description } = req.body;
    if (!name || !client) return res.status(400).json({ error: 'Nombre y cliente requeridos' });

    const slug = clientSlug || client.toLowerCase()
      .replace(/[áàäâ]/g, 'a').replace(/[éèëê]/g, 'e').replace(/[íìïî]/g, 'i')
      .replace(/[óòöô]/g, 'o').replace(/[úùüû]/g, 'u').replace(/ñ/g, 'n')
      .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

    const project = {
      id: require('crypto').randomUUID(),
      name,
      slug,
      client,
      description: description || '',
      status: 'active',
      createdAt: new Date().toISOString(),
      createdBy: req.session.user.email,
      sharepoint: null,
      planner: null,
      teams: null
    };

    const projects = loadProjects();
    projects.push(project);
    saveProjects(projects);

    console.log(`✅ Proyecto creado: ${name}`);
    res.status(201).json(project);
  } catch (error) {
    console.error('Error creando proyecto:', error);
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/projects/:id', requireAuth, (req, res) => {
  const project = updateProject(req.params.id, req.body);
  if (!project) return res.status(404).json({ error: 'Proyecto no encontrado' });
  res.json(project);
});

app.delete('/api/projects/:id', requireAuth, (req, res) => {
  const projects = loadProjects();
  const index = projects.findIndex(p => p.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: 'Proyecto no encontrado' });
  projects.splice(index, 1);
  saveProjects(projects);
  res.json({ success: true });
});

// ============================================
// MICROSOFT 365 - SHAREPOINT
// ============================================

app.get('/api/sharepoint/root', requireAuth, async (req, res) => {
  try {
    const site = await graph.getRootSite(req.session.user.accessToken);
    res.json(site);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/sharepoint/sites', requireAuth, async (req, res) => {
  try {
    const sites = await graph.searchSite(req.session.user.accessToken, req.query.q || 'plainvanilla');
    res.json(sites);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/projects/:id/sharepoint', requireAuth, async (req, res) => {
  try {
    const project = getProject(req.params.id);
    if (!project) return res.status(404).json({ error: 'Proyecto no encontrado' });

    const { siteId } = req.body;
    if (!siteId) return res.status(400).json({ error: 'siteId requerido' });

    const clientFolder = await graph.createFolder(req.session.user.accessToken, siteId, project.client, 'root');
    const projectFolder = await graph.createFolder(req.session.user.accessToken, siteId, project.name, clientFolder.id);

    const updated = updateProject(project.id, {
      sharepoint: { siteId, folderId: projectFolder.id, folderUrl: projectFolder.webUrl, clientFolderId: clientFolder.id }
    });

    console.log(`✅ SharePoint conectado: ${project.name}`);
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/projects/:id/files', requireAuth, async (req, res) => {
  try {
    const project = getProject(req.params.id);
    if (!project?.sharepoint) return res.json([]);

    const files = await graph.listFiles(req.session.user.accessToken, project.sharepoint.siteId, project.sharepoint.folderId);
    res.json(files);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================
// MICROSOFT 365 - TEAMS
// ============================================

app.get('/api/teams', requireAuth, async (req, res) => {
  try {
    const teams = await graph.listMyTeams(req.session.user.accessToken);
    res.json(teams);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/teams/:teamId/channels', requireAuth, async (req, res) => {
  try {
    const channels = await graph.listChannels(req.session.user.accessToken, req.params.teamId);
    res.json(channels);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/projects/:id/teams', requireAuth, async (req, res) => {
  try {
    const project = getProject(req.params.id);
    if (!project) return res.status(404).json({ error: 'Proyecto no encontrado' });

    const { teamId } = req.body;
    if (!teamId) return res.status(400).json({ error: 'teamId requerido' });

    const channelName = `${project.client} - ${project.name}`;
    const channel = await graph.createChannel(req.session.user.accessToken, teamId, channelName, project.description);

    await graph.sendChannelMessage(req.session.user.accessToken, teamId, channel.id,
      `🚀 <b>Proyecto iniciado:</b> ${project.name}<br>Cliente: ${project.client}<br>Creado por: ${req.session.user.name}`);

    const updated = updateProject(project.id, {
      teams: { teamId, channelId: channel.id, channelName: channel.displayName, channelUrl: channel.webUrl }
    });

    console.log(`✅ Canal Teams creado: ${channelName}`);
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================
// MICROSOFT 365 - PLANNER
// ============================================

app.get('/api/groups', requireAuth, async (req, res) => {
  try {
    const groups = await graph.listMyGroups(req.session.user.accessToken);
    res.json(groups);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/groups/:groupId/plans', requireAuth, async (req, res) => {
  try {
    const plans = await graph.listPlans(req.session.user.accessToken, req.params.groupId);
    res.json(plans);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/projects/:id/planner', requireAuth, async (req, res) => {
  try {
    const project = getProject(req.params.id);
    if (!project) return res.status(404).json({ error: 'Proyecto no encontrado' });

    const { groupId } = req.body;
    if (!groupId) return res.status(400).json({ error: 'groupId requerido' });

    const plan = await graph.createPlan(req.session.user.accessToken, groupId, `${project.client} - ${project.name}`);

    const buckets = [];
    for (const name of ['📋 Backlog', '🔄 En progreso', '✅ Completado']) {
      const b = await graph.createBucket(req.session.user.accessToken, plan.id, name);
      buckets.push({ id: b.id, name: b.name });
    }

    const updated = updateProject(project.id, {
      planner: { groupId, planId: plan.id, planTitle: plan.title, buckets }
    });

    console.log(`✅ Plan Planner creado: ${plan.title}`);
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/projects/:id/tasks', requireAuth, async (req, res) => {
  try {
    const project = getProject(req.params.id);
    if (!project?.planner) return res.json([]);

    const tasks = await graph.listTasks(req.session.user.accessToken, project.planner.planId);
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/projects/:id/tasks', requireAuth, async (req, res) => {
  try {
    const project = getProject(req.params.id);
    if (!project?.planner) return res.status(400).json({ error: 'Proyecto sin Planner' });

    const { title, bucketId } = req.body;
    if (!title) return res.status(400).json({ error: 'Título requerido' });

    const task = await graph.createTask(req.session.user.accessToken, project.planner.planId, bucketId || project.planner.buckets[0].id, title);
    res.status(201).json(task);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================
// SETUP ALL (SharePoint + Planner + Teams)
// ============================================

app.post('/api/projects/:id/setup-all', requireAuth, async (req, res) => {
  try {
    const project = getProject(req.params.id);
    if (!project) return res.status(404).json({ error: 'Proyecto no encontrado' });

    const { siteId, groupId, teamId } = req.body;
    const results = { sharepoint: null, planner: null, teams: null, errors: [] };

    if (siteId && !project.sharepoint) {
      try {
        const clientFolder = await graph.createFolder(req.session.user.accessToken, siteId, project.client, 'root');
        const projectFolder = await graph.createFolder(req.session.user.accessToken, siteId, project.name, clientFolder.id);
        results.sharepoint = { siteId, folderId: projectFolder.id, folderUrl: projectFolder.webUrl };
      } catch (e) { results.errors.push(`SharePoint: ${e.message}`); }
    }

    if (groupId && !project.planner) {
      try {
        const plan = await graph.createPlan(req.session.user.accessToken, groupId, `${project.client} - ${project.name}`);
        const buckets = [];
        for (const name of ['📋 Backlog', '🔄 En progreso', '✅ Completado']) {
          const b = await graph.createBucket(req.session.user.accessToken, plan.id, name);
          buckets.push({ id: b.id, name: b.name });
        }
        results.planner = { groupId, planId: plan.id, planTitle: plan.title, buckets };
      } catch (e) { results.errors.push(`Planner: ${e.message}`); }
    }

    if (teamId && !project.teams) {
      try {
        const channel = await graph.createChannel(req.session.user.accessToken, teamId, `${project.client} - ${project.name}`, project.description);
        await graph.sendChannelMessage(req.session.user.accessToken, teamId, channel.id, `🚀 <b>Proyecto iniciado:</b> ${project.name}<br>Cliente: ${project.client}`);
        results.teams = { teamId, channelId: channel.id, channelName: channel.displayName };
      } catch (e) { results.errors.push(`Teams: ${e.message}`); }
    }

    const updated = updateProject(project.id, {
      sharepoint: results.sharepoint || project.sharepoint,
      planner: results.planner || project.planner,
      teams: results.teams || project.teams
    });

    res.json({ project: updated, results });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================
// CLIENT ACCESS TOKENS
// ============================================

const clientTokensFile = path.join(DATA_PATH, 'client-tokens.json');
function loadClientTokens() { if (!fs.existsSync(clientTokensFile)) return {}; try { return JSON.parse(fs.readFileSync(clientTokensFile, 'utf8')); } catch { return {}; } }
function saveClientTokens(t) { fs.writeFileSync(clientTokensFile, JSON.stringify(t, null, 2)); }

app.post('/api/projects/:id/client-access', requireAuth, (req, res) => {
  try {
    const project = getProject(req.params.id);
    if (!project) return res.status(404).json({ error: 'Proyecto no encontrado' });

    const { email, name, permissions = ['files', 'tasks'] } = req.body;
    const token = require('crypto').randomBytes(32).toString('hex');
    const tokens = loadClientTokens();
    
    tokens[token] = { projectId: project.id, email, name: name || email, permissions, createdAt: new Date().toISOString(), createdBy: req.session.user.email };
    saveClientTokens(tokens);

    const portalUrl = `${process.env.BASE_URL}/portal/${project.slug}?token=${token}`;
    res.json({ token, url: portalUrl });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/projects/:id/client-access', requireAuth, (req, res) => {
  const tokens = loadClientTokens();
  const list = Object.entries(tokens).filter(([_, v]) => v.projectId === req.params.id).map(([t, d]) => ({ token: t.slice(0, 8) + '...', ...d }));
  res.json(list);
});

app.delete('/api/projects/:id/client-access/:token', requireAuth, (req, res) => {
  const tokens = loadClientTokens();
  const full = Object.keys(tokens).find(t => t.startsWith(req.params.token));
  if (full) { delete tokens[full]; saveClientTokens(tokens); }
  res.json({ success: true });
});

// ============================================
// PORTAL (public)
// ============================================

app.use('/portal', express.static(path.join(__dirname, '../public/portal')));

function requireClientToken(req, res, next) {
  const token = req.query.token || req.headers['x-client-token'];
  if (!token) return res.status(401).json({ error: 'Token requerido' });
  const tokens = loadClientTokens();
  const access = tokens[token];
  if (!access) return res.status(401).json({ error: 'Token inválido' });
  req.clientAccess = access;
  next();
}

app.get('/api/portal/project', requireClientToken, (req, res) => {
  const project = getProject(req.clientAccess.projectId);
  if (!project) return res.status(404).json({ error: 'Proyecto no encontrado' });
  res.json({ name: project.name, client: project.client, description: project.description, status: project.status, hasFiles: !!project.sharepoint, hasTasks: !!project.planner, permissions: req.clientAccess.permissions });
});

// ============================================
// HEALTH & ROOT
// ============================================

app.get('/health', (req, res) => res.json({ status: 'ok' }));
app.get('/', (req, res) => res.redirect('/admin/'));

app.listen(PORT, () => {
  console.log('🟣 Plain Vanilla Admin Portal');
  console.log(`📡 Puerto: ${PORT}`);
});
