require("dotenv").config();
const { v4: uuidv4 } = require("uuid");
const AccessToken = require("twilio").jwt.AccessToken;
const VideoGrant = AccessToken.VideoGrant;
const express = require("express");
const app = express();
const port = 80;

// use the Express JSON middleware
app.use(express.json());
app.use(express.static("public"));

// create the twilioClient
const twilioClient = require("twilio")(process.env.TWILIO_API_KEY_SID, process.env.TWILIO_API_KEY_SECRET, {
  accountSid: process.env.TWILIO_ACCOUNT_SID,
});

const findOrCreateRoom = async (roomName) => {
  try {
    await twilioClient.video.v1.rooms(roomName).fetch();
    console.log(`Room ${roomName} already exists.`);
  } catch (error) {
    console.log(error);
    // the room was not found, so create it
    if (error.code == 20404) {
      try {
        await twilioClient.video.v1.rooms.create({ uniqueName: roomName, type: "go" });
        console.log(`Room ${roomName} created successfully.`);
      } catch (createError) {
        console.error(`Error creating room ${roomName}:`, createError);
      }
    } else {
      throw error;
    }
  }
};

const getAccessToken = (roomName) => {
  const token = new AccessToken(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_API_KEY_SID, process.env.TWILIO_API_KEY_SECRET, {
    identity: uuidv4(),
  });
  const videoGrant = new VideoGrant({ room: roomName });
  token.addGrant(videoGrant);
  return token.toJwt();
};

app.post("/join-room", async (req, res) => {
  let { roomName } = req.body;
  if (!req.body || !roomName) {
    return res.status(400).send({ message: "Must include roomName argument." });
  }
  findOrCreateRoom(roomName);
  const token = getAccessToken(roomName);
  res.send({ token: token });
});

app.get("/", (req, res) => {
  res.sendFile("public/index.html");
});

// Start the Express server
app.listen(port, () => {
  console.log(`Express server running on port ${port}`);
});
