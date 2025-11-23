import { FaLightbulb } from "react-icons/fa";
import banner from "../../assets/banner.png";
import { MdHistory } from "react-icons/md";
import no_history from "../../assets/no-history.png";
import { useAuthStore } from "@/stores/useAuthStore";
import { useEffect, useState } from "react";
import { callGetHistory } from "@/apis/historyApi";
import HistoryModal from "@/components/history/HistoryModal";
import SearchResultModal from "@/components/search/SearchResultModal";
import HistoryPickerModal from "@/components/history/HistoryPickerModal";
import { EntityType } from "@/types/backend";
import { useNavigate } from "react-router-dom";

/**
 * Search home content — giữ nguyên layout và style gốc,
 * thêm modal lịch sử (HistoryModal) và picker modal khi click keyword không có entityId.
 */

export default function SearchHomeContent() {
    const user = useAuthStore((s) => s.user);
    const isLoggedIn = !!user;
    const isPremium = user?.accountType === "PREMIUM";

    const [history, setHistory] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    // modal lịch sử (danh sách)
    const [historyModalOpen, setHistoryModalOpen] = useState(false);

    // picker modal (Mazii-like) khi click history item mà không có entityId
    const [pickerOpen, setPickerOpen] = useState(false);
    const [pickerKeyword, setPickerKeyword] = useState<string>("");
    const [pickerDefaultTab, setPickerDefaultTab] = useState<
        "KANJI" | "WORD" | "GRAMMAR" | null
    >(null);

    // modal detail universal (mở khi click chip hoặc picker chọn item có id)
    const [detailOpen, setDetailOpen] = useState(false);
    const [detailEntityType, setDetailEntityType] =
        useState<EntityType>("WORD");
    const [detailEntityId, setDetailEntityId] = useState<number | string>(0);

    const navigate = useNavigate();

    /** Gọi API lấy lịch sử khi đã đăng nhập */
    const fetchHistory = () => {
        if (!isLoggedIn) return;

        setLoading(true);
        callGetHistory(1)
            .then((res) => {
                setHistory(res.data?.result?.content || []);
            })
            .catch(() => {})
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        fetchHistory();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isLoggedIn]);

    const openHistoryModal = () => setHistoryModalOpen(true);
    const closeHistoryModal = () => setHistoryModalOpen(false);

    /**
     * Khi click 1 chip trong preview lịch sử:
     * - Nếu item.entityId tồn tại => mở detail modal (truyền id hoặc character string)
     * - Nếu không có entityId => mở picker modal (HistoryPickerModal) với keyword + defaultTab = null
     *   -> picker sẽ gọi 3 API (kanji, vocab, grammar) đồng thời để show mọi khả năng
     */
    const openDetailFromChip = (h: any) => {
        const type = String(h?.entityType ?? "").toUpperCase();

        // Nếu có entityId => open detail directly (id may be number or string)
        if (
            h?.entityId !== undefined &&
            h?.entityId !== null &&
            String(h.entityId) !== ""
        ) {
            let idOrName: number | string = h.entityId;
            if (type === "KANJI" && h.entityName) {
                idOrName = h.entityName;
            }
            setDetailEntityType(h.entityType);
            setDetailEntityId(idOrName);
            setDetailOpen(true);
            return;
        }

        // Không có entityId -> OPEN PICKER và **gọi 3 API cùng lúc**
        // Để picker gọi 3 API cùng lúc, ta truyền defaultTab = null
        const kw = h.entityName ?? h.keyword ?? "";
        if (!kw) return;

        setPickerKeyword(kw);
        setPickerDefaultTab(null);
        setPickerOpen(true);
    };

    /**
     * Handler khi picker modal trả về 1 selection
     * payload: { entityType, id?, name? }
     * - Nếu id tồn tại -> mở detail modal (SearchResultModal)
     * - Nếu id không tồn tại -> điều hướng tới trang search?keyword=...&type=...
     */
    const handlePickerSelect = (payload: {
        entityType: "KANJI" | "WORD" | "GRAMMAR";
        id?: number | string;
        name?: string;
    }) => {
        setPickerOpen(false);

        if (
            payload.id !== undefined &&
            payload.id !== null &&
            String(payload.id).trim() !== ""
        ) {
            // open detail modal
            setDetailEntityType(payload.entityType as EntityType);
            setDetailEntityId(payload.id as number | string);
            setDetailOpen(true);
            return;
        }

        // fallback: navigate to search page with keyword (payload.name)
        const kw = payload.name ?? "";
        if (!kw) return;

        setHistoryModalOpen(false);

        const params = new URLSearchParams();
        params.set("keyword", kw);
        params.set("type", payload.entityType ?? "WORD");
        navigate(`/search?${params.toString()}`);
    };

    return (
        <div className="flex flex-col gap-6">
            {/* Banner: Ẩn nếu user là PREMIUM */}
            {!isPremium && (
                <div
                    className="w-full h-[280px] rounded-2xl border border-gray-200 bg-cover bg-center"
                    style={{ backgroundImage: `url(${banner})` }}
                ></div>
            )}

            {/* Content mặc định */}
            <section className="bg-white border border-gray-200 rounded-2xl shadow-sm p-3 text-[16px]">
                {/* Tips: Ẩn nếu user đăng nhập */}

                <div className="mb-[12px]">
                    <h2 className="flex gap-2 items-center text-[18px] mb-[12px]">
                        <FaLightbulb className="text-[#ffa800] text-[20px]" />
                        Tips
                    </h2>
                    {!isLoggedIn && (
                        <p className="mb-[6px] leading-relaxed">
                            - Đăng nhập tài khoản Javi để được đồng bộ dữ liệu
                            và sử dụng trên nhiều thiết bị.
                        </p>
                    )}
                    <p className="mb-[6px] leading-relaxed">
                        - Javi có thể chuyển romaji sang hiragana/katakana tự
                        động khi bạn nhập từ khóa.
                    </p>
                    <p className="mb-[6px] leading-relaxed">
                        - Tra cứu hiragana: viết thường chữ romaji đó, ví dụ:
                        nihongo
                    </p>
                    <p className=" leading-relaxed">
                        - Tra cứu katakana: viết hoa chữ romaji đó, ví dụ:
                        BETONAMU
                    </p>
                </div>

                {/* Lịch sử */}
                <div className="mb-[12px]">
                    <div className="flex flex-row items-center justify-between mb-[12px]">
                        <h2 className="flex gap-2 items-center text-[20px]">
                            <MdHistory />
                            <span className="text-[18px]">Lịch sử</span>
                        </h2>
                        <button
                            className="hover:underline text-[14px]"
                            onClick={() => {
                                if (isLoggedIn) openHistoryModal();
                            }}
                        >
                            Xem thêm
                        </button>
                    </div>

                    {/* Chưa đăng nhập → luôn hiện block “Chưa có lịch sử” */}
                    {!isLoggedIn && (
                        <div className="flex flex-col justify-center items-center py-4 border border-dashed border-gray-300 rounded-lg">
                            <img
                                className="w-[50px] h-[50px]"
                                src={no_history}
                                alt="no-history"
                            />
                            <div className="mt-2 text-gray-500">
                                Chưa có lịch sử
                            </div>
                        </div>
                    )}

                    {/* Đã đăng nhập nhưng chưa có lịch sử → hiện “Chưa có lịch sử” */}
                    {isLoggedIn && history.length === 0 && (
                        <div className="flex flex-col justify-center items-center py-4 border border-dashed border-gray-300 rounded-lg">
                            <img
                                className="w-[50px] h-[50px]"
                                src={no_history}
                                alt="no-history"
                            />
                            <div className="mt-2 text-gray-500">
                                Chưa có lịch sử
                            </div>
                        </div>
                    )}

                    {/* Đã đăng nhập và có lịch sử */}
                    {isLoggedIn && history.length > 0 && (
                        <div className="flex flex-wrap justify-start items-center py-4 border border-dashed border-gray-300 rounded-lg">
                            {history.map((h, idx) => (
                                <button
                                    key={idx}
                                    className="px-4 py-2 rounded-xl first:ml-[6px] bg-[#f1f5fd] text-black m-[6px] px-[12px] py-[6px]"
                                    onClick={() => openDetailFromChip(h)}
                                >
                                    {h.entityName ?? h.keyword}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* JLPT */}
                <div>
                    <h2 className="flex gap-2 items-center text-[18px] mb-[12px]">
                        JLPT
                    </h2>
                    <div className="flex flex-wrap justify-start items-center">
                        {["N1", "N2", "N3", "N4", "N5"].map((lvl) => (
                            <button
                                key={lvl}
                                className="px-4 py-2 rounded-2xl first:ml-[6px] bg-[#f1f5fd] text-black m-[6px] px-[14px] py-[8px]"
                                onClick={() =>
                                    navigate(`/jlpt?level=${lvl}&type=vocab`)
                                }
                            >
                                {lvl}
                            </button>
                        ))}
                    </div>
                </div>
            </section>

            {/* Nâng cấp Premium: chỉ hiện khi chưa premium */}
            {!isPremium && (
                <section className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-2xl p-6 flex justify-between items-center">
                    <div>
                        <h3 className="text-xl font-bold mb-2">
                            Nâng cấp Premium
                        </h3>
                        <p className="text-sm opacity-90">
                            Dịch ảnh không giới hạn và học sâu hơn!
                        </p>
                    </div>
                    <button
                        onClick={() => navigate("/premium")}
                        className="bg-white text-blue-600 px-5 py-2 rounded-lg font-medium hover:bg-blue-50 transition"
                    >
                        Nâng cấp ngay
                    </button>
                </section>
            )}

            {/* History modal (full list / infinite scroll / delete / select) */}
            <HistoryModal
                open={historyModalOpen}
                onClose={closeHistoryModal}
                onHistoryChanged={() => {
                    // Khi modal báo có thay đổi (xóa), fetch lại để cập nhật danh sách hiển thị ở trang chính
                    fetchHistory();
                }}
            />

            {/* Picker modal (nếu click vào history item mà không có entityId) */}
            <HistoryPickerModal
                open={pickerOpen}
                keyword={pickerKeyword}
                defaultTab={pickerDefaultTab}
                onClose={() => setPickerOpen(false)}
                onSelect={handlePickerSelect}
                pageSize={8}
            />

            {/* SearchResultModal cho click chip (hoặc khi picker chọn item có id) */}
            <SearchResultModal
                open={detailOpen}
                onClose={() => setDetailOpen(false)}
                entityType={detailEntityType}
                entityId={detailEntityId}
            />
        </div>
    );
}
