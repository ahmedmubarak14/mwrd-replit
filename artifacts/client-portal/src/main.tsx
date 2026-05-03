import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { setAuthTokenGetter } from "@workspace/api-client-react";

// Buyer portal authenticates as a `client` user; the API token lives under
// `mwrd_token`. Register an explicit getter so we never accidentally pick up a
// supplier or backoffice token left behind in localStorage.
setAuthTokenGetter(() => localStorage.getItem("mwrd_token"));

createRoot(document.getElementById("root")!).render(<App />);
