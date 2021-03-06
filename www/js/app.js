// Ionic Starter App

// angular.module is a global place for creating, registering and retrieving Angular modules
// 'starter' is the name of this angular module example (also set in a <body> attribute in index.html)
// the 2nd parameter is an array of 'requires'
// 'starter.services' is found in services.js
// 'starter.controllers' is found in controllers.js
angular.module('starter', ['ionic', 'starter.controllers', 'starter.services', 'ngResource', 'ngOpenFB', 'ngSails', 'ngCordova', 'ngMap', 'ngStorage'])

.run(function($ionicPlatform, $state, ngFB) {
  $ionicPlatform.ready(function() {
    // Hide the accessory bar by default (remove this to show the accessory bar above the keyboard
    // for form inputs)
    if (window.cordova && window.cordova.plugins && window.cordova.plugins.Keyboard) {
      cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
    }
    if (window.StatusBar) {
      // org.apache.cordova.statusbar required
      StatusBar.styleLightContent();
    }

    ngFB.init({appId: '424732781033021'});

    $state.go('login');

  });
})

.service('Settings', function() {
  return {
    url: 'http://188.166.100.201',
    user: {}
  };
})

.service('Users', function($resource, Settings) {
  return $resource(Settings.url+'/user/:id', {id: '@id'}, {
    // charge: {method:'POST', params:{charge:true}}
   });
})

.service('Requests', function($resource, Settings) {
  return $resource(Settings.url+'/request/:id', {id: '@id'}, {
  });
})

.filter('sameAbilties', function(Settings) {
  return function(input, filter) {
    var userAbilities = Settings.user.abilities;
    // console.info(userAbilities);
    // console.info(input);
    var _requests = [];
    if (filter === true) {
      angular.forEach(input, function(request) {
        if (request.abilities && userAbilities) {
          for (var i = 0; i < userAbilities.length; i++) {
            for (var j = 0; j < request.abilities.length; j++) {
              if (request.abilities[j] === userAbilities[i]) {
                _requests.push(request);
              }
            }
          }
        }
      });
    } else {
      _requests = input;
    }
    return _requests;
  };
})

.config(function($stateProvider, $urlRouterProvider, $sailsProvider) {

  $sailsProvider.url = 'http://188.166.100.201:80';

  // Ionic uses AngularUI Router which uses the concept of states
  // Learn more here: https://github.com/angular-ui/ui-router
  // Set up the various states which the app can be in.
  // Each state's controller can be found in controllers.js
  $stateProvider

  // setup a login state
  .state('login', {
    url: '/login',
    templateUrl: 'templates/login.html',
    controller: 'LoginCtrl'
  })

  // setup an abstract state for the tabs directive
  .state('tab', {
    url: "/tab",
    abstract: true,
    templateUrl: "templates/tabs.html"
  })

  // Each tab has its own nav history stack:

  .state('tab.dash', {
    url: '/dash',
    cache: false,
    views: {
      'tab-dash': {
        templateUrl: 'templates/tab-dash.html',
        controller: 'DashCtrl'
      }
    }
  })

  .state('tab.requests', {
      url: '/requests',
      cache: false,
      views: {
        'tab-requests': {
          templateUrl: 'templates/tab-requests.html',
          controller: 'RequestsCtrl'
        }
      }
    })
    .state('tab.request-detail', {
      url: '/requests/:requestId',
      cache: false,
      views: {
        'tab-requests': {
          templateUrl: 'templates/request-detail.html',
          controller: 'RequestDetailCtrl'
        }
      }
    })

  .state('tab.account', {
    url: '/account',
    cache: false,
    views: {
      'tab-account': {
        templateUrl: 'templates/tab-account.html',
        controller: 'AccountCtrl'
      }
    }
  });


  // if none of the above states are matched, use this as the fallback
  $urlRouterProvider.otherwise('/login');

});
