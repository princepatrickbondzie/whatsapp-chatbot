import mongoose, { Schema, Document } from "mongoose";

export interface IConversation extends Document {
  user: any;
  message: string;
  initialResponse: string;
  nextResponse: string;
  messageTime: Date;
}

const conversationSchema: Schema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    initialResponse: { type: Schema.Types.ObjectId, ref: "BotResponse" },
    message: { type: Schema.Types.String, required: true },
    nextResponse: {
      type: Schema.Types.ObjectId,
      ref: "BotResponse",
      required: true,
    },
    messageTime: { type: Date, required: true },
  },
  { timestamps: true }
);

export default mongoose.model<IConversation>(
  "Conversation",
  conversationSchema
);
