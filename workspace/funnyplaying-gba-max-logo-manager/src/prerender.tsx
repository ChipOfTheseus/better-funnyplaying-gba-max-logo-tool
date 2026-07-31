import { renderToString } from "react-dom/server";
import App from "./App.tsx";

export function prerender(data: any) {
  return { html: renderToString(<App {...data} />) };
}
