import { Modal, Spin } from "antd";
import { useEffect, useState } from "react";
import { EntityType } from "@/types/backend";
import { callGetGrammarDetail } from "@/apis/grammarApi";
import { callGetKanjiDetail } from "@/apis/kanjiApi";
import { callGetVocabularyById } from "@/apis/vocabularyApi";
import {
    IGrammarResponse,
    IKanjiDetailResponse,
    IVocabResponse,
} from "@/types/backend";
import GrammarDetail from "@/components/grammar/GrammarDetail";
import KanjiDetail from "@/components/kanji/KanjiDetail";
import VocabularyDetail from "@/components/vocabulary/VocabularyDetail";
import { LoadingOutlined } from "@ant-design/icons";

interface Props {
    open: boolean;
    onClose: () => void;
    entityType: EntityType; // "WORD" | "KANJI" | "GRAMMAR"
    entityId: number | string; // id hoặc ký tự kanji
}

export default function SearchResultModal({
    open,
    onClose,
    entityType,
    entityId,
}: Props) {
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState<
        IGrammarResponse | IKanjiDetailResponse | IVocabResponse | null
    >(null);

    useEffect(() => {
        if (!open || !entityId) return;

        const fetchData = async () => {
            try {
                setLoading(true);
                let res: any = null;

                if (entityType === "GRAMMAR") {
                    // Modal chỉ hiển thị dữ liệu đã có → không lưu lịch sử
                    res = await callGetGrammarDetail(Number(entityId), {
                        saveHistory: false,
                    });
                } else if (entityType === "KANJI") {
                    res = await callGetKanjiDetail(String(entityId), {
                        saveHistory: false,
                    });
                } else if (entityType === "WORD") {
                    res = await callGetVocabularyById(Number(entityId), {
                        saveHistory: false,
                    });
                }

                // === FIX: handle different response shapes ===
                // Some endpoints return { result: { ... } }, some return { data: { ... } },
                // some return the entity directly as the JSON body. Try all possibilities.
                if (res && res.data) {
                    const maybeResult =
                        res.data.result ?? res.data.data ?? res.data;
                    setData(maybeResult ?? null);
                } else if (res) {
                    // in case axios response isn't used and res itself is the object
                    setData(res.result ?? res.data ?? res ?? null);
                } else {
                    setData(null);
                }
            } catch (err) {
                console.error("Lỗi khi tải dữ liệu modal:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [entityType, entityId, open]);

    return (
        <Modal
            open={open}
            onCancel={onClose}
            footer={null}
            width={950}
            className="rounded-2xl overflow-hidden"
            destroyOnClose
        >
            {loading ? (
                <div className="flex justify-center items-center py-16">
                    <Spin indicator={<LoadingOutlined spin />} size="large" />
                </div>
            ) : !data ? (
                <p className="text-center text-gray-500 italic py-10">
                    Không tìm thấy dữ liệu phù hợp.
                </p>
            ) : entityType === "GRAMMAR" ? (
                <GrammarDetail data={data as IGrammarResponse} />
            ) : entityType === "KANJI" ? (
                <KanjiDetail data={data as IKanjiDetailResponse} />
            ) : (
                <VocabularyDetail data={data as IVocabResponse} />
            )}
        </Modal>
    );
}
