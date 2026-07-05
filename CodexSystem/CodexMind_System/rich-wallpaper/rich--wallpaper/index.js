<!DOCTYPE HTML>
<html>
<head>
  <meta charset="utf-8">
  <title>Rich Wallpaper</title>
  <style>
    @layer defaults, components, product, overrides;
    @import url('chrome://op-resources/styleguide/global.css') layer(defaults);
    @import url('/theme.css') layer(defaults);

    @layer overrides {
      body {
        --bodyBg: var(--opera-background-color);
        background-color: var(--bodyBg);
/*  */
        transition: background-color .3s ease-in-out
/*  */
      }
    }
  </style>
  <script src="chrome://op-resources/bundles/global.js"></script>
  <script src="chrome://resources/js/load_time_data.js" type="module"></script>
  <script src="chrome://rich-wallpaper/strings.m.js" type="module"></script>
  <script src="chrome://rich-wallpaper/main.js" type="module"></script>
  <script src="chrome://op-resources/js/css_flags.js"></script>
</head>
<body>
  <div id="root"></div>
</body>
</html>