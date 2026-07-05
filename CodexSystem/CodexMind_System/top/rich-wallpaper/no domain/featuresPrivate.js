(function(require, requireNative, loadScript, exports, console, privates, apiBridge, bindingUtil, getInternalApi, $Array, $Function, $JSON, $Object, $RegExp, $String, $Error, $Promise) {'use strict';// Copyright (C) 2023 Opera Norway AS. All rights reserved.
//
// This file is an original work developed by Opera

const binding =
    apiBridge || require('binding').Binding.create('featuresPrivate');
const featuresPrivateNatives = requireNative('featuresPrivate');

binding.registerCustomHook(bindingsAPI => {
  const apiFunctions = bindingsAPI.apiFunctions;
  apiFunctions.setHandleRequest(
      'isFeatureEnabled',
      name => featuresPrivateNatives.isFeatureEnabled(name));
});

if (!apiBridge) {
  exports.$set('binding', binding.generate());
}

})