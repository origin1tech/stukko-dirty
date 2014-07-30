'use strict';

require('./exceptions');

var _ = require('lodash'),
    p = require('path'),
    Dirty = require('dirty'),
    Schema = require('./schema'),
    Model = require('./model'),
    util = require('util');

/**
 * Constructor for connecting to Dirty database.
 * @param {string} path - the path to the database.
 * @returns {Db}
 * @constructor
 */
function Db(options) {

    var self = this;

    // call the inherited class.
    Dirty.call(this);

    this.schemas = {};
    this.models = {};

    return this;

};

// inherit Dirty
util.inherits(Db, Dirty);

/**
 * Connection method for initializing Dirty.
 * @memberof Db
 * @param {string} path
 * @returns {Db}
 */
Db.prototype.connect = function connect(path){

    var self = this;

    this.path = path;
    this._load();
    this.on('close', function () {
        self.models = {};
        self.schemas = {};
    });

    return this;
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

    var self = this,
        _model;

    if (!schema || !name)
        throw new Error('Model creation requires a valid Schema and name.');

    if (this.schemas[name])
        throw new Error('Cannot create duplicate Schema ' + name);

    // add the schema to the schemas collection.
    this.schemas[name] = schema;

    // add the model to the models collection.
    _model = new Model(schema);

    Object.defineProperty(_model, '_name', {
        enumerable: false,
        writable: true,
        value: name
    });

    Object.defineProperty(_model, '_options', {
        enumerable: false,
        writable: true,
        value: schema._options
    });

    Object.defineProperty(_model, '_db', {
        enumerable: false,
        writable: true,
        value: self
    });

    this.models[name] = _model;

    return _model;

};

module.exports = new Db();


