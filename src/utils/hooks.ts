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
		E extends
			| SocketEventDefinition<'clientToClients'>
			| SocketEventDefinition<'serverToClient'>
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
					console.error('Error parsing socket data:', error)
				}
			},
			[args.event.key, args.event.input, cachedHandler]
		)

		const { value: roomPropertyValue } = getRoomPropertyKeyDataFromArgs(args)
		const roomId =
			args.event.roomIdCreator === undefined
				? roomPropertyValue
				: args.event.roomIdCreator(roomPropertyValue)

		useEffect(() => {
			socket.emit('joinRoom', roomId)
			return () => {
				socket.emit('leaveRoom', roomId)
			}
		}, [roomId, socket])

		useEffect(() => {
			socket.on('message', listener)
			return () => {
				socket.off('message', listener)
			}
		}, [listener, socket])
	}
}
