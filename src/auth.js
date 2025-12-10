const msal = require('@azure/msal-node');

// Configuración de MSAL
const msalConfig = {
  auth: {
    clientId: process.env.AZURE_CLIENT_ID,
    clientSecret: process.env.AZURE_CLIENT_SECRET,
    authority: 'https://login.microsoftonline.com/common'
  }
};

const msalClient = new msal.ConfidentialClientApplication(msalConfig);

// Scopes que necesitamos
const SCOPES = [
  'User.Read',
  'Sites.ReadWrite.All',
  'Tasks.ReadWrite',
  'Calendars.ReadWrite',
  'Channel.ReadBasic.All',
  'ChannelMessage.Send'
];

/**
 * Genera la URL para iniciar el login con Microsoft
 */
async function getAuthUrl() {
  const authCodeUrlParameters = {
    scopes: SCOPES,
    redirectUri: process.env.AZURE_REDIRECT_URI
  };

  return await msalClient.getAuthCodeUrl(authCodeUrlParameters);
}

/**
 * Intercambia el código de autorización por tokens
 */
async function getTokenFromCode(code) {
  const tokenRequest = {
    code,
    scopes: SCOPES,
    redirectUri: process.env.AZURE_REDIRECT_URI
  };

  const response = await msalClient.acquireTokenByCode(tokenRequest);
  
  return {
    accessToken: response.accessToken,
    refreshToken: response.refreshToken || null,
    expiresIn: response.expiresOn 
      ? Math.floor((response.expiresOn.getTime() - Date.now()) / 1000)
      : 3600
  };
}

/**
 * Refresca el token de acceso
 */
async function refreshToken(refreshToken) {
  const refreshRequest = {
    refreshToken,
    scopes: SCOPES
  };

  try {
    const response = await msalClient.acquireTokenByRefreshToken(refreshRequest);
    return {
      accessToken: response.accessToken,
      refreshToken: response.refreshToken || refreshToken,
      expiresIn: response.expiresOn 
        ? Math.floor((response.expiresOn.getTime() - Date.now()) / 1000)
        : 3600
    };
  } catch (error) {
    console.error('Error refrescando token:', error);
    throw error;
  }
}

module.exports = {
  getAuthUrl,
  getTokenFromCode,
  refreshToken,
  SCOPES
};
