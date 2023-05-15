
const i18next = require('i18next');
const Backend = require('i18next-fs-backend');
const enTranslation = require('./locales/en/translation.js');
const thTranslation = require('./locales/th/translation.js');
const locale = process.env.LOCALE || 'en';

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

let actionNameTable = ['go', 'create', 'search', 'destroy', 'protect', 'scry', 'summon', 'strike', 'heal', 'disappear', 'return', 'give']
  .reduce((acc, cur) => { return { ...acc, [cur]: i18next.t(`action.${cur}`) } }, {});
let actionNameTableReversed = Object.entries(actionNameTable).reduce((acc, cur) => { return { ...acc, [cur[1]]: cur[0] } }, {});
// I'm beginning to see why this style is controversial.

module.exports = { getLocale, actionNameTable, actionNameTableReversed };
