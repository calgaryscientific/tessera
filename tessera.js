/*
 Tessera - A 3-way data-binding module for AngularJS and PureWeb
 Copyright (c) 2014 Calgary Scientific Inc., http://www.calgaryscientific.com/pureweb
 License: Apache 2.0 (see LICENSE)
*/
'use strict';

angular.module('tessera', [])
    .service('$tessera', function() {
    	//Paths stores all the things we've bound (used for unbinding)
    	var paths = {};

    	//This will watch the scope.pureweb object for any changes 
    	//and auto bind to new properties
    	this.autoBind = function(scope, prop, on){
    		if (!scope){
    			console.error('scope must be defined for tessera.watch()');    			
    		}
    		if (!prop){
    			prop = 'pureweb';
    		}
    		if (on){
	    		if (!scope[prop]){
	    			scope[prop] = {};
	    		}
	    		var autoBindCb = function(newVal, oldVal){
	    			for (prop in newVal){
	    				if (newVal.hasOwnProperty(prop)){

	    				}
	    			}
	    		}
	    		$watch('pureweb', autoBindCb, true);

    		}
    	};

    	//User facing wrapper for binding
    	this.bind = function(scope, prop, path, handler){
			if ((!scope) || (!prop) || (!path)){
				console.error('scope, prop, and path must all be defined for tessera.bind()');
				return;
			}			
			if (typeof scope[prop] === 'object'){
				this.bindObj_(scope, prop, path, handler);				
			}else if ((typeof scope[prop] === 'string') ||
					(typeof scope[prop] === 'number') ||
					(typeof scope[prop] === 'boolean')){
				this.bindVal_(scope, prop, path, handler);				
			}else if (typeof scope[prop] === 'undefined'){
				scope[prop] = null;				
				console.warn(prop + ' is undefined on scope. It has been initialized to null');
				this.bindVal_(scope, prop, path, handler);
			}else{
				console.error('I do not know how to bind ' + prop + ' because it is a: ', typeof scope[prop]);
			}
    	};

    	//Internal method for binding values
		this.bindVal_ = function(scope, prop, path, handler){			
			var self = this;

			//Stores info about what was bound
			var bound = {
				handler: handler, //AppState handler use for removing appstate listeners(opt)
				property: prop, //Name of the property we're binding
				boundHandler: null, //The wrapped handler 
				unlisten: null //The angular unwatch method for this binding
			};		
			
			//This is the handler that is actually called when app state changes come in
			var appStateHandler = function(evt){
				var newVal = evt.getNewValue();
				//If the value from appstate is different than what angular has
				if (scope[prop] !== newVal){					
					scope[prop] = newVal;
					scope.$apply();
				}
				//If there was a pass through call back for appstate, call it
				if ((handler !== null) && (typeof handler !== 'undefined')){
					handler(evt);					
				}
			}
			bound.boundHandler = appStateHandler;
			//Listen on the path
			pureweb.getFramework().getState().getStateManager().addValueChangedHandler(path, appStateHandler);
			
			//This method is called when the value changes in Angular
			var CB = function(newVal, oldVal){			
				if (newVal === oldVal){
					return;
				}
				//Set the value in app state 
				pureweb.getFramework().getState().setValue(path, newVal);
			};
			//Debounce the set method so we don't cause event storms			
			var debouncyCB = self.debounce_(CB, 100);			
			bound.unlisten = scope.$watch(prop, debouncyCB);

			//Add this bind object to the paths object for later reference
			paths[path] = bound;
			return bound;
		};

		//Same as bindVal_ but for JS objects
		this.bindObj_ = function(scope, prop, path, handler){
			var self = this;		
			var bound = {
				handler: handler,
				property: prop,
				boundHandler: null,
				unlisten: null
			};		
			
			var appStateHandler = function(evt){
				var newVal = pureweb.getFramework().getState().getStateManager().getTree(path);
				if (path.indexOf('/') === 0){
					path = path.substring(1,path.length);
				}
				var setVal = newVal[path];
				scope[prop] = setVal;
				scope.$apply();

				if ((handler !== null) && (typeof handler !== 'undefined')){
					handler(evt);					
				}
			}
			bound.boundHandler = appStateHandler;
			pureweb.getFramework().getState().getStateManager().addChildChangedHandler(path, appStateHandler);
			

			var CB = function(newVal, oldVal){
				var obj = {};
				obj[prop] = newVal;
				pureweb.getFramework().getState().getStateManager().setTree(path, obj);
			};
			var debouncyCB = self.debounce_(CB, 100);				
			bound.unlisten = scope.$watch(prop, debouncyCB, true);
		
			paths[path] = bound;
			return bound;
		};

		/*
		* This implementation of debounce has been taken from 
		* the underscore project: http://underscorejs.org/#debounce
		* and lightly modified.
		*/
		this.debounce_ = function(func, wait, immediate) {
			var now = Date.now || function() {
  				return new Date().getTime();
			};		    
			var timeout, args, context, timestamp, result;

		    var later = function() {
		      var last = now() - timestamp;

		      if (last < wait && last > 0) {
		        timeout = setTimeout(later, wait - last);
		      } else {
		        timeout = null;
		        if (!immediate) {
		          result = func.apply(context, args);
		          if (!timeout) context = args = null;
		        }
		      }
		    };

		    return function() {
		      context = this;
		      args = arguments;
		      timestamp = now();
		      var callNow = immediate && !timeout;
		      if (!timeout) timeout = setTimeout(later, wait);
		      if (callNow) {
		        result = func.apply(context, args);
		        context = args = null;
		      }
		      return result;
		    };
		};

		//Unbind a appstate from angular
		this.unbind = function(scope, prop, path, handler){
			if ((!scope) || (!prop) || (!path)){
				console.error('prop, and path must all be defined on $tessera.bind()');
				return;
			}
			//If we have an unlisten method provided by angular.watch(), then call it
			var bound = paths[path];
			if ((bound !== null) && (typeof bound !== 'undefined')){
				if (typeof bound.unlisten === 'function'){
					bound.unlisten();
				}
			}

			//If you passed in an AppState handler, and it's one that's registered
			if ((handler !== null) && (typeof handler !== 'undefined') && (handler === bound.handler)){
				//Unregister it
				if (typeof scope[prop] === 'object'){
					pureweb.getFramework().getState().getStateManager().removeChildChangedHandler(path, bound.boundHandler);				
				}else{
					pureweb.getFramework().getState().getStateManager().removeValueChangedHandler(path, bound.boundHandler);				
				}
			} 
			//Else, if there is a handler registered for the thing you just unbound, pass it back.
			//This will allow you to directly remove the appstate handler using pureweb methods
			else if ((bound.handler !== null) && (typeof bound.handler !== 'undefined')){
				return bound.handler;
			}
		};	
	}	   
);