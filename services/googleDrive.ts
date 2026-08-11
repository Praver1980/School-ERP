import { CloudConfig, ERPDatabase } from '../types';

// Fix: Declare global gapi and google variables provided by external scripts (Google Drive and Identity Services)
declare const gapi: any;
declare const google: any;

const DISCOVERY_DOCS = ["https://www.googleapis.com/discovery/v1/apis/drive/v3/rest"];
const SCOPES = "https://www.googleapis.com/auth/drive.file";

let tokenClient: any = null;
let accessToken: string | null = null;

export const initGoogleDrive = async (config: CloudConfig) => {
  if (!config.clientId || !config.enabled) return;

  return new Promise<void>((resolve) => {
    // Fix: Using global gapi variable to load client library
    gapi.load('client', async () => {
      // Fix: Using global gapi variable to initialize the client
      await gapi.client.init({
        clientId: config.clientId,
        discoveryDocs: DISCOVERY_DOCS,
      });
      
      // Fix: Using global google variable to initialize OAuth2 token client
      tokenClient = google.accounts.oauth2.initTokenClient({
        client_id: config.clientId,
        scope: SCOPES,
        callback: (response: any) => {
          if (response.error !== undefined) {
            throw (response);
          }
          accessToken = response.access_token;
          resolve();
        },
      });
      resolve();
    });
  });
};

export const signInGoogle = async () => {
  return new Promise<void>((resolve, reject) => {
    if (!tokenClient) {
        reject(new Error("Google Drive client not initialized. Check your Client ID."));
        return;
    }
    tokenClient.callback = (response: any) => {
      if (response.error !== undefined) {
        reject(response);
      }
      accessToken = response.access_token;
      resolve();
    };

    if (accessToken === null) {
      tokenClient.requestAccessToken({ prompt: 'consent' });
    } else {
      tokenClient.requestAccessToken({ prompt: '' });
    }
  });
};

const findOrCreateFile = async (fileName: string) => {
  // Fix: Using global gapi variable to list files in Google Drive
  const response = await gapi.client.drive.files.list({
    q: `name = '${fileName}' and trashed = false`,
    fields: 'files(id, name)',
    spaces: 'drive',
  });

  const files = response.result.files;
  if (files && files.length > 0) {
    return files[0].id;
  }
  return null;
};

export const syncToGoogleDrive = async (data: ERPDatabase) => {
  try {
    if (!accessToken) await signInGoogle();

    const fileName = 'nexus_erp_db.json';
    const fileId = await findOrCreateFile(fileName);
    const content = JSON.stringify(data, null, 2);

    if (fileId) {
      // Update existing file
      await fetch(`https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=media`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: content,
      });
    } else {
      // Create new file
      const metadata = {
        name: fileName,
        mimeType: 'application/json',
      };

      const form = new FormData();
      form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
      form.append('file', new Blob([content], { type: 'application/json' }));

      await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        body: form,
      });
    }
    return true;
  } catch (error) {
    console.error('Google Drive Sync Error:', error);
    return false;
  }
};

export const fetchFromGoogleDrive = async (): Promise<ERPDatabase | null> => {
  try {
    if (!accessToken) await signInGoogle();

    const fileName = 'nexus_erp_db.json';
    const fileId = await findOrCreateFile(fileName);

    if (!fileId) return null;

    const response = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    return await response.json();
  } catch (error) {
    console.error('Google Drive Fetch Error:', error);
    return null;
  }
};