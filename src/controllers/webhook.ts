import { Request, Response } from "express";
import User, { IUser } from "../models/User";
import Conversation from "../models/conversation";
import BotResponse from "../models/bot.response";
import { Configs } from "../config/config";
import axios from "axios";
import { ResponseType } from "../common/enum";

const verify_token = Configs.VERIFY_TOKEN;
const token = Configs.WHATSAPP_TOKEN;

// Accepts POST requests at /webhook endpoint
async function webhook(req: Request, res: Response) {
  // Parse the request body from the POST
  let body = req.body;
  const currentTime = new Date();
  let responseMessage = "";

  // Check the Incoming webhook message
  console.log(JSON.stringify(req.body, null, 2));

  // info on WhatsApp text message payload: https://developers.facebook.com/docs/whatsapp/cloud-api/webhooks/payload-examples#text-messages
  if (req.body.object) {
    if (
      req.body.entry &&
      req.body.entry[0].changes &&
      req.body.entry[0].changes[0] &&
      req.body.entry[0].changes[0].value.messages &&
      req.body.entry[0].changes[0].value.messages[0]
    ) {
      let phone_number_id =
        req.body.entry[0].changes[0].value.metadata.phone_number_id;
      let from = req.body.entry[0].changes[0].value.messages[0].from; // extract the phone number from the webhook payload
      let msg_body = req.body.entry[0].changes[0].value.messages[0].text.body; // extract the message text from the webhook payload

      // Find the user in the database based on their phone number (from)
      let user: IUser | null = await User.findOne({ number: from }).populate({
        path: "conversations",
        populate: {
          path: "nextResponse",
        },
      });

      if (!user) {
        user = await User.create({
          name: from,
          number: from,
          lastMessageTime: currentTime,
        });

        const response = await BotResponse.findOne({
          type: ResponseType.Welcome,
        });

        if (response) {
          await Conversation.create({
            user: user._id,
            message: msg_body,
            nextResponse: response?._id,
            messageTime: currentTime,
          });

          responseMessage = response.message;
        }
      } else {
        // Calculate the time elapsed since the user's last message
        const timeElapsed =
          currentTime.getTime() - user.lastMessageTime.getTime();

        // If the last message was sent more than 15 minutes ago, reset the conversation
        if (timeElapsed > 900000) {
          user.lastMessageTime = currentTime;
          const response = await BotResponse.findOne({
            type: ResponseType.WelcomeBack,
          });
          if (response) {
            await Conversation.create({
              user: user._id,
              message: msg_body,
              nextResponse: response?._id,
              messageTime: currentTime,
            });
            responseMessage = response.message;
          }
        } else {
          const lastConversation =
            user.conversations[user.conversations.length - 1];

          if (
            lastConversation.nextResponse.type === ResponseType.Welcome ||
            lastConversation.nextResponse.type === ResponseType.WelcomeBack
          ) {
            user.lastMessageTime = currentTime;
            const response = await BotResponse.findOne({
              type: ResponseType.NumberReq,
            });

            if (response) {
              await Conversation.create({
                user: user._id,
                message: msg_body,
                nextResponse: response?._id,
                messageTime: currentTime,
              });
              responseMessage = response.message;
            }
          } else if (
            lastConversation.nextResponse.type === ResponseType.NumberReq
          ) {
            user.lastMessageTime = currentTime;
            const response = await BotResponse.findOne({
              type: ResponseType.ThankYou,
            });

            if (response) {
              await Conversation.create({
                user: user._id,
                message: msg_body,
                nextResponse: response?._id,
                messageTime: currentTime,
              });
              responseMessage = response.message;
            }
          } else {
            user.lastMessageTime = currentTime;
            const response = await BotResponse.findOne({
              type: ResponseType.WelcomeBack,
            });

            if (response) {
              await Conversation.create({
                user: user._id,
                message: msg_body,
                nextResponse: response?._id,
                messageTime: currentTime,
              });
              responseMessage = response.message;
            }
          }
        }
      }

      await user.save();

      axios({
        method: "POST", // Required, HTTP method, a string, e.g. POST, GET
        url:
          "https://graph.facebook.com/v12.0/" +
          phone_number_id +
          "/messages?access_token=" +
          token,
        data: {
          messaging_product: "whatsapp",
          to: from,
          text: { body: "Ack: " + responseMessage },
        },
        headers: { "Content-Type": "application/json" },
      });
    }
    res.sendStatus(200);
  } else {
    // Return a '404 Not Found' if event is not from a WhatsApp API
    res.sendStatus(404);
  }
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

export { verifyWebhook, webhook };
