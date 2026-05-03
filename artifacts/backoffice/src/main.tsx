import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { setAuthTokenGetter } from "@workspace/api-client-react";

// Backoffice authenticates against the staff (`/backoffice/auth/login`) endpoint;
// the API token lives under `mwrd_bo_token`. Register an explicit getter so the
// shared API client never falls back to a buyer/supplier token.
setAuthTokenGetter(() => localStorage.getItem("mwrd_bo_token"));

createRoot(document.getElementById("root")!).render(<App />);
