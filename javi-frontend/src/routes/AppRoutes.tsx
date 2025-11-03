import {
    createBrowserRouter,
    RouterProvider,
    Navigate,
} from "react-router-dom";

import MainLayout from "../layouts/MainLayout";
import NotFound from "../components/common/NotFount";
import LoginPage from "../pages/auth/LoginPage";
import SearchLayout from "../layouts/SearchLayout";
import SearchHome from "../pages/search/SearchHome";
import VocabularyResult from "../pages/search/VocabularyResult";
import RegisterPage from "../pages/auth/RegisterPage";
import VerifyEmailPage from "../pages/auth/VerifyEmailPage";
import UserDetailPage from "@/pages/user/UserDetailPage";
import ResetPasswordPage from "@/pages/auth/ResetPasswordPage";
import { useAuthStore } from "@/stores/useAuthStore";
import OAuthCallbackPage from "@/pages/auth/OAuthCallbackPage";
import KanjiResult from "@/pages/search/KanjiResult";
import GrammarSearchHome from "@/components/grammar/GrammarSearchHome";
import GrammarResult from "@/pages/search/GrammarResult";
import SearchHomeContent from "@/components/search/SearchHomeContent";

export default function App() {
    const setAuth = useAuthStore((state) => state.setAuth);

    const router = createBrowserRouter([
        {
            path: "/",
            element: <MainLayout />,
            children: [
                { index: true, element: <Navigate to="/search" replace /> },

                {
                    path: "search",
                    element: <SearchLayout />, // Layout ngoài (padding + outlet)
                    children: [
                        {
                            path: "",
                            element: <SearchHome />, // Layout con của nhóm search
                            children: [
                                {
                                    index: true,
                                    element: <Navigate to="word" replace />,
                                },
                                {
                                    path: "word",
                                    element: <SearchHomeContent />,
                                },
                                {
                                    path: "kanji",
                                    element: <SearchHomeContent />,
                                },
                                {
                                    path: "grammar",
                                    element: <GrammarSearchHome />,
                                },
                            ],
                        },
                        {
                            path: "word/:keyword",
                            element: <VocabularyResult />,
                        },
                        { path: "kanji/:keyword", element: <KanjiResult /> },
                        {
                            path: "grammar/:keyword",
                            element: <GrammarResult />,
                        },
                    ],
                },
                { path: "/users/my-info", element: <UserDetailPage /> },
                {
                    path: "/users/profile/:username",
                    element: <UserDetailPage />,
                },
                {
                    path: "oauth2/callback/google",
                    element: <OAuthCallbackPage />,
                },
                { path: "login", element: <LoginPage /> },
                { path: "register", element: <RegisterPage /> },
                { path: "verify", element: <VerifyEmailPage /> },
                { path: "/reset-password", element: <ResetPasswordPage /> },
                { path: "*", element: <NotFound /> },
            ],
        },
    ]);

    return <RouterProvider router={router} />;
}
