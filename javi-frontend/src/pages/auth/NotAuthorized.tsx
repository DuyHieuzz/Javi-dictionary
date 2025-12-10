import { Link } from "react-router-dom";

export default function NotAuthorized() {
    return (
        <div className="min-h-screen flex items-center justify-center p-6">
            <div className="max-w-md text-center">
                <h2 className="text-2xl font-semibold mb-4">Không có quyền</h2>
                <p className="mb-6">
                    Bạn không có quyền truy cập trang này. Nếu bạn nghĩ đây là
                    lỗi, hãy liên hệ quản trị viên.
                </p>

                <Link
                    to="/search"
                    className="inline-block rounded-md bg-indigo-600 text-white px-4 py-2"
                >
                    Quay lại
                </Link>
            </div>
        </div>
    );
}
