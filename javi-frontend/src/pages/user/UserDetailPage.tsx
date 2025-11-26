// src/pages/user/UserDetailPage.tsx
import { useState, useEffect } from "react";
import UserSidebar from "@/components/user/UserSidebar";
import UserInfoPanel from "@/components/user/UserInfoPanel";
import UserSecurityPanel from "@/components/user/UserSecurityPanel";
import UserActivityPanel from "@/components/user/UserActivityPanel";
import {
    callGetMyInfo,
    callGetPublicUserProfile,
    callGetUserById,
} from "@/apis/userApi";
import { Spin } from "antd";
import { useParams, useLocation } from "react-router-dom";
import { useAuthStore } from "@/stores/useAuthStore";

export default function UserDetailPage() {
    const { username } = useParams<{ username?: string }>();
    const location = useLocation();
    // đọc state từ navigate (nếu admin view sẽ truyền { adminView: true, userId })
    const state = (location.state || {}) as {
        adminView?: boolean;
        userId?: number;
    };
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

                if (state.adminView && state.userId) {
                    // nếu là admin view (đi từ màn quản lý) -> gọi API theo id để lấy đầy đủ role & permission
                    const res = await callGetUserById(state.userId);
                    const foundUser = res.data?.result;
                    if (!foundUser) {
                        setNotFound(true);
                        return;
                    }
                    setUser(foundUser);
                    if (activeTab === "security") setActiveTab("overview");
                } else if (username) {
                    // public profile theo username
                    const res = await callGetPublicUserProfile(username);
                    const foundUser = res.data?.result;
                    if (!foundUser) {
                        setNotFound(true);
                        return;
                    }
                    setUser(foundUser);
                    if (activeTab === "security") setActiveTab("overview");
                } else {
                    // my profile
                    const res = await callGetMyInfo();
                    setUser(res.data?.result);
                }
            } catch (err: any) {
                // nếu bển kia trả 404 hoặc lỗi khác -> show notFound
                setNotFound(true);
            } finally {
                setLoading(false);
            }
        })();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [username, state.adminView, state.userId]);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-[70vh]">
                <Spin size="large" />
            </div>
        );
    }

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
    const isSelf =
        (isPublic && username === currentUser?.username) ||
        (!isPublic && currentUser?.id === user?.id);

    return (
        <div className="flex flex-col lg:flex-row gap-4">
            <div className="w-full lg:w-[25%] px-2 lg:px-0">
                <UserSidebar
                    user={user}
                    activeTab={activeTab}
                    setActiveTab={setActiveTab}
                    isPublic={isPublic}
                    isSelf={isSelf}
                />
            </div>

            <div className="w-full lg:w-[75%] px-2 lg:px-0">
                {/*
                  Lưu ý:
                  - Nếu admin view (state.adminView) thì chúng ta đã fetch user bằng id (callGetUserById),
                    do đó user chứa đầy đủ role + permissions.
                  - Nếu public profile (truy cập trực tiếp) thì vẫn dùng callGetPublicUserProfile để
                    chỉ trả data hạn chế.
                  - Nếu muốn admin có thể thấy nút Edit khi xem qua admin, có thể truyền canManageUser prop.
                */}
                <UserInfoPanel
                    user={user}
                    activeTab={activeTab}
                    onUserUpdated={setUser}
                    isPublic={isPublic}
                    // truyền prop để cho phép hiện nút Edit nếu currentUser có quyền quản lý user
                    canManageUser={currentUser?.role?.permissions?.some(
                        (p: any) => p.name === "MANAGE_USER"
                    )}
                />
                {activeTab === "security" && <UserSecurityPanel />}
                {activeTab === "activity" && (
                    <UserActivityPanel
                        pageSize={20}
                        // truyền username từ route (public) hoặc fallback user?.username (admin view)
                        username={username || user?.username || null}
                    />
                )}
            </div>
        </div>
    );
}
