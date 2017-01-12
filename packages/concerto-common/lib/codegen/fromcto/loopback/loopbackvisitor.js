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

const AssetDeclaration = require('../../../introspect/assetdeclaration');
const ClassDeclaration = require('../../../introspect/classdeclaration');
const EnumDeclaration = require('../../../introspect/enumdeclaration');
const EnumValueDeclaration = require('../../../introspect/enumvaluedeclaration');
const Field = require('../../../introspect/field');
const ModelFile = require('../../../introspect/modelfile');
const ModelManager = require('../../../modelmanager');
const RelationshipDeclaration = require('../../../introspect/relationshipdeclaration');
const TransactionDeclaration = require('../../../introspect/transactiondeclaration');
const debug = require('debug')('concerto:jsonschemavisitor');

/**
 * Convert the contents of a {@link ModelManager} instance to a set of LoopBack
 * Definition Language model files - one per concrete asset and transaction type.
 * Set a fileWriter property (instance of {@link FileWriter}) on the parameters
 * object to control where the generated code is written to disk.
 * @private
 * @class
 * @memberof module:concerto-common
 */
class LoopbackVisitor {

    /**
     * Visitor design pattern
     * @param {Object} thing - the object being visited
     * @param {Object} parameters - the parameter
     * @return {Object} the result of visiting or null
     * @private
     */
    visit(thing, parameters) {
        if (thing instanceof ModelManager) {
            return this.visitModelManager(thing, parameters);
        } else if (thing instanceof ModelFile) {
            return this.visitModelFile(thing, parameters);
        } else if (thing instanceof AssetDeclaration) {
            return this.visitAssetDeclaration(thing, parameters);
        } else if (thing instanceof TransactionDeclaration) {
            return this.visitTransactionDeclaration(thing, parameters);
        } else if (thing instanceof EnumDeclaration) {
            return this.visitEnumDeclaration(thing, parameters);
        } else if (thing instanceof ClassDeclaration) {
            return this.visitClassDeclaration(thing, parameters);
        } else if (thing instanceof Field) {
            return this.visitField(thing, parameters);
        } else if (thing instanceof RelationshipDeclaration) {
            return this.visitRelationshipDeclaration(thing, parameters);
        } else if (thing instanceof EnumValueDeclaration) {
            return this.visitEnumValueDeclaration(thing, parameters);
        } else {
            throw new Error('Unrecognised type: ' + typeof thing + ', value: ' + JSON.stringify(thing));
        }
    }

    /**
     * Visitor design pattern
     * @param {ModelManager} modelManager - the object being visited
     * @param {Object} parameters - the parameter
     * @return {Object} the result of visiting or null
     * @private
     */
    visitModelManager(modelManager, parameters) {
        debug('entering visitModelManager');

        // Save the model manager so that we have access to it later.
        parameters.modelManager = modelManager;

        // Visit all of the files in the model manager.
        let jsonSchemas = [];
        modelManager.getModelFiles().forEach((modelFile) => {
            jsonSchemas = jsonSchemas.concat(modelFile.accept(this, parameters));
        });
        return jsonSchemas;

    }

    /**
     * Visitor design pattern
     * @param {ModelFile} modelFile - the object being visited
     * @param {Object} parameters - the parameter
     * @return {Object} the result of visiting or null
     * @private
     */
    visitModelFile(modelFile, parameters) {
        debug('entering visitModelFile', modelFile.getNamespace());

        // Save the model file so that we have access to it later.
        parameters.modelFile = modelFile;

        // Visit all of the asset and transaction declarations, but ignore the abstract ones.
        let jsonSchemas = [];
        modelFile.getAssetDeclarations()
            .concat(modelFile.getTransactionDeclarations())
            .filter((declaration) => {
                return !declaration.isAbstract();
            })
            .forEach((declaration) => {
                parameters.first = true;
                jsonSchemas.push(declaration.accept(this, parameters));
            });
        return jsonSchemas;

    }

    /**
     * Visitor design pattern
     * @param {AssetDeclaration} assetDeclaration - the object being visited
     * @param {Object} parameters - the parameter
     * @return {Object} the result of visiting or null
     * @private
     */
    visitAssetDeclaration(assetDeclaration, parameters) {
        debug('entering visitAssetDeclaration', assetDeclaration.getName());

        // If this is the first declaration, then we are building a schema for this asset.
        let jsonSchema = {};
        if (parameters.first) {
            jsonSchema = {
                $first: true,
                name: assetDeclaration.getName(),
                description: `An asset named ${assetDeclaration.getName()}`,
                plural: assetDeclaration.getFullyQualifiedName(),
                base: 'PersistedModel',
                idInjection: true,
                options: {
                    validateUpsert: true
                },
                properties: {},
                validations: [],
                relations: {},
                acls: [],
                methods: []
            };
            parameters.first = false;
        }

        // Apply all the common schema elements.
        return this.visitClassDeclarationCommon(assetDeclaration, parameters, jsonSchema);

    }

    /**
     * Visitor design pattern
     * @param {TransactionDeclaration} transactionDeclaration - the object being visited
     * @param {Object} parameters - the parameter
     * @return {Object} the result of visiting or null
     * @private
     */
    visitTransactionDeclaration(transactionDeclaration, parameters) {
        debug('entering visitTransactionDeclaration', transactionDeclaration.getName());

        // If this is the top declaration, then we are building a schema for this transaction.
        let jsonSchema = {};
        if (parameters.first) {
            jsonSchema = {
                $first: true,
                name: transactionDeclaration.getName(),
                description: `A transaction named ${transactionDeclaration.getName()}`,
                plural: transactionDeclaration.getFullyQualifiedName(),
                base: 'PersistedModel',
                idInjection: true,
                options: {
                    validateUpsert: true
                },
                properties: {},
                validations: [],
                relations: {},
                acls: [],
                methods: []
            };
            parameters.first = false;
        }

        // Apply all the common schema elements.
        return this.visitClassDeclarationCommon(transactionDeclaration, parameters, jsonSchema);

    }

    /**
     * Visitor design pattern
     * @param {ClassDeclaration} classDeclaration - the object being visited
     * @param {Object} parameters - the parameter
     * @return {Object} the result of visiting or null
     * @private
     */
    visitClassDeclaration(classDeclaration, parameters) {
        debug('entering visitClassDeclaration', classDeclaration.getName());

        // Apply all the common schema elements.
        return this.visitClassDeclarationCommon(classDeclaration, parameters, {});

    }

    /**
     * Visitor design pattern
     * @param {ClassDeclaration} classDeclaration - the object being visited
     * @param {Object} parameters - the parameter
     * @param {Object} jsonSchema - the base JSON Schema object to use
     * @return {Object} the result of visiting or null
     * @private
     */
    visitClassDeclarationCommon(classDeclaration, parameters, jsonSchema) {
        debug('entering visitClassDeclarationCommon', classDeclaration.getName());

        // Set the required properties into the schema.
        Object.assign(jsonSchema, {
            properties: {}
        });

        // If no description exists, add it now.
        if (!jsonSchema.description) {
            jsonSchema.description = `An instance of ${classDeclaration.getFullyQualifiedName()}`;
        }

        // Walk over all of the properties of this class and its super classes.
        classDeclaration.getProperties().forEach((property) => {

            // Get the schema for the property.
            jsonSchema.properties[property.getName()] = property.accept(this, parameters);

        });

        // If this is a top level schema, now we need to write it to disk.
        if (jsonSchema.$first) {
            delete jsonSchema.$first;
            let fileContents = JSON.stringify(jsonSchema, null, 4);
            if (parameters.fileWriter) {
                let fileName = `${classDeclaration.getFullyQualifiedName()}.json`;
                parameters.fileWriter.openFile(fileName);
                parameters.fileWriter.write(fileContents);
                parameters.fileWriter.closeFile();
            }
        }

        // Return the created schema.
        return jsonSchema;

    }

    /**
     * Visitor design pattern
     * @param {Field} field - the object being visited
     * @param {Object} parameters - the parameter
     * @return {Object} the result of visiting or null
     * @private
     */
    visitField(field, parameters) {
        debug('entering visitField', field.getName());

        // Is this a primitive typed property?
        let jsonSchema;
        if (field.isPrimitive()) {

            // Render the type as JSON Schema.
            jsonSchema = {};
            switch (field.getType()) {
            case 'String':
                jsonSchema.type = 'string';
                break;
            case 'Double':
            case 'Integer':
            case 'Long':
                jsonSchema.type = 'number';
                break;
            case 'DateTime':
                jsonSchema.type = 'date';
                break;
            case 'Boolean':
                jsonSchema.type = 'boolean';
                break;
            }

            // If this field has a default value, add it.
            if (field.getDefaultValue()) {
                jsonSchema.default = field.getDefaultValue();
            }

            // If this is the identifying field, mark it as such.
            if (field.getName() === field.getParent().getIdentifierFieldName()) {
                jsonSchema.id = true;
                jsonSchema.description = 'The instance identifier for this type';
            }

        // Is this an enumeration?
        } else if (field.isTypeEnum()) {

            // Render the type as JSON Schema.
            jsonSchema = {
                type: 'string'
            };

            // If this field has a default value, add it.
            if (field.getDefaultValue()) {
                jsonSchema.default = field.getDefaultValue();
            }

            // Look up the type of the property.
            let type = parameters.modelFile.getType(field.getType());

            // Visit it, but ignore the response.
            type.accept(this, parameters);

        // Not primitive, so must be a class or enumeration!
        } else {

            // Look up the type of the property.
            let type = parameters.modelFile.getType(field.getType());

            // Render the type as JSON Schema.
            jsonSchema = type.accept(this, parameters);

        }

        // Is the type an array?
        if (field.isArray()) {
            jsonSchema.type = [ jsonSchema.type ];
        }

        // Is the field required?
        jsonSchema.required = !field.isOptional();

        // Return the schema.
        return jsonSchema;

    }

    /**
     * Visitor design pattern
     * @param {EnumDeclaration} enumDeclaration - the object being visited
     * @param {Object} parameters - the parameter
     * @return {Object} the result of visiting or null
     * @private
     */
    visitEnumDeclaration(enumDeclaration, parameters) {
        debug('entering visitEnumDeclaration', enumDeclaration.getName());

        // Walk over all of the properties which should just be enum value declarations.
        enumDeclaration.getProperties().forEach((property) => {
            property.accept(this, parameters);
        });

        // Return the schema.
        return null;

    }

    /**
     * Visitor design pattern
     * @param {EnumValueDeclaration} enumValueDeclaration - the object being visited
     * @param {Object} parameters - the parameter
     * @return {Object} the result of visiting or null
     * @private
     */
    visitEnumValueDeclaration(enumValueDeclaration, parameters) {
        debug('entering visitEnumValueDeclaration', enumValueDeclaration.getName());

        // The schema in this case is just the name of the value.
        return null;

    }

    /**
     * Visitor design pattern
     * @param {RelationshipDeclaration} relationshipDeclaration - the object being visited
     * @param {Object} parameters - the parameter
     * @return {Object} the result of visiting or null
     * @private
     */
    visitRelationshipDeclaration(relationshipDeclaration, parameters) {
        debug('entering visitRelationship', relationshipDeclaration.getName());

        // Create the schema.
        let jsonSchema = {
            type: 'String',
            description: `The identifier of an instance of ${relationshipDeclaration.getFullyQualifiedTypeName()}`,
            required: !relationshipDeclaration.isOptional()
        };

        // Is the type an array?
        if (relationshipDeclaration.isArray()) {
            jsonSchema.type = [ jsonSchema.type ];
        }

        // Return the schema.
        return jsonSchema;

    }

}

module.exports = LoopbackVisitor;
