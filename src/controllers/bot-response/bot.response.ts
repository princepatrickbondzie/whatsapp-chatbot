import { Request, Response } from "express";
import BotResponse from "../../models/bot.response";

async function createBR(req: Request, res: Response) {
  const br = await BotResponse.create(req.body);
  res.status(201).json({ data: br });
}
async function getAllBRs(req: Request, res: Response) {
  const brs = await BotResponse.find();
  res.status(201).json({ data: brs });
}
async function getSingleBR(req: Request, res: Response) {
  const br = await BotResponse.findById(req.params.id);
  res.status(201).json({ data: br });
}
async function updateBR(req: Request, res: Response) {
  const updatebr = await BotResponse.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true }
  );
  res.status(201).json({ data: updatebr });
}
async function deleteBR(req: Request, res: Response) {
  await BotResponse.findByIdAndDelete(req.params.id);
  res.status(201).json({ message: "Bot response deleted successfully" });
}

export { createBR, getAllBRs, getSingleBR, updateBR, deleteBR };
