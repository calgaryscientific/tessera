/*
 Tessera - A 3-way data-binding module for AngularJS and PureWeb
 Copyright (c) 2014 Calgary Scientific Inc., http://www.calgaryscientific.com/pureweb
 License: Apache 2.0 (see LICENSE)
*/
'use strict';

angular.module('tessera', [])
    .service('$tessera', function() {
    	var paths = {};
    	
    	this.bind = function(scope, prop, path, handler){
			if ((!scope) || (!prop) || (!path)){
				console.error('scope, prop, and path must all be defined on $tessera.bind()');
				return;
			}
			if (typeof scope[prop] === 'object'){
				this.bindObj_(scope, prop, path, handler);				
			}else if ((typeof scope[prop] === 'string') ||
					(typeof scope[prop] === 'number') ||
					(typeof scope[prop] === 'boolean')){
				this.bindVal_(scope, prop, path, handler);				
			}else{
				console.warn('I do not know how to bind ' + prop + ' because it is a: ', typeof scope[prop]);
			}
    	};

		this.bindVal_ = function(scope, prop, path, handler){			
			var bound = {
				handler: handler,
				property: prop,
				boundHandler: null,
				unlisten: null
			};		
			
			var appStateHandler = function(evt){
				var newVal = evt.getNewValue();
				if (scope[prop] !== newVal){
					scope[prop] = newVal;
					scope.$apply();
				}
				if ((handler !== null) && (typeof handler !== 'undefined')){
					handler(evt);					
				}
			}
			bound.boundHandler = appStateHandler;
			pureweb.getFramework().getState().getStateManager().addValueChangedHandler(path, appStateHandler);
			
			bound.unlisten = scope.$watch(prop, function(newVal, oldVal){
				if (newVal === oldVal){
					return;
				}
				pureweb.getFramework().getState().setValue(path, newVal);
			});
			
			paths[path] = bound;
			return bound;
		};

		this.bindObj_ = function(scope, prop, path, handler){				
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
			
			bound.unlisten = scope.$watch(prop, function(newVal, oldVal){
				var obj = {};
				obj[prop] = newVal;
				pureweb.getFramework().getState().getStateManager().setTree(path, obj);
			}, true);
			
			paths[path] = bound;
			return bound;
		};

		this.unbind = function(scope, prop, path, handler){
			if ((!scope) || (!prop) || (!path)){
				console.error('prop, and path must all be defined on $tessera.bind()');
				return;
			}
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
			else if ((bound.handler !== null) && (typeof bound.handler !== 'undefined')){
				return bound.handler;
			}
		};	
	}	   
);