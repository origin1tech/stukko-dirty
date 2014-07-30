'use strict';
var util = require('util'),
    AbstractError,
    ValidationError;

ValidationError = function ValidationError(property, validator, message, constr) {
    this.property = property;
    this.validator = validator;
    this.message = message;
    Error.captureStackTrace(this, constr || this);
};
util.inherits(ValidationError, Error);
ValidationError.prototype.name = 'ValidationError';

GLOBAL.ValidationError = ValidationError;