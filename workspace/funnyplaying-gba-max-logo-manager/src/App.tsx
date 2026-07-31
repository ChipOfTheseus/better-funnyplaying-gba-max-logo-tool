import Main from "./components/Main.tsx";
import favicon from "./assets/images/favicon.png";
import { useFavIcon } from "@chipoftheseus/configurator-template/useFavIcon";

function App() {
  useFavIcon(favicon);

  return (
    <Main/>
  )
}

export default App
