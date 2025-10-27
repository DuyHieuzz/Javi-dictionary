import { useState } from "react";
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
import type { PremiumType } from "@/types/backend";

interface Props {
    user: any;
    activeTab: "overview" | "activity" | "security";
    onUserUpdated?: (u: any) => void;
    isPublic?: boolean;
}

export default function UserInfoPanel({
    user,
    activeTab,
    onUserUpdated,
    isPublic = false,
}: Props) {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [form] = Form.useForm();
    const [intro, setIntro] = useState(user.selfIntroduction || "");
    const [roles, setRoles] = useState<{ label: string; value: number }[]>([]);
    const { user: userLogin, token, setAuth, clearAuth } = useAuthStore();

    const canManageUser = userLogin?.role?.permissions?.some(
        (p: any) => p.name === "MANAGE_USER"
    );
    const canManageRole = userLogin?.role?.permissions?.some(
        (p: any) => p.name === "MANAGE_ROLE"
    );
    const isSelf = userLogin?.id === user?.id;

    const showEditButton =
        !isPublic && (isSelf || canManageUser || canManageRole);

    const handleOpenModal = async () => {
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

        if (canManageRole) {
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

    const handleSubmit = async () => {
        try {
            const values = await form.validateFields();

            const isTargetAdmin = user.role?.name === "ADMIN";
            const isTryingToBlock =
                values.status !== undefined && values.status === false;
            const isRoleChanged = values.role && values.role !== user.role?.id;
            const isInfoChanged =
                values.fullName !== user.fullName ||
                values.level !== user.level ||
                intro !== user.selfIntroduction;
            const isPremiumChanged = !!values.premiumType;

            if (isTargetAdmin && isTryingToBlock) {
                message.warning("Không thể khóa tài khoản ADMIN!");
                return;
            }
            if (isTargetAdmin && isRoleChanged) {
                message.warning("Không thể thay đổi vai trò ADMIN!");
                return;
            }

            const formattedDob = values.dateOfBirth
                ? dayjs(values.dateOfBirth).format("YYYY-MM-DD")
                : null;

            // ✅ Cập nhật thông tin chung
            if (!isPublic && (isInfoChanged || isRoleChanged)) {
                const payload = {
                    username: values.username,
                    fullName: values.fullName,
                    dateOfBirth: formattedDob,
                    level: values.level,
                    selfIntroduction: intro,
                    roleId: values.role,
                };

                const res = await callUpdateUserById(user.id, payload);
                if (res.data?.result) {
                    message.success("Cập nhật thông tin thành công!");
                    if (isSelf) {
                        setAuth({
                            token: token!,
                            tokenType: "Bearer",
                            refresh_token: "",
                            user: res.data.result,
                        });
                    }
                    onUserUpdated?.(res.data.result);
                }
            }

            // ✅ Block / Unblock (chỉ MANAGE_USER)
            if (!isPublic && canManageUser) {
                if (isTryingToBlock && user.status !== "BLOCKED") {
                    await callBlockUser(user.id);
                    message.success("Tài khoản đã bị khóa");
                    if (isSelf) clearAuth();
                    onUserUpdated?.({ ...user, status: "BLOCKED" });
                } else if (
                    values.status === true &&
                    user.status === "BLOCKED"
                ) {
                    await callUnblockUser(user.id);
                    message.success("Tài khoản đã được mở khóa");
                    onUserUpdated?.({ ...user, status: "ACTIVE" });
                }
            }

            // ✅ Nâng cấp Premium (chỉ khi chọn gói)
            if (!isPublic && canManageUser && isPremiumChanged) {
                const res = await callUpgradePremium(
                    user.id,
                    values.premiumType
                );
                if (res.data?.result) {
                    message.success("Nâng cấp Premium thành công!");
                    onUserUpdated?.(res.data.result);
                }
            }

            setIsModalOpen(false);
        } catch (err) {
            message.error("Vui lòng kiểm tra lại thông tin");
        }
    };

    if (activeTab !== "overview") return null;

    return (
        <div className="bg-white rounded-2xl shadow p-3">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-gray-200">
                <h3 className="text-base mb-2">Thông tin cá nhân</h3>
                {showEditButton && (
                    <button
                        onClick={handleOpenModal}
                        className="bg-[#3e67d6] w-[28px] h-[28px] rounded-full flex items-center justify-center text-white hover:bg-[#3558b6]"
                    >
                        <PiNotePencilLight className="text-xl items-center" />
                    </button>
                )}
            </div>

            {/* Body giữ nguyên */}
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
                    <Descriptions.Item label="Giới thiệu bản thân">
                        <div
                            className="prose text-gray-600"
                            dangerouslySetInnerHTML={{
                                __html: user.selfIntroduction || "—",
                            }}
                        />
                    </Descriptions.Item>
                </Descriptions>
            </div>

            {/* Vai trò & Quyền hạn giữ nguyên */}
            {!isPublic && canManageUser && (
                <>
                    <h4 className="text-base text-[#3e67d6] mb-2 border-b border-gray-200 pb-3">
                        Vai trò & Quyền hạn
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-gray-700">
                        <div>
                            <p className="font-normal text-[15px] mb-1">
                                Role: <span>{user.role?.name}</span>
                            </p>
                            <p className="text-gray-600 mb-2 text-sm">
                                {user.role?.description}
                            </p>
                        </div>
                        <div className="md:mt-2">
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

            {/* Modal cập nhật */}
            <Modal
                title="Cập nhật thông tin người dùng"
                open={isModalOpen}
                onCancel={() => setIsModalOpen(false)}
                onOk={handleSubmit}
                okText="Lưu thay đổi"
                cancelText="Hủy"
                width={750}
            >
                <Form layout="vertical" form={form}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Form.Item
                            name="fullName"
                            label="Họ và tên"
                            rules={[{ required: true }]}
                        >
                            <Input
                                placeholder="Nhập họ tên"
                                disabled={isPublic}
                            />
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

                        {!isPublic && canManageRole && (
                            <Form.Item name="role" label="Vai trò">
                                <Select
                                    placeholder="Chọn role"
                                    options={roles}
                                />
                            </Form.Item>
                        )}

                        {/* ✅ Nâng cấp Premium: dropdown mới */}
                        {!isPublic && canManageUser && (
                            <Form.Item name="premiumType" label="Gói Premium">
                                <Select
                                    allowClear
                                    placeholder="Chọn gói nâng cấp (tuỳ chọn)"
                                    options={[
                                        {
                                            label: "1 tháng",
                                            value: "MONTHLY_1",
                                        },
                                        {
                                            label: "3 tháng",
                                            value: "MONTHLY_3",
                                        },
                                        {
                                            label: "6 tháng",
                                            value: "MONTHLY_6",
                                        },
                                        {
                                            label: "Trọn đời",
                                            value: "LIFETIME",
                                        },
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

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {!isPublic &&
                            canManageUser &&
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
        </div>
    );
}
