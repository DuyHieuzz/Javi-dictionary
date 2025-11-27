import { useEffect, useState, useMemo } from "react";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import {
    callGetAllUsers,
    callCreateUser,
    callUpgradePremium,
    callGetUserById,
} from "@/apis/userApi";
import { callGetAllRolesList } from "@/apis/roleApi";
import { useAuthStore } from "@/stores/useAuthStore";

import {
    Avatar,
    Button,
    Tag,
    Table,
    Space,
    Tooltip,
    Typography,
    Modal,
    Form,
    Input,
    Select,
    DatePicker,
    message,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import avatarDefault from "@/assets/avatar.png";
import premium_avatar from "@/assets/premium-avatar.png";
import UserInfoPanel from "@/components/user/UserInfoPanel";
import { FiEdit, FiEye } from "react-icons/fi";
import { PlusOutlined } from "@ant-design/icons";

import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";

import AdminSearchBar, {
    AdminSearchValues,
} from "@/components/admin/AdminSearchBar";

const { Text } = Typography;

export default function AdminUsers() {
    const currentUser = useAuthStore((s) => s.user);
    const navigate = useNavigate();

    // Quyền hiển thị nút tạo: nếu có MANAGE_USER hoặc CREATE_USER sẽ thấy nút Tạo
    const canCreate =
        currentUser?.role?.permissions?.some(
            (p: any) => p.name === "MANAGE_USER" || p.name === "CREATE_USER"
        ) ?? false;

    // Quyền *gán role* khi tạo user:
    // Nếu người đang đăng nhập có permission CREATE_USER thì được gán role,
    // nếu chỉ có MANAGE_USER nhưng không có CREATE_USER thì không được gán role.
    const canAssignRole =
        currentUser?.role?.permissions?.some(
            (p: any) => p.name === "CREATE_USER"
        ) ?? false;

    // Quyền set premium: yêu cầu MANAGE_USER hoặc CREATE_USER
    const canSetPremium =
        currentUser?.role?.permissions?.some(
            (p: any) => p.name === "MANAGE_USER" || p.name === "CREATE_USER"
        ) ?? false;

    const [data, setData] = useState<any[]>([]);
    const [page, setPage] = useState(1); // AntD page is 1-based
    const [size, setSize] = useState(10);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(false);

    // state filter cho thanh search
    const [searchValues, setSearchValues] = useState<AdminSearchValues>({});

    // modal inline editor
    const [editingUser, setEditingUser] = useState<any | null>(null);
    const [forceOpenEditor, setForceOpenEditor] = useState(false);

    // ----- Modal Tạo user state -----
    const [createModalOpen, setCreateModalOpen] = useState(false);
    const [creating, setCreating] = useState(false);
    const [rolesOptions, setRolesOptions] = useState<
        { label: string; value: number }[]
    >([]);
    const [createForm] = Form.useForm();
    const [selfIntro, setSelfIntro] = useState<string>(""); // // lưu nội dung ReactQuill (HTML)

    // Hàm build chuỗi filter turkraft cho màn user
    const buildUserFilter = (values: AdminSearchValues): string | undefined => {
        const parts: string[] = [];

        // // chuẩn hoá keyword (tìm theo username, fullName, email)
        if (values.keyword && values.keyword.trim()) {
            const kw = values.keyword.trim().replace(/'/g, ""); // // bỏ ký tự ' để tránh lỗi cú pháp
            // ~ là like, đúng theo docs spring-filter
            parts.push(
                `(username ~ '${kw}' or fullName ~ '${kw}' or email ~ '${kw}')`
            );
        }

        // // trạng thái ACTIVE / BLOCKED → dùng toán tử :
        if (values.status) {
            parts.push(`status : '${values.status}'`);
        }

        // // lọc theo JLPT level: cho phép chọn nhiều level cùng lúc
        if (values.levels && values.levels.length > 0) {
            if (values.levels.length === 1) {
                // // 1 level thì so sánh trực tiếp
                parts.push(`level : '${values.levels[0]}'`);
            } else {
                // // nhiều level: dùng cú pháp in [x, y]
                const lvList = values.levels.map((lv) => `'${lv}'`).join(", ");
                parts.push(`level in [${lvList}]`);
                // ví dụ: level in ['N2', 'N3']
            }
        }

        // // lọc theo role nếu có (role.id) → dùng :
        if (values.roleId) {
            parts.push(`role.id : ${values.roleId}`);
        }

        if (parts.length === 0) return undefined;
        // // các điều kiện nối với nhau bằng and
        return parts.join(" and ");
    };

    // Load toàn bộ role để hiển thị trong filter
    useEffect(() => {
        (async () => {
            try {
                const res: any = await callGetAllRolesList(); // <-- dùng API lấy tất cả role (không phân trang)
                const payload = res?.data?.result ?? res?.data ?? res;
                // payload có thể là mảng role trực tiếp hoặc { result: [...] }
                const list = Array.isArray(payload)
                    ? payload
                    : payload?.content ?? payload;
                const options =
                    Array.isArray(list) && list.length > 0
                        ? list.map((r: any) => ({ label: r.name, value: r.id }))
                        : [];
                setRolesOptions(options);
            } catch (err) {
                console.warn("Load roles for filter failed", err);
                setRolesOptions([]);
            }
        })();
    }, []);

    // load users
    useEffect(() => {
        loadUsers();
    }, [page, size, searchValues]);

    async function loadUsers() {
        try {
            setLoading(true);
            const params: any = { page: page - 1, size };

            // // build chuỗi filter từ state searchValues
            const filter = buildUserFilter(searchValues);
            if (filter) {
                params.filter = filter;
            }

            const res: any = await callGetAllUsers(params);
            const payload: any =
                res?.data?.result ?? res?.data?.data ?? res?.data ?? res;

            if (payload && Array.isArray(payload.content)) {
                setData(payload.content);
                setTotal(Number(payload.totalElements ?? payload.total ?? 0));
            } else if (Array.isArray(payload)) {
                setData(payload);
                setTotal(payload.length);
            } else {
                setData([]);
                setTotal(0);
            }
        } catch (err) {
            console.error(err);
            toast.error("Không thể tải danh sách người dùng");
        } finally {
            setLoading(false);
        }
    }

    // Khi admin nhấn Sửa: fetch user chi tiết rồi mở modal edit với dữ liệu đầy đủ
    const openEditUserById = async (id: number) => {
        try {
            const res: any = await callGetUserById(id);
            const payload = res?.data?.result ?? res?.data ?? res;
            if (!payload) {
                toast.error("Không lấy được dữ liệu user chi tiết");
                return;
            }
            setEditingUser(payload);
            setForceOpenEditor(true);
        } catch (err) {
            console.error("Lấy user chi tiết thất bại", err);
            toast.error("Lấy thông tin người dùng thất bại");
        }
    };

    function onUserUpdatedCallback(updated: any) {
        if (!updated) return;
        setData((prev) => prev.map((u) => (u.id === updated.id ? updated : u)));
        if (editingUser?.id === updated.id) setEditingUser(updated);
    }

    function formatLocalDateTimeArray(arr: any): string {
        if (!arr) return "Trọn đời";
        if (typeof arr === "string") {
            try {
                const d = new Date(arr);
                if (!isNaN(d.getTime())) return d.toLocaleDateString();
            } catch {}
        }
        if (Array.isArray(arr) && arr.length >= 3) {
            try {
                const [year, month, day, hour = 0, minute = 0, second = 0] =
                    arr;
                const dt = new Date(year, month - 1, day, hour, minute, second);
                if (!isNaN(dt.getTime())) return dt.toLocaleDateString();
                return "Không xác định";
            } catch {
                return "Không xác định";
            }
        }
        return "Không xác định";
    }

    // ================= Columns Table (giữ nguyên hầu hết) =================
    const columns: ColumnsType<any> = useMemo(
        () => [
            {
                title: "Người dùng",
                dataIndex: "username",
                key: "user",
                render: (_: any, record: any) => {
                    const avatarSrc = record.avatarUrl || avatarDefault;
                    const isPremium = record.accountType === "PREMIUM";
                    return (
                        <div
                            style={{
                                display: "flex",
                                gap: 12,
                                alignItems: "center",
                            }}
                        >
                            <div
                                style={{
                                    position: "relative",
                                    width: 56,
                                    height: 56,
                                }}
                            >
                                <Avatar src={avatarSrc} size={56} />
                                {isPremium && (
                                    <div
                                        style={{
                                            position: "absolute",
                                            left: "50%",
                                            top: "36%",
                                            width: 80,
                                            height: 80,
                                            transform: "translate(-50%, -50%)",
                                            backgroundImage: `url(${premium_avatar})`,
                                            backgroundSize: "contain",
                                            backgroundRepeat: "no-repeat",
                                            pointerEvents: "none",
                                        }}
                                    />
                                )}
                            </div>
                            <div>
                                <div style={{ fontWeight: 600 }}>
                                    {record.username}
                                </div>
                                <div
                                    style={{
                                        fontSize: 12,
                                        color: "#6b7280",
                                    }}
                                >
                                    {record.fullName}
                                </div>
                            </div>
                        </div>
                    );
                },
                width: 300,
            },
            {
                title: "Email",
                dataIndex: "email",
                key: "email",
                render: (email: string, record: any) => (
                    <div className="flex items-center gap-2">
                        <div style={{ fontSize: 14 }}>{email}</div>
                        <div>
                            {record.verified ? (
                                <Tag color="green">verified</Tag>
                            ) : (
                                <Tag color="volcano">unverified</Tag>
                            )}
                        </div>
                    </div>
                ),
            },
            {
                title: "Trình độ",
                dataIndex: "level",
                key: "level",
                render: (l: any) => l ?? "-",
                width: 100,
                align: "center",
            },
            {
                title: "Vai trò",
                dataIndex: ["role", "name"],
                key: "role",
                render: (roleName: string) => <Text>{roleName}</Text>,
                width: 120,
                align: "center",
            },
            {
                title: "Premium",
                dataIndex: "premiumExpiredAt",
                key: "premium",
                render: (_: any, record: any) => {
                    if (record.accountType !== "PREMIUM") return "-";
                    return formatLocalDateTimeArray(record.premiumExpiredAt);
                },
                width: 140,
                align: "center",
            },
            {
                title: "Trạng thái",
                dataIndex: "status",
                key: "status",
                render: (status: string) =>
                    status === "ACTIVE" ? (
                        <Tag color="green">ACTIVE</Tag>
                    ) : (
                        <Tag color="red">BLOCKED</Tag>
                    ),
                width: 120,
                align: "center",
            },
            {
                title: "Hành động",
                key: "actions",
                render: (_: any, record: any) => {
                    // const isAdminRole = record?.role?.name === "ADMIN";
                    return (
                        <Space
                            size="small"
                            split={null}
                            style={{
                                display: "flex", // // bắt Space thành flex container
                                width: "100%", // // chiếm toàn bộ chiều ngang cell
                                justifyContent: "center", // // căn giữa hoàn toàn nội dung
                                minWidth: 180,
                            }}
                        >
                            <Tooltip title="Xem chi tiết">
                                <button
                                    onClick={() =>
                                        navigate(
                                            `/users/profile/${record.username}`,
                                            {
                                                state: {
                                                    adminView: true,
                                                    userId: record.id,
                                                },
                                            }
                                        )
                                    }
                                    className="px-3 py-[5px] flex items-center gap-1 rounded-md text-white bg-blue-500 hover:bg-blue-600 transition"
                                >
                                    <FiEye className="text-[15px]" />
                                    Xem
                                </button>
                            </Tooltip>

                            <Tooltip title="Chỉnh sửa">
                                <button
                                    onClick={() => openEditUserById(record.id)} // // fetch user chi tiết trước khi set
                                    className="px-3 py-[5px] flex items-center gap-1 rounded-md text-white bg-amber-500 hover:bg-amber-600 transition"
                                >
                                    <FiEdit className="text-[15px]" />
                                    Sửa
                                </button>
                            </Tooltip>
                        </Space>
                    );
                },
                align: "center",
                width: 160,
            },
        ],
        [navigate]
    );

    // ========================= Tạo User Modal handlers =========================
    const openCreateModal = async () => {
        // set giá trị mặc định cho form
        createForm.setFieldsValue({
            fullName: "",
            username: "",
            email: "",
            password: "123456", // // mật khẩu mặc định hiển thị (không che)
            confirmPassword: "123456",
            dateOfBirth: undefined,
            level: undefined,
            selfIntroduction: "",
            avatarUrl: undefined,
            roleId: undefined,
            status: "ACTIVE",
            accountType: "FREE",
            premiumType: undefined,
        });

        // reset ReactQuill nội dung
        setSelfIntro("");

        // Nếu người tạo có quyền gán role thì load danh sách role để chọn
        if (canAssignRole) {
            try {
                // dùng API lấy tất cả role không phân trang
                const res: any = await callGetAllRolesList();
                const payload = res?.data?.result ?? res?.data ?? res;
                const list = Array.isArray(payload)
                    ? payload
                    : payload?.content ?? payload;
                const options =
                    Array.isArray(list) && list.length > 0
                        ? list.map((r: any) => ({ label: r.name, value: r.id }))
                        : [];
                setRolesOptions(options);
            } catch (err) {
                console.warn("Tải vai trò thất bại", err);
                setRolesOptions([]);
            }
        } else {
            setRolesOptions([]);
        }

        setCreateModalOpen(true);
    };

    const handleCreateCancel = () => {
        setCreateModalOpen(false);
        createForm.resetFields();
        setSelfIntro("");
    };

    const handleCreateSubmit = async () => {
        try {
            const values = await createForm.validateFields();

            // kiểm tra password xác nhận
            if (values.password !== values.confirmPassword) {
                message.error("Mật khẩu xác nhận không khớp.");
                return;
            }

            // chuẩn bị payload để gọi API tạo user
            const payload: any = {
                fullName: values.fullName,
                username: values.username,
                email: values.email,
                password: values.password,
                dateOfBirth: values.dateOfBirth
                    ? values.dateOfBirth.format("YYYY-MM-DD")
                    : null,
                level: values.level,
                // Lưu nội dung giới thiệu như HTML từ ReactQuill
                selfIntroduction: selfIntro,
                avatarUrl: values.avatarUrl,
                // Nếu người tạo có quyền gán role thì gửi roleId, ngược lại backend sẽ gán role USER mặc định
                roleId: canAssignRole ? values.roleId : undefined,
                status: values.status,
                accountType: values.accountType,
            };

            setCreating(true);
            const res = await callCreateUser(payload);

            // ----- an toàn hơn khi parse response (có thể là IBackendRes<IUserResponse> hoặc IUserResponse) -----
            const data = res?.data as any;

            let createdUser: any | undefined;

            if (!data) {
                // không có data trả về
                toast.error(
                    "Tạo người dùng thất bại: server không trả về dữ liệu."
                );
                setCreating(false);
                return;
            }

            if (typeof data === "object" && "result" in data && data.result) {
                // trường hợp API đóng gói trong IBackendRes
                createdUser = data.result;
            } else {
                // trường hợp API trả trực tiếp IUserResponse
                createdUser = data;
            }

            if (!createdUser || !createdUser.id) {
                toast.error(
                    "Tạo người dùng thất bại: server không trả về dữ liệu user."
                );
                setCreating(false);
                return;
            }

            // Nếu admin chọn premium và có quyền thì gọi API set premium sau khi tạo
            if (canSetPremium && values.premiumType) {
                try {
                    await callUpgradePremium(
                        createdUser.id,
                        values.premiumType
                    );
                    // không cần xử lý result chi tiết ở đây
                } catch (err: any) {
                    // nếu set premium lỗi, báo lỗi nhưng vẫn coi user đã tạo thành công
                    const errMsg =
                        err?.response?.data?.message ||
                        err?.message ||
                        "Set premium thất bại";
                    toast.error(errMsg);
                }
            }

            toast.success("Tạo người dùng thành công");
            setCreateModalOpen(false);
            createForm.resetFields();
            setSelfIntro("");
            // reload danh sách
            loadUsers();
        } catch (err: any) {
            console.error("Tạo user thất bại:", err);
            const errMsg =
                err?.response?.data?.message ||
                err?.message ||
                "Tạo user thất bại";
            message.error(errMsg);
        } finally {
            setCreating(false);
        }
    };

    // ======== JSX =========
    return (
        <div className="py-4 px-2">
            {/* Thanh tìm kiếm tách riêng, nằm trên cùng */}
            <AdminSearchBar
                keywordPlaceholder="Tìm theo tên, username hoặc email"
                showLevelFilter={true}
                showStatusFilter={true}
                initialValues={searchValues}
                roleOptions={rolesOptions}
                onSearch={(values) => {
                    // // khi search mới thì quay về trang 1
                    setPage(1);
                    setSearchValues(values);
                }}
                onReset={() => {
                    setPage(1);
                    setSearchValues({});
                }}
            />

            <div className="bg-white rounded-2xl shadow p-4">
                <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-base"></h3>

                    {canCreate && (
                        // Nút Tạo: có icon và mở modal tạo user
                        <Button
                            icon={<PlusOutlined />}
                            className="!bg-green-500 !text-white !border-none hover:!bg-green-600 hover:!text-white"
                            onClick={openCreateModal}
                        >
                            Tạo người dùng
                        </Button>
                    )}
                </div>

                {/* Bọc bảng trong div cho phép scroll ngang trên màn hình nhỏ */}
                <div className="w-full overflow-x-auto">
                    <Table
                        rowKey="id"
                        loading={loading}
                        columns={columns}
                        dataSource={data}
                        scroll={{ x: 1200 }}
                        pagination={{
                            current: page,
                            pageSize: size,
                            total,
                            showSizeChanger: true,
                            pageSizeOptions: ["5", "10", "20", "50"],
                            position: ["bottomCenter"],
                            onChange: (
                                pageNum: number,
                                pageSizeNew?: number
                            ) => {
                                setForceOpenEditor(false);
                                setPage(pageNum);
                                if (pageSizeNew && pageSizeNew !== size)
                                    setSize(pageSizeNew);
                            },
                        }}
                    />
                </div>
            </div>

            {editingUser && (
                <UserInfoPanel
                    user={editingUser}
                    activeTab="overview"
                    onUserUpdated={(u: any) => {
                        onUserUpdatedCallback(u);
                    }}
                    isPublic={false}
                    forceOpen={forceOpenEditor}
                    onForceOpenHandled={() => {
                        setForceOpenEditor(false);
                    }}
                    modalOnly={true}
                    canManageUser={true}
                    canManageRole={true}
                    isSelfOverride={false}
                />
            )}

            {/* ================= Modal tạo user ================= */}
            <Modal
                title={
                    <span className="text-[16px] font-normal">
                        Tạo người dùng mới
                    </span>
                }
                open={createModalOpen}
                onCancel={handleCreateCancel}
                onOk={handleCreateSubmit}
                okText="Tạo"
                cancelText="Hủy"
                confirmLoading={creating}
                width={900}
                className="with-padding-modal"
                cancelButtonProps={{
                    className:
                        "!text-red-600 hover:!text-white hover:!bg-red-500 hover:!border-red-500",
                }}
            >
                <Form layout="vertical" form={createForm}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Form.Item
                            name="Họ và tên"
                            label="Họ và tên"
                            rules={[
                                {
                                    required: true,
                                    message: "Vui lòng nhập họ và tên",
                                },
                            ]}
                        >
                            <Input placeholder="Nhập họ tên" />
                        </Form.Item>

                        <Form.Item
                            name="Tên đăng nhập"
                            label="Tên đăng nhập"
                            rules={[
                                {
                                    required: true,
                                    message: "Vui lòng nhập tên đăng nhập",
                                },
                                {
                                    min: 4,
                                    message: "Tên đăng nhập tối thiểu 4 ký tự",
                                },
                            ]}
                        >
                            <Input placeholder="Tên đăng nhập" />
                        </Form.Item>

                        <Form.Item
                            name="email"
                            label="Email"
                            rules={[
                                {
                                    required: true,
                                    message: "Vui lòng nhập email",
                                },
                                {
                                    type: "email",
                                    message: "Email không hợp lệ",
                                },
                            ]}
                        >
                            <Input placeholder="Email" />
                        </Form.Item>

                        <Form.Item name="dateOfBirth" label="Ngày sinh">
                            <DatePicker
                                style={{ width: "100%" }}
                                format="DD-MM-YYYY"
                                placeholder="Chọn ngày sinh"
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
                            />
                        </Form.Item>

                        {/* Nếu người tạo có quyền gán role (CREATE_USER) thì hiện select role */}
                        {canAssignRole && (
                            <Form.Item name="roleId" label="Vai trò">
                                <Select
                                    placeholder="Chọn role"
                                    options={rolesOptions}
                                />
                            </Form.Item>
                        )}

                        <Form.Item
                            name="password"
                            label="Mật khẩu"
                            rules={[
                                {
                                    required: true,
                                    message: "Vui lòng nhập mật khẩu",
                                },
                                {
                                    min: 6,
                                    message: "Mật khẩu tối thiểu 6 ký tự",
                                },
                            ]}
                        >
                            {/* Mật khẩu hiển thị mặc định là 123456 (admin có thể sửa) */}
                            <Input placeholder="Mật khẩu (mặc định 123456)" />
                        </Form.Item>

                        <Form.Item
                            name="confirmPassword"
                            label="Xác nhận mật khẩu"
                            rules={[
                                {
                                    required: true,
                                    message: "Vui lòng xác nhận mật khẩu",
                                },
                            ]}
                        >
                            <Input placeholder="Xác nhận mật khẩu" />
                        </Form.Item>

                        {/* Nếu có quyền set premium thì hiển thị select premium */}
                        {canSetPremium && (
                            <Form.Item name="premiumType" label="Gói Premium">
                                <Select
                                    allowClear
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
                                    placeholder="Chọn gói Premium"
                                />
                            </Form.Item>
                        )}
                    </div>

                    {/* Giới thiệu bản thân: dùng ReactQuill giống modal cập nhật */}
                    <Form.Item label="Giới thiệu bản thân">
                        <ReactQuill value={selfIntro} onChange={setSelfIntro} />
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
}
