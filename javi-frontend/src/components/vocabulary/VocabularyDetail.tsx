import { useState, useEffect } from "react";
import { PiDiamondFill } from "react-icons/pi";
import { AiOutlineLoading3Quarters } from "react-icons/ai";
import facebook from "@/assets/facebook.png";
import x from "@/assets/x.png";
import { Link } from "react-router-dom";
import Comment from "@/components/comment/Comment";
import { IVocabResponse, IMeaning, IMeaningExample } from "@/types/backend";
import { callExplainVocabulary } from "@/apis/vocabularyApi";
import { useAuthStore } from "@/stores/useAuthStore";
import { toast } from "react-toastify";
import DOMPurify from "dompurify";

const wordTypeMap: Record<string, string> = {
    NOUN: "Danh từ",
    PRONOUN: "Đại từ",
    ADJECTIVE_I: "Tính từ đuôi -i",
    ADJECTIVE_NA: "Tính từ đuôi -na",
    ADVERB: "Trạng từ",
    PARTICLE: "Trợ từ",
    CONJUNCTION: "Liên từ",
    INTERJECTION: "Thán từ",
    VERB: "Động từ",
    VERB_GROUP_1: "Động từ nhóm 1",
    VERB_GROUP_2: "Động từ nhóm 2",
    VERB_GROUP_3: "Động từ nhóm 3 (Bất quy tắc)",
    AUXILIARY_VERB: "Trợ động từ",
    IDIOM: "Thành ngữ",
    PHRASE: "Cụm từ",
    CUSTOM: "Khác",
};

interface Props {
    data: IVocabResponse;
}

export default function VocabularyDetail({ data }: Props) {
    const user = useAuthStore((state) => state.user);
    const isLoggedIn = !!user;

    const [showExplanation, setShowExplanation] = useState(false);
    const [displayedText, setDisplayedText] = useState("");
    const [typingIndex, setTypingIndex] = useState(0);
    const [explanation, setExplanation] = useState("");
    const [loading, setLoading] = useState(false);
    const [canRetry, setCanRetry] = useState(true); // Thêm biến để kiểm soát retry

    // Gọi API giải thích thật (có chặn spam)
    const handleExplain = async () => {
        if (!isLoggedIn) {
            toast.info("Vui lòng đăng nhập để xem giải thích chi tiết.");
            setShowExplanation(true);
            return;
        }

        // Nếu đang loading hoặc đang bị chặn retry, bỏ qua
        if (loading || !canRetry) return;

        // Nếu đã có kết quả thành công → chỉ mở hiển thị, không gọi lại
        if (explanation) {
            setShowExplanation(true);
            return;
        }

        setShowExplanation(true);
        setDisplayedText("");
        setTypingIndex(0);
        setExplanation("");
        setLoading(true);
        setCanRetry(false); // Chặn spam click

        try {
            const res = await callExplainVocabulary(data.word);
            setExplanation(res.data.result || "");
        } catch (err: any) {
            console.error(" Lỗi khi gọi AI giải thích:", err);
            toast.error(
                err?.response?.data?.message ||
                    "Không thể giải thích từ vựng. Vui lòng thử lại!"
            );

            //  Cho phép bấm lại sau 5 giây
            setTimeout(() => setCanRetry(true), 5000);
        } finally {
            setLoading(false);
            // Nếu call thành công → vẫn giữ chặn retry vì đã có dữ liệu
            if (!explanation) setCanRetry(true);
        }
    };

    // Hiệu ứng typing
    useEffect(() => {
        if (showExplanation && isLoggedIn && explanation) {
            if (typingIndex < explanation.length) {
                const timeout = setTimeout(() => {
                    setDisplayedText((prev) => prev + explanation[typingIndex]);
                    setTypingIndex((prev) => prev + 1);
                }, 15);
                return () => clearTimeout(timeout);
            }
        } else {
            setDisplayedText("");
            setTypingIndex(0);
        }
    }, [showExplanation, typingIndex, explanation, isLoggedIn]);

    // Chia sẻ mạng xã hội
    const currentUrl = window.location.href;

    const handleShareFacebook = () => {
        const shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
            currentUrl
        )}`;
        window.open(shareUrl, "_blank", "width=600,height=400");
    };

    const handleShareX = () => {
        const text = encodeURIComponent("Học từ vựng tiếng Nhật trên Javi:");
        const shareUrl = `https://twitter.com/intent/tweet?url=${encodeURIComponent(
            currentUrl
        )}&text=${text}`;
        window.open(shareUrl, "_blank", "width=600,height=400");
    };

    return (
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-3">
            <h2 className="text-[36px] font-medium text-[#3e67d6] mb-[12px] font-mplus">
                {data.word}
            </h2>
            {data.hiragana && (
                <p className="mb-2 text-4 text-gray-700">{data.hiragana}</p>
            )}

            {data.wordType && (
                <div className="py-[10px] px-4 text-lg text-[#ad6800] bg-gradient-to-r from-[#ffeecc] to-[#fffdf7] rounded-lg">
                    ☆ {wordTypeMap[data.wordType] ?? "Khác"}
                </div>
            )}

            <div>
                {Array.isArray(data.meanings) && data.meanings.length > 0 ? (
                    data.meanings.map((m: IMeaning, idx: number) => (
                        <div key={m.id ?? idx} className="mb-4">
                            <h3 className="my-3 text-lg flex items-center gap-1 text-[#3e67d6]">
                                <PiDiamondFill className="text-[12px] mt-1" />
                                <span
                                    className="ql-render"
                                    dangerouslySetInnerHTML={{
                                        __html: DOMPurify.sanitize(
                                            m.meaningVn || ""
                                        ),
                                    }}
                                />
                            </h3>

                            {m.description && (
                                <div
                                    className="ql-render text-gray-600 ml-4 text-[15px] mb-2"
                                    dangerouslySetInnerHTML={{
                                        __html: DOMPurify.sanitize(
                                            m.description || ""
                                        ),
                                    }}
                                />
                            )}

                            {Array.isArray(m.examples) &&
                                m.examples.length > 0 && (
                                    <div className="space-y-2 ml-4">
                                        {m.examples.map(
                                            (ex: IMeaningExample) => (
                                                <div
                                                    key={ex.id ?? ex.jaSentence}
                                                >
                                                    <div className="text-lg leading-relaxed whitespace-pre-line">
                                                        {ex.jaSentence}
                                                    </div>
                                                    {ex.viSentence && (
                                                        <div className="text-base text-gray-500 mt-1 whitespace-pre-line">
                                                            {ex.viSentence}
                                                        </div>
                                                    )}
                                                </div>
                                            )
                                        )}
                                    </div>
                                )}
                        </div>
                    ))
                ) : (
                    <p className="text-gray-500 italic">
                        Không có nghĩa nào được cung cấp.
                    </p>
                )}
            </div>

            {/* ==== GIẢI THÍCH + CHIA SẺ ==== */}
            <div>
                <div className="mt-3 flex items-center justify-between pb-3">
                    <div>
                        <button
                            onClick={handleExplain}
                            disabled={loading || (!canRetry && !explanation)}
                            className="bg-[#ffa800] text-white rounded-xl px-[12px] py-[6px] text-[18px] hover:bg-[#e59400] text-medium transition-all disabled:opacity-60 flex items-center gap-2"
                        >
                            {loading ? (
                                <>
                                    <AiOutlineLoading3Quarters className="animate-spin text-[20px]" />
                                    Đang giải thích...
                                </>
                            ) : (
                                `${data.word} là gì?`
                            )}
                        </button>
                    </div>

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

                {showExplanation && (
                    <div className="bg-[#f1f5fd] border border-[#bcc9e2] rounded-lg p-4 text-gray-700 text-[15px] leading-relaxed whitespace-pre-wrap transition-all duration-300 ease-in-out">
                        {loading ? (
                            <div className="flex items-center gap-2 text-gray-500 italic">
                                <AiOutlineLoading3Quarters className="animate-spin text-[18px]" />
                                <span>Đang phân tích...</span>
                            </div>
                        ) : isLoggedIn ? (
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

            <Comment entityType="WORD" entityId={data.id} />
        </div>
    );
}
