import chalk from 'chalk'

export function getErrorMessage(error: unknown): string {
	const isDebug =
		(typeof process !== 'undefined' && process.env.DEBUG) ||
		process.env.NODE_ENV !== 'production'

	if (isDebug) {
		if (error instanceof Error) {
			return `${error.message}\n${chalk.dim(error.stack ?? '')}`
		} else {
			// eslint-disable-next-line unicorn/error-message -- Creating an error solely for the `stack` property; no message needed
			return `${String(error)}\n${chalk.dim(new Error().stack ?? '')}`
		}
	} else {
		if (error instanceof Error) {
			return `${error.message}`
		} else {
			return String(error)
		}
	}
}
