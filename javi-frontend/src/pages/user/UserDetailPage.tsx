import { useState, useEffect } from "react";
import UserSidebar from "@/components/user/UserSidebar";
import UserInfoPanel from "@/components/user/UserInfoPanel";
import { callGetMyInfo, callGetPublicUserProfile } from "@/apis/userApi";
import { Spin } from "antd";
import { useParams } from "react-router-dom";
import { useAuthStore } from "@/stores/useAuthStore";

export default function UserDetailPage() {
    const { username } = useParams();
    const [activeTab, setActiveTab] = useState<
        "overview" | "activity" | "security"
    >("overview");
    const [user, setUser] = useState<any | null>(null);
    const [loading, setLoading] = useState(true);
    const [notFound, setNotFound] = useState(false);
    const { user: currentUser } = useAuthStore();

    useEffect(() => {
        (async () => {
            try {
                setLoading(true);
                setNotFound(false); // reset trước mỗi lần fetch

                if (username) {
                    // Public profile theo username
                    const res = await callGetPublicUserProfile(username);
                    const foundUser = res.data?.result;
                    if (!foundUser) {
                        setNotFound(true); // nếu không có result
                        return;
                    }
                    setUser(foundUser);
                    if (activeTab === "security") setActiveTab("overview");
                } else {
                    // My profile
                    const res = await callGetMyInfo();
                    setUser(res.data?.result);
                }
            } catch (err: any) {
                // Nếu BE trả lỗi 404 thì cũng xem như "not found"
                setNotFound(true);
            } finally {
                setLoading(false);
            }
        })();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [username]);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-[70vh]">
                <Spin size="large" />
            </div>
        );
    }

    // Nếu không tìm thấy user, hiển thị giao diện thông báo
    if (notFound) {
        return (
            <div className="flex flex-col items-center justify-center h-[70vh] text-center">
                <img
                    src="/notfound-user.png"
                    alt="Not found"
                    className="w-[180px] h-[180px] mb-5 opacity-80"
                    onError={(e) =>
                        ((e.target as HTMLImageElement).style.display = "none")
                    }
                />
                <h2 className="text-xl font-semibold text-gray-700 mb-2">
                    Không tìm thấy người dùng này
                </h2>
                <p className="text-gray-500 text-sm">
                    Tài khoản bạn đang tìm kiếm có thể đã bị xóa hoặc chưa tồn
                    tại.
                </p>
            </div>
        );
    }

    if (!user) return null;

    const isPublic = Boolean(username);
    const isSelf = !isPublic && currentUser?.id === user?.id;

    return (
        <div className="flex flex-col lg:flex-row gap-4">
            <div className="w-full md:w-[25%]">
                <UserSidebar
                    user={user}
                    activeTab={activeTab}
                    setActiveTab={setActiveTab}
                    isPublic={isPublic}
                    isSelf={isSelf}
                />
            </div>

            <div className="w-full md:w-[75%]">
                <UserInfoPanel
                    user={user}
                    activeTab={activeTab}
                    onUserUpdated={setUser}
                    isPublic={isPublic}
                />
            </div>
        </div>
    );
}
