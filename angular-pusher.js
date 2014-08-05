/**
 * Copyright (c) 2014 Brian Woodward.
 * Licensed under the MIT License (MIT).
 */

/**
 * This code and some of the ideas in the code are inspired by the following
 * article from "25 days of AngularJS Calendar | 2013"
 * http://www.ng-newsletter.com/advent2013/#!/day/17
 */

'use strict';

angular.module('msfrisbie.angular-pusher', [])

// create a provider that loads the pusher script from a cdn
.provider('PusherService', function () {
  var scriptUrl = '//js.pusher.com/2.2/pusher.min.js';
  var scriptId = 'pusher-sdk';

  this.setPusherUrl = function (url) {
    if(url) scriptUrl = url;
    return this;
  };

  // load the pusher api script async
  function createScript ($document, callback, success ) {
    var tag = $document.createElement('script');
    tag.type = 'text/javascript';
    tag.async = true;
    tag.id = scriptId;
    tag.src = scriptUrl;

    tag.onreadystatechange = tag.onload = function () {
      var state = tag.readState;
      if (!callback.done && (!state || /loaded|complete/.test(state))) {
        callback.done = true;
        callback();
      }
    };

    $document.getElementsByTagName('head')[0].appendChild(tag);
  }

  this.$get = ['$document', '$timeout', '$q', '$rootScope', '$window', '$location',
    function ($document, $timeout, $q, $rootScope, $window, $location) {
      var deferred = $q.defer();

      var onScriptLoad = function (callback) {
        $timeout(function () {
          deferred.resolve();
        });
      };

      createScript($document[0], onScriptLoad);
      return deferred.promise;
    }];

})

.factory('Pusher', ['$rootScope', '$window', 'PusherService',
  function ($rootScope, $window, PusherService) {

    var pusher;

    return {
      // if you forget to initialize, oh well
      initialize: function(apiKey, initOptions) {
        PusherService.then(function() {
          pusher = new $window.Pusher(apiKey, initOptions)
        })
      },

      subscribe: function (channelName, eventName, callback) {
        PusherService.then(function () {
          var channel = pusher.channel(channelName) || pusher.subscribe(channelName);
          channel.bind(eventName, function (data) {
            if (callback) callback(data);
            // only use $rootScope for event bus
            $rootScope.$emit(channelName + ':' + eventName, data);
            // $rootScope.$digest();
          });
        });
      },

      unsubscribe: function (channelName) {
        PusherService.then(function () {
          pusher.unsubscribe(channelName);
        });
      }
    };
  }
]);
