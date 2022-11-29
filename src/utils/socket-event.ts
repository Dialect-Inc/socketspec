import pTimeout from 'p-timeout'
import type { Server as SocketServer } from 'socket.io'
import type { EmptyObject, Promisable } from 'type-fest'
import type { ZodType } from 'zod'
import { z } from 'zod'

import type {
	ClientSocket,
	ServerSocket,
	SocketEventDefinition
} from '~/types/socket.js'
import type { SocketHandlerResponse } from '~/types/socket.js'
import { SocketEventDefinitionData } from '~/types/socket.js'
import type { ZodObjectSchemaToType } from '~/types/zod.js'
import { socketMessageSchema } from '~/utils/message.js'
import { getRoomPropertyKeyDataFromArgs } from '~/utils/room-property-key.js'
import { getSocket, SocketEventType } from '~/utils/socket.js'
import { debug } from '~/utils/debug.js'


// eslint-disable-next-line no-unused-expressions -- TODO: debug why there is a `ReferenceError` if `z` is not accessed in the global scope
z

/**
	A wrapper function around `emitSocketEvent` that creates a closure around the socket (so it doesn't need to be passed to every `emitSocketEvent` call).

	Can be called from both the browser and Node.js.

	@returns A function for emitting a socket event.
*/
export function createClientSocketEventEmitter({
	socket: socketOrSocketGetter
}: {
	socket: ClientSocket | (() => ClientSocket)
}) {
	function emitSocketEvent<
		E extends SocketEventDefinition<
			| typeof SocketEventType['clientToClients']
			| typeof SocketEventType['clientToServer']
		>
	>(eventDefinition: E, input: z.infer<E['input']>) {
		if ('roomPropertyKey' in eventDefinition) {
			debug(
				`Emitting event ${eventDefinition.key} to room ${
					input[eventDefinition.roomPropertyKey as keyof typeof input] as string
				}`
			)
		} else {
			debug(`Emitting event ${eventDefinition.key}`)
		}

		const socket = getSocket(socketOrSocketGetter)

		const responsePromise = new Promise<any>((resolve) => {
			// No need to validate the response since it came from a trusted server
			socket.emit('message', { key: eventDefinition.key, input }, resolve)
		})

		return {
			async getResponse(args?: {
				timeout?: number
			}): Promise<SocketHandlerResponse<E['response']>> {
				const timeout = args?.timeout ?? 2000
				return pTimeout(responsePromise, { milliseconds: timeout })
			},
			async getResponseData(args?: {
				timeout?: number
			}): Promise<E['response']> {
				const response = await this.getResponse(args)
				if (response.data === null) {
					const errorMessages: string =
						response.errors?.map((error) => error.message).join('\n') ??
						'[no error messages]'

					throw new Error(
						`Error in socket request \`${eventDefinition.key}\`:\n${errorMessages}`
					)
				}

				return response.data
			}
		}
	}

	return emitSocketEvent
}

export function createServerSocketEventEmitter({
	socket: socketOrSocketGetter
}: {
	socket: ServerSocket | SocketServer | (() => ServerSocket | SocketServer)
}) {
	function emitSocketEvent<
		E extends SocketEventDefinition<typeof SocketEventType['serverToClient']>
	>(
		eventDefinition: E,
		input: z.infer<E['input']>
	): { getResponse(args?: { timeout?: number }): Promise<E['response']> } {
		if (eventDefinition.roomPropertyKey !== null) {
			debug(
				`Emitting event ${eventDefinition.key} to room ${
					input[eventDefinition.roomPropertyKey as keyof typeof input] as string
				}`
			)
		} else {
			debug(`Emitting event ${eventDefinition.key} to all clients`)
		}

		const socket = getSocket(socketOrSocketGetter)

		const responsePromise = new Promise<any>((resolve) => {
			socket.emit(
				'message',
				{ key: eventDefinition.key, input },
				(data: any) => {
					// Validating response data at runtime since it came from an untrusted client
					const response = eventDefinition.response?.parse(data)
					resolve(response)
				}
			)
		})

		return {
			async getResponse(args: any) {
				const timeout = args?.timeout ?? 5000
				return pTimeout(responsePromise, { milliseconds: timeout })
			}
		}
	}

	return emitSocketEvent
}

/**
	Defines a new socket event.
*/
// prettier-ignore
export function defineSocketEvent<Key extends string, Type extends keyof typeof SocketEventType>(
	args: { key: Key; type: Type }
)
	: Type extends typeof SocketEventType['clientToServer']
	? {
			setInputType<InputSchema extends Record<string, ZodType>>(args: {
				schema: InputSchema
			}): {
				setHandler<ResponseType>(
					handler: (payload: ZodObjectSchemaToType<InputSchema>) => Promisable<SocketHandlerResponse<ResponseType>>
				): SocketEventDefinition<
					typeof SocketEventType['clientToServer'],
					{ key: Key; input: z.ZodObject<InputSchema>; response: ResponseType }
				>
			}
		}

	: Type extends typeof SocketEventType['serverToClient']
	? {
			setInputType<InputSchema extends Record<string, ZodType>>(args: { schema: InputSchema }): {
				setRoomPropertyKey<RoomPropertyKey extends (keyof InputSchema & string) | null>(roomPropertyKey: RoomPropertyKey): {
					setResponseType<ResponseSchemaArg extends ({ schema: Record<string, ZodType> } | null)>(arg: ResponseSchemaArg): SocketEventDefinition<
						typeof SocketEventType['serverToClient'],
						{
							key: Key
							input: z.ZodObject<InputSchema>
							roomPropertyKey: RoomPropertyKey
							response: ResponseSchemaArg extends { schema: Record<string, ZodType> | ZodType }
								? ResponseSchemaArg['schema'] extends ZodType
									? ResponseSchemaArg['schema']
									: ResponseSchemaArg['schema'] extends Record<string, ZodType>
										? z.ZodObject<ResponseSchemaArg['schema']>
										: never
								: null
						}
					>
				}
			}
		}

	: Type extends typeof SocketEventType['clientToClients']
	? {
			setInputType<InputSchema extends Record<string, ZodType>>(args: { schema: InputSchema }): {
				setRoomPropertyKey<RoomPropertyKey extends (keyof InputSchema & string) | null>(roomPropertyKey: RoomPropertyKey): {
					setResponseType<ResponseSchemaArg extends { schema: ZodType | Record<string, ZodType> } | null>(
						schema: ResponseSchemaArg
					): (ResponseSchemaArg extends { schema: ZodType | Record<string, ZodType> } ? {
						setHandler(
							handler: (payload: ZodObjectSchemaToType<InputSchema>) => Promisable<
								SocketHandlerResponse<
									ResponseSchemaArg['schema'] extends ZodType
										? z.infer<ResponseSchemaArg['schema']>
										: ZodObjectSchemaToType<ResponseSchemaArg['schema']>
								>
							>
						): SocketEventDefinition<
							typeof SocketEventType['clientToClients'],
							{
								key: Key
								input: z.ZodObject<InputSchema>
								response: ResponseSchemaArg['schema'] extends ZodType
										? ResponseSchemaArg['schema']
										: ResponseSchemaArg['schema'] extends Record<string, ZodType>
										? z.ZodObject<ResponseSchemaArg['schema']>
										: never
								roomPropertyKey: RoomPropertyKey
							}
						>
					} : EmptyObject) & SocketEventDefinition<
						typeof SocketEventType['clientToClients'],
						{
							key: Key
							input: z.ZodObject<InputSchema>
							roomPropertyKey: RoomPropertyKey
							response: ResponseSchemaArg extends { schema: Record<string, ZodType> | ZodType }
								? ResponseSchemaArg['schema'] extends ZodType
									? ResponseSchemaArg['schema']
									: ResponseSchemaArg['schema'] extends Record<string, ZodType>
										? z.ZodObject<ResponseSchemaArg['schema']>
										: never
								: null
						}
					>
				}
			}
		}
	: never {
	switch (args.type) {
		case SocketEventType.clientToServer: {
			return {
				setInputType: ({ schema }: { schema: Record<string, ZodType> }) => ({
					setHandler: (handler: () => SocketHandlerResponse) => ({
						...args,
						input: z.object(schema),
						response: { __handler: handler },
					} satisfies SocketEventDefinitionData<typeof SocketEventType['clientToServer']>)
				})
			} as any
		}

		case SocketEventType.serverToClient: {
			return {
				setInputType: () => ({
					setRoomPropertyKey: (roomPropertyKey: string) => ({
						setResponseType: (arg: { schema: Record<string, ZodType> } | null) => ({
							...args,
							// eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- The `input` type is only present in the type system
							input: undefined!,
							roomPropertyKey,
							response: arg === null ? null : z.object(arg.schema)
						} satisfies SocketEventDefinitionData<typeof SocketEventType['serverToClient']>)
					})
				})
			} as any
		}

		case SocketEventType.clientToClients: {
			return {
				setInputType: ({ schema: inputSchema, roomPropertyKey }: { schema: Record<string, ZodType>, roomPropertyKey: string }) => ({
					setRoomPropertyKey: () => ({
						setResponseType: (responseTypeArgs: { schema: Record<string, ZodType> } | null) => ({
							...args,
							roomPropertyKey,
							input: z.object(inputSchema),
							response: responseTypeArgs === null ? null : z.object(responseTypeArgs.schema)
						} satisfies SocketEventDefinitionData<typeof SocketEventType['clientToClients']>)
					})
				})
			} as any
		}

		default: {
			throw new Error(`Unrecognized socket event type: ${String(args.type)}`)
		}
	}
}

export function createClientOnServerEvent({
	socket: socketOrSocketGetter
}: {
	socket: ClientSocket | (() => ClientSocket)
}) {
	return function onServerEvent<
		E extends SocketEventDefinition<'clientToClients' | 'serverToClient'>
	>(
		args: { event: E } & Record<NonNullable<E['roomPropertyKey']>, string>,
		handler: (input: z.infer<E['input']>) => void | Promise<void>
	) {
		const socket = getSocket(socketOrSocketGetter)
		const { value: roomPropertyValue } = getRoomPropertyKeyDataFromArgs(args)
		socket.emit('joinRoom', roomPropertyValue)

		socket.on('message', async (message, ack) => {
			const messageData = socketMessageSchema.parse(message)
			if (messageData.key === args.event.key) {
				const response = await handler(messageData.input)
				if (ack !== undefined) {
					ack(response)
				}
			}
		})
	}
}
