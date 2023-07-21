import mongoose, { Schema, Document } from "mongoose";
import { ResponseType } from "../common/enum";

export interface IBotResponse extends Document {
  type: string;
  message: string;
}

const botResponseSchema: Schema = new Schema({
  type: {
    type: Schema.Types.String,
    enum: [
      ResponseType.Welcome,
      ResponseType.NameReq,
      ResponseType.NumberReq,
      ResponseType.Services,
      ResponseType.ThankYou,
      ResponseType.WelcomeBack,
    ],
    required: true,
    unique: true,
  },
  message: { type: Schema.Types.String, required: true },
});

export default mongoose.model<IBotResponse>("BotResponse", botResponseSchema);
