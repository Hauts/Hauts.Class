# Hauts.Class
\o

Please contact me in case you need some help via twitter http://twitter.com/inflashwetrust.

Note: code is NOT complete and need lots of optimisations and tests.

## Quick alias
```javascript
var Class = Hauts.Class;
```

## Creating class:
```javascript
// Unnamed class without props & methods
var myClass = Class(function(){
	// constructor
});
var instance = new myClass();
```
```javascript
// Unnamed class with props & methods
var myClass = Class(function(){
	// constructor
}, {
	// props
});
var instance = new myClass();
```
```javascript
// Named class with props & methods
var myClass = Class('ClassName', function(){
	// constructor
}, {
	// props
});
var instance = new myClass();
```

## Creating class example:
```javascript
var Animal = Class('Animal', function (name){
	this.name = name;
}, {
	sayHello: function(){
		console.log('Animal ' + this.name + ' says hello!');
	}
});

var myAnimal = new Animal('Mikky');
myAnimal.sayHello();

// Animal Mikky says hello!
```

## Class inheritance:
```javascript
// Simply unnamed SubClass extends unnamed BaseClass
var BaseClass = Class(function(){
	// BaseClass constructor
});
var SubClass = BaseClass.extend(function(){
	// SubClass constructor
});

var instance = new SubClass();
```
```javascript
// Named classes inheritance
var BaseClass = Class('BaseClass', function(){
	// BaseClass constructor
});
var SubClass = BaseClass.extend('SubClass', function(){
	// SubClass constructor
});

var instance = new SubClass();
```
```javascript
// Alternative way using Class.extendClass method
var BaseClass = Class('BaseClass', function(){
	// BaseClass constructor
});
var SubClass = Class.extendClass(BaseClass, function(){
	// SubClass constructor
});

var instance = new SubClass();
```
```javascript
// Also may extend 'hand-made' classes
function SomeFunction(){}
SomeFunction.prototype.someProperty = 123;

var SubClass = Class.extendClass(SomeFunction, function(){
	// SubClass constructor
});

var instance = new SubClass();
console.log(instance.someProperty);

// 123
```

## Working with .superClass:
```javascript
var BaseClass = Class(function(){
	this.someProperty = 1;
});
var SubClass = BaseClass.extend(function(){
	this.superClass();
	console.log(this.someProperty);
});

var instance = new SubClass();

// 1
```
```javascript
var BaseClass = Class(function (value){
	this.someProperty = value;
});
var SubClass = BaseClass.extend(function(){
	this.superClass(10);
	console.log(this.someProperty);
});

var instance = new SubClass();

// 10
```
```javascript
var BaseClass = Class(function(){}, {
	test: function(){
		this.someProperty = 100;
	}
});
var SubClass = BaseClass.extend(function(){
	this.superClass.test();
	console.log(this.someProperty);
});

var instance = new SubClass();

// 100
```
```javascript
var A = Class(function(){}, {
	test: function(){
		console.log('Class A test');
	}
});
var B = A.extend(function(){}, {
	test: function(){
		this.superClass.test();
		console.log('Class B test');
	}
});
var C = B.extend(function(){}, {
	test: function(){
		this.superClass.test();
		console.log('Class C test');
	}
});
var D = C.extend(function(){}, {
	test: function(){
		this.superClass.test();
		console.log('Class D test');
	}
});
var E = D.extend(function(){}, {
	test: function(){
		this.superClass.test();
		console.log('Class E test');
	}
});

var instance = new E();
instance.test();

// Class A test
// Class B test
// Class C test
// Class D test
// Class E test
```

## Working with instanceof:
```javascript
var A = Class(function(){});
var B = A.extend(function(){});

var instance = new B();
console.log(instance instanceof A);
console.log(instance instanceof B);

// true
// true
```
```javascript
var A = Class(function(){});
var B = A.extend(function(){});
var C = B.extend(function(){});

var instance = new C();
console.log(instance instanceof A);
console.log(instance instanceof B);
console.log(instance instanceof C);

// true
// true
// true
```
## Working with instanceof and 'hand-made' classes:
```javascript
var A = function(){}
var B = Class.extendClass(A, function(){});

var instance = new B();
console.log(instance instanceof A);
console.log(instance instanceof B);

// false
// true
```
Forcing instanceof for 'hand-made' classes will launch constructors:
```javascript
var A = function(){
	console.log('A constructor');
}
var B = Class.extendClass(A, function(){}, null, true);

var instance = new B();
console.log(instance instanceof A);
console.log(instance instanceof B);

// A constructor
// true
// true
```