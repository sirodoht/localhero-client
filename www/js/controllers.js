angular.module('starter.controllers', [])

.controller('LoginCtrl', function($scope, $rootScope, $state, $http, $cordovaGeolocation, $localStorage, $timeout, ngFB, Users, Settings) {
  $scope.fbLogin = function() {
    $rootScope.abilities = ['programming', 'engineering', 'gardening', 'knitting'];
    ngFB.login({scope: 'email'}).then(
      function (response) {
        if (response.status === 'connected') {
          console.log('Facebook login succeeded', response);

          ngFB.api({
            path: '/me',
            params: {fields: 'id,name,email'}
          }).then(
            function (fbUser) {
              fbUser.displayPicture = "http://graph.facebook.com/"+fbUser.id+"/picture?width=300&height=300";
              Users.get({id: fbUser.id}, function(data, status) {
                console.log('Got local user.', data);
                // User exists
                var user = new Users(data);
                angular.extend(user, fbUser);
                $rootScope.user = Settings.user = user;
                user.$save(function(){
                  var posOptions = {timeout: 10000, enableHighAccuracy: false};
                  $cordovaGeolocation
                  .getCurrentPosition(posOptions)
                  .then(function (position) {
                    user.location = {
                      latitude: position.coords.latitude,
                      longitude: position.coords.longitude
                    };
                    user.$save();
                  }, function(err) {
                    // error
                  });
                });
                $scope.closeLogin();
              }, function (_data, status) {
                console.error('No local user found. Creating.');
                // User does not exist
                // Users.save(fbUser, function (user) {
                //   console.log('Created new user.', user);
                // });
                $http.post(Settings.url+'/user', fbUser)
                .then(function (user) {
                  console.log('Created new user.', user);
                  Settings.user = user;
                  var posOptions = {timeout: 10000, enableHighAccuracy: false};
                  $cordovaGeolocation
                  .getCurrentPosition(posOptions)
                  .then(function (position) {
                    user.location = {
                      latitude: position.coords.latitude,
                      longitude: position.coords.longitude
                    };
                    user.$save();
                  }, function(err) {
                    // error
                  });

                  $scope.closeLogin();
                }, function(data, status) {
                  alert(data);
                });
              })

            },
            function (error) {
              alert('Facebook error: ' + error.error_description);
            }
          );


        } else {
          alert('Facebook login failed');
        }
    });
  };
  $scope.closeLogin = function() {
    if (!Settings.user.abilities) {
      Settings.user.abilities = [];
    }
    window.localStorage['user'] = JSON.stringify(Settings.user);
    $state.go('tab.account');
  };
  var _user = JSON.parse(window.localStorage['user'] || false);
  if (_user) {
    Settings.user = _user;
    $scope._user = _user;
    $timeout(function() {
      $state.go('tab.account');
    }, 200);
  }
})

.controller('DashCtrl', function($scope) {})

.controller('RequestsCtrl', function($scope, $ionicModal, Requests, Settings) {
  $scope.requests = Requests.query();
  var _req = {
    user_id: Settings.user.id,
    status: 'waiting',
    abilities: [],
    location: Settings.user.location,
    user: Settings.user
  };
  $scope.req = _req;
  $ionicModal.fromTemplateUrl('templates/modal-new-request.html', {
    scope: $scope,
    animation: 'slide-in-up'
  }).then(function(modal) {
    $scope.modal = modal;
  });
  $scope.openModal = function() {
    $scope.modal.show();
  };
  $scope.closeModal = function() {
    $scope.modal.hide();
  };
  //Cleanup the modal when we're done with it!
  $scope.$on('$destroy', function() {
    $scope.modal.remove();
  });
  // Execute action on hide modal
  $scope.$on('modal.hidden', function() {
    // Execute action
  });
  // Execute action on remove modal
  $scope.$on('modal.removed', function() {
    // Execute action
  });
  $scope.submit = function() {
    Requests.save($scope.req, function(data, status) {
      // Saved.
      $scope.closeModal();
      $scope.req = _req;
      $scope.requests = Requests.query();
    }, function (data, status) {
      alert(data);
    });
  };
})

.controller('RequestDetailCtrl', function($scope, $http, $state, $stateParams, $sails, Requests, Settings) {
  $http.get('https://api.justgiving.com/31da5a79/v1/charity/search').then(function(data, status) {
    console.info(data);
    angular.forEach(data.data.charitySearchResults, function(charity) {
      $scope.targets.push({id: charity.charityId, title: charity.name});
    });
  }, function(data, status) {

  });
  $scope.targets = [
    {id: 0, title: 'Myself'}
  ];
  $scope.messageToSend = "";
  $scope.request = Requests.get({id: $stateParams.requestId});
  $sails.on("request", function (message) {
    console.info(message);
    if (message.verb === "updated") {
      angular.extend($scope.request, message.data);
    }
  });
  $sails.get("/request/"+$stateParams.requestId)
  .success(function (data, status, headers, jwr) {
    // $scope.bars = data;
    console.info(data);
  })
  .error(function (data, status, headers, jwr) {
    alert('Houston, we got a problem!');
  });
  $scope.send = function(msg) {
    // var msg = $scope.messageToSend;
    console.info(msg);
    if ($scope.message == "") return;
    if (!$scope.request.messages) $scope.request.messages = [];
    $scope.request.messages.push({
      message: msg,
      name: Settings.user.name,
      user_id: Settings.user.id,
      displayPicture: "http://graph.facebook.com/"+Settings.user.id+"/picture?width=100&height=100",
      dt: new Date()
    });
    $scope.request.$save();
    $scope.messageToSend = "";
  }
  $scope.respond = function() {
    $scope.request.status = "inprogress";
    $scope.request.responder_id = Settings.user.id;
    $scope.request.responder = Settings.user;
    $scope.request.$save();
  }
  $scope.cancel = function() {
    $scope.request.canceled = true;
    $scope.request.$save(function(data, status){
      $state.go('tab.requests');
    }, function(data, status) {
      // TODO error
    });
  }
  $scope.cancelOffer = function() {
    $scope.request.status = "waiting";
    $scope.request.responder_id = null;
    $scope.request.$save(function(data, status){
      $state.reload();
    }, function(data, status) {
      // TODO error
    });
  }
  $scope.decline = function() {
    $scope.request.status = "waiting";
    $scope.request.responder_id = null;
    $scope.request.$save(function(data, status){
      $state.reload();
    }, function(data, status) {
      // TODO error
    });
  }
  $scope.complete = function() {
    $scope.request.canceled = true;
    $scope.request.$save(function(data, status){
      $state.go('tab.requests');
    }, function(data, status) {
      // TODO error
    });
  }
  $scope.pay = function() {
    $http.get(Settings.url+'/pay/'+$scope.request.id).then(function(data, status) {
      console.info(data);
      if (data.data!=false) {
        // console.info('!!');
        window.location = data.data;
      }
    }, function(data, status) {

    });
    // $scope.request.canceled = true;
    // $scope.request.$save(function(data, status){
    //   $state.go('tab.requests');
    // }, function(data, status) {
    //   // TODO error
    // });
  }
  $scope.donate = function() {
    window.location = 'http://www.justgiving.com/4w350m3/donation/direct/charity/'+$scope.request.target+'?currency=EUR&amount='+$scope.paymentSuggested;
    // $scope.request.canceled = true;
    // $scope.request.$save(function(data, status){
    //   $state.go('tab.requests');
    // }, function(data, status) {
    //   // TODO error
    // });
  }
})

.controller('AccountCtrl', function($scope, $rootScope, ngFB, Settings, Users) {
  $scope.user = Settings.user;
  $scope.addAbility = function(ability) {
    Settings.user.abilities.push(ability);
  }
  $scope.removeAbility = function(ability) {
    var index = Settings.user.abilities.indexOf(ability);
    Settings.user.abilities.splice(index, 1);
  }
  $scope.toggleSelection = function toggleSelection(ability) {
    var idx = Settings.user.abilities.indexOf(ability);
    if (idx > -1) {
      Settings.user.abilities.splice(idx, 1);
    } else {
      Settings.user.abilities.push(ability);
    }
    Settings.user.$save();
  };
});
