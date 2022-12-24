import type { z, ZodSchema } from 'zod'

export type ZodObjectSchemaToType<T> = T extends undefined
	? undefined
	: T extends Record<string, any>
	? z.infer<z.ZodObject<T>>
	: never

export type ZodMaybeInfer<T> = T extends ZodSchema ? z.infer<T> : T
