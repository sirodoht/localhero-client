angular.module('starter.controllers', [])

.controller('LoginCtrl', function($scope, $state, $http, ngFB, Users, Settings) {
  $scope.fbLogin = function() {
    ngFB.login({scope: 'email'}).then(
      function (response) {
        if (response.status === 'connected') {
          console.log('Facebook login succeeded', response);

          ngFB.api({
            path: '/me',
            params: {fields: 'id,name'}
          }).then(
            function (fbUser) {

              Users.get({id: fbUser.id}, function(data, status) {
                console.log('Got local user.', data);
                // User exists
                var user = new Users(data);
                Settings.user = user;
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
    $state.go('tab.account');
  };
})

.controller('DashCtrl', function($scope) {})

.controller('RequestsCtrl', function($scope, $ionicModal, Requests, Settings) {
  $scope.requests = Requests.query();
  var _req = {
    user_id: Settings.user.id
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

.controller('ChatDetailCtrl', function($scope, $stateParams, Chats) {
  $scope.chat = Chats.get($stateParams.chatId);
})

.controller('AccountCtrl', function($scope, $rootScope, ngFB, Settings, Users) {
  $scope.abilities = ['one', 'two', 'three'];
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
