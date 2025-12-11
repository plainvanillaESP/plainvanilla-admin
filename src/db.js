const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

// Test connection
pool.query('SELECT NOW()')
  .then(() => console.log('✅ PostgreSQL conectado'))
  .catch(err => console.error('❌ Error PostgreSQL:', err.message));

// ============================================
// PROJECTS
// ============================================

async function getProjects() {
  const result = await pool.query(`
    SELECT p.*, 
           COALESCE(json_agg(DISTINCT pa.*) FILTER (WHERE pa.id IS NOT NULL), '[]') as addons
    FROM projects p
    LEFT JOIN project_addons pa ON pa.project_id = p.id
    GROUP BY p.id
    ORDER BY p.created_at DESC
  `);
  return result.rows.map(formatProject);
}

async function getProject(id) {
  const projectResult = await pool.query('SELECT * FROM projects WHERE id = $1', [id]);
  if (projectResult.rows.length === 0) return null;
  
  const project = formatProject(projectResult.rows[0]);
  
  const [phases, sessions, tasks, addons] = await Promise.all([
    pool.query('SELECT * FROM phases WHERE project_id = $1 ORDER BY sort_order', [id]),
    pool.query('SELECT * FROM sessions WHERE project_id = $1 ORDER BY date, time', [id]),
    pool.query('SELECT * FROM tasks WHERE project_id = $1 ORDER BY created_at', [id]),
    pool.query('SELECT * FROM project_addons WHERE project_id = $1', [id])
  ]);
  
  project.phases = phases.rows.map(formatPhase);
  project.sessions = sessions.rows.map(formatSession);
  project.tasks = tasks.rows.map(formatTask);
  project.addOns = addons.rows.map(a => ({ id: a.id, name: a.name, price: parseFloat(a.price) }));
  
  return project;
}

async function getProjectBySlug(slug) {
  const result = await pool.query('SELECT * FROM projects WHERE slug = $1', [slug]);
  if (result.rows.length === 0) return null;
  return getProject(result.rows[0].id);
}

async function createProject({ name, client, slug, description, status, pricing, createdBy }) {
  const result = await pool.query(`
    INSERT INTO projects (name, client, slug, description, status, pricing_base, pricing_vat_exempt, pricing_vat_rate, created_by)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    RETURNING *
  `, [name, client, slug, description || '', status || 'active',
      pricing?.basePrice || 0, pricing?.vatExempt || false, pricing?.vatRate || 21, createdBy]);
  return formatProject(result.rows[0]);
}

async function updateProject(id, updates) {
  const fields = [];
  const values = [];
  let i = 1;
  
  if (updates.name !== undefined) { fields.push(`name = $${i}`); values.push(updates.name); i++; }
  if (updates.client !== undefined) { fields.push(`client = $${i}`); values.push(updates.client); i++; }
  if (updates.slug !== undefined) { fields.push(`slug = $${i}`); values.push(updates.slug); i++; }
  if (updates.description !== undefined) { fields.push(`description = $${i}`); values.push(updates.description); i++; }
  if (updates.status !== undefined) { fields.push(`status = $${i}`); values.push(updates.status); i++; }
  if (updates.sharepoint_site_id !== undefined) { fields.push(`sharepoint_site_id = $${i}`); values.push(updates.sharepoint_site_id); i++; }
  if (updates.sharepoint_folder_id !== undefined) { fields.push(`sharepoint_folder_id = $${i}`); values.push(updates.sharepoint_folder_id); i++; }
  if (updates.sharepoint_folder_url !== undefined) { fields.push(`sharepoint_folder_url = $${i}`); values.push(updates.sharepoint_folder_url); i++; }
  if (updates.teams_team_id !== undefined) { fields.push(`teams_team_id = $${i}`); values.push(updates.teams_team_id); i++; }
  if (updates.teams_channel_id !== undefined) { fields.push(`teams_channel_id = $${i}`); values.push(updates.teams_channel_id); i++; }
  if (updates.teams_channel_url !== undefined) { fields.push(`teams_channel_url = $${i}`); values.push(updates.teams_channel_url); i++; }
  if (updates.planner_group_id !== undefined) { fields.push(`planner_group_id = $${i}`); values.push(updates.planner_group_id); i++; }
  if (updates.planner_plan_id !== undefined) { fields.push(`planner_plan_id = $${i}`); values.push(updates.planner_plan_id); i++; }
  
  if (updates.pricing) {
    if (updates.pricing.basePrice !== undefined) { fields.push(`pricing_base = $${i}`); values.push(updates.pricing.basePrice); i++; }
    if (updates.pricing.vatExempt !== undefined) { fields.push(`pricing_vat_exempt = $${i}`); values.push(updates.pricing.vatExempt); i++; }
    if (updates.pricing.vatRate !== undefined) { fields.push(`pricing_vat_rate = $${i}`); values.push(updates.pricing.vatRate); i++; }
  }
  
  if (updates.addOns) {
    await pool.query('DELETE FROM project_addons WHERE project_id = $1', [id]);
    for (const addon of updates.addOns) {
      await pool.query('INSERT INTO project_addons (project_id, name, price) VALUES ($1, $2, $3)', [id, addon.name, addon.price]);
    }
  }
  
  if (fields.length > 0) {
    values.push(id);
    await pool.query(`UPDATE projects SET ${fields.join(', ')} WHERE id = $${i}`, values);
  }
  return getProject(id);
}

async function deleteProject(id) {
  await pool.query('DELETE FROM projects WHERE id = $1', [id]);
  return { success: true };
}

// ============================================
// PHASES
// ============================================

async function createPhase(projectId, { name, description, startDate, endDate, order }) {
  const result = await pool.query(`
    INSERT INTO phases (project_id, name, description, start_date, end_date, sort_order)
    VALUES ($1, $2, $3, $4, $5, $6) RETURNING *
  `, [projectId, name, description || '', startDate || null, endDate || null, order || 0]);
  return formatPhase(result.rows[0]);
}

async function updatePhase(phaseId, updates) {
  const fields = [];
  const values = [];
  let i = 1;
  
  if (updates.name !== undefined) { fields.push(`name = $${i}`); values.push(updates.name); i++; }
  if (updates.description !== undefined) { fields.push(`description = $${i}`); values.push(updates.description); i++; }
  if (updates.startDate !== undefined) { fields.push(`start_date = $${i}`); values.push(updates.startDate); i++; }
  if (updates.endDate !== undefined) { fields.push(`end_date = $${i}`); values.push(updates.endDate); i++; }
  if (updates.status !== undefined) { fields.push(`status = $${i}`); values.push(updates.status); i++; }
  if (updates.order !== undefined) { fields.push(`sort_order = $${i}`); values.push(updates.order); i++; }
  if (updates.calendarEventId !== undefined) { fields.push(`calendar_event_id = $${i}`); values.push(updates.calendarEventId); i++; }
  
  if (fields.length === 0) return null;
  values.push(phaseId);
  const result = await pool.query(`UPDATE phases SET ${fields.join(', ')} WHERE id = $${i} RETURNING *`, values);
  return result.rows[0] ? formatPhase(result.rows[0]) : null;
}

async function deletePhase(phaseId) {
  const result = await pool.query('DELETE FROM phases WHERE id = $1 RETURNING *', [phaseId]);
  return result.rows[0] ? formatPhase(result.rows[0]) : null;
}

async function getPhase(phaseId) {
  const result = await pool.query('SELECT * FROM phases WHERE id = $1', [phaseId]);
  return result.rows[0] ? formatPhase(result.rows[0]) : null;
}

// ============================================
// SESSIONS
// ============================================

async function createSession(projectId, data) {
  const result = await pool.query(`
    INSERT INTO sessions (project_id, phase_id, title, date, time, duration, type, location)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *
  `, [projectId, data.phaseId || null, data.title, data.date, data.time, data.duration || 60, data.type || 'online', data.location || '']);
  return formatSession(result.rows[0]);
}

async function updateSession(sessionId, updates) {
  const fields = [];
  const values = [];
  let i = 1;
  
  if (updates.title !== undefined) { fields.push(`title = $${i}`); values.push(updates.title); i++; }
  if (updates.date !== undefined) { fields.push(`date = $${i}`); values.push(updates.date); i++; }
  if (updates.time !== undefined) { fields.push(`time = $${i}`); values.push(updates.time); i++; }
  if (updates.duration !== undefined) { fields.push(`duration = $${i}`); values.push(updates.duration); i++; }
  if (updates.type !== undefined) { fields.push(`type = $${i}`); values.push(updates.type); i++; }
  if (updates.location !== undefined) { fields.push(`location = $${i}`); values.push(updates.location); i++; }
  if (updates.phaseId !== undefined) { fields.push(`phase_id = $${i}`); values.push(updates.phaseId); i++; }
  if (updates.teamsMeetingUrl !== undefined) { fields.push(`teams_meeting_url = $${i}`); values.push(updates.teamsMeetingUrl); i++; }
  if (updates.calendarEventId !== undefined) { fields.push(`calendar_event_id = $${i}`); values.push(updates.calendarEventId); i++; }
  
  if (fields.length === 0) return null;
  values.push(sessionId);
  const result = await pool.query(`UPDATE sessions SET ${fields.join(', ')} WHERE id = $${i} RETURNING *`, values);
  return result.rows[0] ? formatSession(result.rows[0]) : null;
}

async function deleteSession(sessionId) {
  const result = await pool.query('DELETE FROM sessions WHERE id = $1 RETURNING *', [sessionId]);
  return result.rows[0] ? formatSession(result.rows[0]) : null;
}

async function getSession(sessionId) {
  const result = await pool.query('SELECT * FROM sessions WHERE id = $1', [sessionId]);
  return result.rows[0] ? formatSession(result.rows[0]) : null;
}

// ============================================
// TASKS
// ============================================

async function createTask(projectId, data) {
  const result = await pool.query(`
    INSERT INTO tasks (project_id, phase_id, title, description, due_date, visibility, assignees, priority, created_by)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *
  `, [projectId, data.phaseId || null, data.title, data.description || '', data.dueDate || null,
      data.visibility || 'public', JSON.stringify(data.assignees || []), data.priority || 'medium', data.createdBy]);
  return formatTask(result.rows[0]);
}

async function updateTask(taskId, updates) {
  const fields = [];
  const values = [];
  let i = 1;
  
  if (updates.title !== undefined) { fields.push(`title = $${i}`); values.push(updates.title); i++; }
  if (updates.description !== undefined) { fields.push(`description = $${i}`); values.push(updates.description); i++; }
  if (updates.dueDate !== undefined) { fields.push(`due_date = $${i}`); values.push(updates.dueDate); i++; }
  if (updates.phaseId !== undefined) { fields.push(`phase_id = $${i}`); values.push(updates.phaseId); i++; }
  if (updates.visibility !== undefined) { fields.push(`visibility = $${i}`); values.push(updates.visibility); i++; }
  if (updates.assignees !== undefined) { fields.push(`assignees = $${i}`); values.push(JSON.stringify(updates.assignees)); i++; }
  if (updates.priority !== undefined) { fields.push(`priority = $${i}`); values.push(updates.priority); i++; }
  if (updates.status !== undefined) { fields.push(`status = $${i}`); values.push(updates.status); i++; }
  if (updates.plannerTaskId !== undefined) { fields.push(`planner_task_id = $${i}`); values.push(updates.plannerTaskId); i++; }
  
  if (fields.length === 0) return null;
  values.push(taskId);
  const result = await pool.query(`UPDATE tasks SET ${fields.join(', ')} WHERE id = $${i} RETURNING *`, values);
  return result.rows[0] ? formatTask(result.rows[0]) : null;
}

async function deleteTask(taskId) {
  const result = await pool.query('DELETE FROM tasks WHERE id = $1 RETURNING *', [taskId]);
  return result.rows[0] ? formatTask(result.rows[0]) : null;
}

async function getTask(taskId) {
  const result = await pool.query('SELECT * FROM tasks WHERE id = $1', [taskId]);
  return result.rows[0] ? formatTask(result.rows[0]) : null;
}

// ============================================
// USERS & ACCESS
// ============================================

async function createUser({ email, name, passwordHash, microsoftId, role }) {
  const result = await pool.query(`
    INSERT INTO users (email, name, password_hash, microsoft_id, role)
    VALUES ($1, $2, $3, $4, $5)
    ON CONFLICT (email) DO UPDATE SET name = $2, password_hash = COALESCE($3, users.password_hash)
    RETURNING *
  `, [email, name, passwordHash, microsoftId, role || 'client']);
  return result.rows[0];
}

async function getUserByEmail(email) {
  const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
  return result.rows[0] || null;
}

async function createProjectAccess(projectId, userId, permissions = ['view']) {
  await pool.query(`
    INSERT INTO project_access (project_id, user_id, permissions) VALUES ($1, $2, $3)
    ON CONFLICT (project_id, user_id) DO UPDATE SET permissions = $3
  `, [projectId, userId, permissions]);
}

async function getProjectAccess(projectId) {
  const result = await pool.query(`
    SELECT pa.*, u.email, u.name FROM project_access pa 
    JOIN users u ON u.id = pa.user_id WHERE pa.project_id = $1
  `, [projectId]);
  return result.rows;
}

async function deleteProjectAccess(projectId, usrId) {
  await pool.query('DELETE FROM project_access WHERE project_id = $1 AND user_id = $2', [projectId, usrId]);
}

async function getUserProjects(userId) {
  const result = await pool.query(`
    SELECT p.* FROM projects p JOIN project_access pa ON pa.project_id = p.id WHERE pa.user_id = $1
  `, [userId]);
  return result.rows.map(formatProject);
}

// ============================================
// MESSAGES
// ============================================

async function createMessage(projectId, userId, content) {
  const result = await pool.query(`INSERT INTO messages (project_id, user_id, content) VALUES ($1, $2, $3) RETURNING *`, [projectId, userId, content]);
  return result.rows[0];
}

async function getMessages(projectId) {
  const result = await pool.query(`
    SELECT m.*, u.name as user_name, u.email as user_email FROM messages m
    LEFT JOIN users u ON u.id = m.user_id WHERE m.project_id = $1 ORDER BY m.created_at ASC
  `, [projectId]);
  return result.rows;
}

// ============================================
// FORMATTERS
// ============================================

function formatProject(row) {
  return {
    id: row.id, name: row.name, client: row.client, slug: row.slug,
    description: row.description, status: row.status,
    sharepoint: row.sharepoint_site_id ? { siteId: row.sharepoint_site_id, folderId: row.sharepoint_folder_id, folderUrl: row.sharepoint_folder_url } : null,
    teams: row.teams_team_id ? { teamId: row.teams_team_id, channelId: row.teams_channel_id, channelUrl: row.teams_channel_url } : null,
    planner: row.planner_plan_id ? { groupId: row.planner_group_id, planId: row.planner_plan_id } : null,
    pricing: { basePrice: parseFloat(row.pricing_base) || 0, vatExempt: row.pricing_vat_exempt || false, vatRate: row.pricing_vat_rate || 21 },
    addOns: row.addons || [], createdAt: row.created_at, createdBy: row.created_by
  };
}

function formatPhase(row) {
  return {
    id: row.id, projectId: row.project_id, name: row.name, description: row.description,
    startDate: row.start_date ? row.start_date.toISOString().split('T')[0] : null,
    endDate: row.end_date ? row.end_date.toISOString().split('T')[0] : null,
    status: row.status, order: row.sort_order, calendarEventId: row.calendar_event_id, createdAt: row.created_at
  };
}

function formatSession(row) {
  return {
    id: row.id, projectId: row.project_id, phaseId: row.phase_id, title: row.title,
    date: row.date ? row.date.toISOString().split('T')[0] : null,
    time: row.time ? row.time.substring(0, 5) : null,
    duration: row.duration, type: row.type, location: row.location,
    teamsLink: row.teams_meeting_url, calendarEventId: row.calendar_event_id, createdAt: row.created_at
  };
}

function formatTask(row) {
  return {
    id: row.id, projectId: row.project_id, phaseId: row.phase_id, title: row.title, description: row.description,
    dueDate: row.due_date ? row.due_date.toISOString().split('T')[0] : null,
    priority: row.priority, status: row.status, visibility: row.visibility, assignedToType: row.assigned_to_type,
    assignedTo: row.assignees && row.assignees.length > 0 ? row.assignees : (row.assigned_to_email ? [{ email: row.assigned_to_email, name: row.assigned_to_name, photo: row.assigned_to_photo }] : []),
    plannerTaskId: row.planner_task_id, createdAt: row.created_at, createdBy: row.created_by
  };
}

module.exports = {
  pool, getProjects, getProject, getProjectBySlug, createProject, updateProject, deleteProject,
  createPhase, updatePhase, deletePhase, getPhase,
  createSession, updateSession, deleteSession, getSession,
  createTask, updateTask, deleteTask, getTask,
  createUser, getUserByEmail, createProjectAccess, getProjectAccess, deleteProjectAccess, getUserProjects,
  createMessage, getMessages
};
