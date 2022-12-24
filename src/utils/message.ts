import mapObject from 'map-obj'
import invariant from 'tiny-invariant'
import { z } from 'zod'

import type {
	ClientSocket,
	ServerSocket,
	SocketEventDefinition,
	SocketEventHandlerDefinition
} from '~/types/socket.js'

export const socketMessageSchema = z.object({
	key: z.string(),
	input: z.any()
})

export function createServerSocketMessageHandler({
	socketEventHandlers: socketEventHandlersImportMap,
	socketEvents: socketEventsImportMap,
	socket
}: {
	socketEventHandlers: Record<string, any>
	socketEvents: Record<string, any>
	socket: ServerSocket
}) {
	const socketEventHandlerDefinitionsMap = mapObject(
		socketEventHandlersImportMap,
		(_, eventHandler) => [eventHandler.eventDefinition.key, eventHandler]
	) as Record<string, SocketEventHandlerDefinition>
	const socketEventDefinitionsMap = mapObject(
		socketEventsImportMap,
		(_, event) => [event.key, event]
	) as Record<string, SocketEventDefinition>

	return async function handleServerSocketEvent(
		message: unknown,
		ack: (response: unknown) => void
	) {
		// This is called for 'clientToServer' and 'clientToClients' requests
		const event = socketMessageSchema.parse(message)
		console.info(`Socket ${socket.id} emitted event ${event.key}`)

		const socketEventHandlerDefinition =
			socketEventHandlerDefinitionsMap[event.key]

		if (socketEventHandlerDefinition === undefined) {
			// Then the event might be a clientToClients event
			const socketEventDefinition = socketEventDefinitionsMap[event.key]
			if (socketEventDefinition === undefined) {
				console.error(`Socket event with key \`${String(event.key)}\` not found`)
				return
			}

			switch (socketEventDefinition.type) {
				case 'serverToClient': {
					console.error(
						`Socket event ${event.key} should not be sent to the server.`
					)
					break
				}

				case 'clientToServer': {
					console.error(
						`This server does not have a handler for event ${event.key}.`
					)
					break
				}

				case 'clientToClients': {
					invariant(
						'roomPropertyKey' in socketEventDefinition,
						'Socket events of `clientToClients` must have the `roomPropertyKey` property'
					)

					if (socketEventDefinition.roomPropertyKey !== null) {
						const roomPropertyValue =
							event.input[socketEventDefinition.roomPropertyKey]
						const roomId =
							socketEventDefinition.roomIdCreator?.(roomPropertyValue) ??
							roomPropertyValue

						console.debug(
							`Emitting event \`${String(event.key)}\` to room ${
								roomId as string
							}`
						)

						socket.to(roomId).emit('message', event, ack)
					}
					// If no `roomPropertyKey` is specified, emit to all other clients
					else {
						socket.broadcast.emit('message', event, ack)
					}

					break
				}

				default: {
					throw new Error(
						`Unrecognized socket event type: ${String(
							socketEventDefinition.type
						)}`
					)
				}
			}

			return
		}

		switch (socketEventHandlerDefinition.eventDefinition.type) {
			case 'serverToClient': {
				console.error(`Socket event ${event.key} should not be sent to the server.`)
				break
			}

			case 'clientToServer': {
				const response = await socketEventHandlerDefinition.handler(
					event.input,
					{ socket: socket as any }
				)
				ack(response)
				break
			}

			case 'clientToClients': {
				invariant(
					'roomPropertyKey' in socketEventHandlerDefinition.eventDefinition,
					'Socket events of `clientToClients` must have the `roomPropertyKey` property'
				)
				if (
					socketEventHandlerDefinition.eventDefinition.roomPropertyKey !== null
				) {
					socket
						.to(
							event.input[
								socketEventHandlerDefinition.eventDefinition.roomPropertyKey
							]
						)
						.emit('message', event, ack)
				}
				// If no `roomPropertyKey` is specified, emit to all other clients
				else {
					socket.broadcast.emit('message', event, ack)
				}

				break
			}

			default: {
				throw new Error(
					`Unrecognized socket event type: ${String(
						socketEventHandlerDefinition.eventDefinition.type
					)}`
				)
			}
		}
	}
}

export function createClientSocketMessageHandler({
	socketEventHandlers: socketEventHandlersImportMap,
	socket
}: {
	socketEventHandlers: Record<string, any>
	socket: ClientSocket
}) {
	const socketEventHandlerDefinitionsMap = mapObject(
		socketEventHandlersImportMap,
		(_, eventHandler) => [eventHandler.eventDefinition.key, eventHandler]
	) as Record<string, SocketEventHandlerDefinition>

	return async function handleClientSocketEvent(
		message: unknown,
		ack: (response: unknown) => void
	) {
		// This is called for 'clientToServer' and 'clientToClients' requests
		const event = socketMessageSchema.parse(message)
		console.info(`Socket ${socket.id} emitted event ${event.key}`)

		const socketEventHandlerDefinition =
			socketEventHandlerDefinitionsMap[event.key]
		if (socketEventHandlerDefinition === undefined) {
			console.error(`Socket event with key \`${String(event.key)}\` not found`)
			return
		}

		switch (socketEventHandlerDefinition.eventDefinition.type) {
			case 'clientToServer': {
				console.error(`Socket event ${event.key} should not be sent to the client.`)
				break
			}

			case 'serverToClient':
			case 'clientToClients': {
				const response = await socketEventHandlerDefinition.handler(
					event.input,
					{ socket }
				)
				return ack(response)
			}

			default: {
				throw new Error(
					`Unrecognized socket event type: ${String(
						socketEventHandlerDefinition.eventDefinition.type
					)}`
				)
			}
		}
	}
}
