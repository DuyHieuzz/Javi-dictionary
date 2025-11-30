import { useState, useEffect } from "react";
import { FaUser } from "react-icons/fa";
import { PiNotePencilLight } from "react-icons/pi";
import {
    Tag,
    Descriptions,
    Tooltip,
    Modal,
    Form,
    Input,
    Select,
    Switch,
    message,
    DatePicker,
} from "antd";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import dayjs from "dayjs";
import { useAuthStore } from "@/stores/useAuthStore";
import {
    callUpdateUserById,
    callBlockUser,
    callUnblockUser,
    callUpgradePremium,
} from "@/apis/userApi";
import { callGetAllRoles } from "@/apis/roleApi";

interface Props {
    user: any;
    activeTab: "overview" | "activity" | "security";
    onUserUpdated?: (u: any) => void;
    isPublic?: boolean;
    // mới: nếu parent muốn force mở modal
    forceOpen?: boolean;
    // callback để parent biết force open đã xử lý (đặt lại flag)
    onForceOpenHandled?: () => void;
    // optional overrides (giữ backward compat)
    canManageUser?: boolean;
    canManageRole?: boolean;
    isSelfOverride?: boolean;
    // nếu true => chỉ render Modal (không render body/panel)
    modalOnly?: boolean;
}

export default function UserInfoPanel({
    user,
    activeTab,
    onUserUpdated,
    isPublic = false,
    forceOpen = false,
    onForceOpenHandled,
    canManageUser,
    canManageRole,
    isSelfOverride,
    modalOnly = false,
}: Props) {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [form] = Form.useForm();
    const [intro, setIntro] = useState(user.selfIntroduction || "");
    const [roles, setRoles] = useState<{ label: string; value: number }[]>([]);
    const { user: userLogin, token, setAuth, clearAuth } = useAuthStore();

    // tính quyền thực tế xem viewer có quản lý user/role hay không
    const realCanManageUser =
        canManageUser ??
        userLogin?.role?.permissions?.some(
            (p: any) => p.name === "MANAGE_USER"
        );
    const realCanManageRole =
        canManageRole ??
        userLogin?.role?.permissions?.some(
            (p: any) => p.name === "MANAGE_ROLE"
        );
    const isSelf = isSelfOverride ?? userLogin?.id === user?.id;

    const showEditButton =
        !isPublic && (isSelf || realCanManageUser || realCanManageRole);

    const handleOpenModal = async () => {
        // set giá trị mặc định cho form khi mở modal
        form.setFieldsValue({
            fullName: user.fullName,
            username: user.username,
            email: user.email,
            dateOfBirth: user.dateOfBirth
                ? dayjs(user.dateOfBirth).isValid()
                    ? dayjs(user.dateOfBirth)
                    : null
                : null,
            level: user.level ?? null,
            role: user.role?.id ?? undefined,
            status: user.status === "ACTIVE",
            premiumType: undefined,
        });
        setIntro(user.selfIntroduction || "");
        setIsModalOpen(true);

        // nếu viewer có quyền quản role thì load danh sách role để chọn
        if (realCanManageRole) {
            try {
                const res = await callGetAllRoles();
                const options =
                    res.data?.result?.content?.map((r: any) => ({
                        label: r.name,
                        value: r.id,
                    })) || [];
                setRoles(options);
            } catch (err) {
                console.warn("Load roles failed", err);
                setRoles([]);
            }
        }
    };

    // Nếu parent set forceOpen => mở modal (ví dụ admin trigger từ nơi khác)
    useEffect(() => {
        if (forceOpen) {
            handleOpenModal();
            onForceOpenHandled?.();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [forceOpen, user?.id]);

    // Hàm này dài do xử lý nhiều trường hợp: chỉ update info, chỉ block/unblock, cả 2, kiểm tra sửa field hay không, bảo vệ admin, check quyền quản lý role, chỉ upgrade premium
    const handleSubmit = async () => {
        // ====== LẤY GIÁ TRỊ THÔ ======
        const rawValues = form.getFieldsValue();

        // trạng thái toggle (false = muốn block)
        const wantsBlocked =
            rawValues.status !== undefined && rawValues.status === false;
        const wantsUnblocked = rawValues.status === true;
        const isTargetAdmin = user.role?.name === "ADMIN";

        // ===== helpers normalize =====
        const normalizeStr = (v: any) =>
            v === null || v === undefined ? "" : String(v).trim();
        const normalizeDate = (d: any) => {
            if (!d) return "";
            try {
                return dayjs(d).format("YYYY-MM-DD");
            } catch {
                return String(d);
            }
        };
        const normalizeIntro = (v: any) => {
            const s = (v ?? "").toString();
            if (s === "<p><br></p>" || s === "<p></p>") return "";
            return s.trim();
        };

        // ===== giá trị gốc từ user (BE) =====
        const origFullName = normalizeStr(user.fullName);
        const origUsername = normalizeStr(user.username);
        const origDob = normalizeDate(user.dateOfBirth);
        const origLevel = normalizeStr(user.level);
        const origRoleId = user.role?.id ?? null;
        const origPremium = user.premiumType ?? null;
        const origIntro = normalizeIntro(user.selfIntroduction);

        // ===== giá trị hiện tại trên form / intro =====
        const newFullName = normalizeStr(rawValues.fullName);
        const newUsername = normalizeStr(rawValues.username);
        const newDob = normalizeDate(rawValues.dateOfBirth);
        const newLevel = normalizeStr(rawValues.level);
        const newRoleId = rawValues.role ?? null;
        // premium: nếu admin không chọn gì => rawValues.premiumType có thể undefined
        const newPremium = rawValues.premiumType ?? null;
        const newIntro = normalizeIntro(intro);

        // ===== so sánh "chỉ info/role (không tính premium)" =====
        const infoValueChanged =
            newFullName !== origFullName ||
            newUsername !== origUsername ||
            newDob !== origDob ||
            newLevel !== origLevel ||
            newIntro !== origIntro;

        const isRoleChanged = newRoleId !== origRoleId;

        // premium changed?
        const isPremiumChanged =
            newPremium !== origPremium && newPremium !== null;

        // Kiểm tra user có thao tác trên các field thông tin (không tính status)
        // (chỉ detect chỉnh sửa thực sự trên các field info - không bao gồm premiumType ở đây)
        const editedInfoFields = form.isFieldsTouched(
            ["fullName", "username", "dateOfBirth", "level", "role"],
            false
        );

        // Quyết định: user có sửa phần thông tin/role (ngoại trừ premium) không?
        const userEditedInfoOrRole =
            editedInfoFields || infoValueChanged || isRoleChanged;

        // ===== CASE A: KHÔNG sửa info/role (chỉ có thể là: không thay gì, hoặc chỉ thay premium) =====
        if (!userEditedInfoOrRole) {
            // --- START replacement: xử lý đúng cho các case premium / toggle / premium+toggle ---
            // chặn block admin
            if (isTargetAdmin && wantsBlocked) {
                message.warning("Không thể khóa tài khoản ADMIN!");
                return;
            }

            // Nếu không có quyền quản lý hoặc public -> đóng modal
            if (isPublic || !realCanManageUser) {
                setIsModalOpen(false);
                return;
            }

            // CASE: premium + toggle cùng thay đổi -> upgrade trước rồi block/unblock
            if (isPremiumChanged && (wantsBlocked || wantsUnblocked)) {
                // 1) upgrade
                try {
                    const res = await callUpgradePremium(user.id, newPremium);
                    if (res.status === 200 || res.data?.statusCode === 1000) {
                        message.success("Nâng cấp Premium thành công!");
                        onUserUpdated?.(res.data?.result ?? res.data);
                    } else {
                        message.error(
                            res.data?.message || "Không thể nâng cấp Premium"
                        );
                        // nếu upgrade thất bại thì dừng, không tiếp tục block/unblock
                        return;
                    }
                } catch (err: any) {
                    const msg =
                        err?.response?.data?.message ||
                        err?.message ||
                        "Máy chủ không phản hồi, vui lòng thử lại.";
                    message.error(msg);
                    return;
                }

                // 2) sau upgrade: thực hiện block hoặc unblock theo toggle
                if (wantsBlocked && user.status !== "BLOCKED") {
                    try {
                        const res2 = await callBlockUser(user.id);
                        if (
                            res2.status === 200 ||
                            res2.data?.statusCode === 1000
                        ) {
                            message.success("Tài khoản đã bị khóa");
                            if (isSelf) clearAuth();
                            onUserUpdated?.({ ...user, status: "BLOCKED" });
                            setIsModalOpen(false);
                        } else {
                            message.error(
                                res2.data?.message || "Không thể khóa tài khoản"
                            );
                        }
                    } catch (err: any) {
                        const msg =
                            err?.response?.data?.message ||
                            err?.message ||
                            "Máy chủ không phản hồi, vui lòng thử lại.";
                        message.error(msg);
                    }
                    return;
                }

                if (wantsUnblocked && user.status === "BLOCKED") {
                    try {
                        const res2 = await callUnblockUser(user.id);
                        if (
                            res2.status === 200 ||
                            res2.data?.statusCode === 1000
                        ) {
                            message.success("Tài khoản đã được mở khóa");
                            onUserUpdated?.({ ...user, status: "ACTIVE" });
                            setIsModalOpen(false);
                        } else {
                            message.error(
                                res2.data?.message ||
                                    "Không thể mở khóa tài khoản"
                            );
                        }
                    } catch (err: any) {
                        const msg =
                            err?.response?.data?.message ||
                            err?.message ||
                            "Máy chủ không phản hồi, vui lòng thử lại.";
                        message.error(msg);
                    }
                    return;
                }

                // nếu tới đây nghĩa là không cần block/unblock (vd. toggle không thực sự thay đổi)
                message.info("Không có thay đổi để lưu");
                return;
            }

            // CASE: chỉ premium (không toggle, không info) => chỉ upgrade
            if (isPremiumChanged) {
                try {
                    const res = await callUpgradePremium(user.id, newPremium);
                    if (res.status === 200 || res.data?.statusCode === 1000) {
                        message.success("Nâng cấp Premium thành công!");
                        onUserUpdated?.(res.data?.result ?? res.data);
                        setIsModalOpen(false);
                    } else {
                        message.error(
                            res.data?.message || "Không thể nâng cấp Premium"
                        );
                    }
                } catch (err: any) {
                    const msg =
                        err?.response?.data?.message ||
                        err?.message ||
                        "Máy chủ không phản hồi, vui lòng thử lại.";
                    message.error(msg);
                }
                return;
            }

            // CASE: chỉ toggle (không premium, không info) => chỉ block/unblock
            if (wantsBlocked && user.status !== "BLOCKED") {
                try {
                    const res = await callBlockUser(user.id);
                    if (res.status === 200 || res.data?.statusCode === 1000) {
                        message.success("Tài khoản đã bị khóa");
                        if (isSelf) clearAuth();
                        onUserUpdated?.({ ...user, status: "BLOCKED" });
                        setIsModalOpen(false);
                    } else {
                        message.error(
                            res.data?.message || "Không thể khóa tài khoản"
                        );
                    }
                } catch (err: any) {
                    const msg =
                        err?.response?.data?.message ||
                        err?.message ||
                        "Máy chủ không phản hồi, vui lòng thử lại.";
                    message.error(msg);
                }
                return;
            }

            if (wantsUnblocked && user.status === "BLOCKED") {
                try {
                    const res = await callUnblockUser(user.id);
                    if (res.status === 200 || res.data?.statusCode === 1000) {
                        message.success("Tài khoản đã được mở khóa");
                        onUserUpdated?.({ ...user, status: "ACTIVE" });
                        setIsModalOpen(false);
                    } else {
                        message.error(
                            res.data?.message || "Không thể mở khóa tài khoản"
                        );
                    }
                } catch (err: any) {
                    const msg =
                        err?.response?.data?.message ||
                        err?.message ||
                        "Máy chủ không phản hồi, vui lòng thử lại.";
                    message.error(msg);
                }
                return;
            }

            message.info("Không có thay đổi để lưu");
            return;
            // --- END replacement ---
        }

        // ===== CASE B: user sửa info/role (có thể kèm premium & toggle) =====
        // Validate form (giữ nguyên behavior cũ)
        let values: any;
        try {
            values = await form.validateFields();
        } catch {
            message.error("Vui lòng kiểm tra lại thông tin nhập vào.");
            return;
        }

        // bảo vệ admin: không đổi role của ADMIN, không block admin
        if (isTargetAdmin && isRoleChanged) {
            message.warning("Không thể thay đổi vai trò ADMIN!");
            return;
        }
        if (isTargetAdmin && wantsBlocked) {
            message.warning("Không thể khóa tài khoản ADMIN!");
            return;
        }

        // Nếu cần update (info hoặc role)
        if (!isPublic && (infoValueChanged || isRoleChanged)) {
            const payload = {
                username: values.username,
                fullName: values.fullName,
                dateOfBirth: values.dateOfBirth
                    ? dayjs(values.dateOfBirth).format("YYYY-MM-DD")
                    : null,
                level: values.level,
                selfIntroduction: intro,
                roleId: values.role,
            };

            try {
                const res = await callUpdateUserById(user.id, payload);
                if (res.status === 200 || res.data?.statusCode === 1000) {
                    message.success("Cập nhật thông tin thành công!");
                    if (isSelf && res.data?.result) {
                        setAuth({
                            token: token!,
                            tokenType: "Bearer",
                            refresh_token: "",
                            user: res.data.result,
                        });
                    }
                    onUserUpdated?.(res.data.result);
                } else {
                    message.error(res.data?.message || "Cập nhật thất bại!");
                    return;
                }
            } catch (err: any) {
                const msg =
                    err?.response?.data?.message ||
                    err?.message ||
                    "Máy chủ không phản hồi, vui lòng thử lại sau.";
                message.error(msg);
                return;
            }
        }

        // ===== Sau update (nếu có): NÂNG CẤP PREMIUM nếu admin đã chọn gói mới =====
        if (!isPublic && realCanManageUser && isPremiumChanged) {
            try {
                const res = await callUpgradePremium(user.id, newPremium);
                if (res.status === 200 || res.data?.statusCode === 1000) {
                    message.success("Nâng cấp Premium thành công!");
                    onUserUpdated?.(res.data?.result ?? res.data);
                } else {
                    message.error(
                        res.data?.message || "Không thể nâng cấp Premium"
                    );
                }
            } catch (err: any) {
                const msg =
                    err?.response?.data?.message ||
                    err?.message ||
                    "Máy chủ không phản hồi, vui lòng thử lại.";
                message.error(msg);
                // Lưu ý: vẫn tiếp tục để thực hiện block/unblock nếu có (theo yêu cầu thứ tự)
            }
        }

        // ===== Sau update + upgrade: xử lý block/unblock nếu toggle =====
        if (
            !isPublic &&
            realCanManageUser &&
            wantsBlocked &&
            user.status !== "BLOCKED"
        ) {
            try {
                const res = await callBlockUser(user.id);
                if (res.status === 200 || res.data?.statusCode === 1000) {
                    message.success("Tài khoản đã bị khóa");
                    if (isSelf) clearAuth();
                    onUserUpdated?.({ ...user, status: "BLOCKED" });
                } else {
                    message.error(
                        res.data?.message || "Không thể khóa tài khoản"
                    );
                }
            } catch (err: any) {
                const msg =
                    err?.response?.data?.message ||
                    err?.message ||
                    "Máy chủ không phản hồi, vui lòng thử lại.";
                message.error(msg);
            }
        }

        if (
            !isPublic &&
            realCanManageUser &&
            wantsUnblocked &&
            user.status === "BLOCKED"
        ) {
            try {
                const res = await callUnblockUser(user.id);
                if (res.status === 200 || res.data?.statusCode === 1000) {
                    message.success("Tài khoản đã được mở khóa");
                    onUserUpdated?.({ ...user, status: "ACTIVE" });
                } else {
                    message.error(
                        res.data?.message || "Không thể mở khóa tài khoản"
                    );
                }
            } catch (err: any) {
                const msg =
                    err?.response?.data?.message ||
                    err?.message ||
                    "Máy chủ không phản hồi, vui lòng thử lại.";
                message.error(msg);
            }
        }

        setIsModalOpen(false);
    };

    // Nếu parent chỉ muốn mount component để dùng modal (ví dụ admin), trả về modal
    const modalElement = (
        <Modal
            title={
                <span className="text-[16px] font-normal">
                    Cập nhật thông tin người dùng
                </span>
            }
            open={isModalOpen}
            onCancel={() => setIsModalOpen(false)}
            onOk={handleSubmit}
            okText="Lưu thay đổi"
            cancelText="Hủy"
            width={900}
            className="with-padding-modal"
            cancelButtonProps={{
                className:
                    "!text-red-600 hover:!text-white hover:!bg-red-500 hover:!border-red-500",
            }}
        >
            <Form layout="vertical" form={form}>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <Form.Item name="fullName" label="Họ và tên">
                        <Input placeholder="Nhập họ tên" disabled={isPublic} />
                    </Form.Item>

                    <Form.Item
                        name="username"
                        label="Tên đăng nhập"
                        rules={[{ required: true }]}
                    >
                        <Input
                            placeholder="Tên đăng nhập"
                            disabled={isPublic}
                        />
                    </Form.Item>

                    <Form.Item name="email" label="Email">
                        <Input disabled />
                    </Form.Item>

                    <Form.Item name="dateOfBirth" label="Ngày sinh">
                        <DatePicker
                            style={{ width: "100%" }}
                            format="DD-MM-YYYY"
                            placeholder="Chọn ngày sinh"
                            disabled={isPublic}
                        />
                    </Form.Item>

                    <Form.Item name="level" label="Trình độ">
                        <Select
                            allowClear
                            options={[
                                { label: "N5", value: "N5" },
                                { label: "N4", value: "N4" },
                                { label: "N3", value: "N3" },
                                { label: "N2", value: "N2" },
                                { label: "N1", value: "N1" },
                            ]}
                            placeholder="Chọn trình độ"
                            disabled={isPublic}
                        />
                    </Form.Item>

                    {!isPublic && realCanManageRole && (
                        <Form.Item name="role" label="Vai trò">
                            <Select placeholder="Chọn role" options={roles} />
                        </Form.Item>
                    )}

                    {!isPublic && realCanManageUser && (
                        <Form.Item name="premiumType" label="Gói Premium">
                            <Select
                                allowClear
                                placeholder="Chọn gói nâng cấp"
                                options={[
                                    { label: "1 tháng", value: "MONTHLY_1" },
                                    { label: "3 tháng", value: "MONTHLY_3" },
                                    { label: "6 tháng", value: "MONTHLY_6" },
                                    { label: "Trọn đời", value: "LIFETIME" },
                                ]}
                            />
                        </Form.Item>
                    )}
                </div>

                <Form.Item label="Giới thiệu bản thân">
                    <ReactQuill
                        value={intro}
                        onChange={setIntro}
                        theme="snow"
                        readOnly={isPublic}
                    />
                </Form.Item>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {!isPublic &&
                        realCanManageUser &&
                        user.role?.name !== "ADMIN" && (
                            <Form.Item
                                name="status"
                                label="Trạng thái tài khoản"
                                valuePropName="checked"
                            >
                                <Switch
                                    checkedChildren="Active"
                                    unCheckedChildren="Blocked"
                                />
                            </Form.Item>
                        )}

                    {!isPublic && user.role?.name === "ADMIN" && (
                        <Form.Item label="Trạng thái tài khoản">
                            <Tag color="blue">ADMIN (Luôn Active)</Tag>
                        </Form.Item>
                    )}
                </div>
            </Form>
        </Modal>
    );

    if (modalOnly) {
        return modalElement;
    }

    // ====== QUYẾT ĐỊNH HIỂN THỊ: nếu activeTab không phải 'overview' thì ẩn hoàn toàn phần body (chỉ giữ modal) ======
    if (activeTab !== "overview") {
        // trả về modal để modal vẫn có thể mở khi component mount
        return modalElement;
    }
    // ================================================================================================

    return (
        <div className="bg-white rounded-2xl shadow p-3">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-gray-200">
                <h3 className="text-base">Thông tin cá nhân</h3>
                {showEditButton && (
                    <button
                        onClick={handleOpenModal}
                        className="bg-[#3e67d6] w-[28px] h-[28px] rounded-full flex items-center justify-center text-white hover:bg-[#3558b6]"
                    >
                        <PiNotePencilLight className="text-xl items-center" />
                    </button>
                )}
            </div>

            {/* Body */}
            <div className="pb-3">
                <div className="flex items-center justify-start gap-2 text-base my-3">
                    <div className="bg-[#3e67d6] w-[26px] h-[26px] rounded-full flex items-center justify-center text-white">
                        <FaUser className="text-sm items-center" />
                    </div>
                    Thông tin cơ bản
                </div>

                <p className="text-[14px] font-normal mb-3">
                    Họ và tên:{" "}
                    <span className="text-gray-500">{user.fullName}</span>
                </p>

                <p className="text-[14px] font-normal mb-3">
                    Tên đăng nhập:{" "}
                    <span className="text-gray-500">{user.username}</span>
                </p>

                {user.email && (
                    <p className="text-[14px] font-normal mb-3">
                        Email:{" "}
                        <span className="text-gray-500 mr-2">{user.email}</span>
                        {user.verified ? (
                            <Tag color="green">verified</Tag>
                        ) : (
                            <Tag color="volcano">unverified</Tag>
                        )}
                    </p>
                )}

                <p className="text-[14px] font-normal mb-3">
                    Ngày sinh:{" "}
                    <span className="text-gray-500">
                        {user.dateOfBirth && dayjs(user.dateOfBirth).isValid()
                            ? dayjs(user.dateOfBirth).format("DD-MM-YYYY")
                            : "—"}
                    </span>
                </p>

                <p className="text-[14px] font-normal mb-3">
                    Trình độ:{" "}
                    <span className="text-gray-500">{user.level || "—"}</span>
                </p>

                <Descriptions bordered column={1} size="small">
                    <Descriptions.Item
                        label="Giới thiệu bản thân"
                        labelStyle={{ width: 160 }}
                    >
                        <div
                            className="prose text-gray-600 break-words whitespace-normal"
                            dangerouslySetInnerHTML={{
                                __html: user.selfIntroduction || "—",
                            }}
                        />
                    </Descriptions.Item>
                </Descriptions>
            </div>

            {/* CHANGED: hiển thị phần Vai trò & Quyền hạn nếu viewer có quyền quản lý user (realCanManageUser) */}
            {realCanManageUser && (
                <>
                    <h4 className="text-base text-[#3e67d6] border-b border-gray-200 pb-3">
                        Vai trò & Quyền hạn
                    </h4>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-2 text-gray-700 mt-3">
                        <div>
                            <p className="font-normal text-[15px] mb-1">
                                Role: <span>{user.role?.name}</span>
                            </p>
                            <p className="text-gray-600 mb-2 text-sm">
                                {user.role?.description}
                            </p>
                        </div>
                        <div className="lg:mt-2">
                            <div className="flex flex-wrap gap-2">
                                {user.role?.permissions?.map((perm: any) => (
                                    <Tooltip
                                        key={perm.id}
                                        title={
                                            perm.description || "Không có mô tả"
                                        }
                                        placement="top"
                                        color="#3e67d6"
                                    >
                                        <span className="px-2 py-[2px] bg-[#eef2ff] text-[#3e67d6] text-xs rounded-md border border-[#cdd5ff] cursor-help hover:bg-[#e5e9ff] transition-colors">
                                            {perm.name}
                                        </span>
                                    </Tooltip>
                                ))}
                            </div>
                        </div>
                    </div>
                </>
            )}

            {/* Modal */}
            {modalElement}
        </div>
    );
}
