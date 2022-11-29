import { debug } from '~/utils/debug.js'
import mapObject from 'map-obj'
import invariant from 'tiny-invariant'
import { z } from 'zod'

import type { ClientSocket, ServerSocket } from '~/types/socket.js'
import { SocketEventDefinitions } from '~/utils/event-definitions.js'

export const socketMessageSchema = z.object({
	key: z.string(),
	input: z.any()
})

export function createServerSocketMessageHandler({
	eventDefinitionsImport: socketEventDefinitionsImportMap,
	socket
}: {
	eventDefinitionsImport: Record<string, { key: string }>
	socket: ServerSocket
}) {
	const socketEventDefinitionsMap = mapObject(
		socketEventDefinitionsImportMap,
		(_, eventDefinition) => [eventDefinition.key, eventDefinition]
	)
	const socketEventDefinitions = new SocketEventDefinitions(
		socketEventDefinitionsMap
	)

	return async function handleServerSocketEvent(
		message: unknown,
		ack: (response: unknown) => void
	) {
		// This is called for 'clientToServer' and 'clientToClients' requests
		const event = socketMessageSchema.parse(message)
		debug(`Socket ${socket.id} emitted event ${event.key}`)

		const socketEventDefinition = socketEventDefinitions.get(event.key)
		if (socketEventDefinition === undefined) {
			debug(`Socket event with key \`${String(event.key)}\` not found`)
			return
		}

		switch (socketEventDefinition.type) {
			case 'serverToClient': {
				debug(`Socket event ${event.key} should not be sent to the server.`)
				break
			}

			case 'clientToServer': {
				const handler = SocketEventDefinitions.getHandlerFromDefinition(
					socketEventDefinition
				)
				if (handler === undefined) {
					debug(
						`No handler was set for event \`${socketEventDefinition.key}\``
					)
					return
				}

				const response = await handler(event.input)
				ack(response)
				break
			}

			case 'clientToClients': {
				invariant(
					'roomPropertyKey' in socketEventDefinition,
					'Socket events of `clientToClients` must have the `roomPropertyKey` property'
				)
				if (socketEventDefinition.roomPropertyKey !== null) {
					socket
						.to(event.input[socketEventDefinition.roomPropertyKey])
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
						socketEventDefinition.type
					)}`
				)
			}
		}
	}
}

export function createClientSocketMessageHandler({
	eventDefinitionsImport: socketEventDefinitionsMap,
	socket
}: {
	eventDefinitionsImport: Record<string, { key: string }>
	socket: ClientSocket
}) {
	const socketEventDefinitions = new SocketEventDefinitions(
		socketEventDefinitionsMap
	)

	return async function handleClientSocketEvent(
		message: unknown,
		ack: (response: unknown) => void
	) {
		// This is called for 'clientToServer' and 'clientToClients' requests
		const event = socketMessageSchema.parse(message)
		debug(`Socket ${socket.id} emitted event ${event.key}`)

		const socketEventDefinition = socketEventDefinitions.get(event.key)
		if (socketEventDefinition === undefined) {
			debug(`Socket event with key \`${String(event.key)}\` not found`)
			return
		}

		switch (socketEventDefinition.type) {
			case 'clientToServer': {
				debug(`Socket event ${event.key} should not be sent to the client.`)
				break
			}

			case 'serverToClient':
			case 'clientToClients': {
				const handler = SocketEventDefinitions.getHandlerFromDefinition(
					socketEventDefinition
				)

				if (handler === undefined) {
					debug(
						`No handler was set for event \`${socketEventDefinition.key}\``
					)
					return
				}

				const response = await handler(event.input)
				return ack(response)
			}

			default: {
				throw new Error(
					`Unrecognized socket event type: ${String(
						socketEventDefinition.type
					)}`
				)
			}
		}
	}
}
