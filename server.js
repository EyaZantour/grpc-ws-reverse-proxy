const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const path = require('path');

// Path to proto file
const PROTO_PATH = path.join(__dirname, 'chat.proto');

// Load proto file
const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
    keepCase: true,
    longs: String,
    enums: String,
    defaults: true,
    oneofs: true,
});

const chatProto = grpc.loadPackageDefinition(packageDefinition).chat;

// Define admin user
const admin = {
    id: "admin",
    name: "Grpc_Admin",
    email: "grpc_admin@mail.com",
    status: "ACTIVE",
};

// Store chat history
const chatHistory = [];

// Implement GetUser
function getUser(call, callback) {
    const userId = call.request.user_id;
    console.log(`GetUser request received for id: ${userId}`);

    const user = { ...admin, id: userId };
    callback(null, { user });
}

// Implement Chat (bidirectional streaming)
function chat(call) {
    console.log("Chat stream started.");
    call.on('data', (chatStreamMessage) => {
        if (chatStreamMessage.chat_message) {
            const msg = chatStreamMessage.chat_message;
            console.log(`Message received from ${msg.sender_id}: ${msg.content}`);
            
            // Store message in history
            chatHistory.push(msg);
            if (chatHistory.length > 100) { // Limit history size
                chatHistory.shift();
            }

            // Create reply
            const reply = {
                id: msg.id + ".reply",
                room_id: msg.room_id,
                sender_id: admin.name,
                content: "received at " + new Date().toISOString(),
            };

            // Send reply to client
            call.write({ chat_message: reply });
        }
    });

    call.on('end', () => {
        console.log("Chat stream ended.");
        call.end();
    });
}

// Implement GetChatHistory
function getChatHistory(call, callback) {
    const { room_id, limit } = call.request;
    console.log(`GetChatHistory request for room ${room_id}, limit ${limit}`);
    
    // Filter messages by room_id and limit the number
    const roomMessages = chatHistory.filter(msg => msg.room_id === room_id);
    const limitedMessages = roomMessages.slice(-Math.abs(limit));
    
    callback(null, { messages: limitedMessages });
}

// Start gRPC server
function main() {
    const server = new grpc.Server();
    server.addService(chatProto.ChatService.service, {
        GetUser: getUser,
        Chat: chat,
        GetChatHistory: getChatHistory,
    });
    const address = '0.0.0.0:50051';
    server.bindAsync(address, grpc.ServerCredentials.createInsecure(), (error, port) => {
        if (error) {
            console.error("Server binding error:", error);
            return;
        }
        console.log(`gRPC server listening on ${address}`);
        server.start();
    });
}

main();