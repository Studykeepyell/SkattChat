import mongoose, { Document } from 'mongoose';

export interface IGameScore extends Document {
    userId: mongoose.Types.ObjectId;
    username: string;
    score: number;
    accuracy: number;
    songName: string;
    createdAt: Date;
}

const gameScoreSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    username: {
        type: String,
        required: true
    },
    score: {
        type: Number,
        required: true
    },
    accuracy: {
        type: Number,
        required: true
    },
    songName: {
        type: String,
        required: true
    }
}, {
    timestamps: true
});

// Index for better query performance
gameScoreSchema.index({ score: -1 });
gameScoreSchema.index({ userId: 1 });

export default mongoose.model<IGameScore>('GameScore', gameScoreSchema);
