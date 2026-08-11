import * as msal from '@azure/msal-browser';
import { Client } from '@microsoft/microsoft-graph-client';
import { CloudConfig, ERPDatabase } from '../types';

let msalInstance: msal.PublicClientApplication | null = null;

export const initOneDrive = async (config: CloudConfig) => {
  if (!config.clientId || !config.enabled) return null;

  const msalConfig: msal.Configuration = {
    auth: {
      clientId: config.clientId,
      authority: 'https://login.microsoftonline.com/common',
      redirectUri: window.location.origin,
    },
    cache: {
      cacheLocation: 'localStorage',
    },
  };

  msalInstance = new msal.PublicClientApplication(msalConfig);
  await msalInstance.initialize();
  return msalInstance;
};

export const signIn = async () => {
  if (!msalInstance) throw new Error('MSAL not initialized');
  const loginRequest = {
    scopes: ['User.Read', 'Files.ReadWrite'],
  };
  return await msalInstance.loginPopup(loginRequest);
};

const getAccessToken = async () => {
  if (!msalInstance) throw new Error('MSAL not initialized');
  const accounts = msalInstance.getAllAccounts();
  if (accounts.length === 0) throw new Error('No user signed in');

  const request = {
    scopes: ['Files.ReadWrite'],
    account: accounts[0],
  };

  try {
    const response = await msalInstance.acquireTokenSilent(request);
    return response.accessToken;
  } catch (e) {
    const response = await msalInstance.acquireTokenPopup(request);
    return response.accessToken;
  }
};

export const syncToOneDrive = async (data: ERPDatabase) => {
  try {
    const token = await getAccessToken();
    const client = Client.init({
      authProvider: (done) => done(null, token),
    });

    const content = JSON.stringify(data, null, 2);
    const blob = new Blob([content], { type: 'application/json' });

    await client.api('/me/drive/root:/nexus_erp_db.json:/content').put(blob);
    return true;
  } catch (error) {
    console.error('OneDrive Sync Error:', error);
    return false;
  }
};

export const fetchFromOneDrive = async (): Promise<ERPDatabase | null> => {
  try {
    const token = await getAccessToken();
    const client = Client.init({
      authProvider: (done) => done(null, token),
    });

    const response = await client.api('/me/drive/root:/nexus_erp_db.json:/content').get();
    return response;
  } catch (error) {
    console.error('OneDrive Fetch Error:', error);
    return null;
  }
};