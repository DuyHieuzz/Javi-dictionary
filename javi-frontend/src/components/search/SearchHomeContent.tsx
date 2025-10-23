import { FaLightbulb } from "react-icons/fa";
import banner from "../../assets/banner.png";
import { MdHistory } from "react-icons/md";
import no_history from "../../assets/no-history.png";

export default function SearchHomeContent() {
    return (
        <div className="flex flex-col gap-6">
            {/* Banner */}
            <div
                className="w-full h-[280px] rounded-2xl border border-gray-200 bg-cover bg-center"
                style={{ backgroundImage: `url(${banner})` }}
            ></div>

            {/* Content mặc định */}
            <section className="bg-white border border-gray-200 rounded-2xl shadow-sm p-3 text-[16px]">
                {/* Tips */}
                <div className="mb-[12px]">
                    <h2 className="flex gap-2 items-center text-[18px] mb-[12px]">
                        <FaLightbulb className="text-[#ffa800] text-[20px]" />
                        Tips
                    </h2>
                    <p className="mb-[6px] leading-relaxed">
                        - Đăng nhập tài khoản Javi để được đồng bộ dữ liệu và sử
                        dụng trên nhiều thiết bị.
                    </p>
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
                        <button className="underline text-[14px]">
                            Xem thêm
                        </button>
                    </div>
                    {/* Chưa có lịch sử, chưa đăng nhập thì hiện */}
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
                    {/* Đã đăng nhập và đã tìm kiếm thì hiện */}
                    <div className="flex flex-wrap justify-start items-center py-4 border border-dashed border-gray-300 rounded-lg">
                        <button className="px-4 py-2 rounded-xl first:ml-[6px] bg-[#b4bbcb] text-black m-[6px] px-[12px] py-[6px]">
                            勉強
                        </button>
                    </div>
                </div>

                {/* JLPT */}
                <div>
                    <h2 className="flex gap-2 items-center text-[18px] mb-[12px]">
                        JLPT
                    </h2>
                    <div className="flex flex-wrap justify-start items-center">
                        <button className="px-4 py-2 rounded-2xl first:ml-[6px] bg-[#b4bbcb] text-black m-[6px] px-[14px] py-[8px]">
                            N1
                        </button>
                        <button className="px-4 py-2 rounded-2xl first:ml-[6px] bg-[#b4bbcb] text-black m-[6px] px-[14px] py-[8px]">
                            N2
                        </button>
                        <button className="px-4 py-2 rounded-2xl first:ml-[6px] bg-[#b4bbcb] text-black m-[6px] px-[14px] py-[8px]">
                            N3
                        </button>
                        <button className="px-4 py-2 rounded-2xl first:ml-[6px] bg-[#b4bbcb] text-black m-[6px] px-[14px] py-[8px]">
                            N4
                        </button>
                        <button className="px-4 py-2 rounded-2xl first:ml-[6px] bg-[#b4bbcb] text-black m-[6px] px-[14px] py-[8px]">
                            N5
                        </button>
                    </div>
                </div>
            </section>

            {/* Nâng cấp Premium */}
            <section className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-2xl p-6 flex justify-between items-center">
                <div>
                    <h3 className="text-xl font-bold mb-2">Nâng cấp Premium</h3>
                    <p className="text-sm opacity-90">
                        Dịch ảnh không giới hạn và học sâu hơn!
                    </p>
                </div>
                <button className="bg-white text-blue-600 px-5 py-2 rounded-lg font-medium hover:bg-blue-50 transition">
                    Nâng cấp ngay
                </button>
            </section>
        </div>
    );
}
