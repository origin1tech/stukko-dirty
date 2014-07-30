'use strict';

var _ = require('lodash'),
    moment = require('moment'),
    Promise = require('bluebird'),
    validator = require('./validator'),
    Uuid = require('uuid'),
    execQuery,
    generate,
    uuid,
    timestamp,
    bindVirtuals,
    getKey;

// create mixin for moment.
function isMoment(value) {
    try {
        return moment.isMoment(value);
    } catch(e){
        console.log(e);
        return false;
    }
}

// add mixin to Lodash.
_.mixin({
    'isMoment': isMoment
});



module.exports = Model;

/**
 * Creates a new Model instance.
 * @param {Schema} [schema] - model schema.
 * @param {object} [obj] - an object to define instance.
 * @returns {Model}
 * @constructor
 */
function Model(schema, obj) {

    var self = this;

    if(!schema)
        throw new Error('Model initialization failed, Schema not provided.');

    Object.defineProperty(this, '_schema', {
        get: function () { return schema; },
        set: function (value) { schema = value; }
    });

    Object.defineProperty(this, '_errors', {
        enumerable: false,
        writable: true,
        value: undefined
    });

    // define the Model.
    if(_.isObject(obj))
        this.define(obj);

    return this;

}

/**
 * Find records.
 * @memberof Model
 * @param {object} q - the filter for findnig a collection of records.
 * @param {function} cb - callback on found.
 * @returns {array}
 */
Model.prototype.find = function find(q, cb){

    var models;

    q = q || {};
    cb = cb || function () {};

    models = this.execQuery(q) || [];

    cb(null, models);

};

/**
 * Find a record.
 * @memberof Model
 * @param {object|string} q - the filter for finding a record.
 * @param {function} cb - callback on found.
 * @returns {Model)
 */
Model.prototype.findOne = function findOne(q, cb){

    var model;

    cb = cb || function () {};

    // if string assume id.
    if(_.isString(q))
        q = { id: q };

    model = this.execQuery(q)[0] || undefined;

    if(!model)
        return cb('The query procuced zero results.');

    // create the model instance.
    model = new Model(this._schema, model);

    cb(null, model);


};

/**
 * Create a record.
 * @memberof Model
 * @param {object} obj - the object to be created.
 * @param {function} cb - callback on created.
 * @returns {Model}
 */
Model.prototype.create = function create(obj, cb){

    var self = this,
        id,
        model;

    cb = cb || function () {};

    // generate properties & validate the object.
    this.generate(obj, 'create', true);
    id = this.getKey(obj.id);

    // if errors return them.
    if(this._errors)
        return cb(this._errors);

    // add the object to the collection return model.
    this._db.set(id, obj, function () {

        // create the model instance.
        model = new Model(self._schema, obj);

        cb(null, model);

    });

};

/**
 * Update a record.
 * @memberof Model
 * @param {object} obj - the object for updating.
 * @param {object|string} q - filter for finding record to update.
 * @param {function} cb - callback on updated.
 * @returns {Model}
 */
Model.prototype.update = function update(obj, q, cb){

    var self = this,
        id,
        model;

    cb = cb || function () {};

    // if string assume id.
    if(_.isString(q))
        q = { id: q };

    // validate the object.
    this.validate(obj);

    // if errors return them.
    if(this._errors)
        return cb(this._errors);

    model = this.execQuery(q)[0] || undefined;

    // get the key
    id = this.getKey(model.id);

    // if model doesn't exit return error.
    if(!model)
        return cb(new Error('Unable to update undefined.'));

    // merge the object with current.
    obj = _.extend(model, obj);

    // add the object to the models return model.
    this._db.set(id, obj, function () {

        // create the model instance.
        model = new Model(self._schema, obj);

        cb(null, model);

    });


};

/**
 * Update a record or create if doesn't exist.
 * @memberof Model
 * @param {object} obj - the object for updating.
 * @param {object|string} q - filter for finding record to update.
 * @param {function} cb - on update or create callback.
 * @returns {Model}
 */
Model.prototype.updateOrCreate = function updateOrCreate(obj, q, cb){

    var models;

    // if string assume id.
    if(_.isString(q))
        q = { id: q };

    cb = cb || function () {};

    models = this.execQuery(q)[0] || undefined;

    if(!models){
        this.create(obj, cb)
    } else {
        this.update(obj, q, cb);
    }

};

/**
 * Destroy a record.
 * @memberof Model
 * @param {object|string} q - filter for finding record to destroy.
 * @param {function} cb - callback on destroyed.
 * @returns {Model|array}
 */
Model.prototype.destroy = function destroy(q, cb){

    var self = this,
        paranoid = (this._schema._options.timestamps && this._schema._options.timestamps.deleted),
        delKey = paranoid ? this._schema._options.timestamps.deleted : undefined,
        id,
        model;

    cb = cb || function () {};

    // if string assume id.
    if(_.isString(q))
        q = { id: q };

    // query the model.
    model = this.execQuery(q)[0] || undefined;

    // get the key.
    id = this.getKey(model.id);

    if(!model)
        return cb(new Error('Unable to update undefined.'));

    // remove model.
    if(paranoid) {
        model[delKey] = moment();
        this._db.set(id, model, function () {
            cb(null, new Model(self, _.clone(model)));
        });
    } else {
        this._db.rm(id, function() {
            cb(null, new Model(self, _.clone(model)));
        });
    }

};

/**
 * Destroy all in models.
 * @memberof Model
 * @param {function} cb - callback on destroyed.
 * @returns {array}
 */
Model.prototype.destroyAll = function destroyAll(cb){

    var self = this,
        size = this._db.size(),
        ctr = 0;
    this._db.forEach(function (key) {
        var coll = key.split('-')[1];
        if(coll.toLowerCase() === self._name)
            this.rm(key);
        if((ctr + 1) === size && cb)
            cb();
        else
            ctr +=1;
    });
};

/**
 * Converts model to plain object.
 * @param {function} [replacer] - the JSON replacer function.
 * @param {number} [space] - the number of spaces for prettifying JSON
 * @returns {string}
 */
Model.prototype.toObject = function toObject() {
    var model = {};
    _.forEach(this, function (v,k) {
        if(!/^_/.test(k))
            model[k] = v;
    });
    return model;
};

/**
 * Converts model to JSON.
 * @param {function} [replacer] - the JSON replacer function.
 * @param {number} [space] - the number of spaces for prettifying JSON
 * @returns {string}
 */
Model.prototype.toJSON = function toJSON(replacer, space) {
    var model = this.toObject();
    replacer = replacer || null;
    space = space || 4;
    try{
        return JSON.stringify(model, replacer, space);
    } catch(err) {
        throw err;
    }
};

/**
 * Validate the model before changes.
 * @private
 * @memberof Model
 * @param {object} [obj] - the model object to validate.
 * @returns {object|undefined}
 */
Model.prototype.validate = function validate(obj){
    var val = validator(this._schema);
    obj = obj || this;
    this._errors = val(obj);
    return this;
};

/**
 * Define the model.
 * @memberof Model
 * @param {object} obj - the plain object representing the model.
 * @returns {Model}
 */
Model.prototype.define = function define(obj, method) {

    var self = this,
        normalizedObj = {},
        schema;

    schema = this._schema;

    // gets the type default value for define.
    function getTypeDef(key, val) {
        var type,
            typeDef;
        type = schema[key] ? schema[key].type.name : schema.getType(val);
        typeDef = schema.getTypeDef(type);
        if(val)
            return val;
        if(typeDef !== undefined)
            return typeDef
        return '';
    }

    // iterate schema set default values.
    _.forEach(schema, function (v, k) {
        normalizedObj[k] = v.defaultValue;
    });

    if(!schema._options.force)
        normalizedObj = _.extend(normalizedObj, obj);

    _.forEach(normalizedObj, function (v, k) {
        if(!_.isFunction(v))
            self[k] = getTypeDef(k, v);
    });

    this.bindVirtuals();

    return this;

};

/* Private Members
****************************************************/

/**
 * Generate uuid and models key.
 * @private
 * @memberof Model
 * @param {object} obj - the object to add the id to.
 * @type {uuid}
 * @returns {object}
 */
uuid = Model.prototype.uuid = function uuid(obj) {
    var schema = this._schema;
    obj = obj || {};
    if(schema._options.uuid)
        obj.id = Uuid.v1();
    return this;
};

/**
 * Add timestamps to model.
 * @private
 * @memberof Model
 * @param {string} method - the type of method called.
 * @param {object} obj - the object to update with timestamps.
 * @type {timestamp}
 * @returns {object}
 */
timestamp = Model.prototype.timestamp = function timestamp(method, obj) {
    var schema = this._schema,
        options = schema._options;
    if(options.timestamps){
        if(method === 'create'){
            obj[options.timestamps.created] = moment();
            if(options.timestamps.deleted)
                obj[options.timestamps.deleted] = undefined;
        }
        if(method === 'update' || method === 'create')
            obj[options.timestamps.modified] = moment();
        if(options.timestamps.deleted && method === 'destroy')
            obj[options.timestamps.deleted] = moment();
    }
    return this;
};

/**
 * Returns the model key.
 * @memberof Model
 * @private
 * @type {getKey}
 * @returns {string}
 */
getKey = Model.prototype.getKey = function getKey(id) {
    return id + '-' + this._name;
};

/**
 * Add auto generated propeties & validate.
 * @memberof Model
 * @private
 * @param {object} obj - the object to update.
 * @param {boolean} validate - when true the object is validated.
 * @type {generate}
 * @returns {object}
 */
generate = Model.prototype.generate = function generate(obj, method, validate) {
    this.uuid(obj);
    this.timestamp(method, obj);
    if(validate)
       this.validate(obj);
    return this;
};

/**
 * Binds context for virtual methods.
 * @memberof Model
 * @private
 * @type {bindVirtuals}
 */
bindVirtuals = Model.prototype.bindVirtuals = function bindVirtuals(model) {

    var virtuals = this._schema._virtuals;

    model = model || this;

    _.forEach(virtuals, function (v,k) {
        Object.defineProperty(model, k, {
            enumerable: false,
            value: _.bind(v, model)
        });
    });

};

/**
 * Executes query.
 * @private
 * @memberof Model
 * @param {object} query - the query to filter records by.
 * @type {execQuery}
 * @returns {array}
 */
execQuery = Model.prototype.execQuery = function execQuery(query, deleted) {

    var self = this,
        model = this._name,
        keyRegex = new RegExp('.+' + model),
        schema = this._schema,
        options = schema._options,
        uuid = options.uuid ? true : false,
        delKey = options.timestamps && options.timestamps.deleted ? options.timestamps.deleted : undefined,
        operators;

    deleted = deleted || false;

    /* Comparison Operators
    *******************************************************************************/
    // $lt  -  { age: { $lt: 50  }} age must be less than 50.
    // $gt  -  { age: { $gt: 50  }} age must be greater than 50.
    // $lte -  { age: { $lte: 50 }} age must be less than or equal to 50.
    // $gte -  { age: { $gte: 50 }} age must be greater than or equal to 50.
    // $ne  -  { age: { $ne: 50  }} age must be not equal to 50.
    // $in  -  { age: { $in: [1,2]  }} age must be within array values.
    // $nin -  { age: { $nin: [1,2] }} age must NOT be within array values.
    // $like - { name:{ $like: 'oh'  }} for example would match 'John'.
    // $eq -   { name: { $eq: 'John' }} not really needed other than for enable/disable strict equality by type.


    /* Logical Operators Not Listed Below
    *******************************************************************************/
    // $and - { $and: [{key: 'value'}, {key2: 'value2'}] } row requires each value.
    // $or  - { $or:  [{key: 'value'}, {key2: 'value2'}] } row requires any value.
    // $nor - { $nor: [{key: 'value'}, {key2: 'value2'}] } row requires NOT any value.

    operators = {

        // supports String, Number, Date
        $lt: function (a,b) {
            if(_.isArray(a) || _.isBoolean(a))
                return false;
            if(_.isMoment(a)) {
                b = castToType(Date, b);
                if(moment(b).isBefore(a))
                    return true;
                return false;
            }
            if(_.isString(a))
                return a.length < b.length;
            return a < b;
        },

        // supports String, Number, Date
        $gt: function (a,b) {
            if(_.isArray(a) || _.isBoolean(a))
                return false;
            if(_.isMoment(a)) {
                b = castToType(Date, b);
                if(moment(b).isAfter(a))
                    return true;
                return false;
            }
            if(_.isString(a))
                return a.length > b.length;
            return a > b;
        },

        // supports String, Number, Date
        $lte: function (a,b) {
            if(_.isArray(a) || _.isBoolean(a))
                return false;
            if(_.isMoment(a)) {
                b = castToType(Date, b);
                if(moment(b).isSame(a) || moment(b).isBefore(a))
                    return true;
                return false;
            }
            if(_.isString(a))
                return a.length <= b.length;
            return a <= b;
        },

        // supports String, Number, Date
        $gte: function (a,b) {
            if(_.isArray(a) || _.isBoolean(a))
                return false;
            if(_.isMoment(a)) {
                b = castToType(Date, b);
                if(moment(b).isSame(a) || moment(b).isAfter(a))
                    return true;
                return false;
            }
            if(_.isString(a))
                return a.length >= b.length;
            return a >= b;
        },

        // supports String, Number, Date
        $in: function (a,b) {
            if(_.isArray(a) || _.isBoolean(a))
                return false;
            if(_.isMoment(a)){
                var valid = false;
                _.forEach(b, function (v,k) {
                    v = castToType(Date, v);
                    if(moment(a).isSame(v))
                        valid = true;
                });
                return valid;
            }
            return _.contains(b,a);
        },

        // supports String, Number, Date
        $nin: function (a,b) {
            if(_.isArray(a) || _.isBoolean(a))
                return false;
            if(_.isMoment(a)){
                var valid = false;
                _.forEach(b, function (v,k) {
                    v = castToType(Date, v);
                    if(!moment(a).isSame(v))
                        valid = true;
                });
                return valid;
            }
            return !_.contains(b,a);
        },

        // supports String
        $like: function (a,b) {
            if(!_.isString(a))
                return false;
            b = '^.+' + b + '.+$';
            b = new RegExp(b, 'gi');
            return b.test(a);
        },

        // supports all types.
        $eq: function (a,b) {
            if(_.isMoment(a)){
                b = castToType(Date, b);
                return moment(a).isSame(b);
            }
            if(options.equality == 'strict')
                return a === b;
            return a == b;
        },

        // supports all types.
        $ne: function (a,b) {
            if(_.isMoment(a)){
                b = castToType(Date, b);
                return !moment(a).isSame(b);
            }
            if(options.equality == 'strict')
                return a !== b;
            return a != b;
        },
    }

    // whether or not to included deleted rows in results.
    function includeDeleted(row) {
        if(deleted || !row[delKey] || query[delKey])
            return row;
        return undefined;
    }

    // casts string to type.
    function castToType(type, value){
        try{
            // if its a Date convert to moment.
            if(type === Date)
                return moment(value);
            return type(value);
        } catch(e) {
            return value;
        }
    }

    // convert rows to valid types.
    function convertToTypes(row) {

        var converted = {};
        _.forEach(row, function (v,k){

            // if no type return existing value.
            if(!schema[k] || !schema[k].type){
                converted[k] = v;
            }

            // get the type and convert.
            else {
                var type = schema[k].type;
                converted[k] = castToType(type, v);
            }

        });
        return converted;
    }

    // execute a query.
    function exec(query) {

        var models = [],
            operKeys = _.keys(operators),
            k,
            filter;

        // if no query just return empty array don't error.
        if(!query) return [];

        // row/doc filter.
        filter = function filter(value, q, op) {

            // if the query is a function call it.
            if (_.isFunction(q)) {
                return q(value);
            }

            // query is an array iterate its elements.
            else if(_.isArray(q)){
                for(k in q) {
                    if(op == '$or')
                        return filter(value, q[k]);
                    if(op == '$nor')
                        return !filter(value, q[k])
                    else
                        if (!filter(value, q[k]))
                            return false;
                }
                return true;
            }

            // if plain object check for operator otherwise iterate.
            else if(_.isPlainObject(q)){

                var objKeys = _.keys(q),
                    hasOper = _.difference(operKeys, objKeys).length;

                // if only one key/value evaluate & call operator function.
                if(hasOper && objKeys.length == 1 && operators[objKeys[0]]){
                    return operators[objKeys[0]](value, q[objKeys[0]]);
                }

                // otherwise iterate the object.
                else {
                    for(k in q) {
                        if(!filter(value[k] ? value[k] : value, q[k], k))
                            return false;
                    }
                    return true;
                }
            }

            // simple equality evaluation.
            return operators.$eq(value, q);

        };

        // loop through rows/docs and apply query.
        self._db.forEach(function (id, row) {
            var name = uuid ? id.replace(keyRegex, model) : undefined;
            if(row) {
                row = convertToTypes(row);
                if(uuid && (name === model)) {
                    if(filter(row, query)){
                        if(includeDeleted(row))
                            models.push(row);
                    }
                } else if(!uuid) {
                    if(filter(row, query)){
                        if(includeDeleted(row))
                            models.push(row);
                    }
                }
            }
        });

        return models;
    }

    return exec(query);

};

