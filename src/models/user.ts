import mongoose, { Schema, Document } from "mongoose";

export interface IUser extends Document {
  name: string;
  number: string;
  lastMessageTime: Date;
  conversations: any[];
}

const userSchema: Schema = new Schema({
  name: { type: String, required: true },
  number: { type: String, required: true, unique: true },
  lastMessageTime: { type: Date },
  conversations: [
    {
      type: Schema.Types.ObjectId,
      ref: "Conversation",
    },
  ],
});

export default mongoose.model<IUser>("User", userSchema);
