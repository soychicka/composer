/*
 * IBM Confidential
 * OCO Source Materials
 * IBM Concerto - Blockchain Solution Framework
 * Copyright IBM Corp. 2016
 * The source code for this program is not published or otherwise
 * divested of its trade secrets, irrespective of what has
 * been deposited with the U.S. Copyright Office.
 */

'use strict';

const Identifiable = require('./identifiable');
const Field = require('../introspect/field');

/**
 * <p>
 * Resource is an instance that has a type. The type of the resource
 * specifies a set of properites (which themselves have types).
 * </p>
 * <p>
 * Type information in Concerto is used to validate the structure of
 * Resource instances and for serialization.
 * </p>
 * <p>
 * Resources are used in Concerto to represent Assets, Participants, Transactions and
 * other domain classes that can be serialized for long-term persistent storage.
 * </p>
 * @extends Identifiable
 * @see See [Resource]{@link module:concerto-common.Resource}
 * @class
 * @memberof module:concerto-common
 */
class Resource extends Identifiable {
    /**
     * This constructor should not be called directly.
     * <p>
     * <strong>Note: Only to be called by framework code. Applications should
     * retrieve instances from {@link Factory}</strong>
     * </p>
     *
     * @param {ModelManager} modelManager - The ModelManager for this instance
     * @param {string} ns - The namespace this instance.
     * @param {string} type - The type this instance.
     * @param {string} id - The identifier of this instance.
     * @private
     */
    constructor(modelManager, ns, type, id) {
        super(modelManager, ns, type, id);
    }

    /**
     * Sets a property on this Resource
     * @param {string} propName - the name of the field
     * @param {string} value - the value of the property
     */
    setPropertyValue(propName, value) {
        this[propName] = value;
    }

    /**
     * Adds a value to an array property on this Resource
     * @param {string} propName - the name of the field
     * @param {string} value - the value of the property
     */
    addArrayValue(propName, value) {
        if(this[propName]) {
            this[propName].push(value);
        }
        else {
            this[propName] = [value];
        }
    }

    /**
     * Sets the fields to their default values, based on the model
     * @private
     */
    assignFieldDefaults() {
        let classDeclaration = this.getClassDeclaration();
        let fields = classDeclaration.getProperties();

        for (let n = 0; n < fields.length; n++) {
            let field = fields[n];
            if (field instanceof Field) {
                let defaultValue = field.getDefaultValue();

                if (defaultValue) {
                    if (field.getType() === 'String') {
                        this.setPropertyValue(field.getName(), defaultValue);
                    } else if (field.getType() === 'Integer') {
                        this.setPropertyValue(field.getName(), parseInt(defaultValue));
                    } else if (field.getType() === 'Long') {
                        this.setPropertyValue(field.getName(), parseInt(defaultValue));
                    } else if (field.getType() === 'Double') {
                        this.setPropertyValue(field.getName(), parseFloat(defaultValue));
                    } else if (field.getType() === 'Boolean') {
                        this.setPropertyValue(field.getName(), (defaultValue === 'true'));
                    } else if (field.getType() === 'DateTime') {
                        const dateTime = new Date();
                        dateTime.setTime(Date.parse(defaultValue));
                        this.setPropertyValue(field.getName(), dateTime);
                    }
                }
            }
        }
    }

    /**
     * Returns the string representation of this class
     * @return {String} the string representation of the class
     */
    toString() {
        return 'Resource {id=' + this.getFullyQualifiedIdentifier() +'}';
    }

    /**
     * Determine if this identifiable is a resource.
     * @return {boolean} True if this identifiable is a resource,
     * false if not.
     */
    isResource() {
        return true;
    }

}

module.exports = Resource;
