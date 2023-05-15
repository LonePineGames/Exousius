
const i18next = require('i18next');
const Backend = require('i18next-fs-backend');
const enTranslation = require('./locales/en/translation.js');
const thTranslation = require('./locales/th/translation.js');
const locale = 'th';

i18next
  .use(Backend)
  .init({
    lng: locale, // default language
    fallbackLng: 'en',
    resources: {
      en: { translation: enTranslation },
      th: { translation: thTranslation },
    },
  });

function getLocale() {
  return locale;
}

module.exports = { getLocale };
