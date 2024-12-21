import mongoose, { Document } from 'mongoose';
import bcrypt from 'bcrypt';

export interface IUser extends Document {
  username: string;
  password: string;
  friends: string[];
  profileImage?: string | null;
  refreshToken?: string;
  isPasswordMatch(password: string): Promise<boolean>;
}

const userSchema = new mongoose.Schema({
    username: { type: String, unique: true, required: true },
    password: { type: String, required: true },
    friends: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }], // List of friends
    profileImage: { type: String } // New field for profile image URL
});

// Add password comparison method
userSchema.methods.isPasswordMatch = async function(password:string) {
    try {
        return await bcrypt.compare(password, this.password);
    } catch (error:any) {
        throw new Error(error);
    }
};

// Pre-save middleware to hash the password
userSchema.pre('save', async function(next) {
    if (!this.isModified('password')) {
        return next();
    }
    try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (err:any) {
        next(err);
    }
});

// Method to compare the entered password with the hashed password
userSchema.methods.comparePassword = async function(candidatePassword:string) {
    return await bcrypt.compare(candidatePassword, this.password);
};

const User = mongoose.model<IUser>('User', userSchema);
export default User;
