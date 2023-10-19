const form = document.getElementById("room-name-form");
const container = document.getElementById("participants");
const localVideo = document.getElementById("localVideo");
const remoteVideo = document.getElementById("remoteVideo");

const startRoom = async (event) => {
  event.preventDefault();
  $("#room-name-form").css("display", "none");
  $(".video-container").css("display", "block");

  const roomName = document.getElementById("room-name-input").value;

  const response = await fetch("/join-room", {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ roomName: roomName }),
  });
  const { token } = await response.json();

  const room = await joinVideoRoom(roomName, token);

  console.log(room);
  handleConnectedParticipant(room.localParticipant);
  room.participants.forEach(handleConnectedParticipant);
  room.on("participantConnected", handleConnectedParticipant);

  room.on("participantDisconnected", handleDisconnectedParticipant);
  window.addEventListener("pagehide", () => room.disconnect());
  window.addEventListener("beforeunload", () => room.disconnect());
};

const handleConnectedParticipant = (participant) => {
  const participantDiv = $("<div>", {
    id: participant.identity,
    class: "col-md-6",
  });

  $("#disconnectButton").attr("data-identity", participant);
  $("#participants").append(participantDiv);

  participant.tracks.forEach((trackPublication) => {
    handleTrackPublication(trackPublication, participant);
  });

  participant.on("trackPublished", handleTrackPublication);
};

const handleTrackPublication = (trackPublication, participant) => {
  function displayTrack(track) {
    const participantDiv = document.getElementById(participant.identity);
    participantDiv.append(track.attach());
  }

  if (trackPublication.track) {
    displayTrack(trackPublication.track);
  }

  trackPublication.on("subscribed", displayTrack);
};

const handleDisconnectedParticipant = (participant) => {
  console.log(participant)
  participant.removeAllListeners();
  const participantDiv = document.getElementById(participant.identity);
  participantDiv.remove();
};

const joinVideoRoom = async (roomName, token) => {
  const room = await Twilio.Video.connect(token, {
    room: roomName,
  });
  return room;
};

form.addEventListener("submit", startRoom);
