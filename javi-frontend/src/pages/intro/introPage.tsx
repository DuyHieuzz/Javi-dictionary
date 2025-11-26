import React from "react";
import { motion } from "framer-motion";
import { Search, ImageIcon, Zap, ShieldCheck } from "lucide-react";
import introVideo from "@/assets/introVideo.mp4";
import { AiOutlineHistory } from "react-icons/ai";

export default function IntroPage(): JSX.Element {
    const smoothScrollTo = (id: string) => {
        const el = document.getElementById(id);
        if (!el) return;

        const headerHeight = getFixedHeaderHeight();
        const rect = el.getBoundingClientRect();
        const absoluteElementTop = rect.top + window.pageYOffset;
        const target = absoluteElementTop - headerHeight - 12;

        window.scrollTo({
            top: target,
            behavior: "smooth",
        });
    };

    const getFixedHeaderHeight = () => {
        const header =
            document.querySelector("header") ||
            document.getElementById("main-header") ||
            document.querySelector(".site-header");
        if (!header) return 0;
        const style = window.getComputedStyle(header);
        const position = style.position;
        if (position !== "fixed" && position !== "sticky") {
            return 0;
        }
        return (header as HTMLElement).getBoundingClientRect().height || 0;
    };

    const onAnchorClick = (e: React.MouseEvent, id: string) => {
        e.preventDefault();
        smoothScrollTo(id);
    };

    return (
        <main className="min-h-screen text-gray-900 px-2">
            {/* HERO */}
            <section className="mx-auto py-16 flex flex-col lg:flex-row items-center gap-10">
                <div className="flex-1">
                    <motion.h1
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                        className="text-3xl lg:text-4xl font-normal leading-tight"
                    >
                        Javi - Học tiếng Nhật dễ tiếp thu, tiến bộ rõ rệt từng
                        ngày
                    </motion.h1>

                    <p className="mt-4 text-lg text-gray-700">
                        Tra cứu từ vựng, kanji, ngữ pháp, dịch ảnh và luyện tập
                        với trợ lý AI — thiết kế tối giản, tốc độ cao, dễ tiếp
                        cận.
                    </p>

                    <div className="mt-6 flex flex-wrap gap-3">
                        <a
                            href="#features"
                            onClick={(e) => onAnchorClick(e, "features")}
                            className="inline-flex items-center gap-2 rounded-2xl px-5 py-3 bg-[#6366F1] text-white shadow hover:shadow-lg"
                        >
                            Xem tính năng
                        </a>
                        <a
                            href="#how"
                            onClick={(e) => onAnchorClick(e, "how")}
                            className="inline-flex items-center gap-2 rounded-2xl px-5 py-3 border border-gray-200 bg-[#3b5fc5] text-white hover:shadow-lg"
                        >
                            Cách hoạt động
                        </a>
                    </div>

                    <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                        <div className="p-4 rounded-lg bg-white shadow-sm flex items-start gap-3">
                            <Search className="w-6 h-6 opacity-80 w-[30px] h-[30px]" />
                            <div>
                                <div className="">Tìm kiếm mạnh mẽ</div>
                                <div className="text-xs text-gray-600">
                                    Từ vựng · Kanji · Ngữ pháp - kết quả nhanh.
                                </div>
                            </div>
                        </div>

                        <div className="p-4 rounded-lg bg-white shadow-sm flex items-start gap-3">
                            <ImageIcon className="w-6 h-6 opacity-80" />
                            <div>
                                <div className="">Dịch ảnh</div>
                                <div className="text-xs text-gray-600">
                                    Nhanh - chính xác - tự nhiên.
                                </div>
                            </div>
                        </div>

                        <div className="p-4 rounded-lg bg-white shadow-sm flex items-start gap-3">
                            <Zap className="w-6 h-6 opacity-80 w-[30px] h-[30px]" />
                            <div>
                                <div className="">Trợ lý AI</div>
                                <div className="text-xs text-gray-600">
                                    Giải thích ngữ pháp, gợi ý diễn đạt tự nhiên
                                    hơn.
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex-1">
                    <div className="rounded-2xl bg-white shadow-2xl p-2">
                        <div className="aspect-video bg-black rounded-lg overflow-hidden flex items-center justify-center">
                            <video
                                src={introVideo}
                                className="w-full h-full object-cover"
                                autoPlay
                                loop
                                muted
                                playsInline
                                preload="metadata"
                                aria-label="Demo giao diện Javi"
                            >
                                Trình duyệt của bạn không hỗ trợ thẻ video.
                            </video>
                        </div>

                        <div className="mt-2 grid grid-cols-3 text-xs text-gray-600 text-center">
                            <div className="p-2 bg-gray-50 rounded hover:bg-gray-200">
                                SearchBar cố định
                            </div>
                            <div className="p-2 bg-gray-50 rounded hover:bg-gray-200">
                                Modal đa năng
                            </div>
                            <div className="p-2 bg-gray-50 rounded hover:bg-gray-200">
                                Lịch sử thông minh
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* FEATURES */}
            <section id="features" className="mx-auto py-12">
                <h2 className="text-2xl font-medium text-[#3e67d6]">
                    Tính năng nổi bật
                </h2>
                <p className="mt-2 text-sm text-gray-600">
                    Những điểm mạnh đã giúp Javi dễ dùng và hiệu quả.
                </p>

                <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <FeatureCard
                        icon={<Search className="shrink-0" strokeWidth={1.5} />}
                        title="Tra cứu thông minh"
                        desc={`Tìm kiếm từ vựng, kanji và ngữ pháp với bộ lọc, gợi ý và phân trang nhanh.`}
                    />

                    <FeatureCard
                        icon={
                            <ImageIcon className="shrink-0" strokeWidth={1.5} />
                        }
                        title="Dịch ảnh nhanh"
                        desc="Chọn ảnh 1 lần → dịch ngay. Hỗ trợ snapshot & guard để tránh gọi API lặp."
                    />

                    <FeatureCard
                        icon={<Zap className="shrink-0" strokeWidth={1.5} />}
                        title="Giải thích & Gợi ý bằng AI"
                        desc="Giải thích ngữ pháp, phân loại lỗi, điểm naturalness và gợi ý cách diễn đạt tự nhiên."
                    />

                    <FeatureCard
                        icon={
                            <ShieldCheck
                                className="shrink-0"
                                strokeWidth={1.5}
                            />
                        }
                        title="Xác thực & Bảo mật"
                        desc="Xác minh email, Google OAuth và refresh token bảo mật bằng cookie HTTP-only."
                    />

                    <FeatureCard
                        icon={
                            <AiOutlineHistory
                                className="shrink-0"
                                strokeWidth={1.5}
                            />
                        }
                        title="Lịch sử thông minh"
                        desc="Lưu lịch sử có điều kiện, preview, xóa từng mục hoặc xóa toàn bộ; mở từ lịch sử sẽ không lưu thêm."
                    />
                </div>
            </section>

            {/* HOW IT WORKS */}
            <section id="how" className="mx-auto py-12">
                <h3 className="text-2xl font-medium text-[#3e67d6]">
                    Hoạt động trong 3 bước
                </h3>
                <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Step
                        number={1}
                        title="Tra cứu"
                        desc="Gõ từ, kanji hoặc chọn ảnh để dịch."
                    />
                    <Step
                        number={2}
                        title="Xem chi tiết"
                        desc="Mở Modal để xem Vocabulary - Kanji - Grammar chi tiết."
                    />
                    <Step
                        number={3}
                        title="Lưu & Tối ưu"
                        desc="Lịch sử thông minh + trợ giúp AI giúp bạn ôn tập hiệu quả."
                    />
                </div>
            </section>
        </main>
    );
}

function FeatureCard({
    icon,
    title,
    desc,
}: {
    icon: React.ReactNode;
    title: string;
    desc: string;
}) {
    return (
        // Đặt relative để có thể nâng z-index khi hover, thêm transition cho transform & box-shadow để mượt
        <motion.div
            whileHover={{ y: -6 }}
            className="p-5 rounded-2xl bg-white shadow-md relative transition-transform duration-200 ease-out"
            style={{ willChange: "transform" /* hint cho browser tối ưu */ }}
        >
            <div className="flex items-center gap-4">
                {/* Outer icon box: giữ background ở đây (không di chuyển khi hover) */}
                <div className="w-[48px] h-[48px] rounded-lg bg-indigo-50 flex items-center justify-center flex-none box-border">
                    <div className="w-[24px] h-[24px] flex items-center justify-center overflow-hidden flex-none">
                        {React.isValidElement(icon)
                            ? React.cloneElement(icon as React.ReactElement, {
                                  width: 24,
                                  height: 24,
                                  className: "w-full h-full block",
                                  style: { display: "block" },
                              })
                            : icon}
                    </div>
                </div>

                <div>
                    <div className="">{title}</div>
                    <div className="text-xs text-gray-600 mt-1 whitespace-pre-line">
                        {desc}
                    </div>
                </div>
            </div>
        </motion.div>
    );
}

function Step({
    number,
    title,
    desc,
}: {
    number: number;
    title: string;
    desc: string;
}) {
    return (
        <div className="p-4 rounded-lg bg-white shadow-sm text-center">
            <div className="w-10 h-10 mx-auto rounded-full bg-indigo-50 flex items-center justify-center">
                {number}
            </div>
            <div className="mt-3">{title}</div>
            <div className="mt-2 text-sm text-gray-600">{desc}</div>
        </div>
    );
}
