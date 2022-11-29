# Socket Events

Socket events consist of three main parts:

- **Key:** The key of an event is what uniquely identifies an event.
- **Input:** The data that is passed by the socket event emitter (The name was inspired by a GraphQL convention of naming a single argument `input` in GraphQL mutations).
- **Response:** The data that is returned by the socket event handler (through Socket.IO's acknowledgement feature).

These parts are specified as part of each socket definition as either `null`, a [_Zod Schema_](/packages/zod), or a _TypeScript Type._

## Socket event types

The "type" of a socket event is categorized based on how it gets sent between the client and the server. While each socket event type uses a string to define its **key** part, the **input** part and **response** part are either defined by a _Zod Schema_ or a _TypeScript Type_ based on whether a untrusted client is response for emitting the data for that part.

The six different types of socket events are listed below:

### `client-to-server`

In a "client-to-server" socket event, the client sends a message to the server, and the server handles it without sending back a response.

Because the client is not necessarily trusted, the **input** part of these events should be defined with a _Zod schema_ so the input can be validated at runtime.

Since there is no response, the **response** definition should be `null`.

### `client-to-server-with-response`

> This socket type is similar to an HTTP request.

In a "client-to-server-with-response" socket event, the client sends a message to the server and waits for the server to send back a response.

Because the client is not trusted, the **input** definition should be a _Zod schema_ so the input can be validated at runtime.

Because the response is sent back from the server, which is trusted, the **response** definition should be a _TypeScript type_ since there is no need for runtime validation.

### `server-to-client`

In a "server-to-client" socket event, the server sends a message to the client (or multiple clients), and the client handles it without sending back a response.

Since the server is trustned, the **input** definition should be a _TypeScript type_ since there is no need for runtime validation.

Since there is no response from the client, the **response** definition should be `null`.

### `server-to-client-with-response`

In a "server-to-client-with-response" socket event, the server sends a message to the client (or multiple clients) and waits for the client to send back a response.

Because the server is trusted, the **input** definition should be a _TypeScript type_ since there is no need for runtime validation.

Because the response is sent back from the client, which is not trusted, the **response** definition should be a _Zod schema_ so the response can be validated at runtime.

### `client-broadcast`

In a "client-broadcast" socket event, the client sends a message to all clients in a specified room and does not expect a response. Since clients can't send messages directly to other clients, the message gets sent first to the server, which validates the message, and then forwards it as-is to all the other clients in the specified room.

Since the client is not trusted, the **input** definition should be a _Zod schema_ so the input can be validated at runtime.

Since there is no response, the **response** definition should be `null`.

### `client-broadcast-with-response`

In a "client-broadcast-with-response" socket event, the client sends a message to all clients in a specified room and expect a response from each client in that room. Since clients can't send messages directly to other clients, the message gets sent first to the server, which validates the message, and then forwards it as-is to all the other clients in the specified room, waits for a response from all those clients, and then sends that response back to the client who emitted the event.

Since clients are not trusted, both the **input** and **response** definition should be _Zod schemas_ so they can be validated at runtime.

---

Here is a chart summarizing the definition types for each socket event type:

| Event Type                     | Input Definition | Response Definition |
| ------------------------------ | ---------------- | ------------------- |
| client-to-server               | Zod Schema       | `null`              |
| client-to-server-with-response | Zod Schema       | TypeScript type     |
| server-to-client               | TypeScript type  | `null`              |
| server-to-client-with-response | TypeScript type  | Zod Schema          |
| client-broadcast               | Zod Schema       | `null`              |
| client-broadcast-with-response | Zod Schema       | Zod Schema          |