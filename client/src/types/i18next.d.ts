import "i18next";
import common from "../../public/locales/en/common.json";
import layout from "../../public/locales/en/layout.json";
import knowledge from "../../public/locales/en/knowledge.json";

declare module "i18next" {
  interface CustomTypeOptions {
    defaultNS: "common";
    resources: {
      common: typeof common;
      layout: typeof layout;
      knowledge: typeof knowledge;
      entertainment: typeof entertainment;
      dashboard: typeof dashboard;
    };
  }
}
