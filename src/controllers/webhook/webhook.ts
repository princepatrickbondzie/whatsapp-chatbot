import { Request, Response } from "express";
import User, { IUser } from "../../models/user";
import Conversation from "../../models/conversation";
import BotResponse from "../../models/bot.response";
import { Configs } from "../../config/config";
import axios from "axios";
import { ResponseType } from "../../common/enum";
import { Types } from "mongoose";

const verify_token = Configs.VERIFY_TOKEN;
const token = Configs.WHATSAPP_TOKEN;

// Accepts POST requests at /webhook endpoint
async function webhook(req: Request, res: Response) {
  const currentTime = new Date();
  let responseMessage = "";

  try {
    // Parse the request body from the POST
    const body = req.body;

    // Check if the incoming message is from the WhatsApp API
    if (body.object) {
      const changes = body.entry?.[0]?.changes?.[0];
      const messages = changes?.value?.messages;
      const phone_number_id = changes?.value?.metadata?.phone_number_id;

      if (messages?.length && phone_number_id) {
        const message = messages[0];
        const from = message.from;
        const msg_body = message.text.body;

        let user: IUser | null = await User.findOne({ number: from }).populate({
          path: "conversations",
          populate: {
            path: "nextResponse",
          },
        });
        console.log("user:", user);

        if (!user) {
          user = await User.create({
            name: from,
            number: from,
            lastMessageTime: currentTime,
          });

          const response = await getBotResponseByType(ResponseType.Welcome);

          if (response) {
            const convers = await createConversation(
              user._id,
              msg_body,
              response._id,
              currentTime
            );
            user.conversations.push(new Types.ObjectId(convers._id));
            responseMessage = response.message;
          }
        } else {
          const timeElapsed =
            currentTime.getTime() - user.lastMessageTime.getTime();

          if (timeElapsed > 900000) {
            user.lastMessageTime = currentTime;
            const response = await getBotResponseByType(
              ResponseType.WelcomeBack
            );

            if (response) {
              const convers = await createConversation(
                user._id,
                msg_body,
                response._id,
                currentTime
              );
              user.conversations.push(new Types.ObjectId(convers._id));
              responseMessage = response.message;
            }
          } else {
            const lastConversation =
              user.conversations[user.conversations.length - 1];
            let response;
            console.log("User exist and is within time");

            if (
              lastConversation.nextResponse.type === ResponseType.Welcome ||
              lastConversation.nextResponse.type === ResponseType.WelcomeBack
            ) {
              response = await getBotResponseByType(ResponseType.NumberReq);
            } else if (
              lastConversation.nextResponse.type === ResponseType.NumberReq
            ) {
              response = await getBotResponseByType(ResponseType.ThankYou);
            } else {
              response = await getBotResponseByType(ResponseType.WelcomeBack);
            }

            if (response) {
              user.lastMessageTime = currentTime;
              const convers = await createConversation(
                user._id,
                msg_body,
                response._id,
                currentTime
              );
              user.conversations.push(new Types.ObjectId(convers._id));
              responseMessage = response.message;
            }
          }
        }

        await user.save();

        // Send the response back to the user using the WhatsApp Business API
        await sendWhatsAppMessage(from, responseMessage, phone_number_id);
      }

      res.sendStatus(200);
    } else {
      // Return a '404 Not Found' if the event is not from the WhatsApp API
      res.sendStatus(404);
    }
  } catch (error) {
    console.error("Error processing the message:", error);
    res.sendStatus(500);
  }
}

async function getBotResponseByType(type: ResponseType): Promise<any | null> {
  return BotResponse.findOne({ type });
}

async function createConversation(
  userId: string,
  message: string,
  nextResponseId: string,
  messageTime: Date
) {
  return await Conversation.create({
    user: userId,
    message,
    nextResponse: nextResponseId,
    messageTime,
  });
}

async function sendWhatsAppMessage(to: string, message: string, numberId: any) {
  const WA_API_URL = "https://graph.facebook.com/v12.0/";
  const response = await axios.post(
    `${WA_API_URL}${numberId}/messages?access_token=${token}`,
    {
      messaging_product: "whatsapp",
      to,
      text: { body: message },
    },
    {
      headers: { "Content-Type": "application/json" },
    }
  );

  console.log("Message sent successfully:", response.data);
}

// Accepts GET requests at the /webhook endpoint. You need this URL to setup webhook initially.
// info on verification request payload: https://developers.facebook.com/docs/graph-api/webhooks/getting-started#verification-requests

async function verifyWebhook(req: Request, res: Response) {
  /**
   * UPDATE YOUR VERIFY TOKEN
   *This will be the Verify Token value when you set up webhook
   **/

  // Parse params from the webhook verification request
  let mode = req.query["hub.mode"];
  let token = req.query["hub.verify_token"];
  let challenge = req.query["hub.challenge"];

  // Check if a token and mode were sent
  if (mode && token) {
    // Check the mode and token sent are correct
    if (mode === "subscribe" && token === verify_token) {
      // Respond with 200 OK and challenge token from the request
      console.log("WEBHOOK_VERIFIED");
      res.status(200).send(challenge);
    } else {
      // Responds with '403 Forbidden' if verify tokens do not match
      res.sendStatus(403);
    }
  }
}

export { webhook, verifyWebhook };
