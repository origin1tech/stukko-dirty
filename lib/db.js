'use strict';

var _ = require('lodash'),
    p = require('path'),
    Schema = require('./schema'),
    Model = require('./model'),
    instance;

/**
 * Constructor for connecting to Dirty database.
 * @param {string|Dirty} db - a path or existing connecting Dirty db.
 * @returns {Db}
 * @constructor
 */
function Db(db) {

    var self = this;

    this.db = undefined;
    this.schemas = {};
    this.models = {};

    // connect to the database.
    if(db)
        this.connect(connection);

    this.db.on('load', function () {
        self.connected = true;
    });

    return this;

};

/**
 * Connect the database.
 * @memberof Db
 * @param db
 */
Db.prototype.connect = function connect(db) {

    if(this.connected) return;

    if(!db)
        throw new Error('Cannot initialize without a valid database connection or path.');

    if(_.isString(db))
    {
        var Dirty = require('dirty');
        this.db = new Dirty(path.join(this.cwd, db));
    } else {
        this.db = db;
    }
};

/**
 * Expose Schema publically.
 * @memberof Db
 * @type {Schema}
 */
Db.prototype.Schema = Schema;

/**
 * Create a new model.
 * @memberof
 * @param {string} name - the name of the model.
 * @param {Schema} schema - a database Schema.
 * @returns {Model}
 */
Db.prototype.model = function model(name, schema) {
    if(!schema || !name)
        throw new Error('Model creation requires a valid Schema and name.');
    if(this.schemas[name])
        throw new Error('Cannot create duplicate Schema ' + name);
    // add the schema to the collection.
    this.schemas[name] = schema;
    this.models[name] = new Model(schema);
    this.models[name].modelName = name;

    return this.models[name];
}

// get instance if doesn't exist.
if(!instance){
    instance = new Db();
    Db.constructor = null;
}

module.exports = instance;

