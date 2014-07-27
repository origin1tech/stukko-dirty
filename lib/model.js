'use strict';

var _ = require('lodash'),
    cast,
    validate,
    timestamp,
    define;

module.exports = Model;

/**
 * Creates a new Model instance.
 * @param {Schema} [schema] - model schema.
 * @returns {Model}
 * @constructor
 */
function Model(schema) {

    var self = this;

    if(!schema)
        throw new Error('Model initialization failed, Schema not provided.');

    this.schema = schema;

    // define the Model.
    this.define(schema);

    return this;

}

/**
 * Find records.
 * @memberof Model
 * @param {object} where - the filter for findnig a collection of records.
 * @returns {array}
 */
Model.prototype.find = function find(where){

};

/**
 * Find a record.
 * @memberof Model
 * @param {object|string} where - the filter for finding a record.
 * @returns {Model)
 */
Model.prototype.findOne = function findOne(where){
    // if string assume id.
    if(_.isString(where))
        where = { id: where };
};

/**
 * Create a record.
 * @memberof Model
 * @param {object} obj - the object to be created.
 * @returns {Model}
 */
Model.prototype.create = function create(obj){

};

/**
 * Update a record.
 * @memberof Model
 * @param {object} obj - the object for updating.
 * @param {object|string} where - filter for finding record to update.
 * @returns {array}
 */
Model.prototype.update = function update(obj, where){
    // if string assume id.
    if(_.isString(where))
        where = { id: where };
};

/**
 * Update a record or create if doesn't exist.
 * @memberof Model
 * @param {object} obj - the object for updating.
 * @param {object|string} where - filter for finding record to update.
 * @returns {array}
 */
Model.prototype.updateOrCreate = function updateOrCreate(obj, where){
    // if string assume id.
    if(_.isString(where))
        where = { id: where };
};

/**
 * Destroy a record.
 * @memberof Model
 * @param {object|string} where - filter for finding record to destroy.
 * @returns {Model}
 */
Model.prototype.destroy = function destroy(where){
    // if string assume id.
    if(_.isString(where))
        where = { id: where };
};

/* Private Members
****************************************************/

/**
 * Define the model.
 * @private
 * @memberof Model
 * @type {define}
 */
define = Model.prototype.define = function define(schema) {

    var self = this,
        getters,
        setters;

    schema = schema || this.schema;

    // gets the type default value for define.
    function getDef(key) {
        var type = schema[key].type,
            typeDef;
        typeDef = schema.getTypeDef(type);
        if(type === String)
            return typeDef || '';
        if(type === Number)
            return typeDef || 0;
        if(type === Boolean)
            return typeDef || false;
        if(type === Array)
            return typeDef || [];
        if(type === Date)
            return typeDef || '';
       return '';
    }

    // iterate schema and define properties.
    _.forEach(schema, function (v, k) {
        Object.defineProperty(self, k, {
            configurable: true,
            enumerable: true,
            writable: true,
            value: getDef(k)
        });
    });

};

/**
 * Add timestamps to model.
 * @private
 * @memberof Model
 * @type {timestamp}
 */
timestamp = Model.prototype.timestamp = function timestamp() {

};

/**
 * Cast a value to a type.
 * @private
 * @memberof Model
 * @type {cast}
 */
cast = Model.prototype.cast = function cast(type, val) {
    return val;
};

/**
 * Validate the model.
 * @private
 * @memberof Model
 * @type {validate}
 */
validate = Model.prototype.validate = function validate(key, attrs){

};