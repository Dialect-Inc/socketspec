export type {
	SocketEventDefinition,
	SocketEventDefinitionData,
	// Exporting `SocketHandler` is needed to avoid the following error:
	// "The inferred type of 'myHandler' cannot be named without a reference to '../../../../node_modules/@dialect/socket/src/types/socket.js'."
	SocketHandler,
	SocketHandlerResponse
} from './types/socket.js'
export { SocketEventDefinitions } from './utils/event-definitions.js'
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
