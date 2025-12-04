/**
 * Simple validation middleware placeholder
 * Use Joi/Zod for production. This middleware demonstrates how to plug validators into routes.
 */

module.exports = function validate(schema) {
  return (req, res, next) => {
    if (!schema) return next();
    try {
      const data = Object.assign({}, req.body, req.params, req.query);
      const result = schema.validate ? schema.validate(data) : { value: data };
      if (result.error) return next(result.error);
      // attach validated value
      req.validated = result.value;
      return next();
    } catch (err) {
      return next(err);
    }
  };
};
