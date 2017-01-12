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

const Resource = require('@ibm/concerto-common').Resource;
const Util = require('@ibm/concerto-common').Util;

/**
 * Class representing an Abstract Registry.
 * <p><a href="./diagrams/registry.svg"><img src="./diagrams/registry.svg" style="width:100%;"/></a></p>
 * @abstract
 * @class
 * @memberof module:concerto-client
 */
class Registry {

    /**
     * Get a list of all existing registries.
     *
     * @protected
     * @param {SecurityContext} securityContext The user's security context.
     * @param {string} registryType The type of this registry.
     * @return {Promise} A promise that will be resolved with an array of JSON
     * objects representing the registries.
     */
    static getAllRegistries(securityContext, registryType) {
        Util.securityCheck(securityContext);
        if (!registryType) {
            throw new Error('registryType not specified');
        }
        return Util.queryChainCode(securityContext, 'getAllRegistries', [registryType])
            .then((buffer) => {
                return JSON.parse(buffer.toString());
            });
    }

    /**
     * Get an existing registry.
     *
     * @protected
     * @param {SecurityContext} securityContext The user's security context.
     * @param {string} registryType The type of this registry.
     * @param {string} id The unique identifier of the registry.
     * @return {Promise} A promise that will be resolved with a JSON object
     * representing the registry.
     */
    static getRegistry(securityContext, registryType, id) {
        Util.securityCheck(securityContext);
        if (!registryType) {
            throw new Error('registryType not specified');
        } else if (!id) {
            throw new Error('id not specified');
        }
        return Util.queryChainCode(securityContext, 'getRegistry', [registryType, id])
            .then((buffer) => {
                return JSON.parse(buffer.toString());
            });
    }

    /**
     * Determines whether a registry exists.
     *
     * @protected
     * @param {SecurityContext} securityContext The user's security context.
     * @param {string} registryType The type of this registry.
     * @param {string} id The unique identifier of the registry.
     * @return {Promise} A promise that will be resolved with true/false depending on whether the registry exists
     */
    static existsRegistry(securityContext, registryType, id) {
        Util.securityCheck(securityContext);
        if (!registryType) {
            throw new Error('registryType not specified');
        } else if (!id) {
            throw new Error('id not specified');
        }
        return Util.queryChainCode(securityContext, 'existsRegistry', [registryType, id])
        .then((buffer) => {
            return JSON.parse(buffer.toString());
        });
    }

    /**
     * Add a new asset registry.
     *
     * @protected
     * @param {SecurityContext} securityContext The user's security context.
     * @param {string} registryType The type of this registry.
     * @param {string} id The unique identifier of the registry.
     * @param {string} name The name of the registry.
     * @return {Promise} A promise that will be resolved with a JSON object
     * representing the registry.
     */
    static addRegistry(securityContext, registryType, id, name) {
        Util.securityCheck(securityContext);
        if (!registryType) {
            throw new Error('registryType not specified');
        } else if (!id) {
            throw new Error('id not specified');
        } else if (!name) {
            throw new Error('name not specified');
        }
        return Util.invokeChainCode(securityContext, 'addRegistry', [registryType, id, name])
            .then(() => {
                return {
                    id: id,
                    name: name
                };
            });
    }

    /**
     * Create a registry.
     *
     * <strong>Note: Only to be called by framework code. Applications should
     * retrieve instances from {@link BusinessNetworkConnection}</strong>
     * </p>
     *
     * @protected
     * @param {string} registryType The type of this registry.
     * @param {string} id The unique identifier of the registry.
     * @param {string} name The display name for the registry.
     * @param {SecurityContext} securityContext The users security context.
     * @param {ModelManager} modelManager The ModelManager to use for this registry.
     * @param {Factory} factory The factory to use for this registry.
     * @param {Serializer} serializer The Serializer to use for this registry.
     */
    constructor(registryType, id, name, securityContext, modelManager, factory, serializer) {
        if (!registryType) {
            throw new Error('registryType not specified');
        } else if (!id) {
            throw new Error('id not specified');
        } else if (!name) {
            throw new Error('name not specified');
        } else if (!securityContext) {
            throw new Error('securityContext not specified');
        } else if (!modelManager) {
            throw new Error('modelManager not specified');
        } else if (!factory) {
            throw new Error('factory not specified');
        } else if (!serializer) {
            throw new Error('serializer not specified');
        }
        this.registryType = registryType;
        this.id = id;
        this.name = name;
        this.securityContext = securityContext;
        this.modelManager = modelManager;
        this.factory = factory;
        this.serializer = serializer;
    }

    /**
     * Adds a list of new resources to the registry.
     *
     * @param {Resource[]} resources The resources to be added to the registry.
     * @return {Promise} A promise that will be resolved when the resource is
     * added to the registry.
     */
    addAll(resources) {
        Util.securityCheck(this.securityContext);
        if (!resources) {
            throw new Error('resources not specified');
        }
        let serializedResources = resources.map((resource) => {
            return this.serializer.toJSON(resource);
        });
        return Util.invokeChainCode(this.securityContext, 'addAllResourcesToRegistry', [this.registryType, this.id, JSON.stringify(serializedResources)]);
    }

    /**
     * Adds a new resource to the registry.
     *
     * @param {Resource} resource The resource to be added to the registry.
     * @return {Promise} A promise that will be resolved when the resource is
     * added to the registry.
     */
    add(resource) {
        Util.securityCheck(this.securityContext);
        if (!resource) {
            throw new Error('resource not specified');
        }
        let serializedResource = this.serializer.toJSON(resource);
        return Util.invokeChainCode(this.securityContext, 'addResourceToRegistry', [this.registryType, this.id, JSON.stringify(serializedResource)]);
    }

    /**
     * Updates a list of resources in the registry.
     *
     * @param {Resource[]} resources The resources to be updated in the asset registry.
     * @return {Promise} A promise that will be resolved when the resource is
     * added to the registry.
     */
    updateAll(resources) {
        Util.securityCheck(this.securityContext);
        if (!resources) {
            throw new Error('resources not specified');
        }
        let serializedResources = resources.map((resource) => {
            return this.serializer.toJSON(resource);
        });
        return Util.invokeChainCode(this.securityContext, 'updateAllResourcesInRegistry', [this.registryType, this.id, JSON.stringify(serializedResources)]);
    }

    /**
     * Updates a resource in the registry.
     *
     * @param {Resource} resource The resource to be updated in the registry.
     * @return {Promise} A promise that will be resolved when the resource is
     * updated in the registry.
     */
    update(resource) {
        Util.securityCheck(this.securityContext);
        if (!resource) {
            throw new Error('resource not specified');
        }
        let serializedResource = this.serializer.toJSON(resource);
        return Util.invokeChainCode(this.securityContext, 'updateResourceInRegistry', [this.registryType, this.id, JSON.stringify(serializedResource)]);
    }

    /**
     * Removes a list of resources from the registry.
     *
     * @param {(Resource[]|string[])} resources The resources, or the unique identifiers of the resources.
     * @return {Promise} A promise that will be resolved when the resource is
     * added to the registry.
     */
    removeAll(resources) {
        Util.securityCheck(this.securityContext);
        if (!resources) {
            throw new Error('resources not specified');
        }
        let data = resources.map((resource) => {
            if (resource instanceof Resource) {
                return resource.getIdentifier();
            } else {
                return resource;
            }
        });
        return Util.invokeChainCode(this.securityContext, 'removeAllResourcesFromRegistry', [this.registryType, this.id, JSON.stringify(data)]);
    }

    /**
     * Remove an asset with a given type and id from the registry.
     *
     * @param {(Resource|string)} resource The resource, or the unique identifier of the resource.
     * @return {Promise} A promise that will be resolved when the resource is
     * removed from the registry.
     */
    remove(resource) {
        Util.securityCheck(this.securityContext);
        if (!resource) {
            throw new Error('resource not specified');
        }
        let id;
        if (resource instanceof Resource) {
            id = resource.getIdentifier();
        } else {
            id = resource;
        }
        return Util.invokeChainCode(this.securityContext, 'removeResourceFromRegistry', [this.registryType, this.id, id]);
    }

    /**
     * Get all of the resources in the registry.
     *
     * @return {Promise} A promise that will be resolved with an array of JSON
     * objects representing the resources.
     */
    getAll() {
        Util.securityCheck(this.securityContext);
        return Util.queryChainCode(this.securityContext, 'getAllResourcesInRegistry', [this.registryType, this.id])
            .then((buffer) => {
                return JSON.parse(buffer.toString());
            })
            .then((resources) => {
                return resources.map((resource) => {
                    return this.serializer.fromJSON(resource);
                });
            });
    }

    /**
     * Get a specific resource in the registry.
     *
     * @param {string} id The unique identifier of the resource.
     * @return {Promise} A promise that will be resolved with a JSON object
     * representing the resource.
     */
    get(id) {
        Util.securityCheck(this.securityContext);
        if (!id) {
            throw new Error('id not specified');
        }
        return Util.queryChainCode(this.securityContext, 'getResourceInRegistry', [this.registryType, this.id, id])
            .then((buffer) => {
                return JSON.parse(buffer.toString());
            })
            .then((resource) => {
                return this.serializer.fromJSON(resource);
            });
    }

    /**
     * Determines whether a specific resource exists in the registry.
     *
     * @param {string} id The unique identifier of the resource.
     * @return {Promise} A promise that will be resolved with true/false depending on whether the resource exists.
     */
    exists(id) {
        Util.securityCheck(this.securityContext);
        if (!id) {
            throw new Error('id not specified');
        }
        return Util.queryChainCode(this.securityContext, 'existsResourceInRegistry', [this.registryType, this.id, id])
        .then((buffer) => {
            return JSON.parse(buffer.toString());
        });
    }


    /**
     * Find resources in the registry that match the specified JSONata expression.
     * The JSONata expression is applied to each resource in the registry, and
     * resources are returned if the JSONata expression returns a truthy value for that
     * resource.
     *
     * @param {string} expression The JSONata expression.
     * @return {Promise} A promise that will be resolved with an array of {@link
     * Resource} instances representing the assets that match the query.
     */
    find(expression) {
        Util.securityCheck(this.securityContext);
        if (!expression) {
            throw new Error('expression not specified');
        }
        return Util.queryChainCode(this.securityContext, 'findResourcesInRegistry', [this.registryType, this.id, expression])
            .then((buffer) => {
                return JSON.parse(buffer.toString());
            })
            .then((resources) => {
                return resources.map((resource) => {
                    return this.serializer.fromJSON(resource);
                });
            });
    }

    /**
     * Execute a query against all resources in the registry. The JSONata
     * expression is applied to each resource in the registry, and the result
     * of the JSONata expression is returned if the result is truthy. The result
     * is a JavaScript object, and should only be used for visualization
     * purposes. You cannot use the {@link add} or {@link update} functions with
     * data returned by this function.
     *
     * @param {string} expression The JSONata expression.
     * @return {Promise} A promise that will be resolved with an array of JavaScript
     * objects representing the resources and all of their resolved relationships.
     */
    query(expression) {
        Util.securityCheck(this.securityContext);
        if (!expression) {
            throw new Error('expression not specified');
        }
        return Util.queryChainCode(this.securityContext, 'queryResourcesInRegistry', [this.registryType, this.id, expression])
            .then((buffer) => {
                return JSON.parse(buffer.toString());
            });
    }

    /**
     * Get all of the resources in the registry, and resolve all of their relationships
     * to other assets, participants, and transactions. The result is a JavaScript
     * object, and should only be used for visualization purposes. You cannot use
     * the {@link add} or {@link update} functions with a resolved resource.
     *
     * @return {Promise} A promise that will be resolved with an array of JavaScript
     * objects representing the resources and all of their resolved relationships.
     */
    resolveAll() {
        Util.securityCheck(this.securityContext);
        return Util.queryChainCode(this.securityContext, 'resolveAllResourcesInRegistry', [this.registryType, this.id])
            .then((buffer) => {
                return JSON.parse(buffer.toString());
            });
    }

    /**
     * Get a specific resource in the registry, and resolve all of its relationships
     * to other assets, participants, and transactions. The result is a JavaScript
     * object, and should only be used for visualization purposes. You cannot use
     * the {@link add} or {@link update} functions with a resolved resource.
     *
     * @param {string} id The unique identifier of the asset.
     * @return {Promise} A promise that will be resolved with a JavaScript object
     * representing the resource and all of its resolved relationships.
     */
    resolve(id) {
        Util.securityCheck(this.securityContext);
        if (!id) {
            throw new Error('id not specified');
        }
        return Util.queryChainCode(this.securityContext, 'resolveResourceInRegistry', [this.registryType, this.id, id])
            .then((buffer) => {
                return JSON.parse(buffer.toString());
            });
    }

}

module.exports = Registry;
