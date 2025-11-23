import { Button } from "antd";
import {
    IKanjiDetailResponse,
    IVocabResponse,
    IMeaning,
} from "@/types/backend";
import { RotateCcw } from "lucide-react";
import { useEffect, useRef } from "react";

interface Props {
    vocabularies: IVocabResponse[];
    selectedId: string | null;
    onSelect: (word: string) => void;
    keyword?: string;
    kanjiDetails: IKanjiDetailResponse[];
    onViewKanjiDetail: (character: string) => void;
}

export default function VocabularyList({
    vocabularies,
    selectedId,
    onSelect,
    keyword,
    kanjiDetails,
    onViewKanjiDetail,
}: Props) {
    const videoRefs = useRef<Record<number, HTMLVideoElement | null>>({});
    // khi kanjiDetails thay đổi -> thử autoplay các video (muted)
    useEffect(() => {
        kanjiDetails.forEach((k, idx) => {
            const v = videoRefs.current[idx];
            if (v && k.videoUrl) {
                v.muted = true;
                v.loop = true;
                v.playsInline = true;
                // try play, ignore rejection (browser có thể block)
                v.play().catch(() => {});
            }
        });
    }, [kanjiDetails]);
    return (
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-3 flex flex-col">
            <h3 className="text-gray-800 mb-3 text-[15px]">
                Kết quả tra cứu từ vựng:{" "}
                <span className="text-[#3e67d6]">{keyword}</span>
            </h3>

            {/* ==== DANH SÁCH TỪ VỰNG ==== */}
            <div className="flex flex-col gap-2">
                {vocabularies.length === 0 ? (
                    <p className="text-gray-500 text-sm italic py-4">
                        Không có kết quả nào phù hợp.
                    </p>
                ) : (
                    vocabularies.map((item) => {
                        const meaningText = Array.isArray(item.meanings)
                            ? (item.meanings as IMeaning[])
                                  .map((m) => m.meaningVn)
                                  .filter(Boolean)
                                  .join(", ")
                            : "";

                        return (
                            <div
                                key={item.word}
                                onClick={() => onSelect(item.word)}
                                className={`p-3 rounded-lg cursor-pointer transition-all ${
                                    selectedId === item.word
                                        ? "bg-[#f1f5fd]"
                                        : "hover:bg-[#e2ebfa] bg-white"
                                }`}
                            >
                                <div>
                                    {/* Hán tự */}
                                    <h1 className="text-lg font-medium text-[#3e67d6] leading-tight">
                                        {item.word}
                                    </h1>

                                    {/* Hiragana */}
                                    {item.hiragana && (
                                        <p className="text-[14px] text-gray-600 leading-tight mt-1">
                                            {item.hiragana}
                                        </p>
                                    )}

                                    {/* Nghĩa */}
                                    <p
                                        className="text-[14px] text-gray-700 line-clamp-1 mt-1"
                                        title={meaningText}
                                    >
                                        {meaningText || "Không có nghĩa"}
                                    </p>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            {/* ==== DANH SÁCH KANJI CỦA TỪ ==== */}
            {kanjiDetails && kanjiDetails.length > 0 && (
                <div className="mt-6 border-t border-gray-200 pt-4">
                    <h4 className="text-gray-700 mb-3 font-medium text-[15px]">
                        Các chữ Kanji của {selectedId}:
                    </h4>
                    <div className="flex flex-col gap-5">
                        {kanjiDetails.map((k, idx) => (
                            <div
                                key={idx}
                                className="border border-gray-200 rounded-xl p-3 shadow-sm"
                            >
                                <div className="flex items-start gap-3">
                                    {/* GIF hoặc Video minh họa */}
                                    <div className="w-[80px] h-[80px] relative flex items-center justify-center flex-shrink-0">
                                        {k.gifUrl ? (
                                            <img
                                                src={k.gifUrl}
                                                alt={k.characterName}
                                                className="w-[80px] h-[80px] object-contain"
                                            />
                                        ) : (
                                            <>
                                                <video
                                                    ref={(el) => {
                                                        videoRefs.current[idx] =
                                                            el;
                                                    }}
                                                    src={k.videoUrl}
                                                    className="w-[80px] h-[80px] object-contain rounded shadow-sm"
                                                    muted
                                                    playsInline
                                                    loop
                                                    // preload để giảm độ trễ
                                                    preload="auto"
                                                />
                                                {/* Nút phát lại góc trên phải */}
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        const video =
                                                            videoRefs.current[
                                                                idx
                                                            ];
                                                        if (video) {
                                                            try {
                                                                video.pause();
                                                                video.currentTime = 0;
                                                                video
                                                                    .play()
                                                                    .catch(
                                                                        () => {
                                                                            // ignore nếu browser block play
                                                                        }
                                                                    );
                                                            } catch (err) {
                                                                // ignore timing errors
                                                            }
                                                        }
                                                    }}
                                                    title="Phát lại video"
                                                    className="absolute top-1 right-1 bg-white/80 hover:bg-white text-blue-600 p-[2px] rounded-full shadow-sm transition"
                                                >
                                                    <RotateCcw size={13} />
                                                </button>
                                            </>
                                        )}
                                    </div>

                                    {/* Thông tin Kanji */}
                                    <div className="flex-1">
                                        <p className="text-[18px] font-semibold text-[#3e67d6] mb-1">
                                            {k.characterName} 「{k.sinoViName}」
                                        </p>

                                        {k.kunyomi?.length > 0 && (
                                            <p className="text-sm text-gray-700 mb-1">
                                                訓: {k.kunyomi.join("・")}
                                            </p>
                                        )}
                                        {k.onyomi?.length > 0 && (
                                            <p className="text-sm text-gray-700">
                                                音: {k.onyomi.join("・")}
                                            </p>
                                        )}

                                        <Button
                                            size="small"
                                            type="link"
                                            className="!p-0 text-blue-600 hover:underline"
                                            onClick={() =>
                                                onViewKanjiDetail(
                                                    k.characterName
                                                )
                                            }
                                        >
                                            Xem chi tiết
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
