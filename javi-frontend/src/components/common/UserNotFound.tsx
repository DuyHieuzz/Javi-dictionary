export default function UserNotFound() {
    return (
        <div className="flex flex-col items-center justify-center h-[75vh] text-center">
            <img
                src="/notfound-user.png"
                alt="Not found"
                className="w-[180px] h-[180px] mb-5 opacity-90"
                onError={(e) =>
                    ((e.target as HTMLImageElement).style.display = "none")
                }
            />
            <h2 className="text-xl font-semibold text-gray-700 mb-2">
                Không tìm thấy người dùng này
            </h2>
            <p className="text-gray-500 text-sm">
                Tài khoản bạn đang tìm kiếm có thể đã bị xóa hoặc chưa tồn tại.
            </p>
        </div>
    );
}
