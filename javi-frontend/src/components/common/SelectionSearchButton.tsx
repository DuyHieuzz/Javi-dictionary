import React, { useEffect, useRef, useState } from "react";
import { IoSearchOutline } from "react-icons/io5";

type OnSelectFn = (text: string, clientRect: DOMRect | null) => void;

interface Props {
    onSelect: OnSelectFn; // gọi khi người dùng click kính lúp
    enabled?: boolean; // có thể tắt feature tạm thời
}

/**
 * - Khi user bôi đen text trên page (desktop), hiển thị 1 nút kính lúp cạnh vùng chọn.
 * - Khi click nút: gọi onSelect(selectedText, rect) -> parent sẽ open HistoryPickerModal với keyword.
 * - Không hiển thị khi selection trong INPUT/TEXTAREA/SELECT/contentEditable=false.
 * - Chỉ hiển thị selection length >= 1 and <= 120 (bảo vệ UI).
 * - Ẩn khi có modal mở (parent có thể pass enabled=false khi modal active).
 */
export default function SelectionSearchButton({
    onSelect,
    enabled = true,
}: Props) {
    const [visible, setVisible] = useState(false);
    const [rect, setRect] = useState<DOMRect | null>(null);
    const [selectedText, setSelectedText] = useState<string>("");
    const timerRef = useRef<number | null>(null);
    const btnRef = useRef<HTMLButtonElement | null>(null);

    // helper: kiểm tra node có nằm trong input/textarea/select hoặc contentEditable=false
    const isSelectionInsideFormControl = (sel: Selection | null) => {
        try {
            if (!sel || sel.rangeCount === 0) return true;
            const node = sel.anchorNode;
            if (!node) return true;
            // tìm parent element
            let el: HTMLElement | null =
                node.nodeType === Node.ELEMENT_NODE
                    ? (node as HTMLElement)
                    : (node.parentElement as HTMLElement | null);
            while (el) {
                const tag = el.tagName?.toLowerCase();
                if (
                    tag === "input" ||
                    tag === "textarea" ||
                    tag === "select" ||
                    el.getAttribute("contenteditable") === "true"
                ) {
                    // nếu là contentEditable=true cho phép
                    // KHÔNG hiện nút khi bôi trong form controls
                    return true;
                }
                el = el.parentElement;
            }
            return false;
        } catch {
            return true;
        }
    };

    // Lấy text selection + rect; gọi show button
    const handleSelectionChange = () => {
        if (!enabled) {
            setVisible(false);
            return;
        }

        const sel = window.getSelection ? window.getSelection() : null;
        if (!sel || sel.rangeCount === 0) {
            setVisible(false);
            return;
        }

        const text = sel.toString().trim();
        if (!text) {
            setVisible(false);
            return;
        }

        if (isSelectionInsideFormControl(sel)) {
            setVisible(false);
            return;
        }

        if (text.length > 120) {
            setVisible(false);
            return;
        }

        // thử lấy toạ độ (bounding rect) của vùng chọn
        const range = sel.getRangeAt(0);
        let r: DOMRect | null = null;
        try {
            r = range.getBoundingClientRect();

            if (!r || (r.width === 0 && r.height === 0)) {
                const cr = range.getClientRects();
                if (cr && cr.length > 0) r = cr[0];
            }
        } catch {
            r = null;
        }

        // debounce hiển thị nút (tránh nhấp nháy)
        if (timerRef.current) {
            window.clearTimeout(timerRef.current);
            timerRef.current = null;
        }
        timerRef.current = window.setTimeout(() => {
            setSelectedText(text);
            setRect(r);
            setVisible(true);
        }, 80);
    };

    // nếu click ra ngoài hoặc nhấn ESC thì ẩn nút
    useEffect(() => {
        const onMouseDown = (e: MouseEvent) => {
            // nếu click chính nút thì không auto hide here (btn xử lý)
            const tgt = e.target as Node | null;
            if (btnRef.current && tgt && btnRef.current.contains(tgt)) return;
            setVisible(false);
        };
        const onKey = (e: KeyboardEvent) => {
            if (e.key === "Escape") {
                setVisible(false);
            }
        };

        document.addEventListener("selectionchange", handleSelectionChange);
        document.addEventListener("mousedown", onMouseDown);
        document.addEventListener("keydown", onKey);

        return () => {
            document.removeEventListener(
                "selectionchange",
                handleSelectionChange
            );
            document.removeEventListener("mousedown", onMouseDown);
            document.removeEventListener("keydown", onKey);
            if (timerRef.current) {
                window.clearTimeout(timerRef.current);
                timerRef.current = null;
            }
        };
    }, [enabled]);

    // nếu modal mở ở parent (enabled=false) parent sẽ set enabled false để hide button
    if (!enabled) return null;

    // tính vị trí style cho floating button; đảm bảo nó nằm trong viewport
    const computeStyle = (): React.CSSProperties => {
        if (!rect) return { display: "none" };
        // định vị theo viewport (giống như vị trí cố định)
        const gap = 8;
        const btnWidth = 36;
        const btnHeight = 36;
        let top = rect.top + window.scrollY - btnHeight - gap;
        let left = rect.left + window.scrollX + rect.width - btnWidth; // cố định ở góc phải selection
        // nếu selection trên top viewport -> show dưới selection
        if (top < window.scrollY + 8) {
            top = rect.bottom + window.scrollY + gap;
        }
        // giới hạn vị trí ngang để luôn nằm trong vùng hiển thị viewport
        const maxLeft =
            window.scrollX +
            document.documentElement.clientWidth -
            btnWidth -
            8;
        if (left > maxLeft) left = maxLeft;
        if (left < window.scrollX + 8) left = window.scrollX + 8;
        return {
            position: "absolute",
            top: Math.round(top),
            left: Math.round(left),
            zIndex: 9999,
        };
    };

    return (
        <>
            {visible && rect ? (
                <div style={computeStyle()}>
                    <button
                        ref={btnRef}
                        onClick={(e) => {
                            e.stopPropagation();
                            e.preventDefault();
                            setVisible(false);
                            // gọi callback với text đã chọn; parent chịu trách nhiệm mở modal picker
                            try {
                                const safe = selectedText.trim();
                                if (safe) onSelect(safe, rect);
                            } catch {
                                onSelect(selectedText, rect);
                            }
                            // xóa vùng chọn trên trang
                            const sel = window.getSelection
                                ? window.getSelection()
                                : null;
                            if (sel) sel.removeAllRanges();
                        }}
                        aria-label="Tìm với từ đã chọn"
                        title={`Tìm: ${selectedText}`}
                        className="flex items-center justify-center rounded-full"
                        type="button"
                    >
                        <IoSearchOutline className="text-3xl text-black" />
                    </button>
                </div>
            ) : null}
        </>
    );
}
