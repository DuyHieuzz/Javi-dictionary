import { Modal, Spin, Tabs, Empty } from "antd";
import { useEffect, useState } from "react";
import { callSearchKanji } from "@/apis/kanjiApi";
import { callSearchVocabulary } from "@/apis/vocabularyApi";
import { callSearchGrammars } from "@/apis/grammarApi";
import type { IMeaning } from "@/types/backend";
import DOMPurify from "dompurify";
import { IoSearchOutline } from "react-icons/io5";
import { LoadingOutlined } from "@ant-design/icons";
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

    function htmlToPlainText(html?: string): string {
        if (!html) return "";
        const safe = DOMPurify.sanitize(html);
        const tmp = document.createElement("div");
        tmp.innerHTML = safe;
        return (tmp.textContent || "").replace(/\u00A0/g, "").trim();
    }

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
                // Chỉ cập nhật list Kanji, không xóa list khác ― tránh ghi đè khi user đã có kết quả từ lần fetch trước
                const res = await callSearchKanji(k, { saveHistory: false });
                const arr = res.data?.result ?? [];
                const list = Array.isArray(arr) ? arr.slice(0, pageSize) : [];
                setKanjiList(list);
                // không gọi setVocabList([]) hay setGrammarList([]) ở đây
                return {
                    kanjiCount: list.length,
                    vocabCount: 0,
                    grammarCount: 0,
                };
            }

            if (type === "WORD") {
                // Chỉ cập nhật list Từ vựng, giữ nguyên list khác
                const res = await callSearchVocabulary(k, {
                    saveHistory: false,
                });
                const arr = res.data?.result ?? [];
                const list = Array.isArray(arr) ? arr.slice(0, pageSize) : [];
                setVocabList(list);
                return {
                    kanjiCount: 0,
                    vocabCount: list.length,
                    grammarCount: 0,
                };
            }

            if (type === "GRAMMAR") {
                // Chỉ cập nhật list Ngữ pháp, giữ nguyên list khác
                const res = await callSearchGrammars({
                    keyword: k,
                    page: 0,
                    size: pageSize,
                    saveHistory: false,
                });
                const content = res.data?.result?.content ?? [];
                const list = Array.isArray(content) ? content : [];
                setGrammarList(list);
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
                    page: 0,
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
        // Ưu tiên gửi character (ký tự Hán) về caller:
        // - Nếu có characterName / character (string) -> dùng string đó làm id (vì SearchResultModal/BE đôi khi nhận characterName)
        // - Nếu không có character string nhưng có id (number) -> vẫn gửi id (fallback)
        const char = k?.characterName ?? k?.character;
        if (char && String(char).trim() !== "") {
            onSelect({
                entityType: "KANJI",
                id: String(char),
                name: String(char),
            });
            return;
        }

        // Nếu không có ký tự, nhưng có id number thì fallback gửi id
        if (k?.id || k?.id === 0) {
            onSelect({
                entityType: "KANJI",
                id: k.id,
                name: k.characterName ?? k.character,
            });
            return;
        }

        // Fallback: không có gì thì gửi tên từ keyword
        onSelect({
            entityType: "KANJI",
            id: undefined,
            name: k?.characterName ?? k?.character ?? keyword,
        });
    };

    const pickVocab = (v: any) => {
        if (v?.id || v?.id === 0) {
            onSelect({
                entityType: "WORD",
                id: v.id,
                name: v.word ?? v.surface,
            });
            return;
        }

        onSelect({
            entityType: "WORD",
            id: undefined,
            name: v.word ?? v.surface ?? keyword,
        });
    };

    const pickGrammar = (g: any) => {
        if (g?.id || g?.id === 0) {
            onSelect({
                entityType: "GRAMMAR",
                id: g.id,
                name: g.title ?? g.pattern,
            });
            return;
        }
        onSelect({
            entityType: "GRAMMAR",
            id: undefined,
            name: g.title ?? g.pattern ?? keyword,
        });
    };

    const renderKanji = () => {
        if (loading)
            return (
                <div className="py-8 flex justify-center">
                    <Spin indicator={<LoadingOutlined spin />} size="large" />
                </div>
            );
        if (!kanjiList.length)
            return (
                <div className="p-6">
                    <Empty description="Không tìm thấy chữ Hán tương ứng" />
                </div>
            );
        return (
            <div className="">
                {kanjiList.map((k) => (
                    <div
                        key={k.id ?? JSON.stringify(k)}
                        onClick={() => pickKanji(k)}
                        className="flex items-center justify-between gap-3 px-3 py-2 rounded hover:bg-gray-100 cursor-pointer"
                    >
                        <div className="flex items-center gap-5">
                            <div className="text-[30px] text-[#3e67d6] font-mplus">
                                {k.character ?? k.characterName}
                            </div>
                            <div className="text-sm text-gray-600">
                                <div className="font-medium">
                                    {k.sinoViName && k.sinoViName.trim() !== ""
                                        ? k.sinoViName
                                        : "—"}
                                </div>
                            </div>
                        </div>
                        <div className="text-xs text-gray-400 flex-shrink-0 hover:underline">
                            Xem chi tiết
                        </div>
                    </div>
                ))}
            </div>
        );
    };

    const renderVocab = () => {
        if (loading)
            return (
                <div className="py-8 flex justify-center">
                    <Spin indicator={<LoadingOutlined spin />} size="large" />
                </div>
            );
        if (!vocabList.length)
            return (
                <div className="p-6">
                    <Empty description="Không tìm thấy từ vựng tương ứng" />
                </div>
            );

        return (
            <div className="">
                {vocabList.map((v) => (
                    <div
                        key={v.id ?? JSON.stringify(v)}
                        onClick={() => pickVocab(v)}
                        className="flex items-center justify-between gap-3 px-3 py-2 rounded hover:bg-gray-100 cursor-pointer"
                    >
                        <div className="flex items-center gap-3 min-w-0">
                            <div
                                className="font-normal text-[#3e67d6] text-xl mr-4 flex-shrink-0"
                                style={{ minWidth: 120 }}
                            >
                                {v.word ?? v.surface}
                            </div>

                            {/* Nghĩa: nếu có nhiều meanings thì join bằng newline và render bằng whitespace-pre-line */}
                            <div className="text-sm text-gray-500 whitespace-pre-line break-words">
                                {Array.isArray(v.meanings) &&
                                v.meanings.length > 0
                                    ? v.meanings
                                          .map((m: IMeaning) => {
                                              // chuyển HTML Quill sang plain text an toàn
                                              const text = htmlToPlainText(
                                                  m?.meaningVn ?? ""
                                              );
                                              return text ? `- ${text}` : null;
                                          })
                                          .filter(Boolean)
                                          .join("\n")
                                    : // nếu không có meanings array, fallback về preview (preview có thể đã là plain text)
                                      v.meaningPreview ?? ""}
                            </div>
                        </div>

                        <div className="text-xs text-gray-400 flex-shrink-0 hover:underline">
                            Xem chi tiết
                        </div>
                    </div>
                ))}
            </div>
        );
    };

    const renderGrammar = () => {
        if (loading)
            return (
                <div className="py-8 flex justify-center">
                    <Spin indicator={<LoadingOutlined spin />} size="large" />
                </div>
            );
        if (!grammarList.length)
            return (
                <div className="p-6">
                    <Empty description="Không tìm thấy ngữ pháp tương ứng" />
                </div>
            );
        return (
            <div className="">
                {grammarList.map((g) => (
                    <div
                        key={g.id}
                        onClick={() => pickGrammar(g)}
                        className="flex items-center justify-between gap-3 px-3 py-2 rounded hover:bg-gray-100 cursor-pointer"
                    >
                        <div>
                            <div className="font-medium text-lg text-[#3e67d6] mb-1">
                                {g.pattern ?? g.title}
                            </div>
                            <div className="text-sm text-gray-500 whitespace-pre-line break-words">
                                {(() => {
                                    // Lấy nội dung raw (có thể là HTML từ Quill)
                                    const raw =
                                        g.meaning ??
                                        g.shortMeaning ??
                                        g.description ??
                                        "";
                                    // Chuyển HTML Quill sang plain text an toàn
                                    const text = htmlToPlainText(raw);
                                    // Rút gọn cho preview: 120 ký tự (bạn có thể chỉnh)
                                    if (!text) return "";
                                    return text.length > 120
                                        ? text.slice(0, 120).trim() + "..."
                                        : text;
                                })()}
                            </div>
                        </div>
                        <div className="text-xs text-gray-400 flex-shrink-0 hover:underline">
                            Xem chi tiết
                        </div>
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
                <div className="flex items-center gap-2 font-normal text-lg">
                    <IoSearchOutline className="text-2xl" />
                    <span>Kết quả tìm kiếm từ khóa: {keyword}</span>
                </div>
            }
            centered
            width={820}
            // Chỉnh bodyStyle: cao cố định, ẩn overflow bên ngoài – nội dung sẽ scroll bên trong tab panes
            bodyStyle={{
                padding: 0,
                height: "60vh",
                minHeight: 360,
                maxHeight: 720,
                overflow: "hidden",
            }}
            className="rounded-2xl overflow-hidden with-padding-modal "
            closable={true}
        >
            {/* Wrapper cho Tabs: dùng flex để tab headers hiển thị tự nhiên và nội dung chiếm phần còn lại */}
            <div
                style={{
                    height: "100%",
                    display: "flex",
                    flexDirection: "column",
                }}
            >
                <Tabs
                    activeKey={active}
                    onChange={(k) => {
                        const key = k as TabKey;
                        setActive(key);
                        if (key === "KANJI") {
                            if (!kanjiList || kanjiList.length === 0)
                                fetchByType(keyword, "KANJI");
                        } else if (key === "WORD") {
                            if (!vocabList || vocabList.length === 0)
                                fetchByType(keyword, "WORD");
                        } else if (key === "GRAMMAR") {
                            if (!grammarList || grammarList.length === 0)
                                fetchByType(keyword, "GRAMMAR");
                        }
                    }}
                    style={{ flex: "0 0 auto" }} // tab header area, không giãn
                >
                    <Tabs.TabPane
                        tab={`Chữ Hán (${kanjiList?.length ?? 0})`}
                        key="KANJI"
                    >
                        {/* Nội dung tab: flex:1 để chiếm không gian còn lại, overflow:auto để scroll */}
                        <div
                            style={{
                                height: "100%",
                                flex: 1,
                                overflow: "auto",
                            }}
                        >
                            {renderKanji()}
                        </div>
                    </Tabs.TabPane>

                    <Tabs.TabPane
                        tab={`Từ vựng (${vocabList?.length ?? 0})`}
                        key="WORD"
                    >
                        <div
                            style={{
                                height: "100%",
                                flex: 1,
                                overflow: "auto",
                            }}
                        >
                            {renderVocab()}
                        </div>
                    </Tabs.TabPane>

                    <Tabs.TabPane
                        tab={`Ngữ pháp (${grammarList?.length ?? 0})`}
                        key="GRAMMAR"
                    >
                        <div
                            style={{
                                height: "100%",
                                flex: 1,
                                overflow: "auto",
                            }}
                        >
                            {renderGrammar()}
                        </div>
                    </Tabs.TabPane>
                </Tabs>
            </div>
        </Modal>
    );
}
