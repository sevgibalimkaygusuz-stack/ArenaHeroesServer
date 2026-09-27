const WebSocket = require("ws");
const PORT = process.env.PORT || 3000;
const wss = new WebSocket.Server({ port: PORT });
const rooms = new Map();
function send(ws,data){if(ws.readyState===WebSocket.OPEN)ws.send(JSON.stringify(data));}
function createRoom(){let code;do{code=Math.random().toString(36).substring(2,7).toUpperCase();}while(rooms.has(code));rooms.set(code,new Set());return code;}
function broadcast(room,data,except=null){for(const player of room)if(player!==except)send(player,data);}
wss.on("connection",ws=>{
 ws.room=null; ws.playerId=Math.random().toString(36).substring(2,10);
 send(ws,{type:"connected",playerId:ws.playerId});
 ws.on("message",raw=>{
  let data;try{data=JSON.parse(raw);}catch{return;}
  if(data.type==="createRoom"){if(ws.room)return;const code=createRoom();rooms.get(code).add(ws);ws.room=code;send(ws,{type:"roomCreated",room:code});return;}
  if(data.type==="joinRoom"){const code=String(data.room||"").toUpperCase(),room=rooms.get(code);if(!room){send(ws,{type:"error",message:"Oda bulunamadı."});return;}if(room.size>=6){send(ws,{type:"error",message:"Oda dolu."});return;}room.add(ws);ws.room=code;send(ws,{type:"joinedRoom",room:code});broadcast(room,{type:"playerJoined",playerId:ws.playerId},ws);return;}
  if(data.type==="playerUpdate"){if(!ws.room)return;const room=rooms.get(ws.room);if(!room)return;broadcast(room,{type:"playerUpdate",playerId:ws.playerId,x:Number(data.x)||0,y:Number(data.y)||0,angle:Number(data.angle)||0,hp:Number(data.hp)||0},ws);return;}
  if(data.type==="shoot"){if(!ws.room)return;const room=rooms.get(ws.room);broadcast(room,{type:"shoot",playerId:ws.playerId,angle:Number(data.angle)||0},ws);}
 });
 ws.on("close",()=>{if(!ws.room)return;const room=rooms.get(ws.room);if(!room)return;room.delete(ws);broadcast(room,{type:"playerLeft",playerId:ws.playerId});if(room.size===0)rooms.delete(ws.room);});
});
console.log(`Arena Heroes Multiplayer server running on port ${PORT}`);
