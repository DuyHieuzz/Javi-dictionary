import { createBrowserRouter, RouterProvider } from "react-router-dom";
import MainLayout from "../layouts/MainLayout";
import VocabularyListPage from "../pages/vocabulary/VocabularyListPage";
import LoginPage from "../pages/auth/LoginPage";
import NotFound from "../components/common/NotFount";

export default function App() {
    const router = createBrowserRouter([
        {
            path: "/",
            element: <MainLayout />,
            children: [
                { index: true, element: <VocabularyListPage /> },
                { path: "login", element: <LoginPage /> },
                { path: "*", element: <NotFound /> },
            ],
        },
        {
            path: "*",
            element: <NotFound />, // layout rỗng, chỉ dùng khi không match bất kỳ layout nào
        },
    ]);

    return <RouterProvider router={router} />;
}
