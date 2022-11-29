import type { ZodSchema } from 'zod'
export type { Socket as ServerSocket } from 'socket.io'
export type { Socket as ClientSocket } from 'socket.io-client'

import type { SocketEventType } from '~/utils/socket.js'

/**
	@see
 */
export type SocketEventDefinitionData<
	EventType extends keyof typeof SocketEventType
> = {
	[SocketEventType.clientToServer]: {
		input: ZodSchema
		response: any
	}
	[SocketEventType.serverToClient]: {
		input: ZodSchema
		roomPropertyKey: string | null
		response: ZodSchema | null
	}
	[SocketEventType.clientToClients]: {
		input: ZodSchema
		roomPropertyKey: string | null
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

/**
	A handler that executes a callback whenever a socket event is received. Can be on the server side or the client side.
*/
export interface SocketHandler<
	Args extends {
		payload: Record<string, any> | undefined
		data: any
		key: string
	} = {
		payload: Record<string, any> | undefined
		data: any
		key: string
	}
> {
	key: Args['key']
	schema: ZodSchema | null
	handler: (payload: Args['payload']) => Args['data']
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
