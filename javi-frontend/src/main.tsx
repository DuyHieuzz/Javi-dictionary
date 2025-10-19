import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import "antd/dist/reset.css";
import "./index.css";
import AppRoutes from "./routes/AppRoutes.tsx";

createRoot(document.getElementById("root")!).render(
    <StrictMode>
        <AppRoutes />
    </StrictMode>
);
