/**
 * Generic Zod validation runner.
 *
 * Pass a map of request parts to Zod schemas. Each named part is parsed; on
 * success the parsed (coerced/defaulted) value replaces `req[part]`, on failure
 * we respond with a 400 + field-level errors.
 *
 *   router.post('/register', validate({ body: registerSchema }), controller.register)
 *   router.get('/:username', validate({ params: usernameParamSchema }), controller.getPublicProfile)
 */
export function validate(schemas) {
  return (req, res, next) => {
    for (const part of ['body', 'params', 'query']) {
      const schema = schemas[part];
      if (!schema) continue;

      const result = schema.safeParse(req[part]);
      if (!result.success) {
        const fields = result.error.issues.map((issue) => ({
          field: issue.path.join('.'),
          message: issue.message,
        }));

        return res.status(400).json({
          error: {
            message: 'Validation failed',
            code: 'VALIDATION_ERROR',
            fields,
          },
        });
      }

      req[part] = result.data;
    }

    return next();
  };
}
