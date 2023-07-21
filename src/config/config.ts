import * as dotenv from "dotenv";
dotenv.config();

export const Configs = {
  PORT: process.env.PORT,
  MONGODB_URL: process.env.MONGODB_URL,
  WHATSAPP_TOKEN: process.env.WHATSAPP_TOKEN,
  VERIFY_TOKEN: process.env.VERIFY_TOKEN,
};
