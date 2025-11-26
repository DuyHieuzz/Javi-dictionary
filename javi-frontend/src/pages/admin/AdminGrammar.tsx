import { useEffect, useMemo, useState } from "react";
import {
    Table,
    Button,
    Form,
    Input,
    Select,
    Modal,
    Space,
    Tooltip,
    Popconfirm,
    message,
    Row,
    Col,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import { FiEdit, FiEye, FiTrash2 } from "react-icons/fi";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import DOMPurify from "dompurify";

import {
    callGetGrammarDetail,
    callCreateGrammar,
    callUpdateGrammar,
    callDeleteGrammar,
    callGetGrammarsByFilter,
} from "@/apis/grammarApi";
import { useAuthStore } from "@/stores/useAuthStore";

import type {
    IGrammarResponse,
    ICreateGrammarRequest,
    IUpdateGrammarRequest,
    IBackendRes,
    EntityType,
} from "@/types/backend";
import SearchResultModal from "@/components/search/SearchResultModal";

type Mode = "create" | "edit";

export default function AdminGrammar() {
    const currentUser = useAuthStore((s) => s.user);

    // Kiểm tra permission từ user hiện tại
    const hasPermission = (perm: string) =>
        currentUser?.role?.permissions?.some((p: any) => p.name === perm) ??
        false;

    const canCreate = hasPermission("CREATE_GRAMMAR");
    const canEdit = hasPermission("UPDATE_GRAMMAR");
    const canDelete = hasPermission("DELETE_GRAMMAR");
    const [detailKey, setDetailKey] = useState<number | string | null>(null);
    const [data, setData] = useState<IGrammarResponse[]>([]);
    const [page, setPage] = useState(1);
    const [size, setSize] = useState(10);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(false);

    // search form
    const [searchForm] = Form.useForm();
    const [searchValues, setSearchValues] = useState<{
        keyword?: string;
        levels?: string[];
    }>({});

    // modal xem chi tiết (local) — đảm bảo sẽ gọi API khi mở
    const [detailOpen, setDetailOpen] = useState(false);

    // modal create/edit
    const [formOpen, setFormOpen] = useState(false);
    const [formMode, setFormMode] = useState<Mode>("create");
    const [formLoading, setFormLoading] = useState(false);
    const [editingGrammar, setEditingGrammar] =
        useState<IGrammarResponse | null>(null);

    const [form] = Form.useForm();

    useEffect(() => {
        loadGrammars();
    }, [page, size, searchValues]);

    function buildTurkraftFilter(searchValues: any): string | undefined {
        const parts: string[] = [];

        // levels: form dùng 'levels' (mảng khi multi-select)
        const selectedLevels = Array.isArray(searchValues?.levels)
            ? (searchValues.levels as any[]).filter(Boolean)
            : [];

        if (selectedLevels.length > 0) {
            // canonicalize để cùng key khi chỉ khác thứ tự chọn
            const sorted = selectedLevels.map((x) => String(x).trim()).sort();
            // BỌC giá trị bằng nháy đơn theo cú pháp turkraft
            const orExpr = sorted.map((lv) => `level : '${lv}'`).join(" or ");
            parts.push(sorted.length === 1 ? orExpr : `(${orExpr})`);
        }

        // keyword -> tìm pattern hoặc meaning, dùng case-insensitive like (~~)
        const kw = searchValues?.keyword?.trim?.();
        if (kw) {
            const safe = kw.replace(/'/g, "\\'"); // escape '
            parts.push(`(pattern ~~ '${safe}' or meaning ~~ '${safe}')`);
        }

        if (parts.length === 0) return undefined;
        if (parts.length === 1) return parts[0];
        return parts.join(" and ");
    }

    async function loadGrammars() {
        try {
            setLoading(true);

            // FE dùng page 1-based, BE expect 0-based
            const page0 = Math.max(0, page - 1);

            // chuẩn bị searchValues từ state (có thể là {})
            const sv: any = searchValues || {};

            // tạo filter turkraft (hoặc undefined nếu không có điều kiện)
            const filter = buildTurkraftFilter(sv);

            // nếu filter === undefined, API nên trả toàn bộ (hoặc backend xử lý)
            const res = await callGetGrammarsByFilter(filter, page0, size);

            // parse response linh hoạt để tương thích với nhiều dạng trả về
            const bodyAny: any = (res && (res as any).data) ?? res;
            const pageData = bodyAny?.result ?? bodyAny?.data ?? bodyAny;
            const content: any[] =
                pageData?.content ?? pageData?.data ?? pageData?.items ?? [];
            const totalElements: number =
                pageData?.totalElements ??
                pageData?.total ??
                pageData?.totalCount ??
                0;

            setData(content);
            setTotal(totalElements);
        } catch (err: any) {
            console.error("Lấy danh sách grammar (turkraft) thất bại:", err);
            message.error(
                err?.response?.data?.message ||
                    err?.message ||
                    "Lấy danh sách grammar thất bại"
            );
        } finally {
            setLoading(false);
        }
    }

    const columns: ColumnsType<IGrammarResponse> = useMemo(
        () => [
            {
                title: "Mẫu câu",
                dataIndex: "pattern",
                key: "pattern",
                render: (_: any, record: IGrammarResponse) => {
                    const safeMeaning = record.meaning
                        ? DOMPurify.sanitize(record.meaning)
                        : "";
                    return (
                        <div className="space-y-1">
                            <div className="font-mplus text-lg">
                                {record.pattern}
                            </div>

                            <div
                                className="text-xs text-gray-600 meaning-clamp whitespace-pre-wrap break-words meaning-clamp-2-line"
                                dangerouslySetInnerHTML={{
                                    __html:
                                        safeMeaning ||
                                        `<span class="text-gray-400">—</span>`,
                                }}
                            />
                        </div>
                    );
                },
                width: 240,
            },

            {
                title: "Cấu trúc",
                dataIndex: "structure",
                key: "structure",
                render: (m: string) => {
                    const safeHtml = m ? DOMPurify.sanitize(m) : "";
                    return (
                        <div
                            className="text-sm meaning-clamp whitespace-pre-wrap break-words "
                            dangerouslySetInnerHTML={{
                                __html:
                                    safeHtml ||
                                    `<span class="text-gray-400">—</span>`,
                            }}
                        />
                        // meaning-clamp được css trong index.css để giữ logic viết như nào hiển thị như vậy
                    );
                },
            },
            {
                title: "Phạm vi sử dụng",
                dataIndex: "usageNote",
                key: "usageNote",
                render: (m: string) => {
                    const safeHtml = m ? DOMPurify.sanitize(m) : "";
                    return (
                        <div
                            className="text-sm meaning-clamp whitespace-pre-wrap break-words "
                            dangerouslySetInnerHTML={{
                                __html:
                                    safeHtml ||
                                    `<span class="text-gray-400">—</span>`,
                            }}
                        />
                    );
                },
            },
            {
                title: "Level",
                dataIndex: "level",
                key: "level",
                width: 100,
                align: "center",
                render: (lv: string | null) => {
                    if (!lv) return <span className="text-gray-400">—</span>;
                    const bg =
                        lv === "N1"
                            ? "bg-blue-600"
                            : lv === "N2"
                            ? "bg-green-600"
                            : lv === "N3"
                            ? "bg-yellow-500"
                            : lv === "N4"
                            ? "bg-red-500"
                            : "bg-purple-700";
                    return (
                        <span
                            className={`inline-flex px-3 py-0.5 rounded-full text-xs font-medium text-white ${bg}`}
                        >
                            {lv}
                        </span>
                    );
                },
            },
            {
                title: "Hành động",
                key: "actions",
                width: 260,
                align: "center",
                render: (_: any, record: IGrammarResponse) => (
                    <Space
                        size="small"
                        style={{ display: "flex", justifyContent: "center" }}
                    >
                        <Tooltip title="Xem chi tiết">
                            <button
                                onClick={() => {
                                    setDetailKey(record.id);
                                    setDetailOpen(true);
                                }}
                                className="px-3 py-[5px] flex items-center gap-1 rounded-md text-white bg-blue-500 hover:bg-blue-600 transition"
                            >
                                <FiEye className="text-[15px]" />
                                Xem
                            </button>
                        </Tooltip>

                        {canEdit && (
                            <Tooltip title="Chỉnh sửa ngữ pháp">
                                <button
                                    onClick={() => openEditByRecord(record.id)}
                                    className="px-3 py-[5px] flex items-center gap-1 rounded-md text-white bg-amber-500 hover:bg-amber-600 transition"
                                >
                                    <FiEdit className="text-[15px]" /> Sửa
                                </button>
                            </Tooltip>
                        )}

                        {canDelete && (
                            <Tooltip title="Xóa ngữ pháp">
                                <Popconfirm
                                    title="Xóa ngữ pháp"
                                    description={`Bạn có chắc muốn xóa mẫu '${record.pattern}'?`}
                                    okText="Xóa"
                                    cancelText="Hủy"
                                    okButtonProps={{ danger: true }}
                                    onConfirm={() => handleDelete(record.id)}
                                >
                                    <button className="px-3 py-[5px] flex items-center gap-1 rounded-md text-white bg-red-500 hover:bg-red-600 transition">
                                        <FiTrash2 className="text-[15px]" /> Xóa
                                    </button>
                                </Popconfirm>
                            </Tooltip>
                        )}
                    </Space>
                ),
            },
        ],
        [canEdit, canDelete]
    );

    // === search handlers ===
    const handleSearchSubmit = (values: any) => {
        setPage(1);
        setSearchValues(values || {});
    };

    const handleSearchReset = () => {
        searchForm.resetFields();
        setPage(1);
        setSearchValues({});
    };

    // === open create modal ===
    const openCreateModal = () => {
        setFormMode("create");
        setEditingGrammar(null);
        form.resetFields();
        // đặt 1 ví dụ mặc định để UI dễ thao tác
        form.setFieldsValue({
            examples: [{ jaSentence: "", transcription: "", viSentence: "" }],
        });
        setFormOpen(true);
    };

    // === open edit modal by id: fetch detail và fill form ===
    async function openEditByRecord(id: number) {
        try {
            setFormMode("edit");
            setFormLoading(true);
            setFormOpen(true);
            setEditingGrammar(null);

            // Gọi API lấy detail để fill form (bắt buộc)
            const resp = await callGetGrammarDetail(id, { saveHistory: false });
            const body = (resp?.data || resp) as IBackendRes<IGrammarResponse>;
            const det = body?.result ?? body?.data ?? (body as any);
            if (!det) throw new Error("Server không trả về dữ liệu grammar");

            setEditingGrammar(det);
            // Gán dữ liệu vào form — examples là mảng
            form.setFieldsValue({
                pattern: det.pattern,
                meaning: det.meaning,
                structure: det.structure,
                usageNote: det.usageNote,
                level: det.level,
                examples:
                    Array.isArray(det.examples) && det.examples.length > 0
                        ? det.examples
                        : [
                              {
                                  jaSentence: "",
                                  transcription: "",
                                  viSentence: "",
                              },
                          ],
            });
        } catch (err: any) {
            console.error("Mở modal sửa thất bại:", err);
            message.error(
                err?.response?.data?.message ||
                    err?.message ||
                    "Mở modal sửa thất bại"
            );
            setFormOpen(false);
        } finally {
            setFormLoading(false);
        }
    }

    // === delete grammar ===
    async function handleDelete(id: number) {
        try {
            await callDeleteGrammar(id);
            message.success("Xóa ngữ pháp thành công");
            loadGrammars();
        } catch (err: any) {
            console.error("Xóa ngữ pháp thất bại:", err);
            message.error(
                err?.response?.data?.message || err?.message || "Xóa thất bại"
            );
        }
    }

    // === submit create/update form ===
    const handleSubmit = async () => {
        try {
            const values = await form.validateFields();

            // Build payload tương ứng types
            const payload: ICreateGrammarRequest = {
                pattern: values.pattern?.trim(),
                meaning: values.meaning || "",
                structure: values.structure || "",
                usageNote: values.usageNote || "",
                level: values.level,
                examples: values.examples || [],
            };

            setFormLoading(true);

            if (formMode === "edit" && editingGrammar) {
                const updatePayload: IUpdateGrammarRequest = {
                    id: editingGrammar.id,
                    ...payload,
                } as any;
                await callUpdateGrammar(editingGrammar.id, updatePayload);
                message.success("Cập nhật ngữ pháp thành công");
                setFormOpen(false);
                setEditingGrammar(null);
                loadGrammars();
            } else {
                await callCreateGrammar(payload);
                message.success("Tạo ngữ pháp thành công");
                setFormOpen(false);
                loadGrammars();
            }
        } catch (err: any) {
            console.error("Lưu ngữ pháp thất bại:", err);
            message.error(
                err?.response?.data?.message || err?.message || "Lưu thất bại"
            );
        } finally {
            setFormLoading(false);
        }
    };

    return (
        <div className="py-4 px-2">
            <Form
                form={searchForm}
                layout="vertical"
                onFinish={handleSearchSubmit}
            >
                <div className="bg-white rounded-2xl shadow p-4 mb-3">
                    <div className="flex flex-col gap-3">
                        <div className="flex flex-col md:flex-row md:items-end gap-3">
                            <Form.Item
                                name="keyword"
                                label="Từ khóa"
                                className="mb-0 flex-1"
                            >
                                <Input.Search
                                    allowClear
                                    placeholder="Tìm theo mẫu / nghĩa..."
                                    autoComplete="off"
                                    onSearch={() => searchForm.submit()}
                                />
                            </Form.Item>

                            <div className="flex gap-2">
                                <Button type="primary" htmlType="submit">
                                    Tìm kiếm
                                </Button>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
                            <Form.Item
                                name="levels" // lưu mảng levels thay vì 1 level
                                label="Trình độ (JLPT)"
                                className="mb-0"
                            >
                                <Select
                                    mode="multiple" // nhiều lựa chọn
                                    allowClear
                                    placeholder="Chọn level"
                                    options={[
                                        { label: "N5", value: "N5" },
                                        { label: "N4", value: "N4" },
                                        { label: "N3", value: "N3" },
                                        { label: "N2", value: "N2" },
                                        { label: "N1", value: "N1" },
                                    ]}
                                    style={{ maxWidth: 430, width: "100%" }}
                                />
                            </Form.Item>

                            <div className="flex md:justify-end md:items-end justify-start">
                                <Button
                                    className="w-full md:w-auto hover:!border-red-500 hover:!text-red-500"
                                    onClick={handleSearchReset}
                                >
                                    Xóa lọc
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </Form>

            {/* Table area */}
            <div className="bg-white rounded-2xl shadow p-4 mb-3">
                <div className="mb-4 flex items-center justify-between">
                    <div className="text-lg font-semibold"></div>
                    {/* giữ nút ở cùng thẻ */}
                    {canCreate && (
                        <div>
                            <Button
                                onClick={openCreateModal}
                                className="!bg-green-500 !text-white !border-none hover:!bg-green-600"
                            >
                                + Tạo ngữ pháp
                            </Button>
                        </div>
                    )}
                </div>
                <div className="overflow-x-auto">
                    <Table
                        rowKey="id"
                        columns={columns}
                        dataSource={data}
                        loading={loading}
                        pagination={{
                            current: page,
                            pageSize: size,
                            position: ["bottomCenter"],
                            total,
                            showSizeChanger: true,
                            onChange: (p, s) => {
                                setPage(p);
                                setSize(s || size);
                            },
                        }}
                        scroll={{ x: 1200 }}
                    />
                </div>
            </div>

            {/* Modal create/edit */}
            <Modal
                open={formOpen}
                title={formMode === "create" ? "Tạo ngữ pháp" : "Sửa ngữ pháp"}
                onCancel={() => {
                    setFormOpen(false);
                    setEditingGrammar(null);
                    form.resetFields();
                }}
                className="with-padding-modal"
                onOk={() => form.submit()}
                confirmLoading={formLoading}
                width={900}
                cancelText="Hủy"
                okText={formMode === "create" ? "Tạo" : "Lưu"}
                cancelButtonProps={{
                    className:
                        "!text-red-600 hover:!bg-red-500 hover:!text-white",
                }}
            >
                <Form
                    form={form}
                    layout="vertical"
                    onFinish={handleSubmit}
                    initialValues={{
                        pattern: "",
                        meaning: "",
                        structure: "",
                        usageNote: "",
                        level: undefined,
                        examples: [
                            {
                                jaSentence: "",
                                transcription: "",
                                viSentence: "",
                            },
                        ],
                    }}
                >
                    <Row gutter={12}>
                        {/* Mẫu và Level */}
                        <Col span={12}>
                            <Form.Item
                                name="pattern"
                                label="Mẫu ngữ pháp"
                                rules={[
                                    {
                                        required: true,
                                        message: "Nhập mẫu ngữ pháp",
                                    },
                                ]}
                            >
                                <Input />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item
                                name="level"
                                label="Level"
                                rules={[
                                    { required: true, message: "Chọn level" },
                                ]}
                            >
                                <Select
                                    options={[
                                        { label: "N5", value: "N5" },
                                        { label: "N4", value: "N4" },
                                        { label: "N3", value: "N3" },
                                        { label: "N2", value: "N2" },
                                        { label: "N1", value: "N1" },
                                    ]}
                                />
                            </Form.Item>
                        </Col>

                        {/* Nghĩa và Cấu trúc */}
                        <Col span={12}>
                            <Form.Item
                                name="meaning"
                                label="Nghĩa"
                                rules={[
                                    { required: true, message: "Nhập nghĩa" },
                                ]}
                            >
                                <ReactQuill theme="snow" />
                            </Form.Item>
                        </Col>

                        <Col span={12}>
                            <Form.Item
                                name="structure"
                                label="Cấu trúc (cách chia ngữ pháp)"
                                rules={[
                                    {
                                        required: true,
                                        message: "Nhập cấu trúc",
                                    },
                                ]}
                            >
                                <ReactQuill theme="snow" />
                            </Form.Item>
                        </Col>

                        {/* Phạm vi sử dụng */}
                        <Col span={24}>
                            <Form.Item
                                name="usageNote"
                                label="Phạm vi sử dụng"
                                rules={[
                                    {
                                        required: true,
                                        message: "Nhập phạm vi sử dụng",
                                    },
                                ]}
                            >
                                <ReactQuill theme="snow" />
                            </Form.Item>
                        </Col>

                        {/* Examples: thiết kế theo hàng dọc JP / 読み / VI, nút Xóa ở dưới cùng, mỗi khi Xóa show Popconfirm */}
                        <Col span={24}>
                            <div className="mb-2 font-medium">Ví dụ</div>
                            <Form.List name="examples">
                                {(fields, { add, remove }) => (
                                    <div>
                                        {fields.map((field) => (
                                            <div
                                                key={field.key}
                                                className="p-3 border rounded mb-3"
                                            >
                                                <Row gutter={8}>
                                                    <Col span={24}>
                                                        <Form.Item
                                                            name={[
                                                                field.name,
                                                                "jaSentence",
                                                            ]}
                                                            rules={[
                                                                {
                                                                    required:
                                                                        true,
                                                                    message:
                                                                        "Nhập câu tiếng Nhật",
                                                                },
                                                            ]}
                                                        >
                                                            {/* Textarea autoSize để nội dung dài tự xuống dòng và ô tự to */}
                                                            <Input.TextArea
                                                                placeholder="Nhập câu tiếng Nhật"
                                                                autoSize={{
                                                                    minRows: 1,
                                                                    maxRows: 10,
                                                                }}
                                                            />
                                                        </Form.Item>
                                                    </Col>

                                                    <Col span={24}>
                                                        <Form.Item
                                                            name={[
                                                                field.name,
                                                                "transcription",
                                                            ]}
                                                        >
                                                            <Input.TextArea
                                                                placeholder="Câu tiếng Nhật (không có kanji)"
                                                                autoSize={{
                                                                    minRows: 1,
                                                                    maxRows: 6,
                                                                }}
                                                            />
                                                        </Form.Item>
                                                    </Col>

                                                    <Col span={24}>
                                                        <Form.Item
                                                            name={[
                                                                field.name,
                                                                "viSentence",
                                                            ]}
                                                            rules={[
                                                                {
                                                                    required:
                                                                        true,
                                                                    message:
                                                                        "Nhập câu tiếng Việt",
                                                                },
                                                            ]}
                                                        >
                                                            <Input.TextArea
                                                                placeholder="Nhập câu tiếng Việt"
                                                                autoSize={{
                                                                    minRows: 1,
                                                                    maxRows: 10,
                                                                }}
                                                            />
                                                        </Form.Item>
                                                    </Col>

                                                    {/* Nút Xóa ở dưới cùng của ví dụ với Popconfirm để tránh xóa nhầm */}
                                                    <Col
                                                        span={24}
                                                        className="flex justify-end"
                                                    >
                                                        <Popconfirm
                                                            title="Xóa ví dụ"
                                                            description="Bạn có chắc muốn xóa ví dụ này?"
                                                            okText="Xóa"
                                                            cancelText="Hủy"
                                                            okButtonProps={{
                                                                danger: true,
                                                            }}
                                                            onConfirm={() =>
                                                                remove(
                                                                    field.name
                                                                )
                                                            }
                                                        >
                                                            <Button danger>
                                                                {" "}
                                                                Xóa ví dụ{" "}
                                                            </Button>
                                                        </Popconfirm>
                                                    </Col>
                                                </Row>
                                            </div>
                                        ))}

                                        <Button
                                            type="dashed"
                                            onClick={() =>
                                                add({
                                                    jaSentence: "",
                                                    transcription: "",
                                                    viSentence: "",
                                                })
                                            }
                                        >
                                            Thêm ví dụ
                                        </Button>
                                    </div>
                                )}
                            </Form.List>
                        </Col>
                    </Row>
                </Form>
            </Modal>

            {/* Modal detail local */}
            <SearchResultModal
                {...({
                    open: detailOpen,
                    onClose: () => {
                        setDetailOpen(false);
                        setDetailKey(null);
                    },
                    entityType: "GRAMMAR" as unknown as EntityType,
                    ...(detailKey != null
                        ? { entityId: detailKey as unknown as string | number }
                        : {}),
                } as any)}
            />
        </div>
    );
}
