import { useState, useEffect } from "react";
import { PiDiamondFill } from "react-icons/pi";
import facebook from "../../assets/facebook.png";
import x from "../../assets/x.png";
import { Link } from "react-router-dom";
import Comment from "../comment/Comment";

export default function VocabularyDetail() {
    // Giả lập trạng thái đăng nhập
    const isLoggedIn = false; // đổi sang false để test trạng thái chưa login
    const [showExplanation, setShowExplanation] = useState(false);
    const [displayedText, setDisplayedText] = useState("");
    const [typingIndex, setTypingIndex] = useState(0);

    // Giả lập nội dung mô phỏng từ API
    const result = `「飲む」(のむ, nomu)

"飲む" (nomu) là một động từ rất phổ biến trong tiếng Nhật, có nghĩa cơ bản là "uống". Tuy nhiên, nó không chỉ giới hạn ở việc uống nước mà còn được dùng trong nhiều ngữ cảnh khác nhau liên quan đến việc đưa chất lỏng hoặc một số loại thuốc vào cơ thể.

1. Nghĩa 1 (Uống nước, đồ uống nói chung)
例：水を飲む。(Mizu o nomu.)
Dịch: Uống nước.

2. Nghĩa 2 (Uống thuốc)
例：薬を飲む。(Kusuri o nomu.)
Dịch: Uống thuốc.

3. Nghĩa 3 (Uống rượu)
例：お酒を飲む。(Osake o nomu.)
Dịch: Uống rượu.`;

    // Hiệu ứng typing
    useEffect(() => {
        if (showExplanation && isLoggedIn) {
            if (typingIndex < result.length) {
                const timeout = setTimeout(() => {
                    setDisplayedText((prev) => prev + result[typingIndex]);
                    setTypingIndex(typingIndex + 1);
                }, 15);
                return () => clearTimeout(timeout);
            }
        } else {
            setDisplayedText("");
            setTypingIndex(0);
        }
    }, [showExplanation, typingIndex, isLoggedIn]);

    // URL hiện tại để chia sẻ
    const currentUrl = window.location.href;

    //  Hàm chia sẻ Facebook thử nghiệm mở facebook
    const handleShareFacebook = () => {
        const shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
            currentUrl
        )}`;
        window.open(shareUrl, "_blank", "width=600,height=400");
    };

    //  Hàm chia sẻ X thử nghiệm mở X
    const handleShareX = () => {
        const text = encodeURIComponent("Học từ vựng tiếng Nhật trên Javi:");
        const shareUrl = `https://twitter.com/intent/tweet?url=${encodeURIComponent(
            currentUrl
        )}&text=${text}`;
        window.open(shareUrl, "_blank", "width=600,height=400");
    };

    return (
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-3">
            <h2 className="text-[36px] font-medium text-blue-600 mb-[12px]">
                起こる
            </h2>
            <p className="mb-2 text-4">おこる</p>

            {/* Phân loại nhóm từ */}
            <div className="py-[10px] px-4 text-lg text-[#ad6800] bg-gradient-to-r from-[#ffeecc] to-[#fffdf7] rounded-lg">
                ☆ Động từ nhóm 1
            </div>

            {/* Nghĩa + ví dụ */}
            <div>
                <h3 className="my-3 text-lg flex items-center gap-1">
                    <PiDiamondFill className="text-[#3e67d6] text-[12px]" /> Xảy
                </h3>
                <div>
                    <div className="text-lg">
                        第三次世界大戦は起こると思いますか。
                    </div>
                    <div className="text-base text-gray-500 mt-1">
                        Bạn có nghĩ rằng đại chiến thế giới lần thứ 3 sẽ xảy ra
                        hay không.
                    </div>
                </div>
            </div>

            {/* Giải thích + chia sẻ */}
            <div>
                <div className="mt-3 flex items-center justify-between pb-5">
                    {/* Nút giải thích */}
                    <div>
                        <button
                            onClick={() => setShowExplanation(!showExplanation)}
                            className="bg-[#ffa800] text-white rounded-xl px-[12px] py-[6px] text-[18px] hover:bg-[#e59400] text-medium transition-all"
                        >
                            起こる là gì?
                        </button>
                    </div>

                    {/* Nút chia sẻ */}
                    <div className="flex gap-2 items-end">
                        <p className="text-sm underline text-gray-500">
                            Chia sẻ với:
                        </p>
                        <button
                            onClick={handleShareX}
                            className="w-6 h-6 rounded-full overflow-hidden"
                        >
                            <img
                                src={x}
                                alt="x"
                                className="w-full h-full object-cover"
                            />
                        </button>
                        <button
                            onClick={handleShareFacebook}
                            className="w-6 h-6 rounded-full overflow-hidden"
                        >
                            <img
                                src={facebook}
                                alt="facebook"
                                className="w-full h-full object-cover"
                            />
                        </button>
                    </div>
                </div>

                {/* Phần giải thích */}
                {showExplanation && (
                    <div className="bg-[#f1f5fd] border border-[#bcc9e2] rounded-lg p-4 text-gray-700 text-[15px] leading-relaxed whitespace-pre-wrap transition-all duration-300 ease-in-out">
                        {isLoggedIn ? (
                            <p>{displayedText}</p>
                        ) : (
                            <p className="text-gray-700 text-[15px]">
                                <Link
                                    to="/login"
                                    className="underline hover:cursor-pointer"
                                >
                                    Đăng nhập để xem giải thích chi tiết
                                </Link>
                            </p>
                        )}
                    </div>
                )}
            </div>
            <Comment />
        </div>
    );
}
