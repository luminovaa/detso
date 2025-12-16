import path from "path";
import { NotFoundError } from "./error-handler";
import { Response } from "express";
import fs from 'fs';

export const sendSecureFile = (res: Response, filePath: string) => {
    // Resolve path relatif ke absolute path server
    const absolutePath = path.resolve(process.cwd(), filePath);

    // Cek apakah file fisik benar-benar ada
    if (!fs.existsSync(absolutePath)) {
        throw new NotFoundError('File fisik tidak ditemukan di server');
    }

    // Kirim file
    res.sendFile(absolutePath);
};