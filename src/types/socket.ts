import type { Socket as ServerSocket } from 'socket.io'
import type { Socket as ClientSocket } from 'socket.io-client'
import type { Promisable } from 'type-fest'
import type { z, ZodSchema } from 'zod'

import type { ZodMaybeInfer } from '~/types/zod.js'
import type { SocketEventType } from '~/utils/socket.js'

/**
	@see
 */
export type SocketEventDefinitionData<
	EventType extends keyof typeof SocketEventType
> = {
	[SocketEventType.clientToServer]: {
		input: ZodSchema
		response: unknown
	}
	[SocketEventType.serverToClient]: {
		input: ZodSchema
		roomPropertyKey: string | null
		roomIdCreator?: (roomPropertyValue: string) => string
		response: ZodSchema | null
	}
	[SocketEventType.clientToClients]: {
		input: ZodSchema
		roomPropertyKey: string | null
		roomIdCreator?: (roomPropertyValue: string) => string
		response: ZodSchema | null
	}
}[EventType] & { key: string }

/**
	A schema representing a socket "message" event.

	This is the type returned by `defineSocketEvent`.
*/
export type SocketEventDefinition<
	EventType extends keyof typeof SocketEventType = keyof typeof SocketEventType,
	Data extends SocketEventDefinitionData<EventType> = SocketEventDefinitionData<EventType>
> = { type: EventType } & Data

/**
	The data that is sent with a socket "message" event.
*/
export interface SocketEventData<E extends SocketEventDefinition> {
	key: E['key']
	input: E['input']
}

export type SocketEventHandlerContext<E extends SocketEventDefinition> =
	E['type'] extends 'clientToServer'
		? { socket: ServerSocket }
		: { socket: ClientSocket }

/**
	A handler that executes a callback whenever a socket event is received. Can be on the server side or the client side.
*/
export type SocketEventHandler<E extends SocketEventDefinition> = (
	payload: z.infer<E['input']>,
	ctx: SocketEventHandlerContext<E>
) => Promisable<{
	data: ZodMaybeInfer<E['response']> | null
	errors?: Array<{ message: string }>
	extensions?: Record<string, unknown>
}>

export interface SocketEventHandlerDefinition<
	E extends SocketEventDefinition = SocketEventDefinition
> {
	handler: SocketEventHandler<E>
	eventDefinition: E
}

/**
	The response returned by a socket handler, which is to be sent back to the sending socket as a Socket.IO acknowledgement.
*/
export interface SocketHandlerResponse<Data = unknown> {
	data: Data | null
	errors?: Array<{
		message: string
		extensions?: { code?: string; payload?: Record<string, unknown> }
	}>
}

export type { Socket as ServerSocket } from 'socket.io'
export type { Socket as ClientSocket } from 'socket.io-client'
