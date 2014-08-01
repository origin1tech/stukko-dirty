#Stukko Dirty

A module for creating models/schemas in Dirty.js. Includes the Dirty.js library as dependency.

##Basic Usage

```js

var db = require('stukko-dirty'),
    schema;

// connect the database.
db.connect('/path/to/db');

schema = new db.Schema({
    
    // basic properties.
    firstName: String,
    lastName: String,
    
    // instance helper methods.
    // when property type is Function it is
    // considered an instance method.
    fullName: function getFullName() {
        return this.firstName + ' ' + this.lastName;
    }
    
});

// export the new model with its schema.
module.exports = db.model('User', schema);

```

##Supported Property Types

**String** - Native JavaScript String.

**Number** - Native JavaScript Number.

**Date** - properties specified with **Date** are converted to moment (see http://momentjs.com).

**Array** - Native JavaScript Array.

**Boolean** - Native JavaScript Boolean.



##Supported Property Attributes & Validation

**type** - one of the above listed property types.

**required** - indicates the property is required.

**min** - minimum length.

**max** - maximum length.

**match** - matches a regular expression.

**unique** - NOT IMPLEMENTED. (on the todo list)
