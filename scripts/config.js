'use strict';

module.exports = function(hexo) {

  let data = hexo.locals.get('data');

  // Read config from data.next or theme_config
  if (data && data.next) {
    Object.assign(hexo.theme.config, data.next);
  } else {
    Object.assign(hexo.theme.config, hexo.config.theme_config);
  }

  // Custom languages support.
  if (data && data.languages) {
    var lang = hexo.config.language;
    var i18n = hexo.theme.i18n;
    var mergeLang = function (lang) {
      i18n.set(lang, Object.assign(i18n.get([lang]), data.languages[lang]));
    };
    if (Array.isArray(lang)) {
      for (var i = 0; i < lang.length; i++) {
        mergeLang(lang[i]);
      }
    } else {
      mergeLang(lang);
    }
  }

  // Only Gemini.
  //hexo.theme.config.scheme = 'Gemini';

};