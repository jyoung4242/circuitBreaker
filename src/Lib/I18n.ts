type LocaleTable = Record<string, any>;
type Params = Record<string, string | number>;

export class I18n {
  private locales = new Map<string, LocaleTable>();
  private currentLocale = "en";
  private fallbackLocale = "en";

  constructor(defaultLocale = "en") {
    this.currentLocale = defaultLocale;
    this.fallbackLocale = defaultLocale;
  }

  registerLocale(code: string, data: LocaleTable) {
    this.locales.set(code, data);
  }

  setLocale(code: string) {
    if (!this.locales.has(code)) {
      console.warn(`[i18n] Locale '${code}' not registered`);
      return;
    }
    this.currentLocale = code;
  }

  getLocale() {
    return this.currentLocale;
  }

  t(key: string, params?: Params): string {
    let value = this.resolve(key, this.currentLocale) ?? this.resolve(key, this.fallbackLocale) ?? key;

    if (params) {
      value = this.interpolate(value, params);
    }

    return value;
  }

  private resolve(key: string, locale: string): string | undefined {
    const table = this.locales.get(locale);
    if (!table) return undefined;

    const parts = key.split(".");
    let current: any = table;

    for (const part of parts) {
      current = current?.[part];
      if (current == null) return undefined;
    }

    return typeof current === "string" ? current : undefined;
  }

  private interpolate(str: string, params: Params) {
    return str.replace(/\{(\w+)\}/g, (_, key) => (params[key] != null ? String(params[key]) : `{${key}}`));
  }
}
