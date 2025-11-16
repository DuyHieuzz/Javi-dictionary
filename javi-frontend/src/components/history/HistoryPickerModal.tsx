import { Modal, Spin, Tabs, Empty } from "antd";
import { useEffect, useState } from "react";
import { FaSearch } from "react-icons/fa";

import { callSearchKanji } from "@/apis/kanjiApi";
import { callSearchVocabulary } from "@/apis/vocabularyApi";
import { callSearchGrammars } from "@/apis/grammarApi";

type TabKey = "KANJI" | "WORD" | "GRAMMAR";

interface PickerSelectPayload {
    entityType: TabKey;
    id?: number | string;
    name?: string;
}

interface Props {
    open: boolean;
    keyword: string;
    /**
     * Nếu defaultTab được truyền (ví dụ từ history.item.entityType),
     * modal sẽ mặc định mở tab đó và CHỈ gọi API tương ứng.
     * Nếu defaultTab không truyền => sẽ gọi cả 3 API để show mọi khả năng.
     */
    defaultTab?: TabKey | null;
    onClose: () => void;
    onSelect: (payload: PickerSelectPayload) => void;
    pageSize?: number;
}

const isSingleKanjiChar = (s?: string) => {
    if (!s || typeof s !== "string") return false;
    const trimmed = s.trim();
    // basic CJK Unified Ideographs block
    return /^[\u4E00-\u9FFF]$/.test(trimmed);
};

export default function HistoryPickerModal({
    open,
    keyword,
    defaultTab = null,
    onClose,
    onSelect,
    pageSize = 10,
}: Props) {
    const [active, setActive] = useState<TabKey>(defaultTab ?? "WORD");
    const [loading, setLoading] = useState(false);

    const [kanjiList, setKanjiList] = useState<any[]>([]);
    const [vocabList, setVocabList] = useState<any[]>([]);
    const [grammarList, setGrammarList] = useState<any[]>([]);

    /**
     * fetchByType trả về số lượng kết quả mỗi loại để caller quyết định chuyển tab auto nếu cần.
     * Nếu type === null => gọi 3 API song song và set lists tương ứng.
     * Nếu type === 'KANJI'|'WORD'|'GRAMMAR' => chỉ gọi API tương ứng.
     */
    const fetchByType = async (k: string, type: TabKey | null) => {
        if (!k) {
            // clear and return zeros
            setKanjiList([]);
            setVocabList([]);
            setGrammarList([]);
            return { kanjiCount: 0, vocabCount: 0, grammarCount: 0 };
        }

        setLoading(true);
        try {
            if (type === "KANJI") {
                const res = await callSearchKanji(k, { saveHistory: false });
                const arr = res.data?.result ?? [];
                const list = Array.isArray(arr) ? arr.slice(0, pageSize) : [];
                setKanjiList(list);
                setVocabList([]);
                setGrammarList([]);
                return {
                    kanjiCount: list.length,
                    vocabCount: 0,
                    grammarCount: 0,
                };
            }

            if (type === "WORD") {
                const res = await callSearchVocabulary(k, {
                    saveHistory: false,
                });
                const arr = res.data?.result ?? [];
                const list = Array.isArray(arr) ? arr.slice(0, pageSize) : [];
                setVocabList(list);
                setKanjiList([]);
                setGrammarList([]);
                return {
                    kanjiCount: 0,
                    vocabCount: list.length,
                    grammarCount: 0,
                };
            }

            if (type === "GRAMMAR") {
                const res = await callSearchGrammars({
                    keyword: k,
                    page: 1,
                    size: pageSize,
                    saveHistory: false,
                });
                const content = res.data?.result?.content ?? [];
                const list = Array.isArray(content) ? content : [];
                setGrammarList(list);
                setKanjiList([]);
                setVocabList([]);
                return {
                    kanjiCount: 0,
                    vocabCount: 0,
                    grammarCount: list.length,
                };
            }

            // type === null -> call all three in parallel
            const [kjP, vP, gP] = await Promise.allSettled([
                callSearchKanji(k, { saveHistory: false }),
                callSearchVocabulary(k, { saveHistory: false }),
                callSearchGrammars({
                    keyword: k,
                    page: 1,
                    size: pageSize,
                    saveHistory: false,
                }),
            ]);

            let kc = 0,
                vc = 0,
                gc = 0;

            if (kjP && (kjP as any).status === "fulfilled") {
                const arr = (kjP as any).value.data?.result ?? [];
                const list = Array.isArray(arr) ? arr.slice(0, pageSize) : [];
                setKanjiList(list);
                kc = list.length;
            } else {
                setKanjiList([]);
            }

            if (vP && (vP as any).status === "fulfilled") {
                const arr = (vP as any).value.data?.result ?? [];
                const list = Array.isArray(arr) ? arr.slice(0, pageSize) : [];
                setVocabList(list);
                vc = list.length;
            } else {
                setVocabList([]);
            }

            if (gP && (gP as any).status === "fulfilled") {
                const content = (gP as any).value.data?.result?.content ?? [];
                const list = Array.isArray(content) ? content : [];
                setGrammarList(list);
                gc = list.length;
            } else {
                setGrammarList([]);
            }

            return { kanjiCount: kc, vocabCount: vc, grammarCount: gc };
        } catch (err) {
            console.error("Lỗi fetch preview:", err);
            setKanjiList([]);
            setVocabList([]);
            setGrammarList([]);
            return { kanjiCount: 0, vocabCount: 0, grammarCount: 0 };
        } finally {
            setLoading(false);
        }
    };

    // khi mở modal: muốn UX mượt -> nếu defaultTab được truyền, fetch tab đó trước,
    // nếu không có kết quả -> fetch cả 3 và chuyển sang tab đầu có kết quả.
    useEffect(() => {
        if (!open) return;

        (async () => {
            const t = defaultTab ?? null;

            if (t !== null) {
                const r = await fetchByType(keyword, t);
                const count =
                    t === "KANJI"
                        ? r.kanjiCount
                        : t === "WORD"
                        ? r.vocabCount
                        : r.grammarCount;

                if (count && count > 0) {
                    setActive(t);
                    return;
                }

                // nếu không có kết quả ở tab mặc định, fetch cả 3 và chọn tab có kết quả
                const all = await fetchByType(keyword, null);
                // ưu tiên thứ tự hiển thị: KANJI -> WORD -> GRAMMAR (bạn có thể đổi)
                if (all.kanjiCount > 0) setActive("KANJI");
                else if (all.vocabCount > 0) setActive("WORD");
                else if (all.grammarCount > 0) setActive("GRAMMAR");
                else setActive(t ?? "WORD"); // không có gì cả -> giữ default
                return;
            }

            // defaultTab === null => fetch all 3 and pick first non-empty
            const all = await fetchByType(keyword, null);
            if (all.kanjiCount > 0) setActive("KANJI");
            else if (all.vocabCount > 0) setActive("WORD");
            else if (all.grammarCount > 0) setActive("GRAMMAR");
            else setActive("WORD");
        })();
    }, [open, keyword, defaultTab]);

    const pickKanji = (k: any) => {
        if (k?.id || k?.id === 0) {
            onSelect({
                entityType: "KANJI",
                id: k.id,
                name: k.characterName ?? k.character,
            });
            onClose();
            return;
        }

        if (k?.character || k?.characterName) {
            onSelect({
                entityType: "KANJI",
                id: k.character ?? k.characterName,
                name: k.characterName ?? k.character,
            });
            onClose();
            return;
        }

        onSelect({
            entityType: "KANJI",
            id: undefined,
            name: k?.characterName ?? k?.character ?? keyword,
        });
        onClose();
    };

    const pickVocab = (v: any) => {
        if (v?.id || v?.id === 0) {
            onSelect({
                entityType: "WORD",
                id: v.id,
                name: v.word ?? v.surface,
            });
            onClose();
            return;
        }

        onSelect({
            entityType: "WORD",
            id: undefined,
            name: v.word ?? v.surface ?? keyword,
        });
        onClose();
    };

    const pickGrammar = (g: any) => {
        if (g?.id || g?.id === 0) {
            onSelect({
                entityType: "GRAMMAR",
                id: g.id,
                name: g.title ?? g.pattern,
            });
            onClose();
            return;
        }
        onSelect({
            entityType: "GRAMMAR",
            id: undefined,
            name: g.title ?? g.pattern ?? keyword,
        });
        onClose();
    };

    const renderKanji = () => {
        if (loading)
            return (
                <div className="py-8 flex justify-center">
                    <Spin />
                </div>
            );
        if (!kanjiList.length)
            return (
                <div className="p-6">
                    <Empty description="Không tìm thấy chữ Hán" />
                </div>
            );
        return (
            <div className="p-2">
                {kanjiList.map((k) => (
                    <div
                        key={k.id ?? JSON.stringify(k)}
                        onClick={() => pickKanji(k)}
                        className="flex items-center justify-between gap-3 px-3 py-2 rounded hover:bg-gray-100 cursor-pointer"
                    >
                        <div className="flex items-center gap-3">
                            <div className="text-[20px]">
                                {k.character ?? k.characterName}
                            </div>
                            <div className="text-sm text-gray-600">
                                <div className="font-medium">
                                    {k.sinoViName ?? ""}
                                </div>
                            </div>
                        </div>
                        <div className="text-xs text-gray-400">Chi tiết</div>
                    </div>
                ))}
            </div>
        );
    };

    const renderVocab = () => {
        if (loading)
            return (
                <div className="py-8 flex justify-center">
                    <Spin />
                </div>
            );
        if (!vocabList.length)
            return (
                <div className="p-6">
                    <Empty description="Không tìm thấy từ vựng" />
                </div>
            );
        return (
            <div className="p-2">
                {vocabList.map((v) => (
                    <div
                        key={v.id ?? JSON.stringify(v)}
                        onClick={() => pickVocab(v)}
                        className="flex items-center justify-between gap-3 px-3 py-2 rounded hover:bg-gray-100 cursor-pointer"
                    >
                        <div>
                            <div className="font-medium text-sm">
                                {v.word ?? v.surface}
                            </div>
                            <div className="text-xs text-gray-500">
                                {v.meanings?.[0]?.meaningVn ??
                                    v.meaningPreview ??
                                    ""}
                            </div>
                        </div>
                        <div className="text-xs text-gray-400">Chi tiết</div>
                    </div>
                ))}
            </div>
        );
    };

    const renderGrammar = () => {
        if (loading)
            return (
                <div className="py-8 flex justify-center">
                    <Spin />
                </div>
            );
        if (!grammarList.length)
            return (
                <div className="p-6">
                    <Empty description="Không tìm thấy ngữ pháp" />
                </div>
            );
        return (
            <div className="p-2">
                {grammarList.map((g) => (
                    <div
                        key={g.id}
                        onClick={() => pickGrammar(g)}
                        className="flex items-center justify-between gap-3 px-3 py-2 rounded hover:bg-gray-100 cursor-pointer"
                    >
                        <div>
                            <div className="font-medium text-sm">
                                {g.pattern ?? g.title}
                            </div>
                            <div className="text-xs text-gray-500">
                                {g.meaning ??
                                    g.shortMeaning ??
                                    (g.description ?? "").slice(0, 80)}
                            </div>
                        </div>
                        <div className="text-xs text-gray-400">Chi tiết</div>
                    </div>
                ))}
            </div>
        );
    };

    return (
        <Modal
            open={open}
            onCancel={onClose}
            footer={null}
            title={
                <div className="flex items-center gap-2">
                    <FaSearch /> <span>Tìm: "{keyword}"</span>
                </div>
            }
            centered
            width={820}
            bodyStyle={{ padding: 0 }}
            className="rounded-2xl overflow-hidden"
            closable={true}
        >
            <div className="p-0">
                <Tabs
                    activeKey={active}
                    onChange={(k) => {
                        const key = k as TabKey;
                        setActive(key);
                        // fetch content for selected tab (pass current keyword)
                        fetchByType(keyword, key);
                    }}
                >
                    <Tabs.TabPane
                        tab={`Chữ Hán (${kanjiList?.length ?? 0})`}
                        key="KANJI"
                    >
                        {renderKanji()}
                    </Tabs.TabPane>
                    <Tabs.TabPane
                        tab={`Từ vựng (${vocabList?.length ?? 0})`}
                        key="WORD"
                    >
                        {renderVocab()}
                    </Tabs.TabPane>
                    <Tabs.TabPane
                        tab={`Ngữ pháp (${grammarList?.length ?? 0})`}
                        key="GRAMMAR"
                    >
                        {renderGrammar()}
                    </Tabs.TabPane>
                </Tabs>
            </div>
        </Modal>
    );
}
