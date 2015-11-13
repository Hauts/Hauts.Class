/*!
 * Hauts.Class
 *
 * Copyright 2015 Michael Chistyakov | Hauts | http://hauts.com
 *
 * https://github.com/Hauts/Hauts.Class
 */
;(function( factory ){
	'use strict';

	//
	// Short strings
	//
	var VERSION = '1.17 [13.11.2015]';

	var FN = 'function',
		UN = 'undefined',
		CN = 'className',
		EX = 'extend',
		IO = 'instanceOf',
		SC = 'superClass',
		OB = 'object',
		RT = 'return',
		ST = 'string',
		TH = 'this',

		CLASS_NAME_PREFIX = 'Class_',

		EMPTY = {},
		DUMMY = Object,

		// Inner settings
		USE_DEEP_MODE = true,
		USE_EVAL = false,

		ALL_CLASSES = [],

		CLASS_COUNTER = 0,
		INNER_INITIALIZATION = false;

	//
	// Logging vars
	//
	var IS_IN_NODE = !!(typeof module !== UN && module.exports);

	var DEBUG = false;

	var LOG_VERSION = false,
		LOG_OK = true,
		LOG_TESTED = false,
		LOG_CACHED = [],
		LOG_PREFIX = 'Hauts.Class: '

	var TAB = '\t';

	var BROWSER_STYLE_POSTFIX = 'font-size:11px;font-style:italic;';

	// https://coderwall.com/p/yphywg/printing-colorful-text-in-terminal-when-run-node-js-script
	var NODE_STYLE_POSTFIX = '%s\x1b[0m';
	var NODE_STYLE_PREFIX = '\x1b';
	var LOG_STYLES = {
		LOG:	[ NODE_STYLE_PREFIX + '[1m'  + NODE_STYLE_POSTFIX, 'color:#999999;' + BROWSER_STYLE_POSTFIX ],
		ERROR:	[ NODE_STYLE_PREFIX + '[31m' + NODE_STYLE_POSTFIX, 'color:#FF0000;' + BROWSER_STYLE_POSTFIX ],
		WARN:	[ NODE_STYLE_PREFIX + '[43m' + NODE_STYLE_POSTFIX, 'color:#FF7700;' + BROWSER_STYLE_POSTFIX ],
		MARK:	[ NODE_STYLE_PREFIX + '[42m' + NODE_STYLE_POSTFIX, 'color:#009900;' + BROWSER_STYLE_POSTFIX ]
	}

	// Use styling only in chrome browser
	var USE_STYLING = !!(typeof window !== UN && window.chrome);

	function nativeLog( message, style ){
		IS_IN_NODE ? console.log(style[0], message ) : (USE_STYLING ? console.log('%c' + message, style[1] ) : console.log(message) );
	}

	function logStyled( message, style, tabs ){
		if(LOG_OK){
			if(DEBUG){
				tabs = isSet(tabs) ? tabs : 0;
				var tabsString = '';
				while( tabs --){ tabsString += TAB; }

				if(LOG_TESTED){
					nativeLog(tabsString + LOG_PREFIX + message, style );
				} else {
					try{
						nativeLog(tabsString + LOG_PREFIX + message, style );
					} catch(e){ LOG_OK = false; }
					LOG_TESTED = true;				
				}
			} else {
				LOG_CACHED.push( [message, style] );
			}
		}
	}

	//
	// Inner log methods
	//
	function log	( message, tabs ){ return logStyled(message, LOG_STYLES.LOG, tabs );	}
	function error	( message, tabs ){ return logStyled(message, LOG_STYLES.ERROR, tabs );	}
	function warn	( message, tabs ){ return logStyled(message, LOG_STYLES.WARN, tabs );	}
	function mark	( message, tabs ){ return logStyled(message, LOG_STYLES.MARK, tabs );	}

	function logVersion(){
		if(LOG_VERSION){ return; }
		LOG_VERSION = true;
		mark('v.' + VERSION + '\n' + '\n');
	}

	function logCached(){
		var totalCached = LOG_CACHED.length;
		if(totalCached > 0){
			log('// Start of cached', 0);
			for(var k=0;k<totalCached; k++){
				var cached = LOG_CACHED[k];
				logStyled( cached[0], cached[1], 1 );
			}
			LOG_CACHED = [];
			log('// End of cached', 0);
		}
	}

	//
	// Internal helpers
	//
	function isSet( object ){ return typeof object != UN && object != null }
	function isFunction( object ){ return typeof object == FN; }
	function isObject( object ){ return typeof object == OB; }
	function isString( object ){ return typeof object == ST; }
	function isArray(object){ return Object.prototype.toString.call(object) === '[object Array]'; }
	function createNamedObject( name ){ return USE_EVAL ? eval('new function ' + name+'(){}') : new (function(){})(); }
	function testCallback( callback, applyArguments, context ){
		if(isFunction(callback)){
			return callback.apply(context, applyArguments);
		}
		return null;
	}
	function copy( from, to ){ for(var i in from){ to[i] = from[i]; } }
	function testReserved( name ){ return name==SC || name==EX || name==IO || name==CN;}
	function createName(){ return CLASS_NAME_PREFIX + (++CLASS_COUNTER); }
	function createClassStructure( instance ){
		var structure = [];
		function fillStructure( owner ){
			if(owner.superClass && owner.superClass !== DUMMY ){
				structure.push(owner.superClass);
				fillStructure(owner.superClass);
			}
		}				
		fillStructure( instance );
		structure.reverse();
		structure.push( instance );
		return structure;
	}

	var Class = function(className, classConstructor, classPrototype, staticProperties, useDeepMode){
		return Class.create( className, classConstructor, classPrototype, staticProperties, useDeepMode );
	}
	Class.create = function(className, classConstructor, classPrototype, staticProperties, useDeepMode){
		return Class.extend( null, className, classConstructor, classPrototype, staticProperties, useDeepMode );
	}

	//
	// Settings
	//
	Class.useDeepMode = function( state ){
		if(isSet(state)){ USE_DEEP_MODE = !!state; }
		return USE_DEEP_MODE;
	}
	Class.useEval = function( state ){
		if(isSet(state)){ USE_EVAL = !!state; }
		return USE_EVAL;
	}	
	Class.debug = function( state ){
		if( isSet(state) ){ DEBUG = !!state; }
		if( DEBUG ){ logVersion(); logCached(); }
		return DEBUG;
	}
	Class.toggleDebug = function(){
		return Class.debug(!Class.debug());
	}	

	//
	// Core
	//
	Class.extend = function( parentClass, className, classConstructor, classPrototype, staticProperties, useDeepMode ){
		parentClass = isFunction(parentClass) ? parentClass : DUMMY;

		if(isFunction(className)){
			staticProperties = classPrototype;
			classPrototype = classConstructor;
			classConstructor = className;
			className = createName();

		} else if(isString(className)){
			if(!isFunction(classConstructor)){
				staticProperties = classPrototype;
				classPrototype = classConstructor;
				classConstructor = DUMMY;
			}
		} else if(isObject(className)){
			staticProperties = classPrototype;
			classPrototype = className;
			classConstructor = DUMMY;
			className = createName();

		} else if( !isSet(className)){
			className = createName();
		}

		if( !isSet(classConstructor) ){
			classConstructor = DUMMY;
		} else {
			if(!isFunction(classConstructor)){
				throw new Error('classConstructor must be a Function');
			}
		}
		classPrototype = isSet(classPrototype) ? classPrototype : EMPTY;
		staticProperties = isSet(staticProperties) ? staticProperties : EMPTY;

		log('Creating Class ' + className )

		var parentClassPrototype = parentClass.prototype;

		// superClass magic starts here
		var superClassInAction = false;
		var baseSuperClass;

		function createSuperClass( instance, createSuperClassTo, parentClass ){
			var superClassCalled = false;
			var superClass = function(){
				if(!superClassCalled){
					superClassCalled = true;

					var skipRestore = superClassInAction;
					superClassInAction = true;

						var origSuperClass = instance.superClass;
						instance.superClass = createSuperClassTo.superClass.superClass;

							for(var argumentsLength = arguments.length, args = new Array(argumentsLength), k=0; k<argumentsLength; k++){
								args[k] = arguments[k];
							}
							parentClass.apply( instance, args );

						instance.superClass = origSuperClass;

					if(!skipRestore){ superClassInAction = false; }
				}
				return superClass;
			}
			superClass.className = parentClass.className;
			return superClass;
		}

		function generateSuperClassProperty( instance ){
			function wrapMethod( method, replaceSuperClass, methodName ){
				var wrapper = function(){
					var skipRestore = superClassInAction;
					superClassInAction = true;

						var currentSuperClass = instance.superClass;
						instance.superClass = replaceSuperClass;

							for(var argumentsLength = arguments.length, args = new Array(argumentsLength), k=0; k<argumentsLength; k++){
								args[k] = arguments[k];
							}
							var result = method.apply( instance, args );

						instance.superClass = currentSuperClass;

					if(!skipRestore){ superClassInAction = false; }
					return result;
				}
				wrapper.isInherited = !!method.isInherited;
				return wrapper;				
			}
			function wrapSuperClassMethods( holder, superClassPrototype, replaceContext ){
				for(var i in superClassPrototype){
					if( !testReserved( i ) ){
						var prop = superClassPrototype[i];
						if( isFunction(prop) ){
							holder[i] = wrapMethod( prop, replaceContext, i );
						}
					}
				}
			}
			var structure = createClassStructure(instance);
			for(var k=1, totalStructure = structure.length, superClasses = []; k<totalStructure; k++){
				superClasses.push(createSuperClass(instance, structure[k], structure[k-1]));
			}
			for(var k=1, totalSuperClasses = superClasses.length; k<totalSuperClasses; k++){
				var superClass = superClasses[k];
				superClass.superClass = superClasses[k-1];
			}
			for(var k=totalSuperClasses-1; k>=0; k--){
				wrapSuperClassMethods( superClasses[k], structure[k].prototype, superClasses[k-1] );
			}
			instance.superClass = superClasses[totalSuperClasses-1] || new function(){}; // ?
			baseSuperClass = superClasses[totalSuperClasses-1];
		}

		function wrapInnerClassMethods( instance ){
			function wrapInnerClassMethod( method, context ){
				if(method.isWrapper){
					return method;
				}
				var wrapper = function(){
					if(superClassInAction){
						context.superClass = baseSuperClass;
					}
					for(var argumentsLength = arguments.length, args = new Array(argumentsLength), k=0; k<argumentsLength; k++){
						args[k] = arguments[k];
					}
					return method.apply( context, args );
				}
				wrapper.isWrapper = true;
				wrapper.isInherited = !!method.isInherited;
				return wrapper;
			}
			for(var i in instance){
				if( !testReserved( i ) ){
					var prop = instance[i];
					if( isFunction(prop) ){
						instance[i] = wrapInnerClassMethod( prop, instance );
					}
				}
			}
		}
		// Create classWrapper
		var classWrapper = function(){
			if(!INNER_INITIALIZATION){
				generateSuperClassProperty( this );
				wrapInnerClassMethods( this );

				for(var argumentsLength = arguments.length, args = new Array(argumentsLength), k=0; k<argumentsLength; k++){
					args[k] = arguments[k];
				}

				classConstructor.apply( this, args );

				wrapInnerClassMethods( this );

				return this;
			}
		}
		if(USE_EVAL){
			var classWrapperCodeArray = classWrapper.toString().split(FN);
			var classWrapperCode = classWrapperCodeArray.shift() + FN + ' ' + className + classWrapperCodeArray.join(FN);
				classWrapperCode = '(' + FN + '(){' + RT + ' ' + classWrapperCode + '})()';
			try{
				classWrapper = eval(classWrapperCode);
			} catch(e){
				throw new Error('Could not eval class constructor function with source code: \n'+ classWrapperCode);
			}
		}

		// Copy parentClass prototype
		useDeepMode = isSet(useDeepMode) ? !!useDeepMode : USE_DEEP_MODE;
		if(USE_DEEP_MODE && useDeepMode){
			INNER_INITIALIZATION = true;
				classWrapper.prototype = new parentClass();
			INNER_INITIALIZATION = false;
		} else {
			copy( parentClassPrototype, classWrapper.prototype );
		}


		// TODO: Test here!
		function wrapInheritedMethod( name ){
			return function(){
				if(superClassInAction){
					this.superClass = baseSuperClass;
				}
				for(var argumentsLength = arguments.length, args = new Array(argumentsLength), k=0; k<argumentsLength; k++){
					args[k] = arguments[k];
				}
				return this.superClass[name].apply(this, args);
			}
		}
		if(parentClass != DUMMY){
			for(var i in classPrototype){
				if( !testReserved( i ) ){
					var prop = classPrototype[i];
					if( isFunction(prop) ){
						if(!isSet(classPrototype[i])){
							classPrototype[i] = wrapInheritedMethod( i );
							classPrototype[i].isInherited = true;
						}
					}
				}
			}
		}

		// Overwrite with new classPrototype object props
		copy( classPrototype, classWrapper.prototype );

		// Add static properties
		copy( parentClass, classWrapper );
		copy( staticProperties, classWrapper );

		classWrapper.superClass = classWrapper.prototype.superClass = parentClass;
		classWrapper.className = classWrapper.prototype.className = className;

		classWrapper.extend = classWrapper.prototype.extend = function(className, classConstructor, classPrototype, staticProperties, useDeepMode){
			return Class.extend(classWrapper, className, classConstructor, classPrototype, staticProperties, useDeepMode);
		}
		
		classWrapper.instanceOf = classWrapper.prototype.instanceOf = function( testClass ){
			if(classWrapper === testClass){
				return true;
			}
			if(classWrapper.superClass){
				if(classWrapper.superClass === testClass){
					return true;
				} else {
					if(isFunction(classWrapper.superClass.instanceOf)){
						return classWrapper.superClass.instanceOf( testClass );
					}
				}
			}
			return false;
		}

		// TODO & TEST
		/*
		classWrapper.prototype.isInstantiating = function(){
			return false;
		}
		*/
		ALL_CLASSES.push(classWrapper);
		return classWrapper;
	}

	//
	// Utils
	//
	Class.isClass = function( testClass ){
		if(!isSet(testClass)){ return false; }		
		var counter = ALL_CLASSES.length;
		while(counter--){
			if(testClass === ALL_CLASSES[counter]){ return true; }
		}
		return false;
	}

	Class.isClassInstanceOfClass = function( testClass, testParentClass ){
		if(!isSet(testClass)){ return false; }
		if(!isSet(testParentClass)){ return false; }
		if(!Class.isClass(testClass)){ return false; }
		if(!Class.isClass(testParentClass)){ return false; }
		return testClass.instanceOf(testParentClass);
	}

	//
	// Define / Resolve extra methods
	//
	var emptyDefines = [];
	var emptyResolves = [];
	var allResolves = []
	var allDefines = [];
	var lastDefinedObjectPath = '';

	function testResolveHandlers(){
		emptyResolves = [];

		var totalResolves = allResolves.length,
			totalDefines = allDefines.length;

		for(var k=0;k<totalResolves;k++){
			var testResolveData = allResolves[k];
			if(testResolveData && !testResolveData.resolved){
				var emptyDependencies = [];

				var dependencies = testResolveData.dependencies,
					totalDependencies = dependencies.length,
					totalResolved = 0,
					results = [];

				for(var j=0;j<totalDependencies;j++){
					var dependency = dependencies[j];
					var founded = false;
					for(var i=0; i<totalDefines; i++){
						var defineData = allDefines[i];
						if(defineData.defined){
							if(defineData.objectPath == dependency){
								totalResolved++;
								results.push(defineData.result);
								founded = true;
							}
						}
					}
					if(!founded){
						emptyDependencies.push(dependency);
					}
				}
				if(totalResolved == totalDependencies){
					testResolveData.resolved = true;

					mark('Launching resolve for \'' + dependencies.join('\', \'') + '\'');

					testCallback( testResolveData.handler, results, testResolveData.context );

					allResolves.splice(k,1);
					k-=1;

				} else {
					emptyResolves.push({
						emptyDependencies: emptyDependencies
					})
				}
			}
		}
	}

	function testResolveDefines(){
		emptyDefines = [];
		var totalDefines = allDefines.length;
		for(var k=0; k<totalDefines; k++){
			var testDefineData = allDefines[k];

			if(!testDefineData.defined){
				var emptyDependencies = [];

				var definedDependenciesCount = 0,
					dependencies = testDefineData.dependencies,
					totalDependencies = dependencies.length,
					totalDefines = allDefines.length,
					results = [];

				for(var j=0; j<totalDependencies; j++){
					var dependencyObjectPath = dependencies[j];
					var founded = false;
					for(var i=0; i<totalDefines; i++){
						var defineData = allDefines[i],
							definedObjectPath = defineData.objectPath;
						if(defineData.defined){
							if(definedObjectPath == dependencyObjectPath){
								definedDependenciesCount++;
								results.push(defineData.result);
								founded = true;
							}
						}
					}
					if(!founded){
						emptyDependencies.push(dependencyObjectPath);
					}
				}

				if(definedDependenciesCount == totalDependencies){
					testDefineData.defined = true;
					
					mark('Resolved definition for \'' + testDefineData.objectPath + '\'');

					if(testDefineData.targetPath[testDefineData.objectName]){ error(testDefineData.objectPath + ' already defined!'); }

					var defineResult = testCallback( testDefineData.handler, results, factory );
					
					if(!isSet(defineResult)){
						warn('Define handler for ' + testDefineData.objectPath + ' does not return anything');
					}

					testDefineData.result = testDefineData.targetPath[testDefineData.objectName] = defineResult;
					
					testResolveHandlers();
					testResolveDefines();
				} else {
					emptyDefines.push({
						objectPath : testDefineData.objectPath,
						emptyDependencies : emptyDependencies
					})
				}

			}
		}
	}

	Class.define = function( objectPath, dependencies, handler ){
		if( !isString(objectPath) ){
			return error('No objectPath passed to define!')
		}

		lastDefinedObjectPath = objectPath;
		var objectPathArray = objectPath.split('.'),
			objectName = objectPathArray.pop();

		if( objectName == '' ){
			return error('define must have objectPath (objectName) argument!')
		}

		if( isFunction(dependencies) ){
			handler = dependencies;
			dependencies = [];
		}

		if( !isSet(handler) ){
			return error('No handler to define ' + objectPath + '!');
		}

		var pathArrayLength = objectPathArray.length,
			targetPath = factory;

		for (var k = 0; k<pathArrayLength; k++) {
			var name = objectPathArray[k];
			if(name != ''){
				targetPath[name] = targetPath = targetPath[name] || createNamedObject( name );
			}
		}

		log('Added definition for \'' + objectPath + '\'');
		
		allDefines.push({
			defined: false,
			objectPath: objectPath,
			targetPath: targetPath,
			objectName: objectName,
			dependencies: dependencies,
			handler: handler
		});
		
		testResolveDefines();

		return this;
	}

	Class.resolve = function(dependencies, handler, context){
		if(isFunction(dependencies)){
			context = handler;
			handler = dependencies;
			if(lastDefinedObjectPath){
				dependencies = [lastDefinedObjectPath];
			} else {
				// Will not resolve null dependencies
				warn('No dependencies for resolve');
				return;
			}
		}
		
		if(!isArray(dependencies)){ dependencies = [dependencies]; }
		
		allResolves.push({
			resolved: false,
			dependencies: dependencies,
			handler: handler,
			context: isSet(context) ? context : factory
		});
		
		log('Added resolve handler to \'' + dependencies.join('\', \'') + '\'');

		testResolveHandlers();

		return this;
	}
	Class.isDefined = function( dependencies ){
		if(!isArray(dependencies)){ dependencies = [dependencies]; }
		
		var totalDependencies = dependencies.length;
		var totalDefines = allDefines.length;
		var totalDefined = 0;
		
		for(var k=0; k<totalDefines; k++){
			var defineData = allDefines[k];
			if(defineData.defined){
				for(var j=0;j<totalDependencies;j++){
					var dependency = dependencies[j];
					if(dependency == defineData.objectPath){
						totalDefined++;
						if(totalDefined == totalDependencies){
							return true;
						}
					}
				}
			}
		}
		return false;
	}
	Class.debugDefines = function(){
		var totalEmptyDefines = emptyDefines.length;
		if(totalEmptyDefines){
			warn('Empty definitions:');
			for(var k=0;k<totalEmptyDefines;k++){
				var emptyDefine = emptyDefines[k];
				log(emptyDefine.objectPath)
				log('#' + (k+1) + '\t' + emptyDefine.emptyDependencies.join(', '))
			}
		} else {
			mark('All definitions ok');
		}
		var totalEmptyResolves = emptyResolves.length;
		if(totalEmptyResolves){
			warn('Empty resolves:');
			for(var k=0;k<totalEmptyResolves;k++){
				var emptyResolve = emptyResolves[k];
				log('#' + (k+1) + '\t' + emptyResolve.emptyDependencies.join(', '))
			}
		} else {
			mark('All resolves ok');
		}
		return { emptyDefines: emptyDefines, emptyResolves: emptyResolves }
	}


	//
	// Exports
	//
	var Hauts = factory.Hauts = factory.Hauts || new (function Hauts(){})();
	Hauts.Class = Class;

	if(IS_IN_NODE){
		module.exports = Hauts;
	}
})((typeof module !== 'undefined' && module.exports && typeof global !== 'undefined') ? global : this || window );