import type { z } from 'zod'

export type ZodObjectSchemaToType<T> = T extends undefined
	? undefined
	: T extends Record<string, any>
	? z.infer<z.ZodObject<T>>
	: never
