import { faGithub, faTwitter } from "@fortawesome/free-brands-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import clsx from "clsx";
import { memo } from "react";

import { Button } from "@/components/ui/Button";
import { Tooltip } from "@/components/ui/Tooltip";

// Enlaces útiles
const USEFUL_LINKS = [
  { name: "Documentación", url: "https://vonsim.github.io/docs", icon: "icon-[lucide--book-open]" },
  { name: "GitHub", url: "https://github.com/vonsim/vonsim8", icon: faGithub },
  { name: "Reportar Bug", url: "https://github.com/vonsim/vonsim8/issues", icon: "icon-[lucide--bug]" }
];

// Componente de enlace social
const SocialLink = memo(({ 
  name, 
  url, 
  icon 
}: {
  name: string;
  url: string;
  icon: any;
}) => (
  <Tooltip content={name} position="top">
    <Button
      variant="ghost"
      size="sm"
      onClick={() => window.open(url, '_blank')}
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

SocialLink.displayName = 'SocialLink';

// Componente principal del Footer
export const Footer = memo(() => {
  return (
    <footer className="px-3 py-1.5 text-xs text-white bg-black" data-testid="footer">
      <div className="flex items-center justify-between">
        <span className="text-stone-400">
          © Copyright 2017-2025 — III-LIDI, FI, UNLP, UNER
        </span>
        
        {/* Enlaces útiles */}
        <div className="flex items-center gap-1" data-testid="footer-links">
          {USEFUL_LINKS.map((link) => (
            <SocialLink
              key={link.name}
              name={link.name}
              url={link.url}
              icon={link.icon}
            />
          ))}
        </div>
      </div>
    </footer>
  );
});

Footer.displayName = 'Footer';
