import { useEffect } from "react";

export function useFavIcon(favicon: string) {
  useEffect(() => {
    let link = document.querySelector<HTMLLinkElement>("link[rel~='icon']");
    if (!link) {
      link = document.createElement("link");
      link.setAttribute("rel", "icon");
      link.href = favicon;
      document.head.appendChild(link);
    }
  }, [favicon]);
}
