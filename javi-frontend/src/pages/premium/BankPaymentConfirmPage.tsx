import { useLocation, useNavigate } from "react-router-dom";
import { Button, message } from "antd";
import { useAuthStore } from "@/stores/useAuthStore";

import zalo from "@/assets/zalo.png";
import tiktok from "@/assets/tiktok.png";
import facebook from "@/assets/facebook.png";
import youtube from "@/assets/youtube.png";
import instagram from "@/assets/instagram.png";
import messenger from "@/assets/messenger.png";
import bank_qr from "@/assets/bank-qr.png";

import { IoCopy } from "react-icons/io5";

type Plan = {
    id: string;
    months: number;
    price: string;
    originalPrice?: string;
    highlight?: boolean;
    bgUrl?: string;
    type?: string;
};

export default function BankPaymentConfirmPage(): JSX.Element {
    const location = useLocation();
    const navigate = useNavigate();
    const user = useAuthStore((s: any) => s.user);

    const state: any = location.state ?? {};
    const plan: Plan | undefined = state.plan;

    if (!plan) {
        navigate("/premium");
        return <div />;
    }

    const parsePrice = (p?: string) => {
        if (!p) return 0;
        const digits = p.replace(/\./g, "").replace(/[^\d]/g, "");
        return parseInt(digits || "0", 10);
    };

    const formatPrice = (v: number) =>
        v.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");

    const basePriceNum = parsePrice(plan.price);
    const javiDiscount = Math.round((basePriceNum * 0.05) / 1000) * 1000;
    const totalAfter = basePriceNum - javiDiscount;

    const bankInfo = {
        bankName: "Ngân hàng TECHCOMBANK",
        accountHolder: "NGUYEN DUY HIEU",
        accountNumber: "19038189462016",
        branch: "TECHCOMBANK - PGD NINH HIỆP",
    };

    const transferContent = `${user?.email ?? ""} - Javi Premium ${
        plan.months
    } Tháng`;

    const copyToClipboard = async (text: string) => {
        try {
            await navigator.clipboard.writeText(text);
            message.success("Đã sao chép");
        } catch {
            message.error("Sao chép thất bại");
        }
    };

    const onDownloadQR = () => {
        const link = document.createElement("a");
        link.href = bank_qr;
        link.download = `javi-bank-qr-${Date.now()}.png`;
        document.body.appendChild(link);
        link.click();
        link.remove();
    };

    const socialLinks = {
        facebook: "https://www.facebook.com/duyhieu.nguyen.98434",
        tiktok: "https://www.tiktok.com/@pantheon.ndh",
        zalo: "https://zalo.me/0976024780",
        instagram: "https://www.instagram.com/dhieu.ndh/",
        youtube: "https://www.youtube.com/@duyhieunguyen3890",
        messenger: "https://m.me/duyhieu.nguyen.98434",
    };

    return (
        <div className="min-h-screen bg-gray-50 px-2 mt-8">
            <div className="w-full mx-auto bg-white rounded-2xl p-3 border">
                <h1 className="text-2xl text-center text-[#3e67d6] font-medium mb-6">
                    Đăng ký Premium qua chuyển khoản ngân hàng
                </h1>

                <p className="text-sm text-gray-800 mb-4">
                    Mời bạn thực hiện chuyển khoản rồi gửi ảnh cho Javi qua Zalo
                    hoặc Messenger, chúng mình sẽ kích hoạt Premium ngay khi
                    nhận được tiền và tin nhắn của bạn.
                </p>

                <p className="text-sm text-gray-800 mb-6">
                    Mẹo: Nhấn đồng thời nút Home và nút nguồn để chụp lại ảnh
                    màn hình (sử dụng khi cần gửi bằng chứng chuyển khoản).
                </p>

                {/* GÓI & NGÂN HÀNG — gom vào max-w-600px để không bị kéo giãn như ảnh 1 */}
                <div className="border-t border-b py-6 ">
                    <div className="max-w-[800px] grid grid-cols-1 gap-6">
                        {/* NGÂN HÀNG */}
                        <div>
                            <h3 className="text-base font-semibold text-gray-700 mb-2">
                                NGÂN HÀNG
                            </h3>

                            <div className="text-sm text-gray-600 mb-3 space-y-2">
                                <div className="flex justify-between">
                                    <div className="text-black">Ngân hàng</div>
                                    <div className="text-gray-800">
                                        {bankInfo.bankName}
                                    </div>
                                </div>

                                <div className="flex justify-between">
                                    <div className="text-black">
                                        Chủ tài khoản
                                    </div>
                                    <div className="text-gray-800">
                                        {bankInfo.accountHolder}
                                    </div>
                                </div>

                                <div className="flex justify-between items-center">
                                    <div className="text-black">
                                        Số tài khoản
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() =>
                                                copyToClipboard(
                                                    bankInfo.accountNumber
                                                )
                                            }
                                            className="p-1 rounded hover:bg-gray-100"
                                        >
                                            <IoCopy className="text-blue-600" />
                                        </button>
                                        <div className="text-gray-800">
                                            {bankInfo.accountNumber}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex justify-between">
                                    <div className="text-black">Chi nhánh</div>
                                    <div className="text-gray-800">
                                        {bankInfo.branch}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* GÓI */}
                        <div>
                            <h3 className="text-base font-semibold text-gray-700 mb-2">
                                GÓI PREMIUM
                            </h3>

                            <div className="text-sm text-gray-600 mb-3 space-y-2">
                                <div className="flex justify-between">
                                    <div className="text-black">
                                        Thời hạn gói
                                    </div>
                                    <div className="text-gray-800">
                                        {plan.months} Tháng
                                    </div>
                                </div>

                                <div className="flex justify-between">
                                    <div className="text-black">
                                        Số tiền cần chuyển
                                    </div>
                                    <div className="text-[#3e67d6] text-base font-medium">
                                        {formatPrice(totalAfter)} đ{" "}
                                        <span className="text-gray-500 text-xs italic text-center font-normal">
                                            (Đã giảm 5%)
                                        </span>
                                    </div>
                                </div>

                                <div className="flex justify-between items-center">
                                    <div className="text-black">
                                        Nội dung chuyển khoản
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() =>
                                                copyToClipboard(transferContent)
                                            }
                                            className="p-1 rounded hover:bg-gray-100"
                                        >
                                            <IoCopy className="text-blue-600" />
                                        </button>
                                        <div className="text-gray-800">
                                            {transferContent}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* QR */}
                <div className="py-8 flex flex-col items-center">
                    <h3 className="text-2xl text-gray-800 mb-4">
                        Quét mã để thanh toán
                    </h3>

                    <img
                        src={bank_qr}
                        alt="QR chuyển khoản"
                        className="w-45 h-45 object-fit mb-4"
                    />

                    <Button
                        type="primary"
                        variant="solid"
                        onClick={onDownloadQR}
                    >
                        Tải mã QR
                    </Button>
                </div>

                {/* HƯỚNG DẪN */}
                <div className="pt-4 border-t">
                    <h4 className="text-base font-semibold mb-3">
                        HƯỚNG DẪN NÂNG CẤP
                    </h4>

                    <ol className="list-decimal pl-4 text-sm text-gray-800 space-y-2">
                        <li>
                            Mở ứng dụng ngân hàng hoặc tính năng quét mã QR.
                        </li>
                        <li>
                            Quét mã QR hoặc chuyển khoản theo thông tin tài
                            khoản ở trên.
                        </li>
                        <li>
                            Kiểm tra số tiền và nội dung chuyển khoản phải là:{" "}
                            <span className="">{transferContent}</span>.
                        </li>
                        <li>Thực hiện giao dịch.</li>
                        <li>
                            Gửi ảnh chụp màn hình chuyển khoản thành công cho
                            chúng mình qua các kênh hỗ trợ bên dưới.
                        </li>
                    </ol>
                </div>

                {/* HỖ TRỢ */}
                <div className="pt-6 border-t mt-6">
                    <h4 className="text-sm font-semibold mb-3">HỖ TRỢ</h4>

                    <div className="flex flex-wrap gap-4 items-center">
                        <a href={socialLinks.facebook} target="_blank">
                            <img src={facebook} className="w-7 h-7" />
                        </a>
                        <a href={socialLinks.zalo} target="_blank">
                            <img src={zalo} className="w-7 h-7" />
                        </a>
                        <a href={socialLinks.messenger} target="_blank">
                            <img src={messenger} className="w-7 h-7" />
                        </a>
                        <a href={socialLinks.instagram} target="_blank">
                            <img src={instagram} className="w-7 h-7" />
                        </a>
                        <a href={socialLinks.youtube} target="_blank">
                            <img src={youtube} className="w-7 h-7" />
                        </a>
                        <a href={socialLinks.tiktok} target="_blank">
                            <img src={tiktok} className="w-7 h-7" />
                        </a>
                    </div>
                </div>

                {/* FOOTER BUTTONS */}
                <div className="mt-6 flex justify-center">
                    <div className="flex gap-3 w-full max-w-[400px]">
                        <Button
                            className="flex-1"
                            onClick={() => navigate("/premium")}
                        >
                            Trở về trang nâng cấp
                        </Button>

                        <Button
                            type="primary"
                            className="flex-1"
                            onClick={() => navigate("/", { replace: true })}
                        >
                            Trở về trang chủ
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
