import i18n from "i18next";
import Backend from "i18next-http-backend";
import {initReactI18next} from "react-i18next";
import {getSavedLanguage} from "../../helper/session";

i18n
    // load translation using http -> see /public/locales
    // learn more: https://github.com/i18next/i18next-http-backend
    .use(Backend)
    // detect user language
    // learn more: https://github.com/i18next/i18next-browser-languageDetector
    //.use(LanguageDetector)
    // pass the i18n instance to react-i18next.
    .use(initReactI18next)
    .init({
        debug: true,
        lng: getSavedLanguage(),
        fallbackLng: "en",
        interpolation: {
            escapeValue: false // not needed for react as it escapes by default
        },
        backend: {
            loadPath: '/locales/{{lng}}/{{ns}}.json',
        },
    });

export default i18n;