// Hauts.Class
// 13.10.2015
// Hauts
// https://github.com/Hauts/Hauts.Class
;(function( factory ){
	factory.Hauts = factory.Hauts || new (function Hauts(){})();
	var Hauts = factory.Hauts;

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

		CLASS_COUNTER = 0,
		INNER_INITIALIZATION = false

	var Class = function(className, classConstructor, classPrototype, staticProperties, useDeepMode){
		return Class.create( className, classConstructor, classPrototype, staticProperties, useDeepMode );
	}
	Class.create = function(className, classConstructor, classPrototype, staticProperties, useDeepMode){
		return Class.extend( null, className, classConstructor, classPrototype, staticProperties, useDeepMode );
	}

	Class.useDeepMode = function( state ){
		if(typeof state != UN){ USE_DEEP_MODE = !!state; }
		return USE_DEEP_MODE;
	}

	// Internal helpers
	function copy( from, to ){ for(var i in from){ to[i] = from[i]; } }
	function testReserved( name ){ return name==SC || name==EX || name==IO || name==CN; }
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

	Class.extend = function( parentClass, className, classConstructor, classPrototype, staticProperties, useDeepMode ){

		parentClass = typeof parentClass != FN ? DUMMY : parentClass;

		if(typeof className == FN){
			staticProperties = classPrototype;
			classPrototype = classConstructor;
			classConstructor = className;
			className = createName();

		} else if(typeof className == ST){
			if(typeof classConstructor != FN){
				staticProperties = classPrototype;
				classPrototype = classConstructor;
				classConstructor = DUMMY;
			}
		} else if(typeof className == OB){
			staticProperties = classPrototype;
			classPrototype = className;
			classConstructor = DUMMY;//function(){};
			className = createName();

		} else if( typeof className == UN){
			className = createName();
		}

		if(typeof classConstructor == UN){
			classConstructor = DUMMY;
		} else {
			if(typeof classConstructor != FN){
				throw new Error('classConstructor must be a Function');
			}
		}
		classPrototype = typeof classPrototype == UN ? EMPTY : classPrototype;
		staticProperties = typeof staticProperties == UN ? EMPTY : staticProperties;

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
							parentClass.apply( instance, arguments );
						instance.superClass = origSuperClass;

					if(!skipRestore){
						superClassInAction = false;
					}
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
							var result = method.apply( instance, arguments );
						instance.superClass = currentSuperClass;

					if(!skipRestore){
						superClassInAction = false;
					}
					return result;
				}
				wrapper.isInherited = method.isInherited;
				return wrapper;				
			}
			function wrapSuperClassMethods( holder, superClassPrototype, replaceContext ){
				for(var i in superClassPrototype){
					if( !testReserved( i ) ){
						var prop = superClassPrototype[i];
						if( typeof prop == FN ){
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
					return method.apply(context, arguments);
				}
				wrapper.isWrapper = true;
				wrapper.isInherited = method.isInherited;
				return wrapper;
			}
			for(var i in instance){
				if( !testReserved( i ) ){
					var prop = instance[i];
					if(typeof prop == FN){
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
				classConstructor.apply( this, arguments );
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
				console.error('Could not eval class constructor function with source code: \n'+ classWrapperCode);
			}
		}

		// Copy parentClass prototype
		useDeepMode = typeof useDeepMode == UN ? USE_DEEP_MODE : !!useDeepMode;
		if(USE_DEEP_MODE && useDeepMode){
			INNER_INITIALIZATION = true;
				classWrapper.prototype = new parentClass();
			INNER_INITIALIZATION = false;
		} else {
			copy( parentClassPrototype, classWrapper.prototype );
		}

		// Overwrite with new classPrototype object props
		copy( classPrototype, classWrapper.prototype )
		
		if(parentClass != DUMMY){
			for(var i in classWrapper.prototype){
				if( !testReserved( i ) ){
					var prop = classWrapper.prototype[i];
					if(typeof prop == FN){
						if(typeof classPrototype[i] == UN){
							classWrapper.prototype[i] = eval('('+FN+'(){'+RT+' '+FN+'(){'+RT+' '+TH+'.'+SC+'.'+i+'.apply('+TH+',arguments);}})()');
							classWrapper.prototype[i].isInherited = true;
						}
					}
				}
			}
		}

		// Add static properties
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
					if(typeof classWrapper.superClass.instanceOf == FN){
						return classWrapper.superClass.instanceOf( testClass );
					}
				}
			}
			return false;
		}

		if(Object.defineProperty){
			Object.defineProperty(classWrapper, SC, {writable: false, value: parentClass});

			var classNameProps = {writable: false, value: className};
				Object.defineProperty(classWrapper, CN, classNameProps);
				Object.defineProperty(classWrapper.prototype, CN, classNameProps);

			var extendProps = { writable: false, value: classWrapper.extend };
				Object.defineProperty(classWrapper, EX, extendProps);
				Object.defineProperty(classWrapper.prototype, EX, extendProps);

			var instanceOfProps = { writable: false, value: classWrapper.instanceOf };
				Object.defineProperty(classWrapper, IO, instanceOfProps);
				Object.defineProperty(classWrapper.prototype, IO, instanceOfProps);
		}
		return classWrapper;
	}

	// Exports
	Hauts.Class = Class;
})(this);