import fs from 'fs';
import path from 'path';
import { google } from 'googleapis';
import mime from 'mime';

function getDriveClient() {
  const credsPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID;
  if (!credsPath || !folderId) return null;
  if (!fs.existsSync(credsPath)) return null;
  const auth = new google.auth.GoogleAuth({ keyFile: credsPath, scopes: ['https://www.googleapis.com/auth/drive.file'] });
  const drive = google.drive({ version: 'v3', auth });
  return { drive, folderId } as const;
}

export async function uploadToDrive(localFilePath: string, desiredName?: string): Promise<string | null> {
  const client = getDriveClient();
  if (!client) return null;
  const { drive, folderId } = client;
  const fileName = desiredName || path.basename(localFilePath);
  const mimeType = mime.getType(localFilePath) || 'application/octet-stream';
  const res = await drive.files.create({
    requestBody: { name: fileName, parents: [folderId] },
    media: { mimeType, body: fs.createReadStream(localFilePath) as any },
    fields: 'id'
  });
  return (res.data as any).id || null;
}


