import { google } from "googleapis";
import fs from 'fs';

const GOOGLE_API_FOLDER_ID = "1_tN97RG8rCcELQ-P37rzquaj-6qoQxME";

export const uploadFile = async (filePath: string, filename: string) => {
    try {
        const auth = new google.auth.GoogleAuth({
            keyFile: './config/googledrive.json',
            scopes: ['https://www.googleapis.com/auth/drive']
        });

        const driveService = google.drive({
            version: 'v3',
            auth
        });

        const fileMetaData = {
            'name': filename,
            'parents': [GOOGLE_API_FOLDER_ID],
        };

        const media = {
            mimeType: `image/png`,
            body: await fs.createReadStream(filePath) 
        }

        const response = await driveService.files.create({
            requestBody: {
                ...fileMetaData
            },
            media
        });

        return response.data.id;
    } catch (err: any) {
        throw new Error(err.message);
    }
}