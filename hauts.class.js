// Hauts.Class
// 27.10.2015
// Hauts
// https://github.com/Hauts/Hauts.Class
'use strict';
;(function( factory ){
	factory.Hauts = factory.Hauts || new (function Hauts(){})();
	var Hauts = factory.Hauts;

	if(isFunction(Hauts.Class)){
		return;
	}

	// Short strings
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
		USE_EVAL = true,

		ALL_CLASSES = [],

		CLASS_COUNTER = 0,
		INNER_INITIALIZATION = false;

	// Internal helpers
	function isSet( object ){ return typeof object != UN && object != null }
	function isFunction( object ){ return typeof object == FN; }
	function isObject( object ){ return typeof object == OB; }
	function isString( object ){ return typeof object == ST; }

	function createNamedObject( name ){ return USE_EVAL ? eval('new function ' + name+'(){}') : {}; }

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

	Class.useDeepMode = function( state ){
		if(isSet(state)){ USE_DEEP_MODE = !!state; }
		return USE_DEEP_MODE;
	}

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


	// TODO:
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
	// Define / Resolve
	//
	var allResolves = [],
		allDefines = [],
		allDefined = [];

	var lastDefinedClassPath = '';

	function testResolveHandlers(){
		for(var k=0, totalDefined = allDefined.length, totalResolves = allResolves.length;k<totalDefined;k++){
			var definedData = allDefined[k];
			var definedClassPath = definedData.classPath;
			for(var j=0;j<totalResolves;j++){
				var resolveData = allResolves[j];
				if(!resolveData.resolved){
					var resolveClassPath = resolveData.classPath;
					if(resolveClassPath == definedClassPath){
						testCallback( resolveData.handler, [definedData.result], resolveData.context );
						resolveData.resolved = true;
					}
				}
			}
		}
	}

	function testResolveDefined(defineData){
		var definedDependenciesCount = 0;
		var dependencies = defineData.dependencies;
		var totalDependencies = dependencies.length;
		var totalDefined = allDefined.length;
		var dependenciesArray = [];
		for(var k=0; k<totalDependencies; k++){
			var dependencyClassPath = dependencies[k];
			for(var j=0; j<totalDefined; j++){
				var defined = allDefined[j];
				var definedClassPath = defined.classPath;
				if(definedClassPath == dependencyClassPath){
					definedDependenciesCount++;
					dependenciesArray.push(defined.result);
				}
			}
		}
		if(definedDependenciesCount == totalDependencies){

			//console.log(' + Resolved ' + defineData.classPath );

			defineData.defined = true;
			defineData.result = defineData.targetPath[defineData.className] = testCallback( defineData.handler, dependenciesArray, null );
			allDefined.push(defineData);
			testResolveHandlers();
			testResolveDefines();
		}
	}

	function testResolveDefines(){
		var totalDefines = allDefines.length;
		for(var k=0; k<totalDefines; k++){
			var defineData = allDefines[k];
			if(!defineData.defined){
				testResolveDefined(defineData);
			}
		}
	}

	Class.define = function( classPath, dependencies, handler ){

		//console.log('Added definition: ' + classPath );

		lastDefinedClassPath = classPath;

		var classPathArray = classPath.split('.');
		var className = classPathArray.pop();

		if(className == ''){
			throw new Error('Hauts.Class.define must have className argument');
		}
		if(isFunction(dependencies)){
			handler = dependencies;
			dependencies = [];
		}
		var pathArrayLength = classPathArray.length;
		var targetPath = factory;
		for (var k = 0; k < pathArrayLength; k++) {
			var name = classPathArray[k];
			if(name != ''){
				targetPath[name] = targetPath = targetPath[name] || createNamedObject( name );
			}
		}
		allDefines.push({
			defined: false,
			classPath: classPath,
			targetPath: targetPath,
			className: className,
			dependencies: dependencies,
			handler: handler
		});
		testResolveDefines();
	}
	Class.resolve = function( classPath, handler, context ){
		if(isFunction(classPath)){
			context = handler;
			handler = classPath;
			classPath = lastDefinedClassPath;
		}
		allResolves.push({ resolved: false, classPath: classPath, handler: handler, context: context })
		testResolveHandlers()
	}

	// Exports
	Hauts.Class = Class;
})(this);