import { outdent } from 'outdent'
import invariant from 'tiny-invariant'

export function getRoomPropertyKeyDataFromArgs(args: Record<string, any>): {
	key: string
	value: string
} {
	const roomPropertyKey = Object.keys(args).find((key) => key !== 'event')
	invariant(roomPropertyKey, '`roomPropertyKey` should not be undefined')
	const roomPropertyValue = args[roomPropertyKey]
	invariant(
		roomPropertyValue !== undefined,
		() => outdent`
			\`roomPropertyValue\` should not be undefined.

			Given:
				\`args\`: ${JSON.stringify(args)}
				\`roomPropertyKey\`: ${JSON.stringify(roomPropertyKey)}
		`
	)

	return {
		key: roomPropertyKey,
		value: roomPropertyValue
	}
}
