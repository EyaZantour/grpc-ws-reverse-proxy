# gRPC WebSocket Reverse Proxy Chat Service

A simple chat service implementation using gRPC with a WebSocket reverse proxy, as described in the TP5 assignment.

## Features

- gRPC server with bidirectional streaming for chat messages
- WebSocket reverse proxy to bridge WebSocket clients with gRPC service
- Chat history functionality
- Simple web client interface
- Protocol Buffer definitions for service contracts

## Architecture

Web Client (WS) ↔ WebSocket Reverse Proxy (WS/gRPC) ↔ gRPC Server


## Prerequisites

- Node.js (v14 or higher)
- npm or yarn

File Structure

grpc-ws-reverse-proxy/
├── chat.proto            # Protocol Buffer definitions
├── server.js             # gRPC server implementation
├── proxy.js              # WebSocket reverse proxy
├── client.html           # Web client interface
├── README.md             # This file
├── package.json          # Node.js project file
└── .gitignore            # Git ignore rules



## API Documentation

gRPC Service (ChatService)
GetUser(GetUserRequest) returns (GetUserResponse)

Gets user information by ID

Chat(stream ChatStream) returns (stream ChatStream)

Bidirectional stream for chat messages

GetChatHistory(GetChatHistoryRequest) returns (GetChatHistoryResponse)

Retrieves chat history for a room

WebSocket Interface

Connect to ws://localhost:8080

Send messages in the format:
{
    "chat_message": {
        "id": "string",
        "room_id": "string",
        "sender_id": "string",
        "content": "string"
    }
}
Request history:

{
    "get_chat_history": {
        "room_id": "string",
        "limit": number
    }
}

## Acknowledgments

Uses gRPC, Protocol Buffers, and WebSocket technologies


