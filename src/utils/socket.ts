import { Server } from 'socket.io'

import type { ClientSocket, ServerSocket } from '~/types/socket.js'

export function getSocket<Socket extends Server | ClientSocket | ServerSocket>(
	socketOrSocketGetter: Socket | (() => Socket)
) {
	if (socketOrSocketGetter instanceof Server) {
		return socketOrSocketGetter
	} else if (typeof socketOrSocketGetter === 'function') {
		return socketOrSocketGetter()
	} else {
		return socketOrSocketGetter
	}
}

export const SocketEventType = {
	clientToServer: 'clientToServer',
	serverToClient: 'serverToClient',
	clientToClients: 'clientToClients'
} as const
