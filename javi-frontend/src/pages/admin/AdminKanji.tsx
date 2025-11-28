import React, { useEffect, useMemo, useState, useRef } from "react";
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
    Upload,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import { PlusOutlined } from "@ant-design/icons";
import { FiEdit, FiEye, FiTrash2, FiSearch } from "react-icons/fi";
import { FiImage } from "react-icons/fi";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import DOMPurify from "dompurify";

import {
    callGetKanjiPage,
    callCreateOrUpdateKanji,
    callDeleteKanji,
    callGetKanjiDetail,
    callUploadKanjiGif,
} from "@/apis/kanjiApi";
import { useAuthStore } from "@/stores/useAuthStore";
import SearchResultModal from "@/components/search/SearchResultModal";
import type {
    IKanjiResponse,
    IKanjiRequest,
    IBackendRes,
    IKanjiDetailResponse,
} from "@/types/backend";

function getLevelBgClass(level?: string | null): string {
    if (!level) return "bg-gray-400";
    return level === "N1"
        ? "bg-blue-600"
        : level === "N2"
        ? "bg-green-600"
        : level === "N3"
        ? "bg-yellow-500"
        : level === "N4"
        ? "bg-red-500"
        : "bg-purple-700";
}

type Mode = "create" | "edit";

type KanjiSearchValues = {
    keyword?: string;
    levels?: string[];
};

export default function AdminKanji() {
    const currentUser = useAuthStore((s) => s.user);

    const hasPermission = (perm: string) =>
        currentUser?.role?.permissions?.some((p: any) => p.name === perm) ??
        false;

    const canCreate = hasPermission("CREATE_KANJI");
    const canEdit = hasPermission("UPDATE_KANJI");
    const canDelete = hasPermission("DELETE_KANJI");

    const [data, setData] = useState<IKanjiResponse[]>([]);
    const [page, setPage] = useState(1);
    const [size, setSize] = useState(20);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(false);

    // search form
    const [searchForm] = Form.useForm<KanjiSearchValues>();
    const [searchValues, setSearchValues] = useState<KanjiSearchValues>({});

    // modal xem chi tiết
    const [detailOpen, setDetailOpen] = useState(false);
    const [detailKey, setDetailKey] = useState<string | null>(null);

    // modal form
    const [formOpen, setFormOpen] = useState(false);
    const [formMode, setFormMode] = useState<Mode>("create");
    const [formLoading, setFormLoading] = useState(false);
    const [editingKanji, setEditingKanji] = useState<IKanjiResponse | null>(
        null
    );
    const [communityDetail, setCommunityDetail] =
        useState<IKanjiDetailResponse | null>(null);

    const [form] = Form.useForm();

    // file GIF tạm giữ
    const [selectedGifFile, setSelectedGifFile] = useState<File | null>(null);
    const [selectedGifPreview, setSelectedGifPreview] = useState<string | null>(
        null
    );

    const [checkLoading, setCheckLoading] = useState(false);
    const typingDebounceRef = useRef<number | null>(null);

    const MAX_GIF_SIZE = 10 * 1024 * 1024;

    // === THAY ĐỔI CHÍNH: state để điều khiển ReactQuill (controlled) ===
    // Dùng controlled editor để tránh race / uncontrolled -> controlled issues
    const [meaningState, setMeaningState] = useState<string>("");
    // ==================================================================

    useEffect(() => {
        loadKanji();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [page, size, searchValues]);

    async function loadKanji() {
        try {
            setLoading(true);

            const params: any = {
                page: page - 1,
                size,
            };

            const filterParts: string[] = [];

            if (searchValues?.keyword?.trim()) {
                const rawKw = searchValues.keyword.trim();
                const kw = rawKw.replace(/'/g, "");
                filterParts.push(
                    `(characterName ~~ '${kw}' or meaning ~~ '${kw}' or sinoViName ~~ '${kw}')`
                );
            }

            const levelsArr = Array.isArray(searchValues?.levels)
                ? searchValues!.levels
                : [];
            const cleanLevels = (levelsArr || [])
                .filter(Boolean)
                .map((s: string) => s.trim());
            if (cleanLevels.length > 0) {
                if (cleanLevels.length === 1) {
                    filterParts.push(`level : '${cleanLevels[0]}'`);
                } else {
                    const quoted = cleanLevels.map((v) => `'${v}'`).join(", ");
                    filterParts.push(`level in [${quoted}]`);
                }
            }

            if (filterParts.length > 0) {
                const filterString = filterParts.join(" and ");
                params.filter = filterString;
            }

            const res = await callGetKanjiPage(params);
            const body = (res?.data || res) as IBackendRes<any>;
            const pageData = body?.result || body?.data || body;
            const content: IKanjiResponse[] = pageData?.content ?? [];
            const totalElements: number =
                pageData?.totalElements ?? pageData?.total ?? 0;

            setData(content);
            setTotal(totalElements);
        } catch (err: any) {
            console.error("Lấy danh sách kanji thất bại:", err);
            message.error(
                err?.response?.data?.message ||
                    err?.message ||
                    "Lấy danh sách kanji thất bại"
            );
        } finally {
            setLoading(false);
        }
    }

    const columns: ColumnsType<IKanjiResponse> = useMemo(
        () => [
            {
                title: "Ký tự",
                dataIndex: "characterName",
                key: "characterName",
                render: (v: string) => (
                    <div className="text-4xl text-[#3e67d6] font-mplus font-normal text-center">
                        {v}
                    </div>
                ),
                width: 120,
                align: "center",
            },
            {
                title: "Hán Việt",
                dataIndex: "sinoViName",
                key: "sinoViName",
                render: (v: string) => v || "—",
                width: 160,
                align: "center",
            },
            {
                title: "Level",
                dataIndex: "level",
                key: "level",
                width: 100,
                align: "center",
                render: (lv: string | null) => {
                    if (!lv) return <span className="text-gray-400">—</span>;
                    return (
                        <span
                            className={`inline-flex px-3 py-0.5 rounded-full text-xs font-medium text-white ${getLevelBgClass(
                                lv
                            )}`}
                        >
                            {lv}
                        </span>
                    );
                },
            },
            {
                title: "Nghĩa",
                dataIndex: "meaning",
                key: "meaning",
                render: (m: string) => {
                    const safeHtml = m ? DOMPurify.sanitize(m) : "";
                    return (
                        <div
                            className="text-sm meaning-clamp whitespace-normal break-words ql-render"
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
                title: "GIF",
                dataIndex: "gifUrl",
                key: "gif",
                width: 140,
                align: "center",
                render: (gifUrl: string) => (
                    <div className="w-full h-full flex items-center justify-center">
                        {gifUrl ? (
                            <img
                                src={gifUrl}
                                alt="kanji gif"
                                className="max-h-20 object-contain"
                            />
                        ) : (
                            <div className="flex flex-col items-center text-xs text-gray-500">
                                <FiImage className="text-2xl mb-1" />
                                <span>Không có GIF</span>
                            </div>
                        )}
                    </div>
                ),
            },
            {
                title: "Hành động",
                key: "actions",
                width: 260,
                align: "center",
                render: (_: any, record: IKanjiResponse) => (
                    <Space
                        size="small"
                        style={{ display: "flex", justifyContent: "center" }}
                    >
                        <Tooltip title="Xem chi tiết">
                            <button
                                onClick={() => {
                                    setDetailKey(record.characterName);
                                    setDetailOpen(true);
                                }}
                                className="px-3 py-[5px] flex items-center gap-1 rounded-md text-white bg-blue-500 hover:bg-blue-600 transition"
                            >
                                <FiEye className="text-[15px]" />
                                Xem
                            </button>
                        </Tooltip>

                        {canEdit && (
                            <Tooltip title="Chỉnh sửa kanji">
                                <button
                                    onClick={() => openEditByRecord(record)}
                                    className="px-3 py-[5px] flex items-center gap-1 rounded-md text-white bg-amber-500 hover:bg-amber-600 transition"
                                >
                                    <FiEdit className="text-[15px]" />
                                    Sửa
                                </button>
                            </Tooltip>
                        )}

                        {canDelete && (
                            <Tooltip title="Xóa kanji">
                                <Popconfirm
                                    title="Xóa kanji"
                                    description={`Bạn có chắc muốn xóa kanji '${record.characterName}'?`}
                                    okText="Xóa"
                                    cancelText="Hủy"
                                    okButtonProps={{ danger: true }}
                                    onConfirm={() =>
                                        handleDelete(record.characterName)
                                    }
                                >
                                    <button className="px-3 py-[5px] flex items-center gap-1 rounded-md text-white bg-red-500 hover:bg-red-600 transition">
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
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [canEdit, canDelete]
    );

    // === Search area handlers ===
    const handleSearchSubmit = (values: KanjiSearchValues) => {
        setPage(1);
        setSearchValues(values || {});
    };

    const handleSearchReset = () => {
        searchForm.resetFields();
        setPage(1);
        setSearchValues({});
    };

    const openCreateModal = () => {
        setFormMode("create");
        setEditingKanji(null);
        setCommunityDetail(null);
        form.resetFields();

        // reset editor state khi tạo mới
        setMeaningState("");

        setSelectedGifFile(null);
        setSelectedGifPreview(null);
        setFormOpen(true);
    };

    async function openEditByRecord(record: IKanjiResponse) {
        try {
            setFormMode("edit");
            setFormLoading(true);
            setFormOpen(true);
            setEditingKanji(record);

            // gán values vào form trước
            form.setFieldsValue({
                characterName: record.characterName,
                sinoViName: record.sinoViName,
                meaning: record.meaning || "",
                level: record.level,
            });

            // đồng bộ editor state ngay sau setFieldsValue (fix hiển thị lần đầu)
            setMeaningState(record.meaning || "");

            setSelectedGifFile(null);
            setSelectedGifPreview(record.gifUrl || null);

            try {
                // gọi detail (nếu cần nhiều thông tin)
                const resp = await callGetKanjiDetail(record.characterName, {
                    saveHistory: false,
                } as any);
                const b = (resp?.data ||
                    resp) as IBackendRes<IKanjiDetailResponse>;
                const det =
                    (b.result as IKanjiDetailResponse) ||
                    (b.data as IKanjiDetailResponse) ||
                    (b as any);
                if (det) {
                    setCommunityDetail(det ?? null);
                    // đồng bộ nếu API trả nghĩa khác
                    if (det.meaning) {
                        // cập nhật cả form và editor (ăn chắc)
                        form.setFieldsValue({ meaning: det.meaning });
                        setMeaningState(det.meaning || "");
                    }
                    if ((det as any).gifUrl) {
                        setSelectedGifPreview((det as any).gifUrl);
                        setSelectedGifFile(null);
                    }
                } else {
                    setCommunityDetail(null);
                }
            } catch (e) {
                setCommunityDetail(null);
            }
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

    async function handleDelete(characterName: string) {
        try {
            await callDeleteKanji(characterName);
            message.success(`Xóa kanji '${characterName}' thành công`);
            loadKanji();
        } catch (err: any) {
            console.error("Xóa kanji thất bại:", err);
            message.error(
                err?.response?.data?.message || err?.message || "Xóa thất bại"
            );
        }
    }

    const handleCheckCharacter = async () => {
        const character = form
            .getFieldValue("characterName")
            ?.toString()
            ?.trim?.();
        if (!character) {
            message.warning("Vui lòng nhập ký tự Kanji trước khi kiểm tra");
            return;
        }

        setCheckLoading(true);
        try {
            const resp = await callGetKanjiDetail(character, {
                saveHistory: false,
            } as any);
            const b = (resp?.data || resp) as IBackendRes<IKanjiDetailResponse>;
            const det =
                (b.result as IKanjiDetailResponse) ||
                (b.data as IKanjiDetailResponse) ||
                (b as any);

            if (det && det.characterName) {
                form.setFieldsValue({
                    sinoViName: det.sinoViName || det.sinoViName || "",
                    meaning: det.meaning || "",
                    level: det.level || undefined,
                });

                // đồng bộ editor state khi auto-fill tìm thấy
                setMeaningState(det.meaning || "");

                setCommunityDetail(det);

                if ((det as any).gifUrl) {
                    setSelectedGifPreview((det as any).gifUrl);
                    setSelectedGifFile(null);
                }

                message.success(
                    `Tìm thấy Kanji '${character}' — đã điền dữ liệu trả về`
                );
            } else {
                setCommunityDetail(null);
                message.info(`Không tìm thấy dữ liệu cho '${character}'`);
            }
        } catch (err: any) {
            const status = err?.response?.status;
            if (status === 404) {
                setCommunityDetail(null);
                message.info(
                    `Kanji '${character}' chưa tồn tại trong hệ thống`
                );
            } else {
                console.error("Kiểm tra Kanji thất bại:", err);
                message.error(
                    err?.response?.data?.message ||
                        err?.message ||
                        "Kiểm tra thất bại"
                );
            }
        } finally {
            setCheckLoading(false);
        }
    };

    // handleSubmit (giữ nguyên logic chức năng, chỉ dùng form values như trước)
    const handleSubmit = async () => {
        try {
            const values = await form.validateFields();

            const sinoInput = values.sinoViName
                ? values.sinoViName.toString()
                : "";
            const sino = sinoInput.toUpperCase();

            const payload: IKanjiRequest = {
                characterName: values.characterName?.trim(),
                sinoViName: sino,
                meaning: values.meaning || "",
                level: values.level,
            };

            setFormLoading(true);

            if (formMode === "edit" && editingKanji) {
                const orig = editingKanji;

                const characterChanged =
                    (payload.characterName || "") !==
                    (orig.characterName || "");
                const sinoChanged =
                    (payload.sinoViName || "") !== (orig.sinoViName || "");
                const meaningChanged =
                    (payload.meaning || "").trim() !==
                    (orig.meaning || "").trim();
                const levelChanged =
                    (payload.level || "") !== (orig.level || "");

                const formChanged =
                    characterChanged ||
                    sinoChanged ||
                    meaningChanged ||
                    levelChanged;
                const hasGif = !!selectedGifFile;

                if (!formChanged && hasGif) {
                    try {
                        if (selectedGifFile!.size > MAX_GIF_SIZE) {
                            throw new Error("File GIF phải nhỏ hơn 10MB");
                        }
                        await callUploadKanjiGif(
                            orig.characterName,
                            selectedGifFile!
                        );
                        message.success("Upload GIF thành công");
                        setFormOpen(false);
                        setSelectedGifFile(null);
                        if (selectedGifPreview) {
                            try {
                                URL.revokeObjectURL(selectedGifPreview);
                            } catch (e) {}
                            setSelectedGifPreview(null);
                        }
                        setCommunityDetail(null);
                        loadKanji();
                    } catch (gifErr: any) {
                        console.error("Upload GIF thất bại:", gifErr);
                        message.error(
                            gifErr?.response?.data?.message ||
                                gifErr?.message ||
                                "Upload GIF thất bại (kiểm tra kích thước <10MB)"
                        );
                    } finally {
                        setFormLoading(false);
                    }
                    return;
                }

                if (formChanged && !hasGif) {
                    try {
                        await callCreateOrUpdateKanji(payload);
                        message.success("Cập nhật kanji thành công");
                        setFormOpen(false);
                        setEditingKanji(null);
                        setCommunityDetail(null);
                        loadKanji();
                    } catch (updErr: any) {
                        console.error("Cập nhật kanji thất bại:", updErr);
                        message.error(
                            updErr?.response?.data?.message ||
                                updErr?.message ||
                                "Cập nhật thất bại"
                        );
                    } finally {
                        setFormLoading(false);
                    }
                    return;
                }

                if (formChanged && hasGif) {
                    try {
                        const res = await callCreateOrUpdateKanji(payload);
                        const body = (res?.data ||
                            res) as IBackendRes<IKanjiResponse>;
                        const saved =
                            (body.result as IKanjiResponse) ||
                            (body.data as IKanjiResponse) ||
                            (body as any);

                        if (!saved || !saved.characterName) {
                            throw new Error(
                                "Server không trả về dữ liệu kanji sau cập nhật"
                            );
                        }

                        if (selectedGifFile!.size > MAX_GIF_SIZE) {
                            throw new Error("File GIF phải nhỏ hơn 10MB");
                        }

                        await callUploadKanjiGif(
                            saved.characterName,
                            selectedGifFile!
                        );

                        message.success("Cập nhật và upload GIF thành công");
                        setFormOpen(false);
                        setEditingKanji(null);
                        setSelectedGifFile(null);
                        if (selectedGifPreview) {
                            try {
                                URL.revokeObjectURL(selectedGifPreview);
                            } catch (e) {}
                            setSelectedGifPreview(null);
                        }
                        setCommunityDetail(null);
                        loadKanji();
                    } catch (err: any) {
                        console.error("Cập nhật + upload GIF thất bại:", err);
                        message.error(
                            err?.response?.data?.message ||
                                err?.message ||
                                "Cập nhật thất bại"
                        );
                    } finally {
                        setFormLoading(false);
                    }
                    return;
                }

                message.info("Không có thay đổi để lưu.");
                setFormLoading(false);
                return;
            }

            if (formMode === "create") {
                try {
                    const res = await callCreateOrUpdateKanji(payload);
                    const body = (res?.data ||
                        res) as IBackendRes<IKanjiResponse>;
                    const saved =
                        (body.result as IKanjiResponse) ||
                        (body.data as IKanjiResponse) ||
                        (body as any);

                    if (!saved || !saved.characterName) {
                        throw new Error("Server không trả về dữ liệu kanji");
                    }

                    if (selectedGifFile) {
                        try {
                            if (selectedGifFile.size > MAX_GIF_SIZE) {
                                throw new Error("File GIF phải nhỏ hơn 10MB");
                            }
                            await callUploadKanjiGif(
                                saved.characterName,
                                selectedGifFile
                            );
                            message.success("Upload GIF thành công");
                        } catch (gifErr: any) {
                            console.error("Upload GIF thất bại:", gifErr);
                            message.error(
                                gifErr?.response?.data?.message ||
                                    gifErr?.message ||
                                    "Upload GIF thất bại"
                            );
                            setFormLoading(false);
                            return;
                        }
                    }

                    message.success("Tạo kanji thành công");
                    setFormOpen(false);
                    setSelectedGifFile(null);
                    if (selectedGifPreview) {
                        try {
                            URL.revokeObjectURL(selectedGifPreview);
                        } catch (e) {}
                        setSelectedGifPreview(null);
                    }
                    setEditingKanji(null);
                    setCommunityDetail(null);
                    loadKanji();
                } catch (err: any) {
                    console.error("Tạo kanji thất bại:", err);
                    message.error(
                        err?.response?.data?.message ||
                            err?.message ||
                            "Tạo kanji thất bại"
                    );
                } finally {
                    setFormLoading(false);
                }
            }
        } catch (err: any) {
            if (err?.errorFields) {
                setFormLoading(false);
                return;
            }
            console.error("Lưu kanji thất bại:", err);
            message.error(
                err?.response?.data?.message ||
                    err?.message ||
                    "Lưu kanji thất bại"
            );
            setFormLoading(false);
        }
    };

    const uploadProps = {
        beforeUpload: (file: File) => {
            const isGif =
                file.type === "image/gif" ||
                file.name.toLowerCase().endsWith(".gif");
            if (!isGif) {
                message.error("Vui lòng chọn file GIF");
                return Upload.LIST_IGNORE;
            }

            if (file.size > MAX_GIF_SIZE) {
                message.error("Kích thước file GIF phải nhỏ hơn 10MB");
                return Upload.LIST_IGNORE;
            }

            setSelectedGifFile(file);

            try {
                const url = URL.createObjectURL(file);
                setSelectedGifPreview(url);
            } catch (e) {
                setSelectedGifPreview(null);
            }

            return Upload.LIST_IGNORE;
        },
        onRemove: () => {
            setSelectedGifFile(null);
            if (selectedGifPreview) {
                URL.revokeObjectURL(selectedGifPreview);
                setSelectedGifPreview(null);
            }
        },
        multiple: false,
        showUploadList: {
            showPreviewIcon: false,
            showRemoveIcon: true,
        },
    };

    useEffect(() => {
        return () => {
            if (selectedGifPreview) {
                try {
                    URL.revokeObjectURL(selectedGifPreview);
                } catch (e) {}
            }
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        if (!formOpen) return;
        if (formMode !== "create") return;

        const character = form
            .getFieldValue("characterName")
            ?.toString()
            ?.trim?.();
        if (!character) return;

        if (typingDebounceRef.current)
            window.clearTimeout(typingDebounceRef.current);
        typingDebounceRef.current = window.setTimeout(async () => {
            try {
                const resp = await callGetKanjiDetail(character, {
                    saveHistory: false,
                } as any);
                const b = (resp?.data ||
                    resp) as IBackendRes<IKanjiDetailResponse>;
                const foundDetail =
                    (b.result as IKanjiDetailResponse) ||
                    (b.data as IKanjiDetailResponse) ||
                    (b as any);

                if (foundDetail && foundDetail.characterName) {
                    setCommunityDetail(foundDetail);
                    message.info(
                        `Tìm thấy thông tin cộng đồng cho '${character}' — hiển thị dưới dạng chỉ đọc`
                    );

                    const currentMeaning = form.getFieldValue("meaning");
                    if (!currentMeaning && foundDetail.meaning) {
                        form.setFieldsValue({ meaning: foundDetail.meaning });
                        // đồng bộ editor state khi auto-fill trong create form
                        setMeaningState(foundDetail.meaning || "");
                    }
                } else {
                    setCommunityDetail(null);
                    message.warning(
                        `Không tìm thấy thông tin cộng đồng cho '${character}'`
                    );
                }
            } catch (err: any) {
                console.error("Kiểm tra/ lấy detail kanji thất bại:", err);
                setCommunityDetail(null);
            }
        }, 700);

        return () => {
            if (typingDebounceRef.current)
                window.clearTimeout(typingDebounceRef.current);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [formOpen, formMode]);

    const handleSinoInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const raw = e.target.value || "";
        const upper = raw.toUpperCase();
        form.setFieldsValue({ sinoViName: upper });
    };

    return (
        <div className="py-4 px-2">
            {/* === SEARCH AREA === */}
            <Form<KanjiSearchValues>
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
                                    placeholder="Tìm theo ký tự hoặc tên Hán-Việt"
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
                                name="levels"
                                label="Trình độ (JLPT)"
                                className="mb-0"
                            >
                                <Select
                                    mode="multiple"
                                    allowClear
                                    placeholder="Tất cả"
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

            <div className="bg-white rounded-2xl shadow p-4 mb-3">
                <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-base"></h3>
                    <div className="flex items-center gap-3">
                        {canCreate && (
                            <Button
                                icon={<PlusOutlined />}
                                className="!bg-green-500 !text-white !border-none hover:!bg-green-600 hover:!text-white"
                                onClick={openCreateModal}
                            >
                                Tạo kanji
                            </Button>
                        )}
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <Table
                        rowKey={(r) => r.id}
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
                            onChange: (
                                pageNum: number,
                                pageSizeNew?: number
                            ) => {
                                setPage(pageNum);
                                if (pageSizeNew && pageSizeNew !== size)
                                    setSize(pageSizeNew);
                            },
                        }}
                        scroll={{ x: 1200 }}
                    />
                </div>
            </div>

            {/* Modal xem chi tiết */}
            {detailKey !== null && (
                <SearchResultModal
                    open={detailOpen}
                    onClose={() => {
                        setDetailOpen(false);
                        setDetailKey(null);
                    }}
                    entityType="KANJI"
                    entityId={detailKey}
                />
            )}

            {/* Modal tạo / sửa Kanji */}
            <Modal
                title={
                    <span className="text-[16px] font-normal">
                        {formMode === "create"
                            ? "Tạo Kanji mới"
                            : "Chỉnh sửa Kanji"}
                    </span>
                }
                open={formOpen}
                onCancel={() => {
                    setFormLoading(false);
                    setFormOpen(false);
                    setEditingKanji(null);
                    setSelectedGifFile(null);
                    if (selectedGifPreview) {
                        try {
                            URL.revokeObjectURL(selectedGifPreview);
                        } catch (e) {}
                        setSelectedGifPreview(null);
                    }
                    setCommunityDetail(null);
                    // reset editor state (an toàn)
                    setMeaningState("");
                }}
                onOk={handleSubmit}
                okText={formMode === "create" ? "Tạo" : "Lưu"}
                cancelText="Hủy"
                confirmLoading={formLoading}
                width={900}
                className="with-padding-modal"
                cancelButtonProps={{
                    className:
                        "!text-red-600 hover:!text-white hover:!bg-red-500 hover:!border-red-500",
                }}
            >
                <Form form={form} layout="vertical">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <Form.Item
                            name="characterName"
                            label="Ký tự Kanji"
                            rules={[
                                {
                                    required: true,
                                    message: "Vui lòng nhập ký tự Kanji",
                                },
                            ]}
                            className="mb-0"
                        >
                            <Input
                                placeholder="Ví dụ: 水"
                                size="middle"
                                style={{ height: 32, paddingRight: 8 }}
                                suffix={
                                    <Tooltip title="Kiểm tra Kanji">
                                        <Button
                                            type="text"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleCheckCharacter();
                                            }}
                                            icon={
                                                checkLoading ? (
                                                    <span className="inline-block w-4 h-4 border-2 border-gray-300 rounded-full animate-spin" />
                                                ) : (
                                                    <FiSearch />
                                                )
                                            }
                                        />
                                    </Tooltip>
                                }
                            />
                        </Form.Item>

                        <Form.Item name="sinoViName" label="Tên Hán Việt">
                            <Input
                                placeholder="Ví dụ: THỦY"
                                onChange={handleSinoInputChange}
                            />
                        </Form.Item>

                        <Form.Item
                            name="level"
                            label="Trình độ (JLPT)"
                            rules={[{ required: true, message: "Chọn level" }]}
                        >
                            <Select
                                placeholder="Chọn level"
                                options={[
                                    { label: "N5", value: "N5" },
                                    { label: "N4", value: "N4" },
                                    { label: "N3", value: "N3" },
                                    { label: "N2", value: "N2" },
                                    { label: "N1", value: "N1" },
                                ]}
                            />
                        </Form.Item>
                    </div>

                    {/* phần còn lại giữ nguyên */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                        <Form.Item label="Kun-yomi (cách đọc)">
                            <Input
                                value={
                                    (communityDetail as any)?.kunyomi?.join?.(
                                        ", "
                                    ) ||
                                    (communityDetail as any)?.kunyomi ||
                                    ""
                                }
                                disabled
                            />
                        </Form.Item>
                        <Form.Item label="On-yomi (cách đọc)">
                            <Input
                                value={
                                    (communityDetail as any)?.onyomi?.join?.(
                                        ", "
                                    ) ||
                                    (communityDetail as any)?.onyomi ||
                                    ""
                                }
                                disabled
                            />
                        </Form.Item>
                        <Form.Item label="Số nét">
                            <Input
                                value={(communityDetail as any)?.stroke || ""}
                                disabled
                            />
                        </Form.Item>
                    </div>

                    {/* === CHỖ REACTQUILL: controlled bằng meaningState để tránh lỗi hiển thị lần đầu === */}
                    <Form.Item name="meaning" label="Nghĩa">
                        <ReactQuill
                            theme="snow"
                            value={meaningState}
                            onChange={(val: string) => {
                                // cập nhật state editor và đồng bộ vào form
                                setMeaningState(val);
                                form.setFieldsValue({ meaning: val });
                            }}
                            modules={{
                                toolbar: [
                                    [{ header: [1, 2, false] }],
                                    ["bold", "italic", "underline", "strike"],
                                    [{ list: "ordered" }, { list: "bullet" }],
                                    ["link", "image"],
                                ],
                            }}
                        />
                    </Form.Item>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-2 items-start">
                        <div>
                            <div className="mb-2">Ảnh GIF</div>

                            <Upload {...uploadProps} accept="image/gif">
                                <Button>Chọn GIF</Button>
                            </Upload>

                            {selectedGifPreview && (
                                <div className="mt-2">
                                    <div className="text-xs mb-1">
                                        Preview GIF đã chọn:
                                    </div>
                                    <img
                                        src={selectedGifPreview}
                                        alt="preview gif"
                                        className="max-h-40 object-contain"
                                    />
                                </div>
                            )}

                            {!selectedGifPreview &&
                                editingKanji &&
                                (editingKanji as any).gifUrl && (
                                    <div className="mt-2">
                                        <div className="text-xs mb-1">
                                            GIF hiện tại:
                                        </div>
                                        <img
                                            src={(editingKanji as any).gifUrl}
                                            alt="current gif"
                                            className="max-h-40 object-contain"
                                        />
                                    </div>
                                )}

                            {selectedGifFile && (
                                <div className="text-xs mt-1">
                                    Đã chọn: {selectedGifFile.name}
                                </div>
                            )}
                        </div>

                        <Form.Item
                            name="videoUrl"
                            label="Link video (tuỳ chọn)"
                            className="md:col-span-2"
                        >
                            <Input
                                value={
                                    (communityDetail as any)?.videoUrl ||
                                    (editingKanji as any)?.videoUrl ||
                                    ""
                                }
                                disabled
                            />
                        </Form.Item>
                    </div>
                </Form>
            </Modal>
        </div>
    );
}
