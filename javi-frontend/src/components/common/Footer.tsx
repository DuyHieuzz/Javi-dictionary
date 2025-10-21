import { MdEmail, MdLocationOn, MdPhone } from "react-icons/md";
import zalo from "../../assets/zalo.png";
import tiktok from "../../assets/tiktok.png";
import facebook from "../../assets/facebook.png";
import youtube from "../../assets/youtube.png";
import instagram from "../../assets/instagram.png";
import messenger from "../../assets/messenger.png";
import line from "../../assets/line.png";
import safari from "../../assets/safari.png";
import chrome from "../../assets/chrome.png";
import firefox from "../../assets/firefox.png";

export default function Footer() {
    return (
        <div className="bg-white text-sm border border-gray-200 rounded-2xl shadow-sm mx-auto px-8 md:px-6 py-6">
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-10 items-start text-left">
                {/* Cột 1: Thông tin */}
                <div>
                    <div className="flex items-center gap-2 mt-[12px]">
                        {/* <img src="/logo.svg" alt="Javi" className="w-10 h-10" /> */}
                        <h2 className="text-xl font-semibold text-gray-800">
                            Javi
                        </h2>
                    </div>
                    <p className="text-gray-600 my-[12px] mb-3">
                        Javi - giúp bạn học tiếng Nhật hiệu quả hơn mỗi ngày.
                    </p>
                    <ul className="space-y-2 text-gray-600 text-sm">
                        <li className="flex items-center gap-2">
                            <MdLocationOn className="text-blue-500 text-base" />
                            <span>Đặng Công Chất - Hà Nội - Việt Nam</span>
                        </li>
                        <li className="flex items-center gap-2">
                            <MdEmail className="text-blue-500 text-base" />
                            <span>nguyenhieupton@gmail.com</span>
                        </li>
                        <li className="flex items-center gap-2">
                            <MdPhone className="text-blue-500 text-base" />
                            <span>(+84) 123 456 789</span>
                        </li>
                    </ul>
                </div>
                {/* Cột 2: Kết nối */}
                <div>
                    <div>
                        {" "}
                        <h3 className="font-semibold text-base my-[12px]">
                            Mạng xã hội
                        </h3>
                        <ul className="flex gap-4 mb-4">
                            <li>
                                <a href="!">
                                    <img
                                        src={facebook}
                                        alt="FACEBOOK"
                                        className="w-[32px] h-[32px]"
                                    />
                                </a>
                            </li>
                            <li>
                                <a href="!">
                                    <img
                                        src={tiktok}
                                        alt="TIKTOK"
                                        className="w-[32px] h-[32px]"
                                    />
                                </a>
                            </li>
                            <li>
                                <a href="!">
                                    <img
                                        src={zalo}
                                        alt="ZALO"
                                        className="w-[32px] h-[32px]"
                                    />
                                </a>
                            </li>
                            <li>
                                <a href="!">
                                    <img
                                        src={instagram}
                                        alt="INSTAGRAM"
                                        className="w-[32px] h-[32px]"
                                    />
                                </a>
                            </li>
                            <li>
                                <a href="!">
                                    <img
                                        src={youtube}
                                        alt="YOUTUBE"
                                        className="w-[32px] h-[32px]"
                                    />
                                </a>
                            </li>
                            <li>
                                <a href="!">
                                    <img
                                        src={messenger}
                                        alt="MESSENGER"
                                        className="w-[32px] h-[32px]"
                                    />
                                </a>
                            </li>
                            <li>
                                <a href="!">
                                    <img
                                        src={line}
                                        alt="LINE"
                                        className="w-[32px] h-[32px]"
                                    />
                                </a>
                            </li>
                        </ul>
                    </div>

                    <div>
                        <h3 className="font-semibold text-base my-[12px]">
                            Tiện ích
                        </h3>
                        <ul className="flex gap-4 mb-4">
                            <li>
                                <a href="!">
                                    <img
                                        src={chrome}
                                        alt="CHROME"
                                        className="w-[32px] h-[32px]"
                                    />
                                </a>
                            </li>
                            <li>
                                <a href="!">
                                    <img
                                        src={safari}
                                        alt="SAFARI"
                                        className="w-[32px] h-[32px]"
                                    />
                                </a>
                            </li>
                            <li>
                                <a href="!">
                                    <img
                                        src={firefox}
                                        alt="FIREFOX"
                                        className="w-[32px] h-[32px]"
                                    />
                                </a>
                            </li>
                        </ul>
                    </div>
                </div>

                {/* Cột 2: Liên kết nhanh */}
                <div>
                    <h3 className=" font-semibold text-base mb-3 my-[12px]">
                        Chức năng chính
                    </h3>
                    <ul className="space-y-2 text-gray-600 text-sm">
                        <li>
                            <a
                                href="/"
                                className="hover:text-blue-600 transition"
                            >
                                Tra cứu
                            </a>
                        </li>
                        <li>
                            <a
                                href="/translate"
                                className="hover:text-blue-600 transition"
                            >
                                Dịch
                            </a>
                        </li>
                        <li>
                            <a
                                href="/jlpt"
                                className="hover:text-blue-600 transition"
                            >
                                Luyện thi JLPT
                            </a>
                        </li>
                        <li>
                            <a
                                href="/about"
                                className="hover:text-blue-600 transition"
                            >
                                Giới thiệu
                            </a>
                        </li>
                    </ul>
                </div>
            </div>
        </div>
    );
}
