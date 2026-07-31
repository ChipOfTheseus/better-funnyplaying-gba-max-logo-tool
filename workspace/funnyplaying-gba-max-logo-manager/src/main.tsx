import "react-toastify/dist/ReactToastify.css";
import "@chipoftheseus/configurator-template/styles/app.scss";
import "./assets/styles/common.scss";
import { StrictMode } from "react";
import { createRoot, hydrateRoot } from "react-dom/client";
import App from "./App.tsx";

const rootElement = document.getElementById("root")!;
const app = <StrictMode><App /></StrictMode>;

if (rootElement.hasChildNodes()) {
  hydrateRoot(rootElement, app);
} else {
  createRoot(rootElement).render(app);
}
