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

/**
 * Crea una reunión online de Teams
 */
async function createOnlineMeeting(accessToken, subject, startDateTime, endDateTime, attendees = []) {
  const client = getClient(accessToken);
  
  const meeting = {
    subject,
    start: { dateTime: startDateTime, timeZone: 'Europe/Madrid' },
    end: { dateTime: endDateTime, timeZone: 'Europe/Madrid' },
    isOnlineMeeting: true,
    onlineMeetingProvider: 'teamsForBusiness',
    attendees: attendees.map(email => ({
      emailAddress: { address: email },
      type: 'required'
    }))
  };
  
  const event = await client.api('/me/events').post(meeting);
  return {
    id: event.id,
    joinUrl: event.onlineMeeting?.joinUrl || '',
    subject: event.subject,
    start: event.start,
    end: event.end
  };
}

/**
 * Busca usuarios en el directorio
 */
async function searchUsers(accessToken, query) {
  const client = getClient(accessToken);
  const result = await client
    .api('/users')
    .filter(`startswith(displayName,'${query}') or startswith(mail,'${query}')`)
    .select('id,displayName,mail,userPrincipalName')
    .top(10)
    .get();
  return result.value;
}

/**
 * Obtiene los contactos del usuario
 */
async function getMyContacts(accessToken, query = '') {
  const client = getClient(accessToken);
  let api = client.api('/me/contacts').select('id,displayName,emailAddresses').top(20);
  if (query) {
    api = api.filter(`startswith(displayName,'${query}')`);
  }
  const result = await api.get();
  return result.value.map(c => ({
    id: c.id,
    name: c.displayName,
    email: c.emailAddresses?.[0]?.address || ''
  })).filter(c => c.email);
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
    .select('id,displayName,description,groupTypes')
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



// Actualizar evento con opcion de notificar
async function updateOnlineMeeting(accessToken, eventId, updates) {
  const client = getClient(accessToken);
  const payload = {};
  if (updates.subject) payload.subject = updates.subject;
  if (updates.startDateTime) {
    payload.start = { dateTime: updates.startDateTime, timeZone: 'Europe/Madrid' };
  }
  if (updates.endDateTime) {
    payload.end = { dateTime: updates.endDateTime, timeZone: 'Europe/Madrid' };
  }
  if (updates.attendees) {
    payload.attendees = updates.attendees.map(a => {
      const email = typeof a === 'string' ? a : a.email;
      const name = typeof a === 'string' ? email : (a.name || email);
      return { emailAddress: { address: email, name: name }, type: 'required' };
    });
  }
  return await client.api('/me/events/' + eventId).patch(payload);
}

// Anadir asistentes a evento existente
async function addAttendeesToMeeting(accessToken, eventId, newAttendees) {
  const client = getClient(accessToken);
  const currentEvent = await client.api('/me/events/' + eventId).get();
  const existingEmails = new Set(
    (currentEvent.attendees || []).map(a => a.emailAddress.address.toLowerCase())
  );
  const allAttendees = [...(currentEvent.attendees || [])];
  newAttendees.forEach(a => {
    const email = typeof a === 'string' ? a : a.email;
    if (!existingEmails.has(email.toLowerCase())) {
      allAttendees.push({
        emailAddress: { address: email, name: typeof a === 'string' ? email : (a.name || email) },
        type: 'required'
      });
    }
  });
  return await client.api('/me/events/' + eventId).patch({ attendees: allAttendees });
}

// Buscar contactos en emails
async function searchMailContacts(accessToken, query) {
  const client = getClient(accessToken);
  const contacts = new Map();
  try {
    const received = await client.api('/me/messages').select('from').top(100).orderby('receivedDateTime desc').get();
    received.value.forEach(m => {
      if (m.from && m.from.emailAddress && m.from.emailAddress.address) {
        const email = m.from.emailAddress.address.toLowerCase();
        if (!contacts.has(email)) {
          contacts.set(email, { name: m.from.emailAddress.name || email, email: email });
        }
      }
    });
  } catch (e) { console.error('Mail search error:', e.message); }
  try {
    const sent = await client.api('/me/mailFolders/sentitems/messages').select('toRecipients').top(50).orderby('sentDateTime desc').get();
    sent.value.forEach(m => {
      if (m.toRecipients) {
        m.toRecipients.forEach(r => {
          if (r.emailAddress && r.emailAddress.address) {
            const email = r.emailAddress.address.toLowerCase();
            if (!contacts.has(email)) {
              contacts.set(email, { name: r.emailAddress.name || email, email: email });
            }
          }
        });
      }
    });
  } catch (e) { console.error('Sent mail error:', e.message); }
  const results = Array.from(contacts.values());
  if (query) {
    const q = query.toLowerCase();
    return results.filter(c => c.name.toLowerCase().includes(q) || c.email.toLowerCase().includes(q));
  }
  return results;
}


// Obtener foto de perfil como base64
async function getPhoto(accessToken) {
  try {
    const client = getClient(accessToken);
    const photo = await client.api('/me/photo/$value').responseType('arraybuffer').get();
    
    // Convertir ArrayBuffer a base64
    const buffer = Buffer.from(photo);
    const base64 = buffer.toString('base64');
    return `data:image/jpeg;base64,${base64}`;
  } catch (e) {
    // Si no tiene foto, devolver null
    if (e.statusCode === 404 || e.code === 'ImageNotFound') return null;
    console.error('Error getPhoto:', e.message);
    return null;
  }
}


// Obtener foto de un usuario por ID
async function getUserPhoto(accessToken, userId) {
  try {
    const client = getClient(accessToken);
    const photo = await client.api(`/users/${userId}/photo/$value`).responseType('arraybuffer').get();
    const buffer = Buffer.from(photo);
    const base64 = buffer.toString('base64');
    return `data:image/jpeg;base64,${base64}`;
  } catch (e) {
    return null;
  }
}


// ============================================
// M365 INTEGRATION - AUTO SETUP FUNCTIONS
// ============================================

async function createTeamFromGroup(accessToken, groupId) {
  const client = getClient(accessToken);
  const team = await client.api("/groups/" + groupId + "/team").put({
    memberSettings: {
      allowCreateUpdateChannels: true,
      allowDeleteChannels: false,
      allowAddRemoveApps: false,
      allowCreateUpdateRemoveTabs: true,
      allowCreateUpdateRemoveConnectors: false
    },
    messagingSettings: {
      allowUserEditMessages: true,
      allowUserDeleteMessages: true,
      allowOwnerDeleteMessages: true,
      allowTeamMentions: true,
      allowChannelMentions: true
    },
    funSettings: {
      allowGiphy: true,
      giphyContentRating: "moderate",
      allowStickersAndMemes: true,
      allowCustomMemes: true
    }
  });
  return team;
}

async function getGroupSite(accessToken, groupId) {
  const client = getClient(accessToken);
  const site = await client.api("/groups/" + groupId + "/sites/root").get();
  return site;
}

async function addGroupMembers(accessToken, groupId, emails) {
  const client = getClient(accessToken);
  const results = [];
  
  for (const email of emails) {
    try {
      const users = await client.api("/users").filter("mail eq '" + email + "' or userPrincipalName eq '" + email + "'").get();
      
      if (users.value && users.value.length > 0) {
        const userId = users.value[0].id;
        await client.api("/groups/" + groupId + "/members/$ref").post({
          "@odata.id": "https://graph.microsoft.com/v1.0/directoryObjects/" + userId
        });
        results.push({ email, success: true });
      } else {
        results.push({ email, success: false, error: "User not found" });
      }
    } catch (e) {
      results.push({ email, success: false, error: e.message });
    }
  }
  return results;
}

async function addGroupOwners(accessToken, groupId, emails) {
  const client = getClient(accessToken);
  const results = [];
  
  for (const email of emails) {
    try {
      const users = await client.api("/users").filter("mail eq '" + email + "' or userPrincipalName eq '" + email + "'").get();
      
      if (users.value && users.value.length > 0) {
        const userId = users.value[0].id;
        await client.api("/groups/" + groupId + "/owners/$ref").post({
          "@odata.id": "https://graph.microsoft.com/v1.0/directoryObjects/" + userId
        });
        results.push({ email, success: true });
      } else {
        results.push({ email, success: false, error: "User not found" });
      }
    } catch (e) {
      results.push({ email, success: false, error: e.message });
    }
  }
  return results;
}

async function associateToHubSite(accessToken, siteId, hubSiteId) {
  const client = getClient(accessToken);
  try {
    await client.api("/sites/" + siteId).patch({ hubSiteId: hubSiteId });
    return { success: true };
  } catch (e) {
    return { success: false, error: e.message };
  }
}

async function getHubSites(accessToken) {
  const client = getClient(accessToken);
  try {
    const sites = await client.api("/sites?filter=isHubSite eq true").get();
    return sites.value || [];
  } catch (e) {
    return [];
  }
}

async function createDefaultPlannerBuckets(accessToken, planId) {
  const defaultBuckets = ["Por hacer", "En curso", "Completado", "En espera"];
  const results = [];
  
  for (let i = 0; i < defaultBuckets.length; i++) {
    try {
      const bucket = await createBucket(accessToken, planId, defaultBuckets[i], " " + String.fromCharCode(65 + i) + "!");
      results.push(bucket);
    } catch (e) {
      console.error("Error creating bucket " + defaultBuckets[i] + ":", e.message);
    }
  }
  return results;
}

async function setupFullM365Project(accessToken, projectName, clientName, projectDescription, teamEmails) {
  projectDescription = projectDescription || "";
  teamEmails = teamEmails || [];
  clientName = clientName || "";
  const results = { success: false, steps: {} };
  
  try {
    const groupName = clientName ? "PV - " + clientName + " - " + projectName : "PV - " + projectName;
    const mailNickname = (clientName + projectName).toLowerCase().replace(/[^a-z0-9]/g, "").substring(0, 20);
    const group = await createGroup(accessToken, groupName, mailNickname, projectDescription || "Proyecto gestionado por Plain Vanilla");
    results.steps.group = { success: true, data: group };
    
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    try {
      const team = await createTeamFromGroup(accessToken, group.id);
      results.steps.team = { success: true, data: team };
    } catch (e) {
      results.steps.team = { success: false, error: e.message };
    }
    
    try {
      const site = await getGroupSite(accessToken, group.id);
      results.steps.sharepoint = { success: true, data: site };
    } catch (e) {
      results.steps.sharepoint = { success: false, error: e.message };
    }
    
    try {
      const plan = await createPlan(accessToken, group.id, projectName);
      results.steps.planner = { success: true, data: plan };
      const buckets = await createDefaultPlannerBuckets(accessToken, plan.id);
      results.steps.buckets = { success: true, data: buckets };
    } catch (e) {
      results.steps.planner = { success: false, error: e.message };
    }
    
    if (teamEmails.length > 0) {
      try {
        const members = await addGroupMembers(accessToken, group.id, teamEmails);
        results.steps.members = { success: true, data: members };
      } catch (e) {
        results.steps.members = { success: false, error: e.message };
      }
    }
    
    results.success = true;
    results.groupId = group.id;
    
  } catch (e) {
    results.error = e.message;
  }
  
  return results;
}


async function deleteGroup(accessToken, groupId) {
  const client = getClient(accessToken);
  try {
    await client.api("/groups/" + groupId).delete();
    return { success: true };
  } catch (e) {
    return { success: false, error: e.message };
  }
}

module.exports = {
  getPhoto,
  getUserPhoto,
  updateOnlineMeeting,
  addAttendeesToMeeting,
  searchMailContacts,
  getClient,
  // M365 Auto Setup
  deleteGroup,
  createTeamFromGroup,
  getGroupSite,
  addGroupMembers,
  addGroupOwners,
  associateToHubSite,
  getHubSites,
  createDefaultPlannerBuckets,
  setupFullM365Project,
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
  createOnlineMeeting,
  searchUsers,
  getMyContacts,
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
  createGroup,
  searchMailContacts
};
