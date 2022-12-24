export type {
	ClientSocket,
	ServerSocket,
	SocketEventDefinition,
	SocketEventDefinitionData,
	// Exporting `SocketHandler` is needed to avoid the following error:
	// "The inferred type of 'myHandler' cannot be named without a reference to '~/node_modules/@dialect-inc/socket/src/types/socket.js'."
	SocketEventHandler,
	SocketEventHandlerContext,
	SocketEventHandlerDefinition,
	SocketHandlerResponse
} from './types/socket.js'
export { defineSocketEventHandler } from './utils/event-handler.js'
export { createUseSocketEventHook } from './utils/hooks.js'
export {
	createClientSocketMessageHandler,
	createServerSocketMessageHandler
} from './utils/message.js'
export { SocketEventType } from './utils/socket.js'
export {
	createClientOnServerEvent,
	createClientSocketEventEmitter,
	createServerSocketEventEmitter,
	defineSocketEvent
} from './utils/socket-event.js'
