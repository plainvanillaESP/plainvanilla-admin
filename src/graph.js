require('isomorphic-fetch');
const { Client } = require('@microsoft/microsoft-graph-client');

/**
 * Crea un cliente de Graph con el token de acceso
 */
function getClient(accessToken) {
  return Client.init({
    authProvider: (done) => {
      done(null, accessToken);
    }
  });
}

// ============================================
// USUARIO
// ============================================

/**
 * Obtiene información del usuario actual
 */
async function getMe(accessToken) {
  const client = getClient(accessToken);
  return await client.api('/me').get();
}

/**
 * Obtiene la foto del usuario actual
 */
async function getMyPhoto(accessToken) {
  const client = getClient(accessToken);
  try {
    const photo = await client.api('/me/photo/$value').get();
    return photo;
  } catch (error) {
    return null;
  }
}

// ============================================
// SHAREPOINT
// ============================================

/**
 * Obtiene el sitio raíz de SharePoint
 */
async function getRootSite(accessToken) {
  const client = getClient(accessToken);
  return await client.api('/sites/root').get();
}

/**
 * Busca un sitio de SharePoint por nombre
 */
async function searchSite(accessToken, query) {
  const client = getClient(accessToken);
  const result = await client.api(`/sites?search=${query}`).get();
  return result.value;
}

/**
 * Obtiene un sitio específico
 */
async function getSite(accessToken, siteId) {
  const client = getClient(accessToken);
  return await client.api(`/sites/${siteId}`).get();
}

/**
 * Crea una carpeta en SharePoint
 */
async function createFolder(accessToken, siteId, folderName, parentPath = 'root') {
  const client = getClient(accessToken);
  
  const driveItem = {
    name: folderName,
    folder: {},
    '@microsoft.graph.conflictBehavior': 'rename'
  };

  return await client
    .api(`/sites/${siteId}/drive/items/${parentPath}/children`)
    .post(driveItem);
}

/**
 * Lista archivos de una carpeta
 */
async function listFiles(accessToken, siteId, folderId = 'root') {
  const client = getClient(accessToken);
  const result = await client
    .api(`/sites/${siteId}/drive/items/${folderId}/children`)
    .get();
  return result.value;
}

/**
 * Sube un archivo a SharePoint
 */
async function uploadFile(accessToken, siteId, folderId, fileName, content) {
  const client = getClient(accessToken);
  
  return await client
    .api(`/sites/${siteId}/drive/items/${folderId}:/${fileName}:/content`)
    .put(content);
}

/**
 * Obtiene un link de descarga para un archivo
 */
async function getDownloadUrl(accessToken, siteId, itemId) {
  const client = getClient(accessToken);
  const item = await client
    .api(`/sites/${siteId}/drive/items/${itemId}`)
    .select('@microsoft.graph.downloadUrl')
    .get();
  return item['@microsoft.graph.downloadUrl'];
}

/**
 * Crea un link de compartir
 */
async function createShareLink(accessToken, siteId, itemId, type = 'view') {
  const client = getClient(accessToken);
  
  const permission = {
    type: type, // 'view' o 'edit'
    scope: 'anonymous'
  };

  const result = await client
    .api(`/sites/${siteId}/drive/items/${itemId}/createLink`)
    .post(permission);
    
  return result.link.webUrl;
}

// ============================================
// PLANNER (Tareas)
// ============================================

/**
 * Lista los planes de un grupo
 */
async function listPlans(accessToken, groupId) {
  const client = getClient(accessToken);
  const result = await client.api(`/groups/${groupId}/planner/plans`).get();
  return result.value;
}

/**
 * Crea un plan en un grupo
 */
async function createPlan(accessToken, groupId, title) {
  const client = getClient(accessToken);
  
  const plan = {
    owner: groupId,
    title: title
  };

  return await client.api('/planner/plans').post(plan);
}

/**
 * Obtiene los detalles de un plan
 */
async function getPlanDetails(accessToken, planId) {
  const client = getClient(accessToken);
  return await client.api(`/planner/plans/${planId}/details`).get();
}

/**
 * Lista los buckets de un plan
 */
async function listBuckets(accessToken, planId) {
  const client = getClient(accessToken);
  const result = await client.api(`/planner/plans/${planId}/buckets`).get();
  return result.value;
}

/**
 * Crea un bucket en un plan
 */
async function createBucket(accessToken, planId, name, orderHint = ' !') {
  const client = getClient(accessToken);
  
  const bucket = {
    name: name,
    planId: planId,
    orderHint: orderHint
  };

  return await client.api('/planner/buckets').post(bucket);
}

/**
 * Lista las tareas de un plan
 */
async function listTasks(accessToken, planId) {
  const client = getClient(accessToken);
  const result = await client.api(`/planner/plans/${planId}/tasks`).get();
  return result.value;
}

/**
 * Crea una tarea en un plan
 */
async function createTask(accessToken, planId, bucketId, title, options = {}) {
  const client = getClient(accessToken);
  
  const task = {
    planId: planId,
    bucketId: bucketId,
    title: title,
    ...options
  };

  return await client.api('/planner/tasks').post(task);
}

/**
 * Actualiza una tarea
 */
async function updateTask(accessToken, taskId, updates, etag) {
  const client = getClient(accessToken);
  
  return await client
    .api(`/planner/tasks/${taskId}`)
    .header('If-Match', etag)
    .patch(updates);
}

// ============================================
// CALENDAR
// ============================================

/**
 * Lista eventos del calendario
 */
async function listEvents(accessToken, startDate, endDate) {
  const client = getClient(accessToken);
  
  const result = await client
    .api('/me/calendarView')
    .query({
      startDateTime: startDate,
      endDateTime: endDate
    })
    .select('subject,start,end,location,bodyPreview')
    .orderby('start/dateTime')
    .get();
    
  return result.value;
}

/**
 * Crea un evento en el calendario
 */
async function createEvent(accessToken, event) {
  const client = getClient(accessToken);
  return await client.api('/me/events').post(event);
}

/**
 * Crea un evento en un calendario de grupo
 */
async function createGroupEvent(accessToken, groupId, event) {
  const client = getClient(accessToken);
  return await client.api(`/groups/${groupId}/events`).post(event);
}

// ============================================
// TEAMS
// ============================================

/**
 * Lista los equipos del usuario
 */
async function listMyTeams(accessToken) {
  const client = getClient(accessToken);
  const result = await client.api('/me/joinedTeams').get();
  return result.value;
}

/**
 * Obtiene info de un equipo
 */
async function getTeam(accessToken, teamId) {
  const client = getClient(accessToken);
  return await client.api(`/teams/${teamId}`).get();
}

/**
 * Lista los canales de un equipo
 */
async function listChannels(accessToken, teamId) {
  const client = getClient(accessToken);
  const result = await client.api(`/teams/${teamId}/channels`).get();
  return result.value;
}

/**
 * Crea un canal en un equipo
 */
async function createChannel(accessToken, teamId, displayName, description = '') {
  const client = getClient(accessToken);
  
  const channel = {
    displayName: displayName,
    description: description
  };

  return await client.api(`/teams/${teamId}/channels`).post(channel);
}

/**
 * Envía un mensaje a un canal
 */
async function sendChannelMessage(accessToken, teamId, channelId, message) {
  const client = getClient(accessToken);
  
  const chatMessage = {
    body: {
      content: message,
      contentType: 'html'
    }
  };

  return await client
    .api(`/teams/${teamId}/channels/${channelId}/messages`)
    .post(chatMessage);
}

/**
 * Lista miembros de un equipo
 */
async function listTeamMembers(accessToken, teamId) {
  const client = getClient(accessToken);
  const result = await client.api(`/teams/${teamId}/members`).get();
  return result.value;
}

// ============================================
// GRUPOS (base para Teams y Planner)
// ============================================

/**
 * Lista grupos del usuario
 */
async function listMyGroups(accessToken) {
  const client = getClient(accessToken);
  const result = await client
    .api('/me/memberOf')
    .filter("groupTypes/any(c:c eq 'Unified')")
    .get();
  return result.value;
}

/**
 * Crea un grupo Microsoft 365 (base para Team)
 */
async function createGroup(accessToken, displayName, mailNickname, description = '') {
  const client = getClient(accessToken);
  
  const group = {
    displayName: displayName,
    mailNickname: mailNickname,
    description: description,
    groupTypes: ['Unified'],
    mailEnabled: true,
    securityEnabled: false
  };

  return await client.api('/groups').post(group);
}

module.exports = {
  getClient,
  // Usuario
  getMe,
  getMyPhoto,
  // SharePoint
  getRootSite,
  searchSite,
  getSite,
  createFolder,
  listFiles,
  uploadFile,
  getDownloadUrl,
  createShareLink,
  // Planner
  listPlans,
  createPlan,
  getPlanDetails,
  listBuckets,
  createBucket,
  listTasks,
  createTask,
  updateTask,
  // Calendar
  listEvents,
  createEvent,
  createGroupEvent,
  // Teams
  listMyTeams,
  getTeam,
  listChannels,
  createChannel,
  sendChannelMessage,
  listTeamMembers,
  // Grupos
  listMyGroups,
  createGroup
};
