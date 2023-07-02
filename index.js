const express = require("express");
const app = express();
const server = require('http').Server(app);
const { v4: uuidv4 } = require("uuid");
app.set("view engine", "ejs");
const io = require("socket.io")(server, {
  cors: {
    origin: '*'
  }
});
const { ExpressPeerServer } = require("peer");
const opinions = {
  debug: true,
}

app.use("/peerjs", ExpressPeerServer(server, opinions));
app.use(express.static("public"));

var maleRooms = []
var femaleRooms = []
var maleUsers = []
var femaleUsers = []
var occupiedRooms = []


io.on('connection',(socket)=>{
  let roomID
  //Join 
  socket.on('join-room',(peerID,user)=>{
    let pID = peerID
    console.log(user)
    if(user == 'male')
    {
      let maleUser
      if(femaleRooms.length === 0)
      {
        roomID = uuidv4()
        socket.join(roomID)
        maleRooms.push(roomID)
        maleUser= {soc:socket.id, room:roomID, pID:peerID}
      }
      else
      {
        roomID = femaleRooms.shift()
        socket.join(roomID)
        occupiedRooms.push(roomID)
        maleUser= {soc:socket.id, room:roomID, pID:peerID}
        io.to(roomID).emit('createMessage', `---Stranger joined the chat---`);
      }
      maleUsers.push(maleUser)
    }
    else
    {
      let femaleUser
      if(maleRooms.length === 0)
      {
        roomID = uuidv4()
        socket.join(roomID)
        femaleRooms.push(roomID)
        femaleUser= {soc:socket.id, room:roomID, pID:peerID}
      }
      else
      {
        roomID = maleRooms.shift()
        socket.join(roomID)
        occupiedRooms.push(roomID)
        femaleUser= {soc:socket.id, room:roomID, pID:peerID}
        io.to(roomID).emit('createMessage', `---Stranger joined the chat---`);
      }
      femaleUsers.push(femaleUser)
    }
    console.log("mU:", maleUsers, "fU:", femaleUsers, "mR:", maleRooms,"fR:", femaleRooms,"oR:", occupiedRooms);
      setTimeout(()=>{
        socket.to(roomID).emit("user-connected", pID);
      }, 1000)
  })

  socket.on("message", (message) => {
    io.to(roomID).emit("createMessage", message, 'Stranger');
  });

  socket.on('disconnect', () => {
    let uI;
    let uR;
    if(maleUsers.findIndex(a => a.soc === socket.id) !== -1)
    {gender = 'male'}
    else if(femaleUsers.findIndex(a => a.soc === socket.id) !== -1)
    {gender = 'female'}
    else
    {gender = ''}
    if(gender == 'male')
    {
      uI = maleUsers.findIndex(a => a.soc === socket.id)
      uR = maleUsers[uI].room;
      // Check if user is in occupied room or single room
      if(occupiedRooms.includes(uR))
      {
        //find female user and switch her to single room
        socket.to(uR).emit("createMessage", `---Stranger left the chat---`);
        femaleRooms.push(uR)
        occupiedRooms.splice(occupiedRooms.indexOf(uR) , 1)
      }
      else
      {
        maleRooms.splice(maleRooms.indexOf(uR) , 1)
      }
      maleUsers.splice(maleUsers.findIndex(a => a.soc === socket.id) , 1)
      socket.to(uR).emit("lost")
    }
    else if(gender === 'female')
    {
      uI = femaleUsers.findIndex(a => a.soc === socket.id)
      uR = femaleUsers[uI].room;
      if(occupiedRooms.includes(uR))
      {
        socket.to(uR).emit("createMessage", `---Stranger left the chat---`);
        maleRooms.push(uR);
        occupiedRooms.splice(occupiedRooms.indexOf(uR) , 1)
      }
      else
      {
        femaleRooms.splice(femaleRooms.indexOf(uR) , 1)
      }
      femaleUsers.splice(femaleUsers.findIndex(a => a.soc === socket.id) , 1)
      socket.to(uR).emit("lost")
    }
    console.log("mU:", maleUsers, "fU:", femaleUsers, "mR:", maleRooms,"fR:", femaleRooms,"oR:", occupiedRooms);
    
  });
})
app.get("/", (req, res) => {
  res.render("room");
});



server.listen(process.env.PORT || 3000);
