import { useEffect, useMemo, useState } from "react";
import {
    Table,
    Button,
    Form,
    Input,
    Select,
    Modal,
    Space,
    Tag,
    message,
    Popconfirm,
    Row,
    Col,
    Tooltip,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import { PlusOutlined, SearchOutlined } from "@ant-design/icons";
import {
    callGetAllPermissions,
    callCreatePermission,
    callUpdatePermission,
    callDeletePermission,
    callGetPermissionById,
} from "@/apis/permissionApi";
import type { IPermission, IBackendRes } from "@/types/backend";
import { useAuthStore } from "@/stores/useAuthStore";
import { hasPermission } from "@/utils/permission";
import { FiEdit, FiTrash2 } from "react-icons/fi";

// --- Kiểu cho lựa chọn filter (mang nhiều giá trị) ---
type SystemFilterOption = "SYSTEM" | "CUSTOM";

export default function AdminPermission() {
    // lấy user từ store
    const user = useAuthStore((s: any) => s.user);

    // quyền quản trị (dùng helper đã có)
    const canManage = hasPermission(user, "MANAGE_PERMISSION");

    // --- table state ---
    const [data, setData] = useState<IPermission[]>([]);
    const [loading, setLoading] = useState(false);
    const [page, setPage] = useState<number>(1);
    const [size, setSize] = useState<number>(20);
    const [total, setTotal] = useState<number>(0);

    // state lưu tên quyền đã được chuẩn hóa (uppercase + underscores)
    const [nameValue, setNameValue] = useState<string>("");

    // --- search / filter state ---
    const [keyword, setKeyword] = useState<string>("");
    // chuyển từ single string thành array options (multi select)
    const [systemFilterOptions, setSystemFilterOptions] = useState<
        SystemFilterOption[]
    >([]);
    const [searchForm] = Form.useForm();

    // --- modal state ---
    const [modalOpen, setModalOpen] = useState(false);
    const [mode, setMode] = useState<"create" | "edit">("create");
    const [editing, setEditing] = useState<IPermission | null>(null);
    const [form] = Form.useForm();
    const [saving, setSaving] = useState(false);

    // reload trigger
    const [reloadKey, setReloadKey] = useState(0);

    // --- Dựng turkraft filter string
    // Tìm cả name và description
    const buildFilter = (): string | undefined => {
        const parts: string[] = [];
        const kw = (keyword || "").trim();
        if (kw) {
            const safe = kw.replace(/'/g, "");
            // tìm theo tên hoặc mô tả (like)
            parts.push(`(name ~~ '*${safe}*' or description ~~ '*${safe}*')`);
        }

        // xử lý systemFilterOptions
        const opts = Array.isArray(systemFilterOptions)
            ? systemFilterOptions
            : [];
        const hasSystem = opts.includes("SYSTEM");
        const hasCustom = opts.includes("CUSTOM");

        if (hasSystem && !hasCustom) {
            // Gửi đúng tên field BE đang dùng: isSystemPermission
            parts.push(`isSystemPermission : true`);
        } else if (!hasSystem && hasCustom) {
            parts.push(`isSystemPermission : false`);
        }
        // nếu both hoặc none -> không thêm điều kiện về isSystemPermission

        return parts.length > 0 ? parts.join(" and ") : undefined;
    };

    // --- fetch ---
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
            const res = await callGetAllPermissions(params);
            const body: IBackendRes<any> = res?.data || res;
            const pageData = body?.result || body?.data || body;
            const content: IPermission[] = pageData?.content || [];
            const totalElements: number =
                pageData?.totalElements ?? content.length;
            setData(content);
            setTotal(totalElements);
        } catch (err: any) {
            console.error("Lỗi lấy danh sách permission:", err);
            message.error(
                err?.response?.data?.message || "Không thể tải danh sách quyền"
            );
        } finally {
            setLoading(false);
        }
    }

    // --- search handlers ---
    const handleSearch = () => {
        // CHỈ trigger fetch khi người dùng bấm nút Tìm kiếm
        setPage(1);
        setReloadKey((k) => k + 1);
    };

    const handleClearFilter = () => {
        // reset UI và gọi lại API để hiển thị trạng thái mặc định (giống các màn hình khác)
        searchForm.resetFields();
        setKeyword("");
        setSystemFilterOptions([]);
        // đặt page = 1 và trigger reload để fetch lại
        setPage(1);
        setReloadKey((k) => k + 1);
    };

    // --- modal open ---
    const openCreate = () => {
        setMode("create");
        setEditing(null);
        form.resetFields();
        form.setFieldsValue({ systemPermission: false });
        setNameValue("");
        setModalOpen(true);
    };

    const openEdit = async (id: number) => {
        setLoading(true);
        try {
            const res = await callGetPermissionById(id);
            const perm = res?.data?.result as IPermission;
            if (!perm) {
                message.error("Không tìm thấy quyền");
                return;
            }
            // chuẩn hoá tên hiện tại: chữ hoa + thay space bằng underscore
            const normName = perm.name
                ? perm.name.toUpperCase().replace(/\s+/g, "_")
                : "";
            setEditing(perm);
            setNameValue(normName);
            form.setFieldsValue({
                name: normName,
                description: perm.description,
                systemPermission: perm.systemPermission,
            });
            setMode("edit");
            setModalOpen(true);
        } catch (err: any) {
            console.error("Lỗi lấy permission:", err);
            message.error(
                err?.response?.data?.message || "Không thể lấy thông tin quyền"
            );
        } finally {
            setLoading(false);
        }
    };

    // --- submit create/update ---
    const handleSubmit = async () => {
        try {
            const values = await form.validateFields();
            setSaving(true);
            const rawName = (values.name || nameValue || "").trim();
            const payloadName = rawName.toUpperCase().replace(/\s+/g, "_");
            if (mode === "create") {
                // tạo mới: frontend không cho bật systemPermission
                await callCreatePermission({
                    name: payloadName,
                    description: values.description,
                } as any);
                message.success("Tạo quyền thành công");
            } else if (mode === "edit" && editing) {
                await callUpdatePermission(editing.id, {
                    name: payloadName,
                    description: values.description,
                } as any);
                message.success("Cập nhật quyền thành công");
            }

            setModalOpen(false);
            setEditing(null);
            setReloadKey((k) => k + 1);
        } catch (err: any) {
            console.error("Lỗi lưu permission:", err);
            const msg =
                err?.response?.data?.message || err?.message || "Lỗi khi lưu";
            message.error(msg);
        } finally {
            setSaving(false);
        }
    };

    // --- delete ---
    const handleDelete = async (record: IPermission) => {
        if (record.systemPermission) {
            message.error("Không thể xóa quyền hệ thống");
            return;
        }
        try {
            await callDeletePermission(record.id);
            message.success("Xóa quyền thành công");
            setReloadKey((k) => k + 1);
        } catch (err: any) {
            console.error("Lỗi xóa permission:", err);
            message.error(err?.response?.data?.message || "Xóa thất bại");
        }
    };

    // --- columns ---
    const columns: ColumnsType<IPermission> = useMemo(
        () => [
            {
                title: "Tên quyền",
                dataIndex: "name",
                key: "name",
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
                title: "Quyền hệ thống",
                dataIndex: "systemPermission",
                key: "systemPermission",
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
                width: 220,
                align: "center",
                render: (_: any, record: IPermission) => (
                    <Space
                        size="small"
                        style={{ display: "flex", justifyContent: "center" }}
                    >
                        {canManage && (
                            <Tooltip title="Chỉnh sửa quyền">
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
                                    record.systemPermission
                                        ? "Không thể xóa quyền hệ thống"
                                        : "Xóa quyền"
                                }
                            >
                                <Popconfirm
                                    title="Xóa quyền"
                                    description="Bạn có chắc muốn xóa quyền này?"
                                    okText="Xóa"
                                    cancelText="Hủy"
                                    okButtonProps={{ danger: true }}
                                    onConfirm={() => handleDelete(record)}
                                    disabled={record.systemPermission} // <-- DISABLE POPCONFIRM nếu là system
                                >
                                    <button
                                        disabled={record.systemPermission}
                                        className={`
                                            px-3 py-[5px] flex items-center gap-1 rounded-md text-white
                                            transition ${
                                                record.systemPermission
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
                            <Form.Item
                                name="permission"
                                label="Loại quyền"
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

                            {/* Nút xóa lọc: cùng hàng với filter và canh phải */}
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

            {/* TABLE WRAPPER: nút tạo nằm trong cùng thẻ div với bảng và nằm trên bảng */}
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
                                Tạo quyền
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
                        scroll={{ x: 1000 }}
                    />
                </div>
            </div>

            {/* MODAL CREATE / EDIT */}
            <Modal
                title={
                    mode === "create"
                        ? "Tạo Permission"
                        : "Chỉnh sửa Permission"
                }
                open={modalOpen}
                onCancel={() => {
                    setModalOpen(false);
                    setEditing(null);
                    form.resetFields();
                }}
                onOk={handleSubmit}
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
                    initialValues={{ systemPermission: false }}
                >
                    <Row gutter={12}>
                        <Col span={24}>
                            <Form.Item
                                label="Tên quyền"
                                name="name"
                                rules={[
                                    {
                                        required: true,
                                        message: "Vui lòng nhập tên quyền",
                                    },
                                ]}
                            >
                                <Input
                                    placeholder="VD: ADD_GRAMMAR"
                                    disabled={
                                        !!(editing && editing.systemPermission)
                                    }
                                    value={nameValue}
                                    onChange={(e) => {
                                        // chuẩn hoá: thay nhiều khoảng trắng bằng 1 dấu '_' và viết hoa
                                        const raw = e.target.value || "";
                                        const normalized = raw
                                            .replace(/\s+/g, "_")
                                            .toUpperCase();
                                        setNameValue(normalized);
                                        // đồng bộ vào form để validate/submit
                                        form.setFieldsValue({
                                            name: normalized,
                                        });
                                    }}
                                />
                            </Form.Item>
                        </Col>

                        <Col span={24}>
                            <Form.Item label="Mô tả" name="description">
                                <Input.TextArea rows={3} />
                            </Form.Item>
                        </Col>

                        <Col span={24}>
                            <Form.Item
                                label="Loại quyền"
                                name="systemPermission"
                                valuePropName="checked"
                            >
                                <Input
                                    disabled
                                    value={
                                        editing && editing.systemPermission
                                            ? "Quyền hệ thống (không thể sửa)"
                                            : "Tùy chỉnh"
                                    }
                                />
                            </Form.Item>
                        </Col>
                    </Row>
                </Form>
            </Modal>
        </div>
    );
}
