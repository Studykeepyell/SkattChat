import { Request } from 'express';

export interface FileRequest extends Request {
    file?: Express.Multer.File;
}

export interface ErrorResponse {
    success: false;
    message: string;
}