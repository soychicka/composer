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

let LOG;

const connectionManagerClasses = {};

/**
 * A connection profile manager that manages a set of connection profiles. Each
 * connection profile defines an arbitrary set of configuration data and is associated
 * with a ConnectionManager.
 * @private
 * @class
 * @memberof module:concerto-common
 */
class ConnectionProfileManager {

    /**
     * Register a new ConnectionManager class.
     * @param {string} type - the profile type identifier of the ConnectionManager
     * @param {function} ctor - the constructor of the ConnectionManager
     */
    static registerConnectionManager(type, ctor) {
        connectionManagerClasses[type] = ctor;
    }

    /**
     * Create the ConnectionManager and attach a file system
     * @param {ConnectionProfileStore} connectionProfileStore - Node.js FS implementation, for example BrowserFS
     */
    constructor(connectionProfileStore) {
        if (!LOG) {
            LOG = require('./log/logger').getLog('ConnectionProfileManager');
        }
        LOG.info('constructor','Created a new ConnectionProfileManager', connectionProfileStore);

        if(!connectionProfileStore) {
            throw new Error('Must create ConnectionProfileManager with a ConnectionProfileStore implementation.');
        }

        this.connectionProfileStore = connectionProfileStore;
        this.connectionManagers = {};
    }

    /**
     * Returns the ConnectionProfileStore associated with this
     * instance.
     * @return {ConnectionProfileStore} the associated store.
     */
    getConnectionProfileStore() {
        return this.connectionProfileStore;
    }

    /**
     * Adds a ConnectionManager to the mappings of this ConnectionProfileManager
     * @param {string} type - the profile type identifier of the ConnectionManager
     * @param {ConnectionManager} connectionManager - the instance
     */
    addConnectionManager(type, connectionManager) {
        LOG.info('addConnectionManager','Adding a new connection manager', type);
        this.connectionManagers[type] = connectionManager;
    }

    /**
     * Retrieves the ConnectionManager for the given connection profile.
     *
     * @param {string} connectionProfile The name of the connection profile
     * @return {Promise} A promise that is resolved with a {@link ConnectionManager}
     * object once the connection is established, or rejected with a connection error.
     */
    getConnectionManager(connectionProfile) {
        LOG.info('getConnectionManager','Looking up a connection manager for profile', connectionProfile);

        return this.connectionProfileStore.load(connectionProfile)
        .then((data) => {
            let connectionManager  = this.connectionManagers[data.type];
            if(!connectionManager) {
                const mod = `@ibm/concerto-connector-${data.type}`;
                try {
                    // Check for the connection manager class registered using
                    // registerConnectionManager (used by the web connector).
                    let connectionManagerClass = connectionManagerClasses[data.type];
                    if (connectionManagerClass) {
                        connectionManager = new(connectionManagerClass)(this);
                    } else {
                        // Not registered using registerConnectionManager, we now
                        // need to search for the connector module in our module
                        // and all of the parent modules (the ones who require'd
                        // us) as we do not depend on any connector modules.
                        let curmod = module;
                        while (curmod) {
                            try {
                                connectionManager = new(curmod.require(mod))(this);
                                break;
                            } catch (e) {
                                // Continue to search the parent.
                            }
                            curmod = curmod.parent;
                        }
                        if (!connectionManager) {
                            // We still didn't find it, so try plain old require
                            // one last time.
                            connectionManager = new(require(mod))(this);
                        }
                    }
                } catch (e) {
                    throw new Error(`Failed to load connector module "${mod}" for connection profile "${connectionProfile}"`);
                }
                this.connectionManagers[data.type] = connectionManager;
            }
            return connectionManager;
        });
    }

    /**
     * Establish a connection to the business network, using connection information
     * from the connection profile.
     *
     * @param {string} connectionProfile The name of the connection profile
     * @param {string} businessNetworkIdentifier The identifier of the business network, or null if this is an admin connection
     * @return {Promise} A promise that is resolved with a {@link Connection}
     * object once the connection is established, or rejected with a connection error.
     * @abstract
     */
    connect(connectionProfile, businessNetworkIdentifier) {

        LOG.info('connect','Connecting using ' + connectionProfile, businessNetworkIdentifier);

        return this.connectionProfileStore.load(connectionProfile)
        .then((connectOptions) => {
            return this.getConnectionManager(connectionProfile)
          .then((connectionManager) => {
              return connectionManager.connect(connectionProfile, businessNetworkIdentifier, connectOptions);
          });
        });
    }

    /**
     * Stop serialization of this object.
     * @return {Object} An empty object.
     */
    toJSON() {
        return {};
    }
}

module.exports = ConnectionProfileManager;
