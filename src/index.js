require('dotenv').config();
const express = require('express');
const session = require('express-session');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const path = require('path');
const crypto = require('crypto');

const auth = require('./auth');
const graph = require('./graph');

// Helper para calcular hora fin sin timezone issues
function calculateEndDateTime(date, time, duration) {
  const [hours, minutes] = time.split(":").map(Number);
  let endMinutes = minutes + (duration || 60);
  let endHours = hours + Math.floor(endMinutes / 60);
  endMinutes = endMinutes % 60;
  if (endHours >= 24) { endHours = 23; endMinutes = 59; }
  return `${date}T${String(endHours).padStart(2, "0")}:${String(endMinutes).padStart(2, "0")}:00`;
}

// Helper para calcular hora fin sin timezone issues
function calculateEndDateTime(date, time, duration) {
  const [hours, minutes] = time.split(":").map(Number);
  let endMinutes = minutes + (duration || 60);
  let endHours = hours + Math.floor(endMinutes / 60);
  endMinutes = endMinutes % 60;
  if (endHours >= 24) { endHours = 23; endMinutes = 59; }
  return `${date}T${String(endHours).padStart(2, "0")}:${String(endMinutes).padStart(2, "0")}:00`;
}
const db = require('./db');

const app = express();
const PORT = process.env.PORT || 3001;

// ============================================
// MIDDLEWARE
// ============================================

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
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000,
    sameSite: 'lax'
  }
}));

app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// Static files
app.use('/admin', express.static(path.join(__dirname, '../public/admin')));
app.use('/portal', express.static(path.join(__dirname, '../public/portal')));

// ============================================
// AUTH MIDDLEWARE
// ============================================

function requireAuth(req, res, next) {
  if (!req.session.user) return res.status(401).json({ error: 'No autenticado' });
  if (Date.now() > req.session.user.expiresAt) return res.status(401).json({ error: 'Sesión expirada' });
  next();
}

async function requireClientAuth(req, res, next) {
  const token = req.query.token || req.headers['x-client-token'];
  if (!token) return res.status(401).json({ error: 'Token requerido' });

  try {
    const decoded = Buffer.from(token, 'base64').toString('utf8');
    const [visitorId, hash] = decoded.split(':');
    const user = await db.getUserByEmail(visitorId);
    if (!user) return res.status(401).json({ error: 'Token inválido' });
    req.clientUser = user;
    req.clientToken = token;
    next();
  } catch (e) {
    return res.status(401).json({ error: 'Token inválido' });
  }
}

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
    if (error) {
      return res.send(`<h1>Error</h1><p>${error_description || error}</p><a href="/admin/">Volver</a>`);
    }
    if (!code) {
      return res.status(400).json({ error: 'No se recibió código' });
    }

    const tokenResponse = await auth.getTokenFromCode(code);
    const userInfo = await graph.getMe(tokenResponse.accessToken);

    const allowedDomain = process.env.ALLOWED_DOMAIN;
    const userEmail = userInfo.mail || userInfo.userPrincipalName;

    if (allowedDomain && !userEmail?.toLowerCase().endsWith(`@${allowedDomain.toLowerCase()}`)) {
      return res.send(`<h1>Acceso denegado</h1><p>Solo usuarios @${allowedDomain}</p>`);
    }

    req.session.user = {
      id: userInfo.id,
      name: userInfo.displayName,
      email: userEmail,
      accessToken: tokenResponse.accessToken,
      expiresAt: Date.now() + 3600000
    };

    req.session.save((err) => {
      if (err) console.error('Error guardando sesión:', err);
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
  res.json({
    id: req.session.user.id,
    name: req.session.user.name,
    email: req.session.user.email
  });
});

// ============================================
// PROJECTS CRUD
// ============================================

app.get('/api/projects', requireAuth, async (req, res) => {
  try {
    const projects = await db.getProjects();
    res.json(projects);
  } catch (e) {
    console.error('Error getting projects:', e);
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/projects/:id', requireAuth, async (req, res) => {
  try {
    const project = await db.getProject(req.params.id);
    if (!project) return res.status(404).json({ error: 'Proyecto no encontrado' });
    res.json(project);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/projects', requireAuth, async (req, res) => {
  try {
    const { name, client, clientSlug, description, pricing } = req.body;
    if (!name || !client) return res.status(400).json({ error: 'Nombre y cliente requeridos' });

    const slug = clientSlug || client.toLowerCase()
      .replace(/[áàäâ]/g, 'a').replace(/[éèëê]/g, 'e').replace(/[íìïî]/g, 'i')
      .replace(/[óòöô]/g, 'o').replace(/[úùüû]/g, 'u').replace(/ñ/g, 'n')
      .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

    const project = await db.createProject({
      name, client, slug, description, pricing,
      createdBy: req.session.user.email
    });

    console.log(`✅ Proyecto creado: ${name}`);
    res.status(201).json(project);
  } catch (error) {
    console.error('Error creando proyecto:', error);
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/projects/:id', requireAuth, async (req, res) => {
  try {
    const project = await db.updateProject(req.params.id, req.body);
    if (!project) return res.status(404).json({ error: 'Proyecto no encontrado' });
    res.json(project);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.delete('/api/projects/:id', requireAuth, async (req, res) => {
  try {
    await db.deleteProject(req.params.id);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ============================================
// PHASES
// ============================================

app.get('/api/projects/:id/phases', requireAuth, async (req, res) => {
  try {
    const project = await db.getProject(req.params.id);
    if (!project) return res.status(404).json({ error: 'Proyecto no encontrado' });
    res.json(project.phases || []);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/projects/:id/phases', requireAuth, async (req, res) => {
  try {
    const phase = await db.createPhase(req.params.id, req.body);

    // Sync to calendar if dates provided
    if (req.session.user?.accessToken && phase.startDate && phase.endDate) {
      try {
        const project = await db.getProject(req.params.id);
        const eventId = await syncPhaseToCalendar(req.session.user.accessToken, phase, project);
        if (eventId) {
          await db.updatePhase(phase.id, { calendarEventId: eventId });
          phase.calendarEventId = eventId;
        }
      } catch (e) {
        console.error('Error syncing phase to calendar:', e.message);
      }
    }

    res.status(201).json(phase);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.put('/api/projects/:id/phases/:phaseId', requireAuth, async (req, res) => {
  try {
    const phase = await db.updatePhase(req.params.phaseId, req.body);
    if (!phase) return res.status(404).json({ error: 'Fase no encontrada' });

    // Sync to calendar
    if (req.session.user?.accessToken && phase.startDate && phase.endDate) {
      try {
        const project = await db.getProject(req.params.id);
        const eventId = await syncPhaseToCalendar(req.session.user.accessToken, phase, project);
        if (eventId && !phase.calendarEventId) {
          await db.updatePhase(phase.id, { calendarEventId: eventId });
        }
      } catch (e) {
        console.error('Error syncing phase to calendar:', e.message);
      }
    }

    res.json(phase);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.delete('/api/projects/:id/phases/:phaseId', requireAuth, async (req, res) => {
  try {
    const phase = await db.getPhase(req.params.phaseId);

    // Delete from calendar
    if (req.session.user?.accessToken && phase?.calendarEventId) {
      try {
        await graph.deleteCalendarEvent(req.session.user.accessToken, phase.calendarEventId);
      } catch (e) {
        console.error('Error deleting calendar event:', e.message);
      }
    }

    await db.deletePhase(req.params.phaseId);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ============================================
// SESSIONS
// ============================================

app.get('/api/projects/:id/sessions', requireAuth, async (req, res) => {
  try {
    const project = await db.getProject(req.params.id);
    if (!project) return res.status(404).json({ error: 'Proyecto no encontrado' });
    res.json(project.sessions || []);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/projects/:id/sessions', requireAuth, async (req, res) => {
  try {
    const { title, date, time, duration, type, location, phaseId, attendees } = req.body;
    const project = await db.getProject(req.params.id);
    if (!project) return res.status(404).json({ error: 'Proyecto no encontrado' });

    let teamsData = null;

    // Create Teams meeting if online
    console.log('Session type:', type, 'Has token:', !!req.session.user?.accessToken);
    if (type === 'online' && req.session.user?.accessToken) {
      try {
        console.log('Creating Teams meeting for:', title);
        const startDateTime = `${date}T${time}:00`;
        const endDateTime = calculateEndDateTime(date, time, duration); // FIXED
        
        

        const attendeeEmails = (attendees || []).map(a => typeof a === 'string' ? a : a.email).filter(e => e);
        teamsData = await graph.createOnlineMeeting(
          req.session.user.accessToken,
          `[${project.name}] ${title}`,
          startDateTime,
          endDateTime,
          attendeeEmails
        );
        console.log('Teams meeting created:', teamsData?.joinUrl);
      } catch (e) {
        console.error('Error creating Teams meeting:', e.message);
      }
    }

    const session = await db.createSession(req.params.id, {
      title, date, time, duration, type, location, phaseId
    });

    // Update with Teams data
    if (teamsData) {
      await db.updateSession(session.id, {
        teamsMeetingUrl: teamsData.joinUrl,
        calendarEventId: teamsData.id
      });
      session.teamsLink = teamsData.joinUrl;
      session.calendarEventId = teamsData.id;
    }

    res.status(201).json(session);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.put('/api/projects/:id/sessions/:sessionId', requireAuth, async (req, res) => {
  try {
    const currentSession = await db.getSession(req.params.sessionId);
    if (!currentSession) return res.status(404).json({ error: 'Sesion no encontrada' });

    const { notifyAttendees, attendees, ...sessionData } = req.body;
    const session = await db.updateSession(req.params.sessionId, sessionData);

    // Update Teams event if exists
    if (currentSession.calendarEventId && req.session.user?.accessToken) {
      try {
        const project = await db.getProject(req.params.id);
        
        // Detectar nuevos asistentes
        const currentAttendees = currentSession.attendees || [];
        const newAttendees = (attendees || []).filter(a => 
          !currentAttendees.find(ca => ca.email === a.email)
        );
        
        // Si hay nuevos asistentes, siempre notificar
        if (newAttendees.length > 0) {
          await graph.addAttendeesToMeeting(
            req.session.user.accessToken,
            currentSession.calendarEventId,
            newAttendees
          );
          console.log('Nuevos asistentes notificados:', newAttendees.map(a => a.email));
        }
        
        // Si hay cambios en fecha/hora y notifyAttendees es true
        const hasTimeChanges = 
          sessionData.date !== currentSession.date || 
          sessionData.time !== currentSession.time ||
          sessionData.title !== currentSession.title;
          
        if (hasTimeChanges && notifyAttendees) {
          const startDateTime = sessionData.date + 'T' + sessionData.time + ':00';
          const endDate = new Date(sessionData.date + 'T' + sessionData.time);
          endDate.setMinutes(endDate.getMinutes() + (sessionData.duration || 60));
          
          await graph.updateOnlineMeeting(
            req.session.user.accessToken,
            currentSession.calendarEventId,
            {
              subject: '[' + project.name + '] ' + sessionData.title,
              startDateTime: startDateTime,
              endDateTime: endDate.toISOString().slice(0, 19),
              attendees: attendees
            },
            true
          );
          console.log('Asistentes notificados de cambios');
        }
        const { date, time, title, duration } = { ...currentSession, ...req.body };
        if (date && time) {
          const startDateTime = `${date}T${time}:00`;
          const endDateTime = calculateEndDateTime(date, time, duration); // FIXED
          
          

          await graph.updateCalendarEvent(req.session.user.accessToken, currentSession.calendarEventId, {
            subject: title,
            start: { dateTime: startDateTime, timeZone: 'Europe/Madrid' },
            end: { dateTime: endDateTime, timeZone: 'Europe/Madrid' }
          });
        }
      } catch (e) {
        console.error('Error updating Teams event:', e.message);
      }
    }

    res.json(session);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});


// Función para enviar email de cancelación de sesión
async function sendCancellationEmail(accessToken, attendees, sessionTitle, sessionDate, sessionTime, projectName) {
  if (!attendees || attendees.length === 0) return;
  
  const { Client } = require('@microsoft/microsoft-graph-client');
  const client = Client.init({ authProvider: (done) => done(null, accessToken) });
  
  for (const attendee of attendees) {
    const email = typeof attendee === 'string' ? attendee : attendee.email;
    if (!email) continue;
    
    try {
      await client.api('/me/sendMail').post({
        message: {
          subject: `Sesión cancelada: ${sessionTitle}`,
          body: {
            contentType: 'HTML',
            content: `
              <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <div style="background: linear-gradient(135deg, #e6007e 0%, #8b37ed 100%); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
                  <h1 style="color: #ffffff; margin: 0; font-size: 20px;">Sesión Cancelada</h1>
                </div>
                <div style="background: #ffffff; padding: 30px; border: 1px solid #eee; border-top: none; border-radius: 0 0 12px 12px;">
                  <p style="color: #333; font-size: 15px; margin-bottom: 20px;">
                    La siguiente sesión ha sido cancelada:
                  </p>
                  <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
                    <p style="margin: 0 0 10px 0;"><strong>Proyecto:</strong> ${projectName}</p>
                    <p style="margin: 0 0 10px 0;"><strong>Sesión:</strong> ${sessionTitle}</p>
                    <p style="margin: 0;"><strong>Fecha prevista:</strong> ${sessionDate} a las ${sessionTime}</p>
                  </div>
                  <p style="color: #666; font-size: 14px;">
                    Si tienes alguna pregunta, no dudes en contactarnos.
                  </p>
                </div>
              </div>
            `
          },
          toRecipients: [{ emailAddress: { address: email } }]
        },
        saveToSentItems: true
      });
      console.log(`[Cancellation] Email sent to ${email}`);
    } catch (e) {
      console.error(`[Cancellation] Failed to send to ${email}:`, e.message);
    }
  }
}

app.delete('/api/projects/:id/sessions/:sessionId', requireAuth, async (req, res) => {
  try {
    const session = await db.getSession(req.params.sessionId);

    // Delete Teams event
    if (req.session.user?.accessToken && session?.calendarEventId) {
      try {
        await graph.deleteCalendarEvent(req.session.user.accessToken, session.calendarEventId);
      } catch (e) {
        console.error('Error deleting Teams event:', e.message);
      }
    }

    await db.deleteSession(req.params.sessionId);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ============================================
// TASKS
// ============================================

app.get('/api/projects/:id/tasks', requireAuth, async (req, res) => {
  try {
    const project = await db.getProject(req.params.id);
    if (!project) return res.status(404).json({ error: 'Proyecto no encontrado' });
    res.json(project.tasks || []);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/projects/:id/tasks', requireAuth, async (req, res) => {
  try {
    const project = await db.getProject(req.params.id);
    if (!project) return res.status(404).json({ error: 'Proyecto no encontrado' });

    const task = await db.createTask(req.params.id, {
      ...req.body,
      createdBy: req.session.user.email
    });

    // Sync to Planner if public
    if (task.visibility === 'public' && project.planner?.planId && req.session.user?.accessToken) {
      try {
        const plannerTaskId = await syncTaskToPlanner(req.session.user.accessToken, task, project);
        if (plannerTaskId) {
          await db.updateTask(task.id, { plannerTaskId });
          task.plannerTaskId = plannerTaskId;
        }
      } catch (e) {
        console.error('Error syncing task to Planner:', e.message);
      }
    }

    res.status(201).json(task);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.put('/api/projects/:id/tasks/:taskId', requireAuth, async (req, res) => {
  try {
    const task = await db.updateTask(req.params.taskId, req.body);
    if (!task) return res.status(404).json({ error: 'Tarea no encontrada' });

    // Sync to Planner if public
    const project = await db.getProject(req.params.id);
    if (task.visibility === 'public' && project.planner?.planId && req.session.user?.accessToken) {
      try {
        const plannerTaskId = await syncTaskToPlanner(req.session.user.accessToken, task, project);
        if (plannerTaskId && !task.plannerTaskId) {
          await db.updateTask(task.id, { plannerTaskId });
        }
      } catch (e) {
        console.error('Error syncing task to Planner:', e.message);
      }
    }

    res.json(task);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.delete('/api/projects/:id/tasks/:taskId', requireAuth, async (req, res) => {
  try {
    // Delete from Planner if synced
    const taskToDelete = await db.getTask(req.params.taskId);
    if (req.session.user?.accessToken && taskToDelete?.plannerTaskId) {
      try {
        await graph.deleteTask(req.session.user.accessToken, taskToDelete.plannerTaskId);
      } catch (e) {
        console.error('Error deleting task from Planner:', e.message);
      }
    }

    await db.deleteTask(req.params.taskId);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ============================================
// MICROSOFT 365 - SHAREPOINT
// ============================================

app.get('/api/sharepoint/sites', requireAuth, async (req, res) => {
  try {
    const sites = await graph.searchSite(req.session.user.accessToken, req.query.q || '');
    res.json(sites);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/projects/:id/sharepoint', requireAuth, async (req, res) => {
  try {
    const project = await db.getProject(req.params.id);
    if (!project) return res.status(404).json({ error: 'Proyecto no encontrado' });

    const { siteId } = req.body;
    if (!siteId) return res.status(400).json({ error: 'siteId requerido' });

    const clientFolder = await graph.createFolder(req.session.user.accessToken, siteId, project.client, 'root');
    const projectFolder = await graph.createFolder(req.session.user.accessToken, siteId, project.name, clientFolder.id);

    const updated = await db.updateProject(project.id, {
      sharepoint_site_id: siteId,
      sharepoint_folder_id: projectFolder.id,
      sharepoint_folder_url: projectFolder.webUrl
    });

    console.log(`✅ SharePoint conectado: ${project.name}`);
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/projects/:id/files', requireAuth, async (req, res) => {
  try {
    const project = await db.getProject(req.params.id);
    if (!project?.sharepoint) return res.json([]);

    const files = await graph.listFiles(
      req.session.user.accessToken,
      project.sharepoint.siteId,
      project.sharepoint.folderId
    );
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
    const project = await db.getProject(req.params.id);
    if (!project) return res.status(404).json({ error: 'Proyecto no encontrado' });

    const { teamId } = req.body;
    if (!teamId) return res.status(400).json({ error: 'teamId requerido' });

    const channelName = `${project.client} - ${project.name}`;
    const channel = await graph.createChannel(req.session.user.accessToken, teamId, channelName, project.description);

    await graph.sendChannelMessage(
      req.session.user.accessToken,
      teamId,
      channel.id,
      `🚀 <b>Proyecto iniciado:</b> ${project.name}<br>Cliente: ${project.client}<br>Creado por: ${req.session.user.name}`
    );

    const updated = await db.updateProject(project.id, {
      teams_team_id: teamId,
      teams_channel_id: channel.id,
      teams_channel_url: channel.webUrl
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

app.post('/api/projects/:id/planner', requireAuth, async (req, res) => {
  try {
    const project = await db.getProject(req.params.id);
    if (!project) return res.status(404).json({ error: 'Proyecto no encontrado' });

    const { groupId } = req.body;
    if (!groupId) return res.status(400).json({ error: 'groupId requerido' });

    const plan = await graph.createPlan(req.session.user.accessToken, groupId, `${project.client} - ${project.name}`);

    const updated = await db.updateProject(project.id, {
      planner_group_id: groupId,
      planner_plan_id: plan.id
    });

    console.log(`✅ Plan Planner creado: ${plan.title}`);
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================
// CONTACTS SEARCH (NUEVO)
// ============================================

app.get('/api/contacts/search', requireAuth, async (req, res) => {
  try {
    const query = (req.query.q || '').toLowerCase();
    const projectId = req.query.projectId;
    const results = [];
    const seen = new Set();
    
    const addContact = (name, email, source) => {
      if (!email || seen.has(email.toLowerCase())) return;
      seen.add(email.toLowerCase());
      results.push({ name: name || email, email, source });
    };
    
    // 1. Clientes con acceso al proyecto
    if (projectId) {
      const access = await db.getProjectAccess(projectId);
      access.forEach(a => addContact(a.name, a.email, 'client'));
    }
    
    const token = req.session.user.accessToken;
    
    // 2. People (contactos frecuentes)
    try {
      const people = await graph.searchUsers(token, query);
      people.forEach(p => {
        const email = p.mail;
        if (email) addContact(p.displayName, email, 'people');
      });
    } catch (e) { console.error('People search error:', e.message); }
    
    // 3. Directorio de usuarios
    try {
      const users = await graph.getMyContacts(token, query);
      users.forEach(u => {
        if (u.email) addContact(u.name, u.email, 'directory');
      });
    } catch (e) { console.error('Directory search error:', e.message); }
    
    // 4. Contactos de emails recibidos/enviados
    try {
      const mailContacts = await graph.searchMailContacts(token, query);
      mailContacts.forEach(c => addContact(c.name, c.email, "mail"));
    } catch (e) { console.error("Mail contacts error:", e.message); }
    
    // Filtrar localmente por query
    const filtered = query.length >= 2 
      ? results.filter(c => 
          c.name.toLowerCase().includes(query) || 
          c.email.toLowerCase().includes(query)
        )
      : results;
    
    res.json(filtered.slice(0, 20));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================
// SETUP ALL
// ============================================

app.post('/api/projects/:id/setup-all', requireAuth, async (req, res) => {
  try {
    const project = await db.getProject(req.params.id);
    if (!project) return res.status(404).json({ error: 'Proyecto no encontrado' });

    const { siteId, groupId, teamId } = req.body;
    const results = { sharepoint: null, planner: null, teams: null, errors: [] };
    const updates = {};

    if (siteId && !project.sharepoint) {
      try {
        const clientFolder = await graph.createFolder(req.session.user.accessToken, siteId, project.client, 'root');
        const projectFolder = await graph.createFolder(req.session.user.accessToken, siteId, project.name, clientFolder.id);
        updates.sharepoint_site_id = siteId;
        updates.sharepoint_folder_id = projectFolder.id;
        updates.sharepoint_folder_url = projectFolder.webUrl;
        results.sharepoint = { siteId, folderId: projectFolder.id, folderUrl: projectFolder.webUrl };
      } catch (e) { results.errors.push(`SharePoint: ${e.message}`); }
    }

    if (groupId && !project.planner) {
      try {
        const plan = await graph.createPlan(req.session.user.accessToken, groupId, `${project.client} - ${project.name}`);
        updates.planner_group_id = groupId;
        updates.planner_plan_id = plan.id;
        results.planner = { groupId, planId: plan.id, planTitle: plan.title };
      } catch (e) { results.errors.push(`Planner: ${e.message}`); }
    }

    if (teamId && !project.teams) {
      try {
        const channel = await graph.createChannel(
          req.session.user.accessToken,
          teamId,
          `${project.client} - ${project.name}`,
          project.description
        );
        await graph.sendChannelMessage(
          req.session.user.accessToken,
          teamId,
          channel.id,
          `🚀 <b>Proyecto iniciado:</b> ${project.name}<br>Cliente: ${project.client}`
        );
        updates.teams_team_id = teamId;
        updates.teams_channel_id = channel.id;
        updates.teams_channel_url = channel.webUrl;
        results.teams = { teamId, channelId: channel.id, channelName: channel.displayName };
      } catch (e) { results.errors.push(`Teams: ${e.message}`); }
    }

    const updated = Object.keys(updates).length > 0 ? await db.updateProject(project.id, updates) : project;

    res.json({ project: updated, results });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================
// CLIENT ACCESS
// ============================================

app.post('/api/projects/:id/client-access', requireAuth, async (req, res) => {
  try {
    const project = await db.getProject(req.params.id);
    if (!project) return res.status(404).json({ error: 'Proyecto no encontrado' });

    const { email, name, permissions = ['view', 'tasks'], sendEmail = true } = req.body;
    const password = crypto.randomBytes(4).toString('hex').toUpperCase();
    const passwordHash = crypto.createHash('sha256').update(password).digest('hex');

    // Create or update user
    const user = await db.createUser({ email, name: name || email, passwordHash, role: 'client' });

    // Create project access
    await db.createProjectAccess(project.id, user.id, permissions);

    const portalUrl = `${process.env.BASE_URL || 'https://admin.plainvanilla.ai'}/portal/${project.slug}`;

    // Send email if requested
    if (sendEmail && req.session.user?.accessToken) {
      try {
        await sendClientAccessEmail(req.session.user.accessToken, {
          to: email,
          name: name || email,
          projectName: project.name,
          portalUrl,
          password
        });
        console.log('Email enviado a:', email);
      } catch (e) {
        console.error('Error enviando email:', e.message);
      }
    }

    res.json({ success: true, url: portalUrl, password, emailSent: sendEmail });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/projects/:id/client-access', requireAuth, async (req, res) => {
  try {
    const access = await db.getProjectAccess(req.params.id);
    res.json(access);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.delete('/api/projects/:id/client-access/:userId', requireAuth, async (req, res) => {
  try {
    await db.deleteProjectAccess(req.params.id, req.params.userId);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Resend email (NUEVO)
app.post('/api/projects/:id/client-access/:userId/resend', requireAuth, async (req, res) => {
  try {
    const project = await db.getProject(req.params.id);
    if (!project) return res.status(404).json({ error: 'Proyecto no encontrado' });
    
    // Buscar el acceso
    const access = await db.getProjectAccess(req.params.id);
    const userAccess = access.find(a => a.user_id == req.params.userId);
    
    if (!userAccess) return res.status(404).json({ error: 'Acceso no encontrado' });
    
    // Generar nueva contraseña
    const password = crypto.randomBytes(4).toString('hex').toUpperCase();
    const passwordHash = crypto.createHash('sha256').update(password).digest('hex');
    
    // Actualizar contraseña en la base de datos
    await db.pool.query(
      'UPDATE users SET password_hash = $1 WHERE id = $2',
      [passwordHash, req.params.userId]
    );
    
    const portalUrl = `${process.env.BASE_URL || 'https://admin.plainvanilla.ai'}/portal/${project.slug}`;
    
    // Enviar email
    if (req.session.user?.accessToken) {
      try {
        await sendClientAccessEmail(req.session.user.accessToken, {
          to: userAccess.email,
          name: userAccess.name,
          projectName: project.name,
          portalUrl,
          password,
          isResend: true
        });
        console.log('Email reenviado a:', userAccess.email);
      } catch (e) {
        console.error('Error enviando email:', e.message);
        return res.status(500).json({ error: 'Error enviando email: ' + e.message });
      }
    }
    
    res.json({ success: true, password });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================
// PORTAL (PUBLIC)
// ============================================

app.get('/portal/*', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/portal/index.html'));
});

app.post('/api/portal/login', async (req, res) => {
  try {
    const { email, password, slug } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email y contraseña requeridos' });

    const passwordHash = crypto.createHash('sha256').update(password).digest('hex');
    const user = await db.getUserByEmail(email);

    if (!user || user.password_hash !== passwordHash) {
      return res.status(401).json({ error: 'Credenciales incorrectas' });
    }

    // Get user's projects
    const projects = await db.getUserProjects(user.id);

    if (slug) {
      const project = projects.find(p => p.slug === slug);
      if (!project) return res.status(401).json({ error: 'No tienes acceso a este proyecto' });
    }

    // Generate token
    const token = Buffer.from(`${email}:${passwordHash}`).toString('base64');

    res.json({ token, projects: projects.map(p => ({ id: p.id, name: p.name, slug: p.slug })) });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/portal/project/:slug', requireClientAuth, async (req, res) => {
  try {
    const project = await db.getProjectBySlug(req.params.slug);
    if (!project) return res.status(404).json({ error: 'Proyecto no encontrado' });

    // Verify access
    const access = await db.getProjectAccess(project.id);
    const hasAccess = access.some(a => a.email === req.clientUser.email);
    if (!hasAccess) return res.status(403).json({ error: 'Sin acceso a este proyecto' });

    // Filter to public tasks only
    const publicTasks = (project.tasks || []).filter(t => t.visibility === 'public');

    res.json({
      ...project,
      tasks: publicTasks,
      clientName: req.clientUser.name,
      clientEmail: req.clientUser.email
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/portal/task/:taskId/status', requireClientAuth, async (req, res) => {
  try {
    const task = await db.getTask(req.params.taskId);
    if (!task) return res.status(404).json({ error: 'Tarea no encontrada' });

    if (task.assignedToType !== 'client') {
      return res.status(403).json({ error: 'No puedes modificar esta tarea' });
    }

    const { status } = req.body;
    await db.updateTask(req.params.taskId, { status });

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/portal/messages/:projectId', requireClientAuth, async (req, res) => {
  try {
    const messages = await db.getMessages(req.params.projectId);
    res.json(messages);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/portal/messages/:projectId', requireClientAuth, async (req, res) => {
  try {
    const { content } = req.body;
    const message = await db.createMessage(req.params.projectId, req.clientUser.id, content);
    res.json(message);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ============================================
// HELPER FUNCTIONS
// ============================================

async function syncPhaseToCalendar(accessToken, phase, project) {
  if (!phase.startDate || !phase.endDate) return null;

  try {
    const event = {
      subject: `[Fase] ${phase.name} - ${project.name}`,
      body: { contentType: 'Text', content: phase.description || '' },
      start: { dateTime: phase.startDate + 'T00:00:00', timeZone: 'Europe/Madrid' },
      end: { dateTime: phase.endDate + 'T23:59:59', timeZone: 'Europe/Madrid' },
      isAllDay: true,
      showAs: 'free',
      isReminderOn: false
    };

    if (phase.calendarEventId) {
      await graph.updateCalendarEvent(accessToken, phase.calendarEventId, event);
      return phase.calendarEventId;
    } else {
      const result = await graph.createEvent(accessToken, event);
      return result.id;
    }
  } catch (e) {
    console.error('Error syncing phase to calendar:', e.message);
    return null;
  }
}

async function syncTaskToPlanner(accessToken, task, project) {
  if (!project.planner?.planId) return null;
  if (task.visibility !== 'public') return null;
  
  try {
    // Obtener buckets del plan
    const buckets = await graph.listBuckets(accessToken, project.planner.planId);
    
    // Seleccionar bucket según estado
    let bucketId = buckets[0]?.id; // Default: primer bucket (Backlog)
    if (task.status === 'in_progress' && buckets[1]) {
      bucketId = buckets[1].id; // En progreso
    } else if (task.status === 'completed' && buckets[2]) {
      bucketId = buckets[2].id; // Completado
    }
    
    if (task.plannerTaskId) {
      // Actualizar tarea existente
      await graph.updateTask(accessToken, task.plannerTaskId, {
        title: task.title,
        percentComplete: task.status === 'completed' ? 100 : task.status === 'in_progress' ? 50 : 0,
        dueDateTime: task.dueDate ? task.dueDate + 'T23:59:59Z' : null
      });
      return task.plannerTaskId;
    } else {
      // Crear nueva tarea
      const options = {};
      if (task.dueDate) {
        options.dueDateTime = task.dueDate + 'T23:59:59Z';
      }
      if (task.assignedToId) {
        options.assignments = {
          [task.assignedToId]: {
            '@odata.type': '#microsoft.graph.plannerAssignment',
            orderHint: ' !'
          }
        };
      }
      const result = await graph.createTask(
        accessToken,
        project.planner.planId,
        bucketId,
        task.title,
        options
      );
      return result.id;
    }
  } catch (e) {
    console.error('Error syncing task to Planner:', e.message);
    return null;
  }
}

async function sendClientAccessEmail(accessToken, { to, name, projectName, portalUrl, password, isResend = false }) {
  const { Client } = require('@microsoft/microsoft-graph-client');
  const client = Client.init({ authProvider: (done) => done(null, accessToken) });

  await client.api('/me/sendMail').post({
    message: {
      subject: isResend 
        ? `Nueva contraseña - Portal ${projectName}` 
        : `Acceso al portal: ${projectName}`,
      body: {
        contentType: 'HTML',
        content: `
          <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff;">
            <div style="background: linear-gradient(135deg, #e6007e 0%, #8b37ed 100%); padding: 40px 30px; border-radius: 16px 16px 0 0; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 700;">Plain Vanilla</h1>
              <p style="color: #ffffff; opacity: 0.9; margin: 10px 0 0 0; font-size: 14px;">Portal de Cliente</p>
            </div>
            <div style="background-color: #ffffff; padding: 40px 30px; border: 1px solid #eeeeee; border-top: none; border-radius: 0 0 16px 16px;">
              <p style="color: #333333; font-size: 16px; margin: 0 0 20px 0;">Hola <strong>${name}</strong>,</p>
              <p style="color: #666666; font-size: 15px; line-height: 1.6; margin: 0 0 20px 0;">
                ${isResend 
                  ? `Te enviamos una nueva contraseña para acceder al portal de tu proyecto <strong>${projectName}</strong>.`
                  : `Te damos acceso al portal de tu proyecto <strong>${projectName}</strong>. Desde aquí podrás seguir el progreso, ver las sesiones programadas y comunicarte con nosotros.`
                }
              </p>
              <div style="background-color: #f8f9fa; border-radius: 12px; padding: 24px; margin: 30px 0;">
                <p style="margin: 0 0 15px 0; color: #666666; font-size: 14px;">Tus credenciales de acceso:</p>
                <p style="margin: 0 0 8px 0; color: #333333;"><strong>Email:</strong> ${to}</p>
                <p style="margin: 0; color: #333333;"><strong>Contraseña:</strong> <code style="background-color: #e9ecef; padding: 4px 8px; border-radius: 4px; font-size: 16px; color: #333333;">${password}</code></p>
              </div>
              <div style="text-align: center; margin: 30px 0;">
                <a href="${portalUrl}" style="display: inline-block; background: linear-gradient(135deg, #e6007e 0%, #8b37ed 100%); color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 15px;">
                  Acceder al portal
                </a>
              </div>
              <p style="color: #999999; font-size: 13px; margin-top: 30px;">
                Si tienes alguna pregunta, no dudes en responder a este email.
              </p>
            </div>
            <p style="color: #999999; font-size: 12px; text-align: center; margin-top: 20px;">
              © ${new Date().getFullYear()} Plain Vanilla Solutions
            </p>
          </div>
        `
      },
      toRecipients: [{ emailAddress: { address: to } }]
    },
    saveToSentItems: true
  });
}

// ============================================
// HEALTH & ROOT
// ============================================

app.get('/health', (req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));
app.get('/', (req, res) => res.redirect('/admin/'));

// ============================================
// START SERVER
// ============================================

app.listen(PORT, () => {
  console.log('🟣 Plain Vanilla Admin Portal');
  console.log(`📡 Puerto: ${PORT}`);
  console.log(`🌐 URL: http://localhost:${PORT}`);
  console.log(`🗄️ Database: PostgreSQL`);
});
