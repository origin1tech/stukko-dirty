'use strict';

var moment = require('moment');

module.exports = Validator;

function Validator () {

    var self = this,
        schema = this._schema,
        errors,
        validators;

    function addError(key, type, message) {
        var err = new ValidationError(key, type, message);
        errors = errors || {};
        errors[key] = errors[key] || [];
        errors[key].push(err);
    }

    validators = {
        type: function type(key, value) {

            var type = schema[key].type,
                valType = schema.getType(value),
                required = schema[key].required;

            // return if type match.
            if(valType.toLowerCase() === type.name.toLowerCase()) return;

            else if(!value && required !== true) return;

            // make sure object is valid moment object.
            else if(type.name.toLowerCase() === 'date' &&
                valType.toLowerCase() === 'object' &&
                moment.isMoment(value)) return;

            // otherwise add error for type mismatch.
            else
                addError(key, 'type', key + ' was changed using type ' + valType + ' but requires ' + type.name);

        },
        required: function required (key, value) {
            var type = schema[key].type,
                validator = schema[key].required,
                hasErr = false;
            // make sure required is true.
            if(validator) {
                if(value === undefined || value === null)
                    hasErr = true;
                else if(type === String && !value.length)
                    hasErr = true;
                else if(type === Number && !_.isNumber(value))
                    hasErr = true;
                else if(type === Boolean && !_.isBoolean(value))
                    hasErr = true;
                else if(type === Date && !_.isDate(value))
                    hasErr = true;
                else if(type === Array && !_.isArray(value))
                    hasErr = true;
                if(hasErr)
                    addError(key, 'required', key + ' is required')
            }
        },
        min: function min(key, value) {
            var type = schema[key].type,
                validator = schema[key].min,
                hasErr = false;
            // make sure we have a valid number.
            if(_.isNumber(validator)){
                if(type === String && value.length < validator)
                    hasErr = true;
                else if(type === Number && value < validator)
                    hasErr = true;
                if(hasErr)
                    addError(key, 'max', key + ' must be less than ' + validator + '.');
            }
        },
        max: function max(key, value) {
            var type = schema[key].type,
                validator = schema[key].max,
                hasErr = false;
            // make sure we have a valid number.
            if(_.isNumber(validator)){
                if(type === String && value.length > validator)
                    hasErr = true;
                else if(type === Number && value > validator)
                    hasErr = true;
                if(hasErr)
                    addError(key, 'max', key + ' must be less than ' + validator + '.');
            }
        },
        match: function match(key, value) {
            var type = schema[key].type,
                validator = schema[key].match;
            // make sure we have a valid RegExp.
            if(_.isArray(validator) && validator.length === 2 && _.isRegExp(validator[0])){
                if(!validator.test(value))
                    addError(key, 'match', validator[1] || key + ' does not match expression ' + validator[0].toString());
            }
        },
        unique: function unique(key, value) {
            var type = schema[key].type,
                validator = schema[key].unique;
            // make sure unique is true.
            if(validator) {
                if(!self.unique(key, value))
                    addError(key, 'unique', value + ' is not unique.');
            }
        },
    };

    return function validator(obj) {
        errors = undefined;
        // iterate properties check for
        // matching validators.
        _.forEach(obj, function (v, k){
            var schemaAttrs = schema[k];
            _.forEach(schema[k], function (val, key){
                // if matching key and has value
                // call the validator.
                if(validators[key])
                    validators[key](k, v);
            });
        });

        if(_.isEmpty(errors))
            return undefined;
        return errors;

    }

}