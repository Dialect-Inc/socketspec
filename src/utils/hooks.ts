import { debug } from '~/utils/debug.js'
import { getErrorMessage } from '~/utils/error.js'
import type { DependencyList } from 'react'
import { useCallback, useEffect } from 'react'
import type { z } from 'zod'

import type {
	ClientSocket,
	SocketEventData,
	SocketEventDefinition
} from '~/types/socket.js'
import { getRoomPropertyKeyDataFromArgs } from '~/utils/room-property-key.js'
import { getSocket } from '~/utils/socket.js'

export function createUseSocketEventHook({
	socket: socketOrSocketGetter
}: {
	socket: ClientSocket | (() => ClientSocket)
}) {
	return function useSocketEvent<
		E extends SocketEventDefinition<'clientToClients'>
	>(
		args: { event: E } & Record<NonNullable<E['roomPropertyKey']>, string>,
		handler: (input: z.infer<E['input']>) => void | Promise<void>,
		deps: DependencyList
	): void {
		const socket = getSocket(socketOrSocketGetter)

		const cachedHandler = useCallback(handler, deps)

		const listener = useCallback(
			async (data: SocketEventData<E>) => {
				try {
					if (data.key !== args.event.key) return
					await cachedHandler(args.event.input.parse(data.input))
				} catch (error: unknown) {
					debug(`Error parsing socket data: ${getErrorMessage(error)}`)
				}
			},
			[args.event.key, args.event.input, cachedHandler]
		)

		const { value: roomPropertyValue } = getRoomPropertyKeyDataFromArgs(args)

		// Join the socket room based on the `roomPropertyKey`
		useEffect(() => {
			socket.emit('joinRoom', roomPropertyValue)
			return () => {
				socket.emit('leaveRoom', roomPropertyValue)
			}
		}, [roomPropertyValue, socket])

		useEffect(() => {
			socket.on('message', listener)
			return () => {
				socket.off('message', listener)
			}
		}, [handler, listener, socket])
	}
}
