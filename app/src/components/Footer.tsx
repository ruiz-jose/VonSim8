import { faGithub } from "@fortawesome/free-brands-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import clsx from "clsx";
import { memo, useMemo } from "react";

import { Button } from "@/components/ui/Button";
import { Tooltip } from "@/components/ui/Tooltip";
import { useTranslate } from "@/lib/i18n";
import { useSettings } from "@/lib/settings";

// Declaración de la variable global definida por Vite
declare const __COMMIT_HASH__: string;

// Enlaces útiles
const USEFUL_LINKS = [
  {
    name: "Documentación",
    url: "https://ruiz-jose.github.io/VonSim8/docs/",
    icon: "icon-[lucide--book-open]",
  },
  { name: "GitHub", url: "https://github.com/ruiz-jose/VonSim8", icon: faGithub },
];

// Componente de enlace social
const SocialLink = memo(({ name, url, icon }: { name: string; url: string; icon: any }) => (
  <Tooltip content={name} position="top">
    <Button
      variant="ghost"
      size="sm"
      onClick={() => window.open(url, "_blank")}
      className="hover-lift"
      aria-label={name}
    >
      {typeof icon === "string" ? (
        <span className={clsx(icon, "size-4")} />
      ) : (
        <FontAwesomeIcon icon={icon} className="size-4" />
      )}
    </Button>
  </Tooltip>
));

SocialLink.displayName = "SocialLink";

// Componente principal del Footer
export const Footer = memo(() => {
  const translate = useTranslate();
  const [settings] = useSettings();

  // Generar enlace para reportar issue
  const issueLink = useMemo(() => {
    const program = window.codemirror?.state.doc.toString() || "";
    const body = translate("footer.issue.body", settings, program);
    return `https://github.com/ruiz-jose/VonSim8/issues/new?body=${encodeURIComponent(body)}`;
  }, [translate, settings]);

  return (
    <footer className="bg-black px-3 py-1.5 text-xs text-white" data-testid="footer">
      <div className="flex items-center justify-between">
        <span className="text-stone-400 text-xs sm:text-sm">
          © 2025 — UNLP, UNER — v{__COMMIT_HASH__}
        </span>

        {/* Tamaño de fuente del editor */}

        {/* Enlaces útiles */}
        <div className="flex items-center gap-1" data-testid="footer-links">
          {USEFUL_LINKS.map(link => (
            <SocialLink key={link.name} name={link.name} url={link.url} icon={link.icon} />
          ))}

          {/* Enlace para reportar issue */}
          <Tooltip content={translate("footer.issue.report")} position="top">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => window.open(issueLink, "_blank")}
              className="hover-lift"
              aria-label={translate("footer.issue.report")}
            >
              <span className="icon-[lucide--bug] size-4" />
            </Button>
          </Tooltip>
        </div>
      </div>
    </footer>
  );
});

Footer.displayName = "Footer";
