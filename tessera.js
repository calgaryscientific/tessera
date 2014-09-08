'use strict';

angular.module('tessera', [])
    .service('$tessera', function() {
    	var paths = {};
		this.bind = function(scope, prop, path, handler){			
			var bound = {
				handler: handler,
				property: prop,
				unlisten: null
			};

			pureweb.getFramework().getState().getStateManager().addValueChangedHandler(path, function(evt){
				var newVal = evt.getNewValue();
				if (scope[prop] !== newVal){
					scope[prop] = newVal;
					scope.$apply();
				}
				if ((handler !== null) && (typeof handler !== 'undefined')){
					handler(evt);
				}
			});			
			
			bound.unlisten = scope.$watch(prop, function(newVal, oldVal){
				if (newVal === oldVal){
					return;
				}
				pureweb.getFramework().getState().setValue(path, newVal);
			});
			paths[path] = bound;
		};

		this.unbind = function(prop, path){
			var bound = paths[path];
			if ((bound !== null) && (typeof bound !== 'undefined')){
				if (typeof bound.unlisten === 'function'){
					bound.unlisten();
				}
			}
		};
	}	   
);