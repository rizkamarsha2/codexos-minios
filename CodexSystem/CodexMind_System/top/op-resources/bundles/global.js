// Copyright (C) 2017 Opera Software AS.  All rights reserved.
//
// This file is an original work developed by Opera Software AS

'use strict';

const async = fn => setTimeout(fn, 1);

function generateUUID4() {
  let uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.split('');
  for (let i = 0; i < uuid.length; i++) {
    if (uuid[i] === 'x') {
      uuid[i] = Math.floor(Math.random() * 16).toString(16);
    } else if (uuid[i] === 'y') {
      uuid[i] = (8 + Math.floor(Math.random() * 3)).toString(16);
    }
  }
  return uuid.join('');
}

// Copyright (C) 2017 Opera Software AS.  All rights reserved.
//
// This file is an original work developed by Opera Software AS

'use strict';

{
  const localFetch = request => new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open(request.method, request.url);
    xhr.onload = () => resolve(new Response(xhr.response, {
      status: xhr.status,
      statusText: xhr.statusText,
    }));
    xhr.onerror = () => reject();
    xhr.responseType = 'blob';
    xhr.send();
  });

  const defaultFetch = window.fetch;
  /* eslint-disable space-before-function-paren */
  window.fetch = async (input, init, strategy = [0]) => {
    const sleep = millis => new Promise(resolve => setTimeout(resolve, millis));
    const fetchResource = async () => {
      const request =
          typeof input === 'string' ? new Request(input, init) : input;
      if (request.url.startsWith('chrome')) {
        return localFetch(request);
      }
      return defaultFetch(input, init);
    };
    let response, error;
    for (const delay of strategy) {
      await sleep(delay * 1000);
      try {
        response = await fetchResource();
        if (response.ok) {
          return response;
        }
        error = null;
      } catch (e) {
        error = e;
      }
    }
    if (error) {
      throw error;
    }
    return response;
  };
  /* eslint-enable space-before-function-paren */
}

// Copyright (C) 2017 Opera Software AS.  All rights reserved.
//
// This file is an original work developed by Opera Software AS
if (!Function.prototype.asPromise) {
  Object.defineProperty(Function.prototype, 'asPromise', {
    configurable: false,
    enumerable: false,
    writeable: false,
    value: function(...args) {
      const resolveIndex = args.findIndex(arg => arg === Promise.resolve);
      const rejectIndex = args.findIndex(arg => arg === Promise.reject);
      return new Promise((resolve, reject) => {
        const finalResolve = (...args) => {
          // Can by api call so need to catch lastError
          if (chrome && chrome.runtime && chrome.runtime.lastError) {
            reject(chrome.runtime.lastError);
          } else {
            // can have more than one arg then return array
            if (args.length > 1) {
              resolve(args);
            } else {
              resolve(...args);
            }
          }
        };

        if (resolveIndex !== -1) {
          args.splice(resolveIndex, 1, finalResolve);
        } else {
          args.push(finalResolve);
        }

        if (rejectIndex !== -1) {
          args.splice(rejectIndex, 1, reject);
        }

        try {
          this(...args);
        } catch (e) {
          reject(e);
        }
      });
    },
  });
}

// Copyright (C) 2017 Opera Software AS.  All rights reserved.
//
// This file is an original work developed by Opera Software AS

Object.freezeDeep = obj => {
  Object.keys(obj).forEach(name => {
    if (typeof obj[name] === 'object' && obj[name] !== null) {
      Object.freezeDeep(obj[name]);
    }
  });
  return Object.freeze(obj);
};

Object.copyDeep = obj => {
  let copy = Object.assign({}, obj);
  Object.keys(copy).forEach(name => {
    if (typeof obj[name] === 'object' && obj[name] !== null) {
      copy[name] = Object.copyDeep(copy[name]);
    }
  });
  return copy;
};

// Copyright (C) 2017 Opera Software AS.  All rights reserved.
//
// This file is an original work developed by Opera Software AS

Promise.external = () => {
  let promiseResolve;
  let promiseReject;
  const promise = new Promise((resolve, reject) => {
    promiseResolve = resolve;
    promiseReject = reject;
  });

  promise.resolve = promiseResolve;
  promise.reject = promiseReject;
  return promise;
};

Promise.queue = () => {
  let last = Promise.resolve();
  const push = next => { last = last.then(next); };

  return {push};
};

// Copyright (C) 2017 Opera Software AS.  All rights reserved.
//
// This file is an original work developed by Opera Software AS

Storage.prototype.setJSONItem = function(key, value) {
  try {
    this[key] = JSON.stringify(value);
  } catch (e) {
    this[key] = value;
  }
};

Storage.prototype.getJSONItem = function(key) {
  let val;
  try {
    val = JSON.parse(this[key]);
  } catch (e) {
    val = this[key];
  }
  return val;
};

// Copyright (C) 2017 Opera Software AS.  All rights reserved.
//
// This file is an original work developed by Opera Software AS

Document.prototype.ready = () => {
  if (/complete|interactive/.test(document.readyState)) {
    return Promise.resolve();
  }
  return new Promise(
      resolve => this.addEventListener('DOMContentLoaded', resolve));
};

Object.defineProperty(Document.prototype, 'deepActiveElement', {
  configurable: false,
  enumerable: false,
  get: function() {
    let activeElement = document.activeElement;
    while (activeElement.shadowRoot) {
      activeElement = activeElement.shadowRoot.activeElement;
    }
    return activeElement;
  },
});

// Copyright (C) 2019 Opera Software AS.  All rights reserved.
//
// This file is an original work developed by Opera Software AS

Element.prototype.getRect = function() {
  const rect = this.getBoundingClientRect();
  return {
    width: rect.width,
    height: rect.height,
    top: rect.top,
    left: rect.left,
    bottom: rect.bottom,
    right: rect.right,
    center: {
      x: parseInt(rect.left + rect.width / 2),
      y: parseInt(rect.top + rect.height / 2),
    },
  };
};

// Copyright (C) 2016 Opera Software AS.  All rights reserved.
//
// This file is an original work developed by Opera Software AS

if (!Event.prototype.getDeepTarget) {
  Event.prototype.getDeepTarget = function() {
    return this.composedPath()[0];
  };
}

{
  let tab = false;

  document.addEventListener('keydown', event => {
    tab = event.code === 'Tab';
  });
  document.addEventListener('keyup', event => {
    tab = false;
  });

  Object.defineProperty(FocusEvent.prototype, 'tab', {
    get: () => tab,
  });
}

// Copyright (C) 2015 Opera Software AS.  All rights reserved.
//
// This file is an original work developed by Opera Software AS

String.prototype.snakeCaseToCamelCase = function() {
  return this.toLowerCase().replace(/(_\w)/g, m => m[1].toUpperCase());
};

String.prototype.snakeCaseToCssCase = function() {
  return this.toLowerCase().replace(/_/g, '-');
};

// Copyright (C) 2017 Opera Software AS.  All rights reserved.
//
// This file is an original work developed by Opera Software AS

'use strict';

{
  let getDeclaration = (sheet, selector, filter = null) => {
    try {
      if (sheet.cssRules && sheet.cssRules.length) {
        for (let rule of Array.from(sheet.cssRules)) {
          switch (rule.type) {
            case CSSStyleRule.STYLE_RULE:
              if ((rule.selectorText === selector ||
                   (rule.selectorText.includes(selector) &&
                    rule.selectorText.split(/\s*,\s*/g).includes(selector))) &&
                  (!filter || filter(rule))) {
                return rule.style;
              }
              break;

            case CSSStyleRule.IMPORT_RULE: {
              let style = getDeclaration(rule.styleSheet, selector, filter);
              if (style) {
                return style;
              }
              break;
            }
          }
        }
      }
    } catch (exception) {
      if(exception.name !== "SecurityError") {
          throw exception;
      }
    }
  };

  StyleSheetList.prototype.getDeclaration = function(selector, filter = null) {
    for (let sheet of Array.from(this)) {
      let style = getDeclaration(sheet, selector, filter);
      if (style) {
        return style;
      }
    }
    return null;
  };

  StyleSheetList.prototype.getPropertyOfDeclaration = function(
      selector, propertyName) {
    const filter = rule => rule.style.getPropertyValue(propertyName) !== '';
    for (const sheet of Array.from(this)) {
      const style = getDeclaration(sheet, selector, filter);
      if (style) {
        return style.getPropertyValue(propertyName).trim();
      }
    }
    return '';
  };

  StyleSheetList.prototype.getUrlOfDeclaration = function(
      selector, propertyName) {
    const value = this.getPropertyOfDeclaration(selector, propertyName);
    const match = /url(?:\(['"]?)(.*?)(?:['"]?\))/g.exec(value);
    return match ? match[1].replace(/\\/g, '') : '';
  };
}

// Copyright (C) 2017 Opera Software AS.  All rights reserved.
//
// This file is an original work developed by Opera Software AS

/**
 * Alter a Text node to replace the escaped attributeless elements by their
 * corresponding HTMLElement, and replace the substrings $$ and $1 to $9 by the
 * either a single $ or the first to nineth arguments if they are HTMLElements
 * @param {...string} The extra values to include in the formatted output.
 */
Text.prototype.stringF = function process() {
  // replace attributeless elements.
  const matchMarkup = this.data.match(/<(\w+)>/i);
  if (matchMarkup) {
    const markup = matchMarkup[0];
    const nodeName = matchMarkup[1];
    let pos = this.data.indexOf(markup);
    const next = this.splitText(pos);
    next.deleteData(0, markup.length);
    const element = document.createElement(nodeName);

    // closing markup
    pos = next.data.indexOf(`</${nodeName}>`);
    if (pos > -1) {
      // set and process the Text of the element
      if (pos) {
        element.textContent = next.substringData(0, pos);
        // process the textcontent of the element
        process.apply(element.firstChild, arguments);
      }
      // trim the sibling Text accordingly
      next.deleteData(0, pos + markup.length + 1);  // +1 for the "/"
    }

    // insert the element
    next.before(element);
    // process the sibling Text
    process.apply(next, arguments);
  }

  // replace the $$ and $1-9
  const matchPlaceholder = this.data.match(/\$([$1-9])/i);
  if (matchPlaceholder) {
    const placeholder = matchPlaceholder[0];
    let value = matchPlaceholder[1];
    const pos = this.data.indexOf(placeholder);
    const next = this.splitText(pos);
    next.deleteData(0, placeholder.length);

    if (value === '$') {
      // Append the $ to the current Text
      this.appendData('$');
    } else {
      // insert a clone of the corresponding element if it exists
      value = Number(value) - 1;
      const replacement = arguments[value];
      if (replacement instanceof HTMLElement) {
        next.before(replacement.cloneNode(true));
      } else if (typeof replacement === 'string') {
        next.before(document.createTextNode(replacement));
      }
    }

    // process the sibling Text
    process.apply(next, arguments);
  }
};


// Copyright (C) 2019 Opera Software AS.  All rights reserved.
//
// This file is an original work developed by Opera Software AS

window.esImport = async (path, exports = 'default') => {
  const module = (await import(loader.path(path)))[exports];
  if (module) {
    if (typeof module.init === 'function') {
      await module.init();
    }
    return module;
  }
  return null;
};

// Copyright (C) 2022 Opera Norway AS. All rights reserved.
//
// This file is an original work developed by Opera.

function formatUnits(
    input_value, units, multiplier, precision = 3, max_decimals = 1) {
  let unit_index = 0;
  let value = input_value;
  const max_value = Math.pow(10, precision);
  while (value >= max_value && unit_index <= units.length - 2) {
    unit_index++;
    value /= multiplier;
  }
  const roundedValue = parseFloat(
      parseFloat(value.toFixed(max_decimals)).toPrecision(precision));
  return [roundedValue, units[unit_index]];
}

const BYTE_UNITS = ['B', 'KB', 'MB', 'GB', 'TB'];
const BYTE_MULTIPLIER = 1024;

window.formatBytes = val => formatUnits(val, BYTE_UNITS, BYTE_MULTIPLIER);

// Copyright (C) 2023 Opera Norway AS. All rights reserved.
//
// This file is an original work developed by Opera.

if (!window.svgPolicy) {
  window.svgPolicy = trustedTypes.createPolicy('webui-inline-svg-policy', {
    createHTML: html => html,
  });
}


// -*- Mode: js; tab-width: 2; indent-tabs-mode: nil; c-basic-offset: 2 -*-

/**
 *    Copyright 2006 - 2015 Opera Software AS
 *
 *    Licensed under the Apache License, Version 2.0 (the "License");
 *    you may not use this file except in compliance with the License.
 *    You may obtain a copy of the License at
 *
 *        http://www.apache.org/licenses/LICENSE-2.0
 *
 *    Unless required by applicable law or agreed to in writing, software
 *    distributed under the License is distributed on an "AS IS" BASIS,
 *    WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *    See the License for the specific language governing permissions and
 *    limitations under the License.
 *
 **/

'use strict';

/**
 * @fileoverview
 * Color class
 */

/**
 * @constructor
 *
 *
 * @class
 * Represent a color. Allows for setting and getting color components based
 * on RGB, HSV and HSL color spaces.
 * See also http://en.wikipedia.org/Color_space
 */
window.Color = class Color {
  constructor(value, type) {
    this.red = 0;
    this.green = 0;
    this.blue = 0;
    this.hue = 0;
    this.saturation = 0;
    this.lightness = 0;
    this.saturationV = 0;
    this.value = 0;
    this.alpha = 1;
    this.rgb_ = null;
    this.rgba_ = null;
    this.hsl_ = null;
    this.hsla_ = null;
    this.hsv_ = null;
    this.hex_ = null;
    if (typeof value === 'string') {
      if (type === Color.HEX) {
        this.hex.set(value);
      } else {
        this.parseCSSColor(value);
      }
    }
    if (Array.isArray(value)) {
      switch (type) {
        case undefined:
        case Color.RGB:
          this.rgb.set(value);
          break;
        case Color.RGBA:
          this.rgba.set(value);
          break;
        case Color.HSL:
          this.hsl.set(value);
          break;
        case Color.HSLA:
          this.hsla.set(value);
          break;
        case Color.HSV:
          this.hsv.set(value);
          break;
      }
    }
  }

  parseCSSColor(input) {
    const host = document.head;
    host.style.setProperty('color', input, 'important');
    const raw = window.getComputedStyle(host).color;
    host.style.removeProperty('color');

    const rawArray = raw.split(/rgba?\(|,s*|\)$/).filter(Boolean);
    if (rawArray.length === 4) {
      this.alpha = parseFloat(rawArray.pop());
    }
    this.rgb.set(rawArray.map(Color.parseInt10));
  }

  get rgb() {
    if (!this.rgb_) {
      this.rgb_ = new RGBInterface(this);
    }
    return this.rgb_;
  }

  get rgba() {
    if (!this.rgba_) {
      this.rgba_ = new RGBAInterface(this);
    }
    return this.rgba_;
  }

  get hsl() {
    if (!this.hsl_) {
      this.hsl_ = new HSLInterface(this);
    }
    return this.hsl_;
  }

  get hsla() {
    if (!this.hsla_) {
      this.hsla_ = new HSLAInterface(this);
    }
    return this.hsla_;
  }

  get hsv() {
    if (!this.hsv_) {
      this.hsv_ = new HSVInterface(this);
    }
    return this.hsv_;
  }

  get hex() {
    if (!this.hex_) {
      this.hex_ = new HexInterface(this);
    }
    return this.hex_;
  }

  setRed(red) {
    this.red = Color.clamp(red, 0, 255);
    this.updateHslFromRgb();
    this.updateHsvFromHsl();
  }

  getRed() {
    return Math.round(Color.clamp(this.red, 0, 255));
  }

  setGreen(green) {
    this.green = Color.clamp(green, 0, 255);
    this.updateHslFromRgb();
    this.updateHsvFromHsl();
  }

  getGreen() {
    return Math.round(Color.clamp(this.green, 0, 255));
  }

  setBlue(blue) {
    this.blue = Color.clamp(blue, 0, 255);
    this.updateHslFromRgb();
    this.updateHsvFromHsl();
  }

  getBlue() {
    return Math.round(Color.clamp(this.blue, 0, 255));
  }

  setHue(hue) {
    this.hue = Color.clamp(hue, 0, 360);
    this.updateRgbFromHsl();
  }

  getHue() {
    return Math.round(Color.clamp(this.hue, 0, 360));
  }

  setSaturation(saturation) {
    this.saturation = Color.clamp(saturation, 0, 1);
    this.updateRgbFromHsl();
    this.updateHsvFromHsl();
  }

  getSaturation() {
    return Color.clamp(this.saturation, 0, 1);
  }

  setSaturationV(saturationV) {
    this.saturationV = Color.clamp(saturationV, 0, 1);
    this.updateHslFromHsv();
    this.updateRgbFromHsl();
  }

  getSaturationV() {
    return Color.clamp(this.saturationV, 0, 1);
  }

  setLightness(lightness) {
    this.lightness = Color.clamp(lightness, 0, 1);
    this.updateRgbFromHsl();
    this.updateHsvFromHsl();
  }

  getLightness() {
    return Color.clamp(this.lightness, 0, 1);
  }

  setValue(value) {
    this.value = Color.clamp(value, 0, 100);
    this.updateHslFromHsv();
    this.updateRgbFromHsl();
  }

  getValue() {
    return Color.clamp(this.value, 0, 1);
  }

  setAlpha(alpha) {
    this.alpha = Color.clamp(alpha, 0, 1);
  }

  getAlpha() {
    return Color.clamp(this.alpha, 0, 1);
  }

  getGreyValue() {
    return 0.2126 * this.red + 0.7152 * this.green + 0.0722 * this.blue;
  }

  invertHue() {
    this.setHue((this.hue + 180) % 360);
    return this;
  }

  // http://www.w3.org/TR/2008/REC-WCAG20-20081211/#relativeluminancedef
  getLuminance() {
    let RGB = this.rgb.get().map(c => {
      let cs = c / 255;
      return cs <= 0.03928 ? cs / 12.92 : Math.pow((cs + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * RGB[0] + 0.7152 * RGB[1] + 0.0722 * RGB[2];
  }

  // http://www.w3.org/TR/2008/REC-WCAG20-20081211/#contrast-ratiodef
  getContrastRatio(color2) {
    let l1 = this.getLuminance();
    let l2 = color2.getLuminance();
    return l1 > l2 ? (l1 + 0.05) / (l2 + 0.05) : (l2 + 0.05) / (l1 + 0.05);
  }

  updateHslFromRgb() {
    let red = this.red / 255;
    let green = this.green / 255;
    let blue = this.blue / 255;
    let maxColor = Math.max(red, green, blue);
    let minColor = Math.min(red, green, blue);
    let sum = maxColor + minColor;
    let delta = maxColor - minColor;
    this.hue = 0;
    this.saturation = 0;
    this.lightness = sum / 2;
    if (delta !== 0) {
      this.saturation = delta / (1 - Math.abs(sum - 1));
      delta = 60 / delta;
      switch (maxColor) {
        case red:
          this.hue = (360 + (green - blue) * delta) % 360;
          break;
        case green:
          this.hue = 120 + (blue - red) * delta;
          break;
        case blue:
          this.hue = 240 + (red - green) * delta;
          break;
      }
    }
  }

  updateRgbFromHsl() {
    let rgb1 = Color.hueToRgb(this.hue);
    let rgb2 = Color.mixRgbColors(rgb1, Color.GREY, 1 - this.saturation);
    let rgb3 = this.lightness <= 0.5 ? Color.BLACK : Color.WHITE;
    let mix = 1 - Math.abs(2 * this.lightness - 1);
    let rgb4 = Color.mixRgbColors(rgb3, rgb2, mix);
    this.red = rgb4[0];
    this.green = rgb4[1];
    this.blue = rgb4[2];
  }

  // http://codeitdown.com/hsl-hsb-hsv-color/
  updateHsvFromHsl() {
    let l = this.lightness;
    let v = (2 * l + this.saturation * (1 - Math.abs(2 * l - 1))) / 2;
    this.saturationV = (2 * (v - l)) / v || 0;
    this.value = v;
  }

  updateHslFromHsv() {
    let v = this.value;
    let sv = this.saturationV;
    let l = 0.5 * v * (2 - sv);
    this.saturation = (sv * v) / (1 - Math.abs(2 * l - 1)) || 0;
    this.lightness = l;
  }

  static clamp(val, min, max) {
    return Math.min(Math.max(val, min), max);
  }

  static mixRgbColors(c1Rgb, c2Rgb, m) {
    let rgb = [];
    for (let i = 0; i < 3; i++) {
      rgb[i] = c1Rgb[i] + m * (c2Rgb[i] - c1Rgb[i]);
    }
    return rgb;
  }

  static toPercent(value) {
    return `${Math.round(value * 100)}%`;
  }

  static hueToRgb(hue) {
    hue %= 360;
    let delta = hue % 60;
    hue -= delta;
    delta = Math.round((255 / 60) * delta);
    switch (hue) {
      case 0:
        return [255, delta, 0];
      case 60:
        return [255 - delta, 255, 0];
      case 120:
        return [0, 255, delta];
      case 180:
        return [0, 255 - delta, 255];
      case 240:
        return [delta, 0, 255];
      case 300:
        return [255, 0, 255 - delta];
    }
  }

  static parseInt10(i) {
    return parseInt(i, 10);
  }
};

Color.DEFAULT_COLOR = 'black';
Color.HEX = 1;
Color.RGB = 2;
Color.RGBA = 3;
Color.HSL = 4;
Color.HSLA = 5;
Color.BLACK = [0, 0, 0];
Color.WHITE = [255, 255, 255];
Color.GREY = [127.5, 127.5, 127.5];
Color.RE_HEX_6 = new RegExp('^[0-9a-fA-F]{6}$');
Color.RE_HEX_3 = new RegExp('^[0-9a-fA-F]{3}$');

// -*- Mode: js; tab-width: 2; indent-tabs-mode: nil; c-basic-offset: 2 -*-
//
// Copyright (C) 2016 Opera Software AS.  All rights reserved.
//
// This file is an original work developed by Opera Software AS

'use strict';

window.ColorUtils = class ColorUtils {
  static readValues(data, colorMap, neutralMap) {
    let color = this.getColor();
    for (let i = 0, r, g, b, a, key, map; i < data.length; i += 4) {
      a = data[i + 3];
      if (a === 255) {
        r = color.rgb.r = data[i + 0];
        g = color.rgb.g = data[i + 1];
        b = color.rgb.b = data[i + 2];
        if (color.hsv.s > ColorUtils.NEUTRAL_LIMIT &&
            color.hsv.v > ColorUtils.NEUTRAL_LIMIT) {
          map = colorMap;
          key = (color.hsl.h / ColorUtils.HUE_DELTA) | 0;
        } else {
          map = neutralMap;
          key = ((color.hsl.l * 100) / ColorUtils.LIGHTNESS_DELTA) | 0;
        }
        if (!map.has(key)) {
          map.set(key, []);
        }
        map.get(key).push(r, g, b, a);
      }
    }
  }

  static getBackgroundColor(img, customWidth, customHeight, config = {}) {
    const naturalWidth = customWidth || img.naturalWidth;
    const naturalHeight = customHeight || img.naturalHeight;

    if (!naturalWidth || !naturalHeight) {
      return null;
    }

    let testCtx = ColorUtils.testCanvasContext();
    testCtx.clearRect(0, 0, ColorUtils.MAX_DIM, ColorUtils.MAX_DIM);
    let width = naturalWidth;
    let height = naturalHeight;
    let max = Math.max(width, height);
    if (max > ColorUtils.MAX_DIM) {
      if (max === width) {
        width = ColorUtils.MAX_DIM;
        height =
            ((ColorUtils.MAX_DIM / (naturalWidth)) * (naturalHeight)) | 0;
      } else {
        width =
            ((ColorUtils.MAX_DIM / (naturalHeight)) * (naturalWidth)) | 0;
        height = ColorUtils.MAX_DIM;
      }
    }
    testCtx.drawImage(img, 0, 0, width, height);
    let colorMap = new Map();
    let neutralMap = new Map();

    const CONFIG = Object.assign({}, ColorUtils.DEFAULT_CONFIG, config);

    const {
      BORDER_TOP,
      BORDER_RIGHT,
      BORDER_BOTTOM,
      BORDER_LEFT,
    } = CONFIG;

    const hasLeft = BORDER_LEFT > 0;
    const hasTop = BORDER_TOP > 0;
    const hasRight = BORDER_RIGHT > 0;
    const hasBottom = BORDER_BOTTOM > 0;

    [hasLeft ? testCtx.getImageData(0, 0, BORDER_LEFT, height).data : [],
     hasTop ?
         testCtx
             .getImageData(
                 BORDER_LEFT, 0, width - BORDER_LEFT - BORDER_RIGHT, BORDER_TOP)
             .data :
         [],
     hasRight ?
         testCtx.getImageData(width - BORDER_RIGHT, 0, BORDER_RIGHT, height)
             .data :
         [],
     hasBottom ? testCtx
                     .getImageData(
                         BORDER_LEFT, height - BORDER_BOTTOM,
                         width - BORDER_LEFT - BORDER_RIGHT, BORDER_BOTTOM)
                     .data :
                 [],
    ].forEach(data => ColorUtils.readValues(data, colorMap, neutralMap));
    let max_color_length = 0;
    let max_neutral_length = 0;
    let max_colors = null;
    let max_neutrals = null;
    for (let cs of colorMap.values()) {
      if (cs.length > max_color_length) {
        max_color_length = cs.length;
        max_colors = cs;
      }
    }
    for (let cs of neutralMap.values()) {
      if (cs.length > max_neutral_length) {
        max_neutral_length = cs.length;
        max_neutrals = cs;
      }
    }

    let leftPixelsArea = BORDER_LEFT * height;
    let rightPixelsArea = BORDER_RIGHT * height;
    let topPixelsArea = (width - BORDER_LEFT - BORDER_RIGHT) * BORDER_TOP;
    let bottomPixelsArea = (width - BORDER_LEFT - BORDER_RIGHT) * BORDER_BOTTOM;
    let pixelTotal = 4 *
        (leftPixelsArea + rightPixelsArea + topPixelsArea + bottomPixelsArea);
    let selected_color = null;
    if (max_color_length > pixelTotal * ColorUtils.MIN_PERCENT_COLOR) {
      selected_color = max_colors;
    }
    let weighted_max_neutral_length =
        max_neutral_length * ColorUtils.PRIORITIZE_NEUTRAL_WEIGHT;

    if ((!selected_color || weighted_max_neutral_length > max_color_length)) {
      if (max_neutral_length > pixelTotal * ColorUtils.MIN_PERCENT) {
        selected_color = max_neutrals;
      } else {
        // 
      }
    }

    if (selected_color) {
      let r_sum = 0;
      let g_sum = 0;
      let b_sum = 0;
      for (let i = 0; i < selected_color.length; i += 4) {
        r_sum += selected_color[i + 0];
        g_sum += selected_color[i + 1];
        b_sum += selected_color[i + 2];
      }
      let l = selected_color.length / 4;
      let color = new Color();
      color.rgb.r = (r_sum / l) | 0;
      color.rgb.g = (g_sum / l) | 0;
      color.rgb.b = (b_sum / l) | 0;
      return color;
    }
    return null;
  }

  static getColor() {
    if (!this.color) {
      this.color = new Color();
    }
    return this.color;
  }

  static testCanvasContext() {
    if (!this.testCtx) {
      let canvas = document.createElement('canvas');
      canvas.width = ColorUtils.MAX_DIM;
      canvas.height = ColorUtils.MAX_DIM;
      this.testCtx = canvas.getContext('2d', {willReadFrequently: true});
    }
    return this.testCtx;
  }
};

ColorUtils.MAX_DIM = 100;
ColorUtils.MIN_PERCENT = 0.1;        // 0.25;
ColorUtils.MIN_PERCENT_COLOR = 0.3;  // 0.25;
ColorUtils.HUE_DELTA = 15;
ColorUtils.LIGHTNESS_DELTA = 100 / (360 / ColorUtils.HUE_DELTA);
ColorUtils.NEUTRAL_LIMIT = 0.1;
ColorUtils.PRIORITIZE_NEUTRAL_WEIGHT = 1.4;

ColorUtils.DEFAULT_CONFIG = {
  BORDER_TOP: 1,
  BORDER_RIGHT: 1,
  BORDER_BOTTOM: 1,
  BORDER_LEFT: 1,
};

// -*- Mode: js; tab-width: 2; indent-tabs-mode: nil; c-basic-offset: 2 -*-

/**
 *    Copyright 2006 - 2015 Opera Software AS
 *
 *    Licensed under the Apache License, Version 2.0 (the "License");
 *    you may not use this file except in compliance with the License.
 *    You may obtain a copy of the License at
 *
 *        http://www.apache.org/licenses/LICENSE-2.0
 *
 *    Unless required by applicable law or agreed to in writing, software
 *    distributed under the License is distributed on an "AS IS" BASIS,
 *    WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *    See the License for the specific language governing permissions and
 *    limitations under the License.
 *
 **/

'use strict';

window.HexInterface = class HexInterface {
  constructor(color) {
    this.color_ = color;
  }

  set(hex) {
    if (!(Color.RE_HEX_3.test(hex) || Color.RE_HEX_6.test(hex))) {
      throw Error('Not valid hex color');
    }
    if (Color.RE_HEX_3.test(hex)) {
      hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
    }
    let temp = parseInt(hex, 16);
    this.color_.rgb.set([temp >> 16, (temp >> 8) & 0xff, temp & 0xff]);
  }

  get(withAlpha = false) {
    let rgb = this.color_.rgba;
    if (withAlpha) {
      let hex = ((rgb.r * (1 << 24)) + (rgb.g << 16) + (rgb.b << 8) +
                 Math.round(rgb.a * 255))
                    .toString(16);
      return '0'.repeat(8 - hex.length) + hex;
    }
    let hex = ((rgb.r << 16) | (rgb.g << 8) | rgb.b).toString(16);
    return '0'.repeat(6 - hex.length) + hex;
  }

  toCss() {
    let hex = this.get();
    let isShort = true;
    for (let i = 0; i < 6 && isShort; i += 2) {
      isShort = hex[i] === hex[i + 1];
    }
    if (isShort) {
      hex = hex[0] + hex[2] + hex[4];
    }
    return `#${hex}`;
  }
};

// -*- Mode: js; tab-width: 2; indent-tabs-mode: nil; c-basic-offset: 2 -*-

/**
 *    Copyright 2006 - 2015 Opera Software AS
 *
 *    Licensed under the Apache License, Version 2.0 (the "License");
 *    you may not use this file except in compliance with the License.
 *    You may obtain a copy of the License at
 *
 *        http://www.apache.org/licenses/LICENSE-2.0
 *
 *    Unless required by applicable law or agreed to in writing, software
 *    distributed under the License is distributed on an "AS IS" BASIS,
 *    WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *    See the License for the specific language governing permissions and
 *    limitations under the License.
 *
 **/

'use strict';

window.HSLInterface = class HSLInterface {
  constructor(color) {
    this.color_ = color;
  }

  set h(h) {
    this.color_.setHue(h);
  }

  get h() {
    return this.color_.getHue();
  }

  set s(s) {
    this.color_.setSaturation(s);
  }

  get s() {
    return this.color_.getSaturation();
  }

  set l(l) {
    this.color_.setLightness(l);
  }

  get l() {
    return this.color_.getLightness();
  }

  get() {
    return [this.h, this.s, this.l];
  }

  set(hsl) {
    this.h = hsl[0];
    this.s = hsl[1];
    this.l = hsl[2];
  }

  toCss() {
    let s = Color.toPercent(this.s);
    let l = Color.toPercent(this.l);
    return `hsl(${this.h}, ${s}, ${l})`;
  }
};

// -*- Mode: js; tab-width: 2; indent-tabs-mode: nil; c-basic-offset: 2 -*-

/**
 *    Copyright 2006 - 2015 Opera Software AS
 *
 *    Licensed under the Apache License, Version 2.0 (the "License");
 *    you may not use this file except in compliance with the License.
 *    You may obtain a copy of the License at
 *
 *        http://www.apache.org/licenses/LICENSE-2.0
 *
 *    Unless required by applicable law or agreed to in writing, software
 *    distributed under the License is distributed on an "AS IS" BASIS,
 *    WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *    See the License for the specific language governing permissions and
 *    limitations under the License.
 *
 **/

'use strict';

window.HSLAInterface = class HSLAInterface extends HSLInterface {
  set a(a) {
    this.color_.setAlpha(a);
  }

  get a() {
    return this.color_.getAlpha();
  }

  get() {
    return [this.h, this.s, this.l, this.a];
  }

  set(hsla) {
    this.h = hsla[0];
    this.s = hsla[1];
    this.l = hsla[2];
    this.a = hsla[3];
  }

  toCss() {
    let s = Color.toPercent(this.s);
    let l = Color.toPercent(this.l);
    return `hsla(${this.h}, ${s}, ${l}, ${this.a})`;
  }
};

// -*- Mode: js; tab-width: 2; indent-tabs-mode: nil; c-basic-offset: 2 -*-

/**
 *    Copyright 2006 - 2015 Opera Software AS
 *
 *    Licensed under the Apache License, Version 2.0 (the "License");
 *    you may not use this file except in compliance with the License.
 *    You may obtain a copy of the License at
 *
 *        http://www.apache.org/licenses/LICENSE-2.0
 *
 *    Unless required by applicable law or agreed to in writing, software
 *    distributed under the License is distributed on an "AS IS" BASIS,
 *    WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *    See the License for the specific language governing permissions and
 *    limitations under the License.
 *
 **/

'use strict';

window.HSVInterface = class HSVInterface {
  constructor(color) {
    this.color_ = color;
  }

  set h(h) {
    this.color_.setHue(h);
  }

  get h() {
    return this.color_.getHue();
  }

  set s(s) {
    this.color_.setSaturationV(s);
  }

  get s() {
    return this.color_.getSaturationV();
  }

  set v(v) {
    this.color_.setValue(v);
  }

  get v() {
    return this.color_.getValue();
  }

  get() {
    return [this.h, this.s, this.v];
  }

  set(hsv) {
    this.h = hsv[0];
    this.s = hsv[1];
    this.v = hsv[2];
  }

  toCss() {
    return this.color_.hsl.toCss();
  }
};

// -*- Mode: js; tab-width: 2; indent-tabs-mode: nil; c-basic-offset: 2 -*-

/**
 *    Copyright 2006 - 2015 Opera Software AS
 *
 *    Licensed under the Apache License, Version 2.0 (the "License");
 *    you may not use this file except in compliance with the License.
 *    You may obtain a copy of the License at
 *
 *        http://www.apache.org/licenses/LICENSE-2.0
 *
 *    Unless required by applicable law or agreed to in writing, software
 *    distributed under the License is distributed on an "AS IS" BASIS,
 *    WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *    See the License for the specific language governing permissions and
 *    limitations under the License.
 *
 **/

'use strict';

window.RGBInterface = class RGBInterface {
  constructor(color) {
    this.color_ = color;
  }

  set r(r) {
    this.color_.setRed(r);
  }

  get r() {
    return this.color_.getRed();
  }

  set g(g) {
    this.color_.setGreen(g);
  }

  get g() {
    return this.color_.getGreen();
  }

  set b(b) {
    this.color_.setBlue(b);
  }

  get b() {
    return this.color_.getBlue();
  }

  get() {
    return [this.r, this.g, this.b];
  }

  set(rgb) {
    this.r = rgb[0];
    this.g = rgb[1];
    this.b = rgb[2];
  }

  toCss() {
    return `rgb(${this.r}, ${this.g}, ${this.b})`;
  }
};

// -*- Mode: js; tab-width: 2; indent-tabs-mode: nil; c-basic-offset: 2 -*-

/**
 *    Copyright 2006 - 2015 Opera Software AS
 *
 *    Licensed under the Apache License, Version 2.0 (the "License");
 *    you may not use this file except in compliance with the License.
 *    You may obtain a copy of the License at
 *
 *        http://www.apache.org/licenses/LICENSE-2.0
 *
 *    Unless required by applicable law or agreed to in writing, software
 *    distributed under the License is distributed on an "AS IS" BASIS,
 *    WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *    See the License for the specific language governing permissions and
 *    limitations under the License.
 *
 **/

'use strict';

window.RGBAInterface = class RGBAInterface extends RGBInterface {
  set a(a) {
    this.color_.setAlpha(a);
  }

  get a() {
    return this.color_.getAlpha();
  }

  set r(r) {
    this.color_.setRed(r);
  }

  get r() {
    return this.color_.getRed();
  }

  set g(g) {
    this.color_.setGreen(g);
  }

  get g() {
    return this.color_.getGreen();
  }

  set b(b) {
    this.color_.setBlue(b);
  }

  get b() {
    return this.color_.getBlue();
  }

  get() {
    return [this.r, this.g, this.b, this.a];
  }

  set(rgba) {
    this.r = rgba[0];
    this.g = rgba[1];
    this.b = rgba[2];
    this.a = rgba[3];
  }

  toCss() {
    return `rgba(${this.r}, ${this.g}, ${this.b}, ${this.a})`;
  }
};


// Copyright (C) 2018 Opera Software AS.  All rights reserved.
//
// This file is an original work developed by Opera Software AS

// -*- Mode: js; tab-width: 2; indent-tabs-mode: nil; c-basic-offset: 2 -*-

/**
 *    Copyright 2006 - 2015 Opera Software AS
 *
 *    Licensed under the Apache License, Version 2.0 (the "License");
 *    you may not use this file except in compliance with the License.
 *    You may obtain a copy of the License at
 *
 *        http://www.apache.org/licenses/LICENSE-2.0
 *
 *    Unless required by applicable law or agreed to in writing, software
 *    distributed under the License is distributed on an "AS IS" BASIS,
 *    WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *    See the License for the specific language governing permissions and
 *    limitations under the License.
 *
 **/

'use strict';

/**
 * @fileoverview
 * Color class
 */

/**
 * @constructor
 *
 *
 * @class
 * Represent a color. Allows for setting and getting color components based
 * on RGB, HSV and HSL color spaces.
 * See also http://en.wikipedia.org/Color_space
 */
window.Color = class Color {
  constructor(value, type) {
    this.red = 0;
    this.green = 0;
    this.blue = 0;
    this.hue = 0;
    this.saturation = 0;
    this.lightness = 0;
    this.saturationV = 0;
    this.value = 0;
    this.alpha = 1;
    this.rgb_ = null;
    this.rgba_ = null;
    this.hsl_ = null;
    this.hsla_ = null;
    this.hsv_ = null;
    this.hex_ = null;
    if (typeof value === 'string') {
      if (type === Color.HEX) {
        this.hex.set(value);
      } else {
        this.parseCSSColor(value);
      }
    }
    if (Array.isArray(value)) {
      switch (type) {
        case undefined:
        case Color.RGB:
          this.rgb.set(value);
          break;
        case Color.RGBA:
          this.rgba.set(value);
          break;
        case Color.HSL:
          this.hsl.set(value);
          break;
        case Color.HSLA:
          this.hsla.set(value);
          break;
        case Color.HSV:
          this.hsv.set(value);
          break;
      }
    }
  }

  parseCSSColor(input) {
    const host = document.head;
    host.style.setProperty('color', input, 'important');
    const raw = window.getComputedStyle(host).color;
    host.style.removeProperty('color');

    const rawArray = raw.split(/rgba?\(|,s*|\)$/).filter(Boolean);
    if (rawArray.length === 4) {
      this.alpha = parseFloat(rawArray.pop());
    }
    this.rgb.set(rawArray.map(Color.parseInt10));
  }

  get rgb() {
    if (!this.rgb_) {
      this.rgb_ = new RGBInterface(this);
    }
    return this.rgb_;
  }

  get rgba() {
    if (!this.rgba_) {
      this.rgba_ = new RGBAInterface(this);
    }
    return this.rgba_;
  }

  get hsl() {
    if (!this.hsl_) {
      this.hsl_ = new HSLInterface(this);
    }
    return this.hsl_;
  }

  get hsla() {
    if (!this.hsla_) {
      this.hsla_ = new HSLAInterface(this);
    }
    return this.hsla_;
  }

  get hsv() {
    if (!this.hsv_) {
      this.hsv_ = new HSVInterface(this);
    }
    return this.hsv_;
  }

  get hex() {
    if (!this.hex_) {
      this.hex_ = new HexInterface(this);
    }
    return this.hex_;
  }

  setRed(red) {
    this.red = Color.clamp(red, 0, 255);
    this.updateHslFromRgb();
    this.updateHsvFromHsl();
  }

  getRed() {
    return Math.round(Color.clamp(this.red, 0, 255));
  }

  setGreen(green) {
    this.green = Color.clamp(green, 0, 255);
    this.updateHslFromRgb();
    this.updateHsvFromHsl();
  }

  getGreen() {
    return Math.round(Color.clamp(this.green, 0, 255));
  }

  setBlue(blue) {
    this.blue = Color.clamp(blue, 0, 255);
    this.updateHslFromRgb();
    this.updateHsvFromHsl();
  }

  getBlue() {
    return Math.round(Color.clamp(this.blue, 0, 255));
  }

  setHue(hue) {
    this.hue = Color.clamp(hue, 0, 360);
    this.updateRgbFromHsl();
  }

  getHue() {
    return Math.round(Color.clamp(this.hue, 0, 360));
  }

  setSaturation(saturation) {
    this.saturation = Color.clamp(saturation, 0, 1);
    this.updateRgbFromHsl();
    this.updateHsvFromHsl();
  }

  getSaturation() {
    return Color.clamp(this.saturation, 0, 1);
  }

  setSaturationV(saturationV) {
    this.saturationV = Color.clamp(saturationV, 0, 1);
    this.updateHslFromHsv();
    this.updateRgbFromHsl();
  }

  getSaturationV() {
    return Color.clamp(this.saturationV, 0, 1);
  }

  setLightness(lightness) {
    this.lightness = Color.clamp(lightness, 0, 1);
    this.updateRgbFromHsl();
    this.updateHsvFromHsl();
  }

  getLightness() {
    return Color.clamp(this.lightness, 0, 1);
  }

  setValue(value) {
    this.value = Color.clamp(value, 0, 100);
    this.updateHslFromHsv();
    this.updateRgbFromHsl();
  }

  getValue() {
    return Color.clamp(this.value, 0, 1);
  }

  setAlpha(alpha) {
    this.alpha = Color.clamp(alpha, 0, 1);
  }

  getAlpha() {
    return Color.clamp(this.alpha, 0, 1);
  }

  getGreyValue() {
    return 0.2126 * this.red + 0.7152 * this.green + 0.0722 * this.blue;
  }

  invertHue() {
    this.setHue((this.hue + 180) % 360);
    return this;
  }

  // http://www.w3.org/TR/2008/REC-WCAG20-20081211/#relativeluminancedef
  getLuminance() {
    let RGB = this.rgb.get().map(c => {
      let cs = c / 255;
      return cs <= 0.03928 ? cs / 12.92 : Math.pow((cs + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * RGB[0] + 0.7152 * RGB[1] + 0.0722 * RGB[2];
  }

  // http://www.w3.org/TR/2008/REC-WCAG20-20081211/#contrast-ratiodef
  getContrastRatio(color2) {
    let l1 = this.getLuminance();
    let l2 = color2.getLuminance();
    return l1 > l2 ? (l1 + 0.05) / (l2 + 0.05) : (l2 + 0.05) / (l1 + 0.05);
  }

  updateHslFromRgb() {
    let red = this.red / 255;
    let green = this.green / 255;
    let blue = this.blue / 255;
    let maxColor = Math.max(red, green, blue);
    let minColor = Math.min(red, green, blue);
    let sum = maxColor + minColor;
    let delta = maxColor - minColor;
    this.hue = 0;
    this.saturation = 0;
    this.lightness = sum / 2;
    if (delta !== 0) {
      this.saturation = delta / (1 - Math.abs(sum - 1));
      delta = 60 / delta;
      switch (maxColor) {
        case red:
          this.hue = (360 + (green - blue) * delta) % 360;
          break;
        case green:
          this.hue = 120 + (blue - red) * delta;
          break;
        case blue:
          this.hue = 240 + (red - green) * delta;
          break;
      }
    }
  }

  updateRgbFromHsl() {
    let rgb1 = Color.hueToRgb(this.hue);
    let rgb2 = Color.mixRgbColors(rgb1, Color.GREY, 1 - this.saturation);
    let rgb3 = this.lightness <= 0.5 ? Color.BLACK : Color.WHITE;
    let mix = 1 - Math.abs(2 * this.lightness - 1);
    let rgb4 = Color.mixRgbColors(rgb3, rgb2, mix);
    this.red = rgb4[0];
    this.green = rgb4[1];
    this.blue = rgb4[2];
  }

  // http://codeitdown.com/hsl-hsb-hsv-color/
  updateHsvFromHsl() {
    let l = this.lightness;
    let v = (2 * l + this.saturation * (1 - Math.abs(2 * l - 1))) / 2;
    this.saturationV = (2 * (v - l)) / v || 0;
    this.value = v;
  }

  updateHslFromHsv() {
    let v = this.value;
    let sv = this.saturationV;
    let l = 0.5 * v * (2 - sv);
    this.saturation = (sv * v) / (1 - Math.abs(2 * l - 1)) || 0;
    this.lightness = l;
  }

  static clamp(val, min, max) {
    return Math.min(Math.max(val, min), max);
  }

  static mixRgbColors(c1Rgb, c2Rgb, m) {
    let rgb = [];
    for (let i = 0; i < 3; i++) {
      rgb[i] = c1Rgb[i] + m * (c2Rgb[i] - c1Rgb[i]);
    }
    return rgb;
  }

  static toPercent(value) {
    return `${Math.round(value * 100)}%`;
  }

  static hueToRgb(hue) {
    hue %= 360;
    let delta = hue % 60;
    hue -= delta;
    delta = Math.round((255 / 60) * delta);
    switch (hue) {
      case 0:
        return [255, delta, 0];
      case 60:
        return [255 - delta, 255, 0];
      case 120:
        return [0, 255, delta];
      case 180:
        return [0, 255 - delta, 255];
      case 240:
        return [delta, 0, 255];
      case 300:
        return [255, 0, 255 - delta];
    }
  }

  static parseInt10(i) {
    return parseInt(i, 10);
  }
};

Color.DEFAULT_COLOR = 'black';
Color.HEX = 1;
Color.RGB = 2;
Color.RGBA = 3;
Color.HSL = 4;
Color.HSLA = 5;
Color.BLACK = [0, 0, 0];
Color.WHITE = [255, 255, 255];
Color.GREY = [127.5, 127.5, 127.5];
Color.RE_HEX_6 = new RegExp('^[0-9a-fA-F]{6}$');
Color.RE_HEX_3 = new RegExp('^[0-9a-fA-F]{3}$');

// -*- Mode: js; tab-width: 2; indent-tabs-mode: nil; c-basic-offset: 2 -*-

/**
 *    Copyright 2006 - 2015 Opera Software AS
 *
 *    Licensed under the Apache License, Version 2.0 (the "License");
 *    you may not use this file except in compliance with the License.
 *    You may obtain a copy of the License at
 *
 *        http://www.apache.org/licenses/LICENSE-2.0
 *
 *    Unless required by applicable law or agreed to in writing, software
 *    distributed under the License is distributed on an "AS IS" BASIS,
 *    WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *    See the License for the specific language governing permissions and
 *    limitations under the License.
 *
 **/

'use strict';

window.RGBInterface = class RGBInterface {
  constructor(color) {
    this.color_ = color;
  }

  set r(r) {
    this.color_.setRed(r);
  }

  get r() {
    return this.color_.getRed();
  }

  set g(g) {
    this.color_.setGreen(g);
  }

  get g() {
    return this.color_.getGreen();
  }

  set b(b) {
    this.color_.setBlue(b);
  }

  get b() {
    return this.color_.getBlue();
  }

  get() {
    return [this.r, this.g, this.b];
  }

  set(rgb) {
    this.r = rgb[0];
    this.g = rgb[1];
    this.b = rgb[2];
  }

  toCss() {
    return `rgb(${this.r}, ${this.g}, ${this.b})`;
  }
};

// -*- Mode: js; tab-width: 2; indent-tabs-mode: nil; c-basic-offset: 2 -*-

/**
 *    Copyright 2006 - 2015 Opera Software AS
 *
 *    Licensed under the Apache License, Version 2.0 (the "License");
 *    you may not use this file except in compliance with the License.
 *    You may obtain a copy of the License at
 *
 *        http://www.apache.org/licenses/LICENSE-2.0
 *
 *    Unless required by applicable law or agreed to in writing, software
 *    distributed under the License is distributed on an "AS IS" BASIS,
 *    WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *    See the License for the specific language governing permissions and
 *    limitations under the License.
 *
 **/

'use strict';

window.HSVInterface = class HSVInterface {
  constructor(color) {
    this.color_ = color;
  }

  set h(h) {
    this.color_.setHue(h);
  }

  get h() {
    return this.color_.getHue();
  }

  set s(s) {
    this.color_.setSaturationV(s);
  }

  get s() {
    return this.color_.getSaturationV();
  }

  set v(v) {
    this.color_.setValue(v);
  }

  get v() {
    return this.color_.getValue();
  }

  get() {
    return [this.h, this.s, this.v];
  }

  set(hsv) {
    this.h = hsv[0];
    this.s = hsv[1];
    this.v = hsv[2];
  }

  toCss() {
    return this.color_.hsl.toCss();
  }
};

// -*- Mode: js; tab-width: 2; indent-tabs-mode: nil; c-basic-offset: 2 -*-

/**
 *    Copyright 2006 - 2015 Opera Software AS
 *
 *    Licensed under the Apache License, Version 2.0 (the "License");
 *    you may not use this file except in compliance with the License.
 *    You may obtain a copy of the License at
 *
 *        http://www.apache.org/licenses/LICENSE-2.0
 *
 *    Unless required by applicable law or agreed to in writing, software
 *    distributed under the License is distributed on an "AS IS" BASIS,
 *    WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *    See the License for the specific language governing permissions and
 *    limitations under the License.
 *
 **/

'use strict';

window.HSLInterface = class HSLInterface {
  constructor(color) {
    this.color_ = color;
  }

  set h(h) {
    this.color_.setHue(h);
  }

  get h() {
    return this.color_.getHue();
  }

  set s(s) {
    this.color_.setSaturation(s);
  }

  get s() {
    return this.color_.getSaturation();
  }

  set l(l) {
    this.color_.setLightness(l);
  }

  get l() {
    return this.color_.getLightness();
  }

  get() {
    return [this.h, this.s, this.l];
  }

  set(hsl) {
    this.h = hsl[0];
    this.s = hsl[1];
    this.l = hsl[2];
  }

  toCss() {
    let s = Color.toPercent(this.s);
    let l = Color.toPercent(this.l);
    return `hsl(${this.h}, ${s}, ${l})`;
  }
};


{
  const CssFlags = {
    remove(...names) {
      for (const name of names) {
        document.documentElement.removeAttribute(`data-${name}`);
        document.documentElement.classList.remove(name);
      }
    },

    set(name, value) {
      if (value) {
        document.documentElement.setAttribute(`data-${name}`, '');
        document.documentElement.classList.toggle(name, true);
      } else {
        CssFlags.remove(name);
      }

      // 
    },

    contains(name) {
      return document.documentElement.classList.contains(name);
    },
  };

  const WallpaperLightness = {
    VERY_DARK: 'very-dark-wallpaper',
    DARK: 'dark-wallpaper',
    LIGHT: 'light-wallpaper',
    VERY_LIGHT: 'very-light-wallpaper',
  };

  const setBackgroundLightnessFlag = hex => {
    const color = new Color(hex);
    const lightness = color.getLightness();
    if (lightness > 0.5) {
      CssFlags.remove(WallpaperLightness.DARK, WallpaperLightness.VERY_DARK);
      CssFlags.set(WallpaperLightness.LIGHT, true);
      if (lightness > 0.75) {
        CssFlags.set(WallpaperLightness.VERY_LIGHT, true);
      } else {
        CssFlags.remove(WallpaperLightness.VERY_LIGHT);
      }
    } else {
      CssFlags.remove(WallpaperLightness.LIGHT, WallpaperLightness.VERY_LIGHT);
      CssFlags.set(WallpaperLightness.DARK, true);
      if (lightness < 0.25) {
        CssFlags.set(WallpaperLightness.VERY_DARK, true);
      } else {
        CssFlags.remove(WallpaperLightness.VERY_DARK);
      }
    }
  };

  const setUiCornersFlags = (name, value) => {
    const isValid = (name, value) => {
      switch (name) {
        case 'gx-ui-roundness':
          return ['NORMAL', 'GX', 'MEDIUM', 'MAX'].includes(value);
        case 'gx-ui-corner-family':
          return ['NONE', 'CUT', 'SCOOP'].includes(value);
        default:
          return false;
      }
    };

    if (value && isValid(name, value)) {
      document.documentElement.setAttribute(
          `data-${name}`, value);
    } else {
      CssFlags.remove(name);
    }
  };

  const update = properties => {
    for (const property of properties) {
      switch (property.key) {
        case 'ui.dark_skin':
          CssFlags.set('dark-theme', property.value);
          break;
        case 'ui.roundness':
          if (!opr.featuresPrivate.isFeatureEnabled('gx-ui-2026-update')) {
            setUiCornersFlags('gx-ui-roundness', 'NORMAL');
          } else {
            setUiCornersFlags('gx-ui-roundness', property.value);
          }
          break;
        case 'ui.corner.family':
          if (!opr.featuresPrivate.isFeatureEnabled('gx-ui-2026-update')) {
            setUiCornersFlags('gx-ui-corner-family', 'CUT');
          } else {
            setUiCornersFlags('gx-ui-corner-family', property.value);
          }
          break;
        case 'startpage.background_color':
          setBackgroundLightnessFlag(property.value);
          break;
      }
    }
  };

  const mediaSelectorWatcher = media_selector_query => {
    CssFlags.set('dark-theme', media_selector_query.matches);
  };

  CssFlags.set('mac', /Macintosh/.test(navigator.userAgent));
  // 
  // 
  // 
  // eslint-disable-next-line max-len
  // 
  CssFlags.set('one', true);
  // 
  // 
  // 
  // 
  CssFlags.set('color-theme', true);
  // 
  if (chrome.settingsPrivate) {
    chrome.settingsPrivate.getAllPrefs(update);
    chrome.settingsPrivate.onPrefsChanged.addListener(update);
  } else {
    let matchMediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    mediaSelectorWatcher(matchMediaQuery);
    matchMediaQuery.addListener(mediaSelectorWatcher);
  }

  window.CssFlags = CssFlags;
}


// Copyright (C) 2019 Opera Software AS.  All rights reserved.
//
// This file is an original work developed by Opera Software AS

window.addEventListener(
  'keydown',
  evt => {
    CssFlags.set('keyboard-focus', evt.code === 'Tab');
  },
  true,
);

window.addEventListener(
  'mousedown',
  () => {
    CssFlags.remove('keyboard-focus');
  },
  true,
);

