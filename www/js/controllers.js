angular.module('starter.controllers', [])

.controller('LoginCtrl', function($scope, ngFB, $state) {
  $scope.fbLogin = function() {
    ngFB.login({scope: 'email'}).then(
      function (response) {
        if (response.status === 'connected') {
          console.log('Facebook login succeeded', response);
          $scope.closeLogin();
        } else {
          alert('Facebook login failed');
        }
    });
  };
  $scope.closeLogin = function() {
    $state.go('tab.account');
  };
})

.controller('DashCtrl', function($scope) {})

.controller('ChatsCtrl', function($scope, Chats) {
  $scope.chats = Chats.all();
  $scope.remove = function(chat) {
    Chats.remove(chat);
  }
})

.controller('ChatDetailCtrl', function($scope, $stateParams, Chats) {
  $scope.chat = Chats.get($stateParams.chatId);
})

.controller('AccountCtrl', function($scope, ngFB) {
  ngFB.api({
    path: '/me',
    params: {fields: 'id,name'}
  }).then(
    function (user) {
      $scope.user = user;
    },
    function (error) {
      alert('Facebook error: ' + error.error_description);
    }
  );
});
