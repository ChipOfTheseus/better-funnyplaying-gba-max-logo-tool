import { ToastContainer } from "react-toastify";
import Main from "./components/Main.tsx";
import { useEffect } from "react";
import favicon from "/src/assets/images/favicon.png";

function useFavIcon() {
  useEffect(() => {
    let link = document.querySelector<HTMLLinkElement>("link[rel~='icon']");
    if (!link) {
      link = document.createElement('link');
      link.setAttribute('rel', 'icon');
      link.href = favicon;
      document.head.appendChild(link);
    }
  }, []);
}

function ToastInitializer() {
  return <ToastContainer
    position="top-center"
    autoClose={5000}
    hideProgressBar={true}
    newestOnTop={true}
    closeOnClick
    theme="light"
  />;
}

function App() {
  useFavIcon();

  return (
    <>
      <Main/>

      <ToastInitializer />
    </>
  )
}

export default App
