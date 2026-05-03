import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

let container = document.getElementById("root");
if (!container) {
  container = document.createElement("div");
  container.id = "root";
  document.body.appendChild(container);
}
document.body.classList.add("mwrd-enhanced");
createRoot(container).render(<App />);
