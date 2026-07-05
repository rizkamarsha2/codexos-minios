(function(require, requireNative, loadScript, exports, console, privates, apiBridge, bindingUtil, getInternalApi, $Array, $Function, $JSON, $Object, $RegExp, $String, $Error, $Promise) {'use strict';// Copyright (c) 2012 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file

apiBridge.registerCustomHook(function(bindingsAPI) {
  let apiFunctions = bindingsAPI.apiFunctions;
  apiFunctions.setCustomCallback(
      'getWallpaperBlobUri', function(callback, blobs) {
        if (blobs) {
          callback(URL.createObjectURL(blobs[0]));
        } else {
          callback();
        }
      });
});

})