import { Outlet } from "react-router-dom";

export default function SearchLayout() {
    return (
        // max-w-[1380px]
        <div className="mx-auto px-2 lg:px-2 py-3">
            <Outlet />
        </div>
    );
}
