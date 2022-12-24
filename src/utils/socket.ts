import type { Server as SocketServer } from 'socket.io'

import type { ClientSocket, ServerSocket } from '~/types/socket.js'

export function getSocket<
	Socket extends SocketServer | ClientSocket | ServerSocket
>(socketOrSocketGetter: Socket | (() => Socket)): Socket {
	// We don't want to use an `instanceof` check because this file might be required from the client-side
	if ('listen' in socketOrSocketGetter) {
		return socketOrSocketGetter as Socket
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
