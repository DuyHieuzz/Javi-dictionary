import { useEffect, useMemo, useState } from "react";
import {
    Table,
    Button,
    Form,
    Input,
    Modal,
    Space,
    Tag,
    message,
    Popconfirm,
    Row,
    Col,
    Tooltip,
    Select,
    Divider,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import { PlusOutlined, SearchOutlined } from "@ant-design/icons";
import {
    callGetAllRoles,
    callCreateRole,
    callUpdateRole,
    callDeleteRole,
    callGetRoleById,
} from "@/apis/roleApi";
import { callGetPermissionsAll } from "@/apis/permissionApi";
import type { IRole, IBackendRes, IPermission } from "@/types/backend";
import { useAuthStore } from "@/stores/useAuthStore";
import { hasPermission } from "@/utils/permission";
import { FiEdit, FiTrash2, FiEye } from "react-icons/fi";
import dayjs from "dayjs";

type SystemFilterOption = "SYSTEM" | "CUSTOM";

export default function AdminRole() {
    const user = useAuthStore((s: any) => s.user);
    const canManage = hasPermission(user, "MANAGE_ROLE");

    const [data, setData] = useState<IRole[]>([]);
    const [loading, setLoading] = useState(false);
    const [page, setPage] = useState<number>(1);
    const [size, setSize] = useState<number>(20);
    const [total, setTotal] = useState<number>(0);

    const [keyword, setKeyword] = useState<string>("");
    // state cho filter select
    const [systemFilterOptions, setSystemFilterOptions] = useState<
        SystemFilterOption[]
    >([]);
    const [searchForm] = Form.useForm();

    const [modalOpen, setModalOpen] = useState(false);
    const [mode, setMode] = useState<"create" | "edit" | "view">("create");
    const [editing, setEditing] = useState<IRole | null>(null);
    const [form] = Form.useForm();
    const [saving, setSaving] = useState(false);

    const [allPermissions, setAllPermissions] = useState<IPermission[]>([]);
    const [permsLoading, setPermsLoading] = useState(false);

    const [reloadKey, setReloadKey] = useState(0);

    const buildFilter = (): string | undefined => {
        const parts: string[] = [];
        const kw = (keyword || "").trim();
        if (kw) {
            const safe = kw.replace(/'/g, "");
            parts.push(`(name ~~ '*${safe}*' or description ~~ '*${safe}*')`);
        }

        const opts = Array.isArray(systemFilterOptions)
            ? systemFilterOptions
            : [];
        const hasSystem = opts.includes("SYSTEM");
        const hasCustom = opts.includes("CUSTOM");

        if (hasSystem && !hasCustom) {
            parts.push(`isSystemRole : true`);
        } else if (!hasSystem && hasCustom) {
            parts.push(`isSystemRole : false`);
        }
        return parts.length > 0 ? parts.join(" and ") : undefined;
    };

    useEffect(() => {
        fetchPage(page);
    }, [page, size, reloadKey]);

    async function fetchPage(p: number = 1) {
        setLoading(true);
        try {
            const params: any = {
                page: p - 1,
                size,
                sort: "id,desc",
            };
            const filter = buildFilter();
            if (filter) params.filter = filter;
            const res = await callGetAllRoles(params);
            const body: IBackendRes<any> = res?.data || res;
            const pageData = body?.result || body?.data || body;
            const content: IRole[] = pageData?.content || [];
            const totalElements: number =
                pageData?.totalElements ?? content.length;
            setData(content);
            setTotal(totalElements);
        } catch (err: any) {
            console.error("Lỗi lấy danh sách role:", err);
            message.error(
                err?.response?.data?.message || "Không thể tải danh sách role"
            );
        } finally {
            setLoading(false);
        }
    }

    const handleSearch = () => {
        setPage(1);
        setReloadKey((k) => k + 1);
    };

    const handleClearFilter = () => {
        searchForm.resetFields();
        setKeyword("");
        setSystemFilterOptions([]);
        setPage(1);
        setReloadKey((k) => k + 1);
    };

    const openCreate = async () => {
        setMode("create");
        setEditing(null);
        form.resetFields();
        await loadAllPermissions();
        setModalOpen(true);
    };

    async function loadAllPermissions() {
        if (allPermissions && allPermissions.length > 0) return;
        setPermsLoading(true);
        try {
            const res = await callGetPermissionsAll();
            const body: IBackendRes<any> = res?.data || res;
            const perms: IPermission[] = body?.result || body?.data || body;
            setAllPermissions(perms || []);
        } catch (err: any) {
            console.error("Lỗi lấy permissions toàn bộ:", err);
            message.error(
                err?.response?.data?.message || "Không thể lấy danh sách quyền"
            );
        } finally {
            setPermsLoading(false);
        }
    }

    const openEdit = async (id: number) => {
        setLoading(true);
        try {
            const res = await callGetRoleById(id);
            const role = res?.data?.result as IRole;
            if (!role) {
                message.error("Không tìm thấy role");
                return;
            }
            await loadAllPermissions();

            setEditing(role);
            // hiển thị tên vai trò dạng VIẾT HOA khi sửa
            form.setFieldsValue({
                name: role.name?.toUpperCase?.() ?? role.name,
                description: role.description,
                isSystemRole: role.systemRole,
                permissions: (role.permissions || []).map((p) => p.id),
            });
            setMode("edit");
            setModalOpen(true);
        } catch (err: any) {
            console.error("Lỗi lấy role:", err);
            message.error(
                err?.response?.data?.message || "Không thể lấy thông tin role"
            );
        } finally {
            setLoading(false);
        }
    };

    const openView = async (id: number) => {
        setLoading(true);
        try {
            const res = await callGetRoleById(id);
            const role = res?.data?.result as IRole;
            if (!role) {
                message.error("Không tìm thấy role");
                return;
            }
            await loadAllPermissions();

            setEditing(role);
            // hiển thị tên vai trò dạng VIẾT HOA khi xem
            form.setFieldsValue({
                name: role.name?.toUpperCase?.() ?? role.name,
                description: role.description,
                isSystemRole: role.systemRole,
                permissions: (role.permissions || []).map((p) => p.id),
            });
            setMode("view");
            setModalOpen(true);
        } catch (err: any) {
            console.error("Lỗi lấy role:", err);
            message.error(
                err?.response?.data?.message || "Không thể lấy thông tin role"
            );
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async () => {
        try {
            const values = await form.validateFields();
            setSaving(true);

            const payload = {
                name: (values.name || "").toString().trim().toUpperCase(),
                description: values.description,
                systemRole: !!values.isSystemRole,
                permissions: (values.permissions || []).map((id: number) => ({
                    id,
                })),
            };

            if (mode === "create") {
                await callCreateRole(payload);
                message.success("Tạo role thành công");
            } else if (mode === "edit" && editing) {
                await callUpdateRole(editing.id, payload);
                message.success("Cập nhật role thành công");
            }

            setModalOpen(false);
            setEditing(null);
            setReloadKey((k) => k + 1);
        } catch (err: any) {
            console.error("Lỗi lưu role:", err);
            const msg =
                err?.response?.data?.message || err?.message || "Lỗi khi lưu";
            message.error(msg);
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (record: IRole) => {
        if (record.systemRole) {
            message.error("Không thể xóa role hệ thống");
            return;
        }
        try {
            await callDeleteRole(record.id);
            message.success("Xóa role thành công");
            setReloadKey((k) => k + 1);
        } catch (err: any) {
            console.error("Lỗi xóa role:", err);
            message.error(err?.response?.data?.message || "Xóa thất bại");
        }
    };

    const columns: ColumnsType<IRole> = useMemo(
        () => [
            {
                title: "Vai trò",
                dataIndex: "name",
                key: "name",
                align: "center",
                render: (v: string) => <span className="font-normal">{v}</span>,
            },
            {
                title: "Mô tả",
                dataIndex: "description",
                key: "description",
                render: (d: string) => (
                    <span className="meaning-clamp-2-line">{d || "—"}</span>
                ),
            },
            {
                title: "Quyền",
                dataIndex: "permissions",
                key: "permissions",
                // GIẢM width cột Quyền để nhường không gian cho cột khác;
                width: 560,
                render: (perms: IPermission[], _record: IRole) => (
                    <div className="meaning-clamp">
                        <div className="flex flex-wrap gap-2">
                            {perms?.map((perm: any) => (
                                <Tooltip
                                    key={perm.id}
                                    title={perm.description || "Không có mô tả"}
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
                ),
            },
            {
                title: "Loại vai trò",
                dataIndex: "systemRole",
                key: "systemRole",
                width: 160,
                align: "center",
                render: (isSystem: boolean) =>
                    isSystem ? (
                        <Tag color="success">HỆ THỐNG</Tag>
                    ) : (
                        <Tag color="warning">TÙY CHỈNH</Tag>
                    ),
            },
            {
                title: "Hành động",
                key: "action",
                width: 260,
                align: "center",
                render: (_: any, record: IRole) => (
                    <Space
                        size="small"
                        style={{ display: "flex", justifyContent: "center" }}
                    >
                        <Tooltip title="Xem role">
                            <button
                                onClick={() => openView(record.id)}
                                className="px-3 py-[5px] flex items-center gap-1 rounded-md text-white bg-blue-500 hover:bg-blue-600 transition"
                            >
                                <FiEye className="text-[15px]" />
                                Xem
                            </button>
                        </Tooltip>

                        {canManage && (
                            <Tooltip title="Chỉnh sửa role">
                                <button
                                    onClick={() => openEdit(record.id)}
                                    className="px-3 py-[5px] flex items-center gap-1 rounded-md text-white bg-amber-500 hover:bg-amber-600 transition"
                                >
                                    <FiEdit className="text-[15px]" />
                                    Sửa
                                </button>
                            </Tooltip>
                        )}

                        {canManage && (
                            <Tooltip
                                title={
                                    record.systemRole
                                        ? "Không thể xóa role hệ thống"
                                        : "Xóa role"
                                }
                            >
                                <Popconfirm
                                    title="Xóa role"
                                    description="Bạn có chắc muốn xóa role này?"
                                    okText="Xóa"
                                    cancelText="Hủy"
                                    okButtonProps={{ danger: true }}
                                    onConfirm={() => handleDelete(record)}
                                    disabled={record.systemRole}
                                >
                                    <button
                                        disabled={record.systemRole}
                                        className={`
                                            px-3 py-[5px] flex items-center gap-1 rounded-md text-white
                                            transition ${
                                                record.systemRole
                                                    ? "bg-gray-400 cursor-not-allowed"
                                                    : "bg-red-500 hover:bg-red-600"
                                            }
                                        `}
                                    >
                                        <FiTrash2 className="text-[15px]" />
                                        Xóa
                                    </button>
                                </Popconfirm>
                            </Tooltip>
                        )}
                    </Space>
                ),
            },
        ],
        [canManage]
    );

    // --- Chuẩn bị options cho Select trong modal ---
    // Mỗi option.label là Tooltip để khi hover hiển thị description
    const permissionSelectOptions = (allPermissions || []).map((p) => ({
        label: (
            <Tooltip
                title={p.description || "Không có mô tả"}
                placement="top"
                color="#3e67d6"
            >
                <span>{p.name}</span>
            </Tooltip>
        ),
        value: p.id,
        // disable option nếu đang edit role ADMIN và permission là systemPermission
        disabled: !!(
            editing &&
            (editing.name || "").toString().toUpperCase() === "ADMIN" &&
            p.systemPermission
        ),
    }));

    // --- Handler: khi user gõ tên role, tự động VIẾT HOA (UI cập nhật ngay) ---
    const handleNameInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const v = (e.target.value || "").toString().toUpperCase();
        // cập nhật form field ngay (viết hoa trên UI)
        form.setFieldsValue({ name: v });
    };

    // --- Hàm định dạng ngày từ backend (ISO string, timestamp, hoặc mảng) ---
    function formatBackendDate(d: any): string {
        if (!d) return "-";

        // Nếu BE trả về array [year, month, day, hour, minute, second, nanos]
        if (Array.isArray(d) && d.length >= 6) {
            try {
                const year = Number(d[0]);
                const month = Number(d[1]); // 1-based
                const day = Number(d[2]);
                const hour = Number(d[3] ?? 0);
                const minute = Number(d[4] ?? 0);
                const second = Number(d[5] ?? 0);
                const nanos = Number(d[6] ?? 0);
                const millis = Math.floor(nanos / 1e6);
                const dt = new Date(
                    year,
                    month - 1,
                    day,
                    hour,
                    minute,
                    second,
                    millis
                );
                return dayjs(dt).format("DD/MM/YYYY HH:mm:ss");
            } catch (err) {
                return "-";
            }
        }

        try {
            return dayjs(d).isValid()
                ? dayjs(d).format("DD/MM/YYYY HH:mm:ss")
                : "-";
        } catch (e) {
            return "-";
        }
    }

    return (
        <div className="py-4 px-2">
            <Form form={searchForm} layout="vertical" onFinish={handleSearch}>
                <div className="bg-white rounded-2xl shadow p-4 mb-3">
                    <div className="flex flex-col gap-3">
                        <div className="flex flex-col md:flex-row md:items-end gap-3">
                            <Form.Item
                                name="keyword"
                                label="Từ khóa"
                                className="mb-0 flex-1"
                            >
                                <Input
                                    placeholder="Tìm theo tên hoặc mô tả..."
                                    value={keyword}
                                    autoComplete="off"
                                    onChange={(e) => setKeyword(e.target.value)}
                                    onPressEnter={handleSearch}
                                    suffix={<SearchOutlined />}
                                />
                            </Form.Item>

                            <div className="flex gap-2">
                                <Button type="primary" onClick={handleSearch}>
                                    Tìm kiếm
                                </Button>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
                            {/* --- filter bằng Select multiple như bạn yêu cầu --- */}
                            <Form.Item
                                name="permission"
                                label="Loại vai trò"
                                className="mb-0"
                            >
                                <Select
                                    mode="multiple"
                                    allowClear
                                    placeholder="Chọn loại"
                                    value={systemFilterOptions}
                                    onChange={(vals: SystemFilterOption[]) => {
                                        // CHỈ cập nhật UI state tại đây, KHÔNG gọi API tự động
                                        setSystemFilterOptions(vals || []);
                                    }}
                                    options={[
                                        {
                                            label: "Quyền hệ thống",
                                            value: "SYSTEM",
                                        },
                                        {
                                            label: "Tùy chỉnh",
                                            value: "CUSTOM",
                                        },
                                    ]}
                                    style={{ maxWidth: 430, width: "100%" }}
                                />
                            </Form.Item>

                            <div className="flex md:justify-end md:items-end justify-start">
                                <Button
                                    className="w-full md:w-auto hover:!border-red-500 hover:!text-red-500"
                                    onClick={handleClearFilter}
                                >
                                    Xóa lọc
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </Form>

            <div className="bg-white rounded-2xl shadow p-4 mb-3">
                <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-base"></h3>
                    <div className="flex items-center gap-3">
                        {canManage && (
                            <Button
                                icon={<PlusOutlined />}
                                className="!bg-green-500 !text-white !border-none hover:!bg-green-600 hover:!text-white"
                                onClick={openCreate}
                            >
                                Tạo vai trò
                            </Button>
                        )}
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <Table
                        rowKey="id"
                        loading={loading}
                        columns={columns}
                        dataSource={data}
                        pagination={{
                            current: page,
                            pageSize: size,
                            total,
                            position: ["bottomCenter"],
                            showSizeChanger: true,
                            pageSizeOptions: ["10", "20", "50"],
                            onChange: (p, ps) => {
                                setPage(p);
                                if (ps && ps !== size) setSize(ps);
                            },
                        }}
                        scroll={{ x: 1300 }}
                    />
                </div>
            </div>

            <Modal
                title={
                    <span className="text-[16px] font-normal">
                        {mode === "create"
                            ? "Tạo vai trò mới"
                            : "Chỉnh sửa vai trò"}
                    </span>
                }
                open={modalOpen}
                onCancel={() => {
                    setModalOpen(false);
                    setEditing(null);
                    form.resetFields();
                }}
                onOk={mode === "view" ? undefined : handleSubmit}
                okText={mode === "create" ? "Tạo" : "Lưu"}
                cancelText="Hủy"
                confirmLoading={saving}
                destroyOnClose
                className="with-padding-modal"
                width={900}
                cancelButtonProps={{
                    className:
                        "!text-red-600 hover:!text-white hover:!bg-red-500 hover:!border-red-500",
                }}
            >
                <Form
                    form={form}
                    layout="vertical"
                    initialValues={{ isSystemRole: false, permissions: [] }}
                >
                    <Row gutter={12}>
                        <Col span={24}>
                            {/* Hiển thị audit info nếu ở chế độ view */}
                            {mode === "view" && editing && (
                                <div className="mb-4">
                                    <div className="flex items-center justify-between gap-4">
                                        <div className="flex-1 flex items-center gap-2 min-w-0">
                                            <div className="text-sm text-gray-500 whitespace-nowrap">
                                                Người tạo:
                                            </div>
                                            <div className="font-medium truncate">
                                                {editing.createdBy || "-"}
                                            </div>
                                        </div>
                                        <div className="flex-1 flex items-center gap-2 min-w-0">
                                            <div className="text-sm text-gray-500 whitespace-nowrap">
                                                Ngày tạo:
                                            </div>
                                            <div className="font-medium truncate">
                                                {formatBackendDate(
                                                    editing.createdAt
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between gap-4 mt-2">
                                        <div className="flex-1 flex items-center gap-2 min-w-0">
                                            <div className="text-sm text-gray-500 whitespace-nowrap">
                                                Người cập nhật:
                                            </div>
                                            <div className="font-medium truncate">
                                                {editing.updatedBy || "-"}
                                            </div>
                                        </div>
                                        <div className="flex-1 flex items-center gap-2 min-w-0">
                                            <div className="text-sm text-gray-500 whitespace-nowrap">
                                                Ngày cập nhật:
                                            </div>
                                            <div className="font-medium truncate">
                                                {formatBackendDate(
                                                    editing.updatedAt
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    <Divider />
                                </div>
                            )}
                        </Col>

                        <Col span={24}>
                            <Form.Item
                                label="Tên vai trò"
                                name="name"
                                rules={[
                                    {
                                        required: true,
                                        message: "Vui lòng nhập tên vai trò",
                                    },
                                ]}
                            >
                                {/* bắt sự kiện onChange để tự động viết hoa trên UI */}
                                <Input
                                    placeholder="VD: EDITOR"
                                    disabled={
                                        !!(editing && editing.systemRole) ||
                                        mode === "view"
                                    }
                                    onChange={handleNameInputChange}
                                />
                            </Form.Item>
                        </Col>

                        <Col span={24}>
                            <Form.Item label="Mô tả" name="description">
                                <Input.TextArea
                                    rows={3}
                                    disabled={mode === "view"}
                                />
                            </Form.Item>
                        </Col>

                        <Col span={24}>
                            <Form.Item
                                label="Loại quyền"
                                name="isSystemRole"
                                valuePropName="checked"
                            >
                                <Input
                                    disabled
                                    value={
                                        editing && editing.systemRole
                                            ? "Role hệ thống (không thể sửa)"
                                            : "Tùy chỉnh"
                                    }
                                />
                            </Form.Item>
                        </Col>

                        <Col span={24}>
                            <Divider />
                            <Form.Item
                                label="Danh sách quyền"
                                name="permissions"
                            >
                                {mode === "view" ? (
                                    <div>
                                        <div className="flex flex-wrap gap-2">
                                            {(
                                                form.getFieldValue(
                                                    "permissions"
                                                ) || []
                                            ).map((pid: number) => {
                                                const p = allPermissions.find(
                                                    (x) => x.id === pid
                                                );
                                                if (!p) return null;
                                                return (
                                                    <Tooltip
                                                        key={p.id}
                                                        title={
                                                            p.description ||
                                                            "Không có mô tả"
                                                        }
                                                        placement="top"
                                                        color="#3e67d6"
                                                    >
                                                        <span className="px-2 py-[2px] bg-[#eef2ff] text-[#3e67d6] text-xs rounded-md border border-[#cdd5ff] cursor-help hover:bg-[#e5e9ff] transition-colors">
                                                            {p.name}
                                                        </span>
                                                    </Tooltip>
                                                );
                                            })}
                                        </div>
                                    </div>
                                ) : (
                                    <>
                                        {/* --- Dùng Select multi-dropdown cho permissions --- */}
                                        <Select
                                            mode="multiple"
                                            optionLabelProp="label"
                                            placeholder="Chọn quyền..."
                                            options={permissionSelectOptions}
                                            value={form.getFieldValue(
                                                "permissions"
                                            )}
                                            onChange={(vals: any[]) =>
                                                form.setFieldsValue({
                                                    permissions: vals,
                                                })
                                            }
                                            style={{ width: "100%" }}
                                            // không set maxTagCount để hiển thị đầy đủ tags theo yêu cầu
                                        />
                                        {permsLoading && (
                                            <div className="mt-2 text-sm text-gray-500">
                                                Đang tải danh sách quyền...
                                            </div>
                                        )}
                                        {!permsLoading &&
                                            allPermissions.length === 0 && (
                                                <div className="mt-2 text-sm text-gray-500">
                                                    Không có permission để chọn
                                                </div>
                                            )}
                                    </>
                                )}
                            </Form.Item>
                        </Col>
                    </Row>
                </Form>
            </Modal>
        </div>
    );
}
