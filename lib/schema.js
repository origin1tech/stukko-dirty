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
        uuid: true,
        timestamps: {
            created:  'created',
            modified: 'modified',
            deleted:  'deleted'
        },
        typeDefs: {
            String:    '' ,
            Number:    0 ,
            Boolean:   false,
            Array:     [],
            Date:      '',
        }
    };

    options = _.extend(defaults, options);

    // merge timestamps if enabled.
    if(options.timestamps){
        var tsConf = options.timestamps,
            ts = {};
        ts[tsConf.created] = Date;
        ts[tsConf.modified] = Date;
        if(tsConf.deleted)
            ts[tsConf.deleted] = Date;
        obj = _.extend(obj, ts);
    }

    // define options property.
    Object.defineProperty(this, '_options', {
        get: function () { return options; },
        set: function (value) { options = value; }
    });

    // iterate object add to Schema validate types.
    _.forEach(obj, function (v, k) {
        var attrs = _.isFunction(v) ? { type: v } : v;
        self.validate(attrs);
       self[k] = attrs;
    });

    return this;
}

/**
 * Gets a default for a type.
 * @memberof Schema
 * @param {String|Number|Date|Boolean|Array} type - the type to get a default value for.
 * @returns {*}
 */
Schema.prototype.getTypeDef = function getTypeDef(type) {
    var typeDefs = this._options.typeDefs;
    return typeDefs[type.name];
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

