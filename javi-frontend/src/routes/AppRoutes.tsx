import { BrowserRouter, Routes, Route } from "react-router-dom";
import MainLayout from "../layouts/MainLayout";
import VocabularyListPage from "../pages/vocabulary/VocabularyListPage";
import LoginPage from "../pages/auth/LoginPage";

export default function AppRoutes() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/login" element={<LoginPage />} />
                <Route element={<MainLayout />}>
                    <Route path="/" element={<VocabularyListPage />} />
                </Route>
            </Routes>
        </BrowserRouter>
    );
}
