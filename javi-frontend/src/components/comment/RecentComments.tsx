import { FaRegComments } from "react-icons/fa";
import { Link } from "react-router-dom";
import avatar from "../../assets/avatar.png";

export default function RecentComments() {
    return (
        <div className="bg-white rounded-2xl shadow-sm p-3 flex flex-col">
            <h2 className="flex items-center gap-2 text-base text-center mb-3">
                <FaRegComments className="text-lg" /> Bình luận gần đây
            </h2>

            {/* Khung danh sách có cuộn */}
            <div className="flex-1 max-h-[200px] md:max-h-[480px] overflow-y-auto pr-1 text-sm text-gray-700 divide-y divide-gray-200">
                {/* Mỗi comment */}
                <div className="py-3">
                    <p className="line-clamp-2">
                        <button className="font-medium text-blue-600">
                            名乗る
                        </button>
                        : 名乗るほどの者ではない 名乗るほどの者ではない
                        名乗るほどの者ではない 名乗るほどの者ではない
                        名乗るほどの者ではない
                    </p>

                    <Link
                        to="/user/1918557/Nam-Vu"
                        className="flex items-center gap-2 text-gray-600 hover:text-blue-600 transition-colors mt-2"
                    >
                        <img
                            src={avatar}
                            alt="avatar"
                            className="w-5 h-5 rounded-full border border-gray-300"
                        />
                        <span>Nam Vũ</span>
                    </Link>
                </div>
            </div>

            {/* Nút xem thêm tách riêng, luôn dính đáy */}
            <div className="border-t border-gray-200 text-center bg-white">
                <button
                    onClick={() => console.log("Load thêm bình luận...")}
                    className="text-[13px] mt-[8px] text-blue-600 hover:underline"
                >
                    Xem thêm
                </button>
            </div>
        </div>
    );
}
