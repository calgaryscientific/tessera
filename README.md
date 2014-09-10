tessera
================

Tessera is an Angular module that provides three-way data-binding between Angular (DOM/Model) and PureWeb's AppState.  Changes made to any of the DOM/Model/AppState will be synchronized to the other two locations.

# Installation

```bower install tessera```

# Usage
Include the library:
```
<script src="/myApp/bower_components/tessera/tessera.js"></script>
```

Add the module to your main application:
```
angular
  .module('myApp', [
    'ngRoute',
    'tessera'
  ])
  .config(function ($routeProvider) {  
```

Reference the actual service in your controller:
```
angular.module('myApp')
  .controller('MainCtrl', function ($scope, $tessera) {
```
 
Specify the properties you want to bind to AppState:
```
$tessera.bind($scope, 'SharedMessage', '/SharedMessage');
```  

You can also unbind any bound property:
```
$tessera.unbind('SharedMessage', '/SharedMessage'); 
```

Finally, you can pass a traditional callback through for any PureWeb AppState changes, this will be called after the Angular digest loop:
```
var f = function(evt){var n = evt.getNewValue(); console.log(n);};
$tessera.bind($scope, 'ScribbleColor', '/ScribbleColor', f); 
```

If you want to unbind a property with a callback you must pass the callback into the unbind method to unregister the AppState callback.  If you unbind a property without passing the callback, the callback will be returned by unbind() and you can unregister the callback using traditional PureWeb methods (removeValueChangedHandler()).
  
# PureWeb

[The PureWeb platform](http://www.calgaryscientific.com/pureweb/) lets you expose your complex or graphics intensive application as a back end service so it can be hosted online and accessed from new interfaces on browsers and mobile devices.

## Author

Calgary Scientific Inc

## License

See the LICENSE file for more info.

