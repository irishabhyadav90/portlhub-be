import { validationResult } from 'express-validator';

/**
 * Generic validation runner.
 *
 * Usage: pass an array of express-validator chains. They run in order, then
 * this collects any failures and responds with a 400 + field-level errors.
 *
 *   router.post('/links', validate(createLinksRules), controller.createLinks)
 */
export function validate(rules) {
  return async (req, res, next) => {
    for (const rule of rules) {
      await rule.run(req);
    }

    const result = validationResult(req);
    if (result.isEmpty()) {
      return next();
    }

    const fields = result.array().map((err) => ({
      field: err.path,
      message: err.msg,
    }));

    return res.status(400).json({
      error: {
        message: 'Validation failed',
        code: 'VALIDATION_ERROR',
        fields,
      },
    });
  };
}
