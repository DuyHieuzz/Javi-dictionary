import { IGrammarResponse } from "@/types/backend";
import Comment from "@/components/comment/Comment";
import DOMPurify from "dompurify";

interface Props {
    data: IGrammarResponse;
}

export default function GrammarDetail({ data }: Props) {
    return (
        <div className="bg-white rounded-2xl overflow-hidden border border-gray-200 p-3">
            {/* ====== PHẦN TIÊU ĐỀ ====== */}
            <div className="bg-[#f1f5fd] px-3 py-9 border-b border-gray-200 rounded-lg">
                <div className="flex flex-col items-center justify-between">
                    <h1 className="text-xl mb-1 text-gray-900">
                        {data.pattern.trim()}
                    </h1>
                    {/* Hiển thị meaning dưới dạng HTML đã sanitize (ReactQuill output) */}
                    <div
                        className="ql-render text-gray-700 text-[15px] prose max-w-none"
                        // prose giúp một số style mặc định cho HTML (tuỳ project nếu dùng Tailwind Typography)
                        dangerouslySetInnerHTML={{
                            __html: DOMPurify.sanitize(data.meaning || ""),
                        }}
                    />
                </div>
            </div>

            <div className="">
                {/* ====== CẤU TRÚC ====== */}
                {data.structure && (
                    <div className="text-lg">
                        <h3 className="text-[#3e67da] mb-3 mt-5">Cấu trúc:</h3>
                        <div
                            className="ql-render border border-[#3e67d6] p-2 rounded-lg"
                            dangerouslySetInnerHTML={{
                                __html: DOMPurify.sanitize(
                                    data.structure || ""
                                ),
                            }}
                        />
                    </div>
                )}

                {/* ====== NGHĨA & GIẢI THÍCH ====== */}
                {data.usageNote && (
                    <div>
                        <h3 className="text-lg text-[#3e67da] mb-3 mt-5">
                            Nghĩa
                        </h3>
                        <div
                            className="ql-render text-gray-700 leading-relaxed text-base"
                            dangerouslySetInnerHTML={{
                                __html: DOMPurify.sanitize(
                                    data.usageNote || ""
                                ),
                            }}
                        />
                    </div>
                )}

                {/* ====== VÍ DỤ ====== */}
                <div className="mt-5">
                    <h3 className="text-lg text-[#3e67da] mb-3">Ví dụ</h3>

                    {data.examples && data.examples.length > 0 ? (
                        <div className="space-y-4">
                            {data.examples.map((ex) => (
                                <div key={ex.id} className="">
                                    <p className="text-lg text-gray-900">
                                        {ex.jaSentence}
                                    </p>
                                    {/* {ex.transcription && (
                                        <p className="text-sm text-gray-500 ">
                                            {ex.transcription}
                                        </p>
                                    )} */}
                                    <p className="text-[15px] text-gray-700 mt-1">
                                        {ex.viSentence}
                                    </p>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-gray-500 italic">
                            Chưa có ví dụ nào
                        </p>
                    )}
                </div>
            </div>

            {/* ==== COMMENT ==== */}
            <Comment entityType="GRAMMAR" entityId={data.id} />
        </div>
    );
}
