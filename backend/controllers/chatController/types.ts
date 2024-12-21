import { Document } from 'mongoose';

export interface IMessage extends Document {
    _id: string;
    roomId: string;
    userId: string;
    username: string;
    message: string;
    timestamp: Date;
    createdAt: Date;
    updatedAt: Date;
}

export interface IParticipant {
    _id: string;
    username: string;
    profileImage: string;
}