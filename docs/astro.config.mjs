import starlight from "@astrojs/starlight";
import { defineConfig } from "astro/config";

import vonsimLang from "./src/assets/vonsim.tmLanguage.json";

// https://astro.build/config
export default defineConfig({
  site: "https://ruiz-jose.github.io/VonSim8/",
  base: "/VonSim8/docs/",
  trailingSlash: "always",

  integrations: [
    starlight({
      title: "VonSim8",
      favicon: "/favicon.svg",
      logo: { src: "./public/favicon.svg", alt: "Logo" },
      editLink: {
        baseUrl: "https://github.com/ruiz-jose/VonSim8/edit/main/docs/",
      },
      pagination: false,
      lastUpdated: true,
      social: [{ label: "GitHub", icon: "github", href: "https://github.com/ruiz-jose/VonSim8" }],

      // Solo español, sin configuración de i18n

      sidebar: [
        { label: "Inicio", link: "/" },
        {
          label: "CPU",
          items: [
            { label: "Conceptos generales", link: "/cpu/" },
            { label: "Lenguaje ensamblador", link: "/cpu/assembly/" },
            {
              label: "Instrucciones",
              collapsed: true,
              autogenerate: { directory: "cpu/instructions" },
            },
          ],
        },
        { label: "Memoria principal", link: "/memory/" },
        {
          label: "Entrada/Salida",
          items: [
            { label: "Conceptos generales", link: "/io/" },
            {
              label: "Módulos E/S",
              collapsed: true,
              autogenerate: { directory: "io/modules" },
            },
            {
              label: "Dispositivos",
              collapsed: true,
              autogenerate: { directory: "io/devices" },
            },
          ],
        },
        {
          label: "Referencia",
          autogenerate: { directory: "reference" },
        },
        { label: "Notas de versión", link: "/changelog/" },
      ],

      customCss: ["./src/styles/custom.css"],
      head: [
        {
          tag: "script",
          attrs: {
            async: true,
            defer: true,
            src: "https://cloud.umami.is/script.js",
            "data-website-id": "88e39718-0b94-440b-a8b7-3ad3226717c3",
            "data-do-not-track": "true",
          },
        },
        {
          tag: "script",
          content: `
            !function(t,e){var o,n,p,r;e.__SV||(window.posthog=e,e._i=[],e.init=function(i,s,a){function g(t,e){var o=e.split(".");2==o.length&&(t=t[o[0]],e=o[1]),t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}}(p=t.createElement("script")).type="text/javascript",p.async=!0,p.src=s.api_host.replace(".i.posthog.com","-assets.i.posthog.com")+"/static/array.js",(r=t.getElementsByTagName("script")[0]).parentNode.insertBefore(p,r);var u=e;for(void 0!==a?u=e[a]=[]:a="posthog",u.people=u.people||[],u.toString=function(t){var e="posthog";return"posthog"!==a&&(e+="."+a),t||(e+=" (stub)"),e},u.people.toString=function(){return u.toString(1)+".people (stub)"},o="capture identify alias people.set people.set_once set_config register register_once unregister opt_out_capturing has_opted_out_capturing opt_in_capturing reset isFeatureEnabled onFeatureFlags getFeatureFlag getFeatureFlagPayload reloadFeatureFlags group updateEarlyAccessFeatureEnrollment getEarlyAccessFeatures getActiveMatchingSurveys getSurveys getNextSurveyStep onSessionId setPersonProperties".split(" "),n=0;n<o.length;n++)g(u,o[n]);e._i.push([i,s,a])},e.__SV=1)}(document,window.posthog||[]);
            posthog.init('phc_Iq0zy6d8IRJY2ts0uHNWlSbectCsUgQK77MLj3ypSdM',{api_host:'https://us.i.posthog.com', person_profiles: 'identified_only' // or 'always' to create profiles for anonymous users as well});
          `,
        },
      ],
    }),
  ],

  // Process images with sharp: https://docs.astro.build/en/guides/assets/#using-sharp
  image: { service: { entrypoint: "astro/assets/services/sharp" } },

  // Markdown configuration: https://docs.astro.build/en/reference/configuration-reference/#markdown-options
  markdown: {
    shikiConfig: {
      langs: [vonsimLang],
      theme: "vitesse-dark", // best approximation of the theme
    },
  },
});
