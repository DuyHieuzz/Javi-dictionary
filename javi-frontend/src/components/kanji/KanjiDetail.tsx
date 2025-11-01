import { useRef, useState } from "react";
import { Tag, Tooltip, Button, Typography, Divider } from "antd";
import { PlayCircleOutlined, ReloadOutlined } from "@ant-design/icons";
import Comment from "@/components/comment/Comment";
import { AiOutlinePartition } from "react-icons/ai";
import KanjiDecompositionModal from "./KanjiDecompositionModal";
import { IKanjiDetailResponse } from "@/types/backend";

const { Title, Text } = Typography;

interface Props {
    data: IKanjiDetailResponse;
}

export default function KanjiDetail({ data }: Props) {
    const [analyzeOpen, setAnalyzeOpen] = useState(false);
    const videoRef = useRef<HTMLVideoElement>(null);

    const handleReplay = () => {
        if (videoRef.current) {
            videoRef.current.currentTime = 0;
            videoRef.current.play();
        }
    };

    return (
        <div className=" bg-white rounded-2xl shadow-lg p-4">
            <div className="w-full flex flex-col md:flex-row gap-8 text-gray-800">
                {/* ==== CỘT TRÁI: THÔNG TIN CHI TIẾT ==== */}
                <div className="flex-1 space-y-4">
                    <Title
                        level={5}
                        className="!m-0 text-gray-700 text-base !font-normal"
                    >
                        Chi tiết chữ Kanji {data.characterName}
                    </Title>

                    {/* Hán tự */}
                    <div>
                        <Text className="block mb-1">Hán tự</Text>
                        <Tag color="blue" className="text-xl px-3 py-1">
                            {data.characterName} - {data.sinoViName}
                        </Tag>
                    </div>

                    {/* Kunyomi */}
                    {data.kunyomi && data.kunyomi.length > 0 && (
                        <div>
                            <Text className="block mb-1">Kunyomi</Text>
                            <div className="flex flex-wrap gap-2">
                                {data.kunyomi.map((k, idx) => (
                                    <Tag
                                        key={idx}
                                        color="purple"
                                        className="text-base px-3 py-1"
                                    >
                                        {k}
                                    </Tag>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Onyomi */}
                    {data.onyomi && data.onyomi.length > 0 && (
                        <div>
                            <Text className="block mb-1">Onyomi</Text>
                            <div className="flex flex-wrap gap-2">
                                {data.onyomi.map((o, idx) => (
                                    <Tag
                                        key={idx}
                                        color="magenta"
                                        className="text-base px-3 py-1"
                                    >
                                        {o}
                                    </Tag>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Số nét & JLPT */}
                    <div className="flex flex-wrap gap-6">
                        <div>
                            <Text className="mb-1">Số nét: </Text>
                            <Text className="text-base">{data.stroke}</Text>
                        </div>
                        <div>
                            <Text className="mb-1">JLPT:</Text>
                            <div className="text-base ml-1 inline">
                                {data.level && data.level.trim() !== ""
                                    ? data.level
                                    : "Chưa phân loại"}
                            </div>
                        </div>
                    </div>

                    {/* Nút phân tích */}
                    <Button
                        type="default"
                        icon={<AiOutlinePartition />}
                        className="ml-auto bg-blue-50 border border-blue-300 text-blue-700 hover:bg-blue-100 transition-all"
                        onClick={() => setAnalyzeOpen(true)}
                    >
                        Phân tích
                    </Button>

                    <Divider className="!my-3" />

                    {/* Nghĩa */}
                    <div>
                        <Text strong className="block text-gray-600 mb-1">
                            Nghĩa và giải nghĩa
                        </Text>
                        <pre className="whitespace-pre-wrap text-[15px] text-gray-700 font-sans leading-relaxed">
                            {data.meaning}
                        </pre>
                    </div>
                </div>

                {/* ==== CỘT PHẢI: GIF / VIDEO ==== */}
                <div className="md:w-[320px] flex flex-col items-center gap-3 relative">
                    {data.gifUrl ? (
                        <div className="relative w-full aspect-square max-w-[320px] border border-gray-200 rounded-lg overflow-hidden shadow-md bg-gray-50 flex items-center justify-center">
                            <img
                                src={data.gifUrl}
                                alt={`${data.characterName} stroke order`}
                                className="w-full h-full object-contain"
                            />
                        </div>
                    ) : (
                        <div className="relative w-full aspect-square max-w-[320px] border border-gray-200 rounded-lg overflow-hidden shadow-md bg-gray-50">
                            <video
                                ref={videoRef}
                                src={data.videoUrl}
                                className="w-full h-full object-contain"
                                playsInline
                                muted
                            />
                            <Tooltip title="Phát lại video">
                                <Button
                                    shape="circle"
                                    icon={<ReloadOutlined />}
                                    onClick={handleReplay}
                                    className="!absolute top-3 right-3 bg-white/80 hover:bg-white shadow-md transition-transform hover:scale-105"
                                />
                            </Tooltip>
                        </div>
                    )}

                    <div className="flex items-center gap-2 text-gray-500 text-sm mt-2">
                        <PlayCircleOutlined />
                        <span>
                            {data.gifUrl
                                ? "Ảnh GIF minh họa thứ tự nét viết"
                                : "Video minh họa thứ tự nét viết"}
                        </span>
                    </div>
                </div>
            </div>

            {/* ==== COMMENT ==== */}
            <Comment entityType="KANJI" entityId={data.id} />

            {/* ==== MODAL PHÂN TÍCH ==== */}
            <KanjiDecompositionModal
                open={analyzeOpen}
                onClose={() => setAnalyzeOpen(false)}
                kanji={data.characterName}
            />
        </div>
    );
}
