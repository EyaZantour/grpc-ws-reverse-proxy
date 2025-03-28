const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const WebSocket = require('ws');
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

// Create gRPC client
function createGrpcClient() {
    return new chatProto.ChatService('localhost:50051', 
        grpc.credentials.createInsecure());
}

// Create WebSocket server as reverse proxy
const wss = new WebSocket.Server({ port: 8080 });
console.log('WebSocket reverse proxy listening on ws://localhost:8080');

wss.on('connection', (ws) => {
    console.log('New WebSocket client connected.');

    // Create bidirectional gRPC stream for each client
    const grpcClient = createGrpcClient();
    const grpcStream = grpcClient.Chat();

    // Relay messages from gRPC server to WebSocket client
    grpcStream.on('data', (chatStreamMessage) => {
        console.log('Message received from gRPC server:', chatStreamMessage);
        ws.send(JSON.stringify(chatStreamMessage));
    });

    grpcStream.on('error', (err) => {
        console.error('Error in gRPC stream:', err);
        ws.send(JSON.stringify({ error: err.message }));
    });

    grpcStream.on('end', () => {
        console.log('gRPC stream ended.');
        ws.close();
    });

    // Relay messages from WebSocket client to gRPC server
    ws.on('message', (message) => {
        console.log('Message received from WebSocket client:', message);
        try {
            const parsed = JSON.parse(message);
            
            // Handle GetChatHistory request
            if (parsed.get_chat_history) {
                grpcClient.getChatHistory(parsed.get_chat_history, (err, response) => {
                    if (err) {
                        ws.send(JSON.stringify({ error: err.message }));
                    } else {
                        ws.send(JSON.stringify({ chat_history: response }));
                    }
                });
            } else {
                grpcStream.write(parsed);
            }
        } catch (err) {
            console.error('Error parsing JSON message:', err);
            ws.send(JSON.stringify({ error: 'Invalid JSON format' }));
        }
    });

    ws.on('close', () => {
        console.log('WebSocket client disconnected, closing gRPC stream.');
        grpcStream.end();
    });
});