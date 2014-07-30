'use strict';

var _ = require('lodash');

module.exports = Schema;

/**
 * Constructs Schema for Model.
 * @param {object} obj - model schema types and attributes.
 * @param {object} options - object for overriding default options.
 * @returns {Schema}
 * @constructor
 */
function Schema(obj, options) {

    var self = this,
        defaults;

    if(!obj || _.isEmpty(obj))
        throw new Error ('Schema cannot be defined without a name and and properties.');

    defaults = {
        schema: true,                   // when true schema is forced other properties ignored.
        uuid: true,                     // when true generates ids automatically.
        equality: 'default',            // set to strict to replace == & != with === & !==.
        timestamps: {                   // set to undefined to disable.
            created:  'created',        // the name for the created timestamp or undefined to disable.
            modified: 'modified',       // the name for the modified timestamp or undefined to disable.
            deleted:  'deleted'         // the name for the deleted timestamp or undefined to disable.
        },                              // when deleted is defined rows are not destroyed but marked with timestamp.
        typeDefs: {                     // default values for respective types.
            String:    '',
            Number:    0,
            Boolean:   false,
            Array:     [],
            Date:      ''
            //undefined: '',              // treat undefined as empty string
            //null: ''                    // treat null as empty string.
        }
    };

    options = _.extend(defaults, options);

    // auto generated ids are used.
    if(options.uuid)
        obj.id = String;

    // merge timestamps if enabled.
    if(options.timestamps){
        var tsConf = options.timestamps,
            ts = {};
        ts[tsConf.created] = Date;
        ts[tsConf.modified] = Date;
        if(tsConf.deleted)
            ts[tsConf.deleted] = { type: Date, required: false };
        obj = _.extend(obj, ts);
    }

    // define options property.
    Object.defineProperty(this, '_options', {
        get: function () { return options; },
        set: function (value) { options = value; }
    });

    Object.defineProperty(this, '_virtuals', {
        writable: true,
        enumerable: false,
        value: {}
    });

    // iterate object add to Schema validate types.
    _.forEach(obj, function (v, k) {
        var type = v.name,
            isType = _.contains(_.keys(options.typeDefs), type),
            attrs = isType ? { type: v } : v;

        if(_.isPlainObject(attrs)){
            self.validate(attrs);
            self[k] = attrs;
        } else {
            // add virtual property.
            self._virtuals[k] = attrs;
        }
    });

    return this;
}

/**
 * Gets type of a given value.
 * @param {*} value - the value to get the type for.
 * @param {boolean} [lower] - whether to call to lower.
 * @returns {*}
 */
Schema.prototype.getType = function getType(value, lower) {
    var type = ({}).toString.call(value).match(/\s([a-zA-Z]+)/)[1];
    if(lower)
        return type.toLowerCase();
    return type;
}

/**
 * Gets a default for a type.
 * @memberof Schema
 * @param {String|Number|Date|Boolean|Array} type - the type to get a default value for.
 * @returns {*}
 */
Schema.prototype.getTypeDef = function getTypeDef(type) {
    var typeDefs = this._options.typeDefs;
    return typeDefs[type];
};

/**
 * Validates the Schema.
 * @memberof Schema
 * @param attrs
 */
Schema.prototype.validate = function validate(attrs) {
    var typeDefs = Object.keys(this._options.typeDefs);
    if(!_.contains(typeDefs, attrs.type.name))
        throw new Error('The type ' + attrs.type.name + ' is not valid.');

}

