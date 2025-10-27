import {
    createBrowserRouter,
    RouterProvider,
    Navigate,
} from "react-router-dom";

// Layouts
import MainLayout from "../layouts/MainLayout";

// Common pages
import NotFound from "../components/common/NotFount";
import LoginPage from "../pages/auth/LoginPage";

// Search pages
import SearchLayout from "../layouts/SearchLayout";
import SearchHome from "../pages/search/SearchHome";
import VocabularyResult from "../pages/search/VocabularyResult";
import RegisterPage from "../pages/auth/RegisterPage";
import VerifyEmailPage from "../pages/auth/VerifyEmailPage";
import UserDetailPage from "@/pages/user/UserDetailPage";

export default function App() {
    const router = createBrowserRouter([
        {
            path: "/",
            element: <MainLayout />,
            children: [
                { index: true, element: <Navigate to="/search" replace /> },

                {
                    path: "search",
                    element: <SearchLayout />, // Layout giữ chỗ cho <Outlet />
                    children: [
                        // Trang ban đầu
                        {
                            index: true,
                            element: <Navigate to="word" replace />,
                        },
                        { path: "word", element: <SearchHome /> },
                        { path: "kanji", element: <SearchHome /> },
                        { path: "grammar", element: <SearchHome /> },

                        // Trang kết quả
                        {
                            path: "word/:keyword",
                            element: <VocabularyResult />,
                        },
                    ],
                },
                { path: "/users/my-info", element: <UserDetailPage /> },
                {
                    path: "/users/profile/:username",
                    element: <UserDetailPage />,
                },
                { path: "login", element: <LoginPage /> },
                { path: "register", element: <RegisterPage /> },
                { path: "verify", element: <VerifyEmailPage /> },
                { path: "*", element: <NotFound /> },
            ],
        },
    ]);

    return <RouterProvider router={router} />;
}
