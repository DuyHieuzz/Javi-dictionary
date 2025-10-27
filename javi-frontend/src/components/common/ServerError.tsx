// src/components/common/ServerError.tsx
import { ReloadOutlined } from "@ant-design/icons";

export default function ServerError({ onRetry }: { onRetry?: () => void }) {
    return (
        <div className="flex flex-col items-center justify-center h-[75vh] text-center px-5">
            <img
                src="/server-down.png"
                alt="Server error"
                className="w-[200px] h-[200px] mb-5 opacity-90"
                onError={(e) =>
                    ((e.target as HTMLImageElement).style.display = "none")
                }
            />
            <h2 className="text-xl font-semibold text-gray-700 mb-2">
                Máy chủ đang gặp sự cố
            </h2>
            <p className="text-gray-500 mb-5">
                Rất tiếc, hệ thống hiện không phản hồi. Vui lòng thử lại sau ít
                phút.
            </p>
            <button
                onClick={onRetry || (() => window.location.reload())}
                className="bg-[#3e67d6] hover:bg-[#3558b6] text-white rounded-lg px-5 py-2 flex items-center gap-2 transition"
            >
                <ReloadOutlined />
                Thử lại
            </button>
        </div>
    );
}
