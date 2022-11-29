import type { SocketEventDefinition } from '~/index.js'
import { debug } from '~/utils/debug.js'
import { getErrorMessage } from '~/utils/error.js'

export class SocketEventDefinitions {
	private eventDefinitionMap: Map<string, SocketEventDefinition>

	constructor(eventDefinitions: Record<string, any>) {
		this.eventDefinitionMap = new Map(Object.entries(eventDefinitions))
	}

	get(key: string): SocketEventDefinition | undefined {
		return this.eventDefinitionMap.get(key)
	}

	static getHandlerFromDefinition(
		event: SocketEventDefinition
	): ((input: any) => Promise<any>) | undefined {
		async function executeHandler(input: any): Promise<any> {
			try {
				const handler = event.response?.__handler
				const response = await handler(input)
				return response
			} catch (error: unknown) {
				const errorMessage = getErrorMessage(error)
				debug(
					`Error from handler for event \`${event.key}\`: ${errorMessage}`
				)
				return {
					data: null,
					errors: [{ message: errorMessage }]
				}
			}
		}

		return executeHandler
	}
}
