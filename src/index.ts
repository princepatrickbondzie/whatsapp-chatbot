import express, { Request, Response } from "express";
import "./config/dbConnect";
import cors from "cors";
import { Configs } from "./config/config";
import webhookRoutes from "./routes/webhook/webhook.routes";
import botResponseRoutes from "./routes/bot-response/bot.response.routes";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cors());

app.get("/", (req: Request, res: Response) => {
  res.status(200).json("Welcome To WhatsApp Chatbot API");
});

//routes
app.use("/webhook", webhookRoutes);
app.use("/bot-response", botResponseRoutes);

app.listen(Configs.PORT, () => {
  console.log(`Server is running on port: ${Configs.PORT}`);
});
