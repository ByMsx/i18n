import i18next, { Services, LanguageDetectorModule, InitOptions, Context, i18n, SessionFlavor, Middleware } from "./deps.deno.ts";

export class GrammyLanguageDetector implements LanguageDetectorModule {
  constructor(ctx: i18nFlavorContextS, useSession: boolean) {
    this.useSession = useSession;
    this.ctx = ctx;
  }
  static type = "languageDetector" as const;
  ctx: i18nFlavorContextS | undefined;
  useSession: boolean;
  type = GrammyLanguageDetector.type;
  services!: Services;
  i18nextOptions!: InitOptions;
  init(
      services: Services,
      i18nextOptions: InitOptions
  ): void {
    this.services = services;
    this.i18nextOptions = i18nextOptions;
  }

  detect(): string | string[] | undefined {
    if (this.useSession && this.ctx?.session?.__language_code) {
      return this.ctx?.session.__language_code;
    } else if (this.useSession && this.ctx?.session) {
      return this.ctx?.from?.language_code
    } else {
      return this.ctx?.from?.language_code;
    }
  }
  cacheUserLanguage (lng:string) {
    if (this.useSession && this.ctx?.session) {
      this.ctx.session.__language_code = lng;
    }
  }
}


interface  i18nFlavor extends Context {
  i18n: i18n;
}

interface SessionFlavori18n extends SessionFlavor<any> {
  __language_code?: string;
}

type i18nFlavorContextS = Context & i18nFlavor & SessionFlavori18n;

export function langDetect<C extends i18nFlavorContextS>(InitOptions: InitOptions, useSession: boolean): Middleware<C> {
  return async (ctx, next) => {
    console.log("Language", ctx.from?.language_code);
    ctx.i18n = i18next.createInstance();
    await ctx.i18n.use(new GrammyLanguageDetector(ctx, useSession)).init(InitOptions);
    ctx.i18n.on('languageChanged', (lng:string) => { // Keep language in sync
      if(ctx.session){
        console.log("Language changed to: ", lng, " in session: ", ctx.session.__language_code);
        ctx.i18n.services.languageDetector.cacheUserLanguage(lng);
      }
    })
    await next();
  }
}
