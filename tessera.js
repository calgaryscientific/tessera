'use strict';

angular.module('tessera', [])
    .service('$tessera', function() {
    	var unwatch = null;
		this.bind = function(scope, prop, path, handler){			
			pureweb.getFramework().getState().getStateManager().addValueChangedHandler(path, function(evt){
				var newVal = evt.getNewValue();
				if (scope[prop] !== newVal){
					scope[prop] = newVal;
					scope.$apply();
				}
				if ((handler !== null) && (typeof handler !== undefined)){
					handler(evt);
				}
			});
			
			unwatch = scope.$watch(prop, function(newVal, oldVal){
				if (newVal === oldVal){
					return;
				}
				pureweb.getFramework().getState().setValue(path, newVal);
			});
		};		
	}	   
);