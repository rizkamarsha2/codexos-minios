const productResourcesPolicy =
    window.trustedTypes.createPolicy('product-resources', {
      createScriptURL: path =>
          path.startsWith('/') ? `chrome://op-resources${path}` : null,
    });

function loadScript(src) {
  const scriptElement = document.createElement('script');
  scriptElement.src = productResourcesPolicy.createScriptURL(src);
  document.head.appendChild(scriptElement);
}

function loadStylesheet(href) {
  const linkElement = document.createElement('link');
  linkElement.rel = 'stylesheet';
  linkElement.href = href;
  document.head.appendChild(linkElement);
}

const isGX = opr.operaBrowserPrivate.getCodeName() === 'gx';

if (isGX) {
  loadScript('/third_party/davidshimjs-qrcodejs/qrcode.min.js');
  loadStylesheet('chrome://op-resources/underwave.css');
}
