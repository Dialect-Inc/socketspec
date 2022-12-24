import type {
	SocketEventDefinition,
	SocketEventHandler,
	SocketEventHandlerDefinition
} from '~/types/socket.js'

export function defineSocketEventHandler<E extends SocketEventDefinition>(
	event: E
): {
	setHandler(handler: SocketEventHandler<E>): SocketEventHandlerDefinition<E>
} {
	return {
		setHandler: (handler) => ({
			handler,
			eventDefinition: event
		})
	}
}
