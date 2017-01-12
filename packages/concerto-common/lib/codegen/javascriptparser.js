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

const doctrine = require('doctrine');
const esprima = require('esprima');
const acorn = require('acorn');

/**
 * Processes a single Javascript file (.js extension)
 *
 * @param {string} file - the file to process
 * @param {Object} fileProcessor - the processor instance to use to generate code
 * @private
 * @class
 * @memberof module:concerto-common
 */
class JavaScriptParser {

  /**
   * Create a JavaScriptParser.
   *
   * @param {string} fileContents - the text of the JS file to parse
   * @param {boolean} includePrivates - if true methods tagged as private are also returned
   */
    constructor(fileContents, includePrivates) {
        let comments = [],
            tokens = [];

        let ast = acorn.parse(fileContents, {
            // collect ranges for each node
            ranges: true,
            // collect comments in Esprima's format
            onComment: comments,
            // collect token ranges
            onToken: tokens
        });

        this.includes = [];
        this.classes = [];
        this.functions = [];

        for (let n = 0; n < ast.body.length; n++) {
            let statement = ast.body[n];

            if (statement.type === 'VariableDeclaration') {
                let variableDeclarations = statement.declarations;

                for (let n = 0; n < variableDeclarations.length; n++) {
                    let variableDeclaration = variableDeclarations[n];

                    if (variableDeclaration.init && variableDeclaration.init.type === 'CallExpression' &&
                        variableDeclaration.init.callee.name === 'require') {
                        let requireName = variableDeclaration.init.arguments[0].value;
                        // we only care about the code we require with a relative path
                        if (requireName.startsWith('.')) {
                            this.includes.push(variableDeclaration.init.arguments[0].value);
                        }
                    }
                }
            }
            else if (statement.type === 'FunctionDeclaration') {
                //console.log(JSON.stringify(statement));
                let closestComment = findCommentBefore(statement.start, statement.end, comments);
                let returnType = '';
                let visibility = '+';
                let parameterTypes = [];
                let parameterNames = [];
                let decorators = [];
                let throws = '';
                let example = '';
                if(closestComment >= 0) {
                    let comment = comments[closestComment].value;
                    //console.log('Found comment: ' + comment );
                    returnType = getReturnType(comment);
                    visibility = getVisibility(comment);
                    parameterTypes = getMethodArguments(comment);
                    throws = getThrows(comment);
                    decorators = getDecorators(comment);
                    example = getExample(comment);
                }

                if(visibility === '+' || includePrivates) {
                    for(let n=0; n < statement.params.length; n++) {
                        parameterNames.push(statement.params[n].name);
                    }
                    const func = {
                        visibility: visibility,
                        returnType: returnType,
                        name: statement.id.name,
                        parameterTypes: parameterTypes,
                        parameterNames: parameterNames,
                        throws: throws,
                        decorators: decorators,
                        functionText : getText(statement.start, statement.end, fileContents),
                        example: example
                    };
                    //console.log('Function: ' + JSON.stringify(func));
                    this.functions.push(func);
                }
            } else if (statement.type === 'ClassDeclaration') {
                let closestComment = findCommentBefore(statement.start, statement.end, comments);
                let privateClass = false;
                if(closestComment >= 0) {
                    let comment = comments[closestComment].value;
                    privateClass = getVisibility(comment) === '-';
                }

                if(privateClass === false || includePrivates) {

                    const clazz = { name: statement.id.name};
                    clazz.methods = [];

                    for(let n=0; n < statement.body.body.length; n++) {
                        let thing = statement.body.body[n];

                        if (thing.type === 'MethodDefinition') {

                            let closestComment = findCommentBefore(thing.key.start, thing.key.end, comments);
                            let returnType = '';
                            let visibility = '+';
                            let methodArgs = [];
                            let throws = '';
                            let decorators = [];
                            let example = '';
                            if(closestComment >= 0) {
                                let comment = comments[closestComment].value;
                                returnType = getReturnType(comment);
                                visibility = getVisibility(comment);
                                methodArgs = getMethodArguments(comment);
                                decorators = getDecorators(comment);
                                throws = getThrows(comment);
                                example = getExample(comment);
                            }

                            if(visibility === '+' || includePrivates) {
                                const method = {
                                    visibility: visibility,
                                    returnType: returnType,
                                    name: thing.key.name,
                                    methodArgs: methodArgs,
                                    decorators: decorators,
                                    throws: throws,
                                    example: example
                                };
                                clazz.methods.push(method);
                            }
                        }
                    }

                    if (statement.superClass) {
                        clazz.superClass = statement.superClass.name;
                    }

                    this.classes.push(clazz);
                }
            }
        }
    }

    /**
     * Return the includes that were extracted from the JS file.
     *
     * @return {Object[]} information about each include
     */
    getIncludes() {
        return this.includes;
    }

    /**
     * Return the classes that were extracted from the JS file.
     *
     * @return {Object[]} information about each class
     */
    getClasses() {
        return this.classes;
    }

    /**
     * Return the methods that were extracted from the JS file.
     *
     * @return {Object[]} information about each method
     */
    getFunctions() {
        return this.functions;
    }
}

/**
 * Grab the text between a range§
 *
 * @param {integer} rangeStart - the start of the range
 * @param {integer} rangeEnd - the end of the range
 * @param {string} source - the source text
 * @return {string} the text between start and end
 * @private
 */
function getText(rangeStart, rangeEnd, source) {
    return source.substring(rangeStart, rangeEnd);
}

/**
 * Find the comments that is above and closest to the start of the range.
 *
 * @param {integer} rangeStart - the start of the range
 * @param {integer} rangeEnd - the end of the range
 * @param {string[]} comments - the end of the range
 * @return {integer} the comment index or -1 if there are no comments
 * @private
 */
function findCommentBefore(rangeStart, rangeEnd, comments) {
    let foundIndex = -1;
    let distance = -1;

    for(let n=0; n < comments.length; n++) {
        let comment = comments[n];
        let endComment = comment.end;
        if(rangeStart > endComment ) {
            if(distance === -1 || rangeStart - endComment < distance) {
                distance = rangeStart - endComment;
                foundIndex = n;
            }
        }
    }

    return foundIndex;
}

/**
 * Grabs all the @ prefixed decorators from a comment block.
 * @param {string} comment - the comment block
 * @return {string[]} the @ prefixed decorators within the comment block
 * @private
 */
function getDecorators(comment) {
    const re = /(?:^|\W)@(\w+)/g;
    let match;
    const matches = [];
    match = re.exec(comment);
    while (match) {
        matches.push(match[1]);
        match = re.exec(comment);
    }
    return matches;
}

/**
 * Extracts the visibilty from a comment block
 * @param {string} comment - the comment block
 * @return {string} the return visibility (either + for public, or - for private)
 * @private
 */
function getVisibility(comment) {
    const PRIVATE = 'private';
    let parsedComment = doctrine.parse(comment, {unwrap: true, sloppy: true, tags: [PRIVATE]});
    const tags = parsedComment.tags;

    if (tags.length > 0) {
        return '-';
    }
    return '+';
}

/**
 * Extracts the return type from a comment block.
 * @param {string} comment - the comment block
 * @return {string} the return type of the comment
 * @private
 */
function getReturnType(comment) {
    const RETURN = 'return';
    const RETURNS = 'returns';

    let result = 'void';
    let parsedComment = doctrine.parse(comment, {unwrap: true, sloppy: true, tags: [RETURN, RETURNS]});

    const tags = parsedComment.tags;

    if (tags.length > 1) {
        throw new Error('Malformed JSDoc comment. More than one returns: ' + comment );
    }

    tags.forEach((tag) => {
        if (!tag.type.name && !tag.type) {
            throw new Error('Malformed JSDoc comment. ' + comment );
        }

        if (tag.type.name) {
            result = tag.type.name;
        } else if (tag.type.applications){
            result = tag.type.applications[0].name + '[]';
        } else if (tag.type.expression) {
            result = tag.type.expression.name;

        }
    });
    return result;
}

/**
 * Extracts the return type from a comment block.
 * @param {string} comment - the comment block
 * @return {string} the return type of the comment
 * @private
 */
function getThrows(comment) {
    const THROWS = 'throws';
    const EXCEPTION = 'exception';
    let result = '';
    let parsedComment = doctrine.parse(comment, {unwrap: true, sloppy: true, tags: [THROWS, EXCEPTION]});

    const tags = parsedComment.tags;

    if (tags.length > 1) {
        throw new Error('Malformed JSDoc comment. More than one throws/exception: ' + comment );
    }

    tags.forEach((tag) => {
        if (!tag.type.type || !tag.type.name) {
            throw new Error('Malformed JSDoc comment. ' + comment );
        }
        result = tag.type.name;
    });

    return result;
}

/**
 * Extracts the method arguments from a comment block.
 * @param {string} comment - the comment block
 * @return {string} the the argument types
 * @private
 */
function getMethodArguments(comment) {
    const TAG = 'param';
    let paramTypes = [];
    let parsedComment = doctrine.parse(comment, {unwrap: true, sloppy: true, tags: [TAG]});

    const tags = parsedComment.tags;

    // param is mentined but not picked up by parser
    if (comment.indexOf('@'+TAG) !== -1 && tags.length === 0) {
        throw new Error('Malformed JSDoc comment: ' + comment );
    }

    tags.forEach((tag) => {
            //If description starts with }
        if (tag.description.trim().indexOf('}') === 0 ||
            !tag.type ||
            !tag.name ) {
            throw new Error('Malformed JSDoc comment: ' + comment );
        } else if(tag.type.name) {
            if (tag.type.name.indexOf(' ') !== -1) {
                throw new Error('Malformed JSDoc comment: ' + comment );
            }
        }

        if (tag.type.name) {
            paramTypes.push(tag.type.name);
        } else if (tag.type.applications){
            paramTypes.push(tag.type.applications[0].name + '[]');
        } else if (tag.type.expression) {
            paramTypes.push(tag.type.expression.name);

        }
    });
    return paramTypes;
}

/**
 * Extracts the example tag from a comment block.
 * @param {string} comment - the comment block
 * @return {string} the the argument types
 * @private
 */
function getExample(comment) {
    const EXAMPLE = 'example';
    let result = '';
    let parsedComment = doctrine.parse(comment, {unwrap: true, sloppy: true, tags: [EXAMPLE]});

    const tags = parsedComment.tags;

    if (tags.length > 0) {
        result = tags[0].description;
    }

    try {
        // Pass as a function so that return statements are valid
        let program = 'function testSyntax() {' + result + '}';
        esprima.parse(program);
    } catch (e) {
        throw Error('Malformed JSDoc Comment. Invalid @example tag: ' + comment);
    }

    return result;
}

module.exports = JavaScriptParser;
