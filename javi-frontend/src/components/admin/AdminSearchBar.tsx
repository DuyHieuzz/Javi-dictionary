import { useEffect } from "react";
import { Form, Input, Select, Button } from "antd";

export type JlptLevel = "N5" | "N4" | "N3" | "N2" | "N1";

export interface AdminSearchValues {
    keyword?: string;
    levels?: JlptLevel[];
    status?: string;
    roleId?: number;
    premiumType?: string;
    [key: string]: any;
}

export interface AdminSearchBarProps {
    initialValues?: Partial<AdminSearchValues>;
    values?: Partial<AdminSearchValues>;
    onSearch: (values: AdminSearchValues) => void;
    onReset?: () => void;
    showLevelFilter?: boolean;
    showStatusFilter?: boolean;
    statusOptions?: { label: string; value: string }[];
    roleOptions?: { label: string; value: number }[];
    keywordPlaceholder?: string;
}

const JLPT_LEVEL_OPTIONS = [
    { label: "N5", value: "N5" },
    { label: "N4", value: "N4" },
    { label: "N3", value: "N3" },
    { label: "N2", value: "N2" },
    { label: "N1", value: "N1" },
];

export default function AdminSearchBar({
    initialValues,
    values,
    onSearch,
    onReset,
    showLevelFilter = false,
    showStatusFilter = false,
    statusOptions,
    roleOptions,
    keywordPlaceholder = "Tìm theo tên, username hoặc email",
}: AdminSearchBarProps) {
    // Dùng form nội bộ giống AdminVocabulary (không bắt parent truyền form)
    const [form] = Form.useForm<AdminSearchValues>();

    // Ưu tiên initialValues, fallback values (tương thích)
    const init = initialValues ?? values ?? {};

    /**
     * Sync initialValues/values vào form.
     * Nếu init là object rỗng (không có key) -> gọi resetFields()
     * để đảm bảo UI bị clear ngay lập tức (không còn giá trị cũ).
     * Giải quyết tình huống parent set searchValues = {}
     * nhưng form AntD vẫn giữ lại value cũ (cần reset hoàn toàn).
     */
    useEffect(() => {
        try {
            const isEmpty = !init || Object.keys(init).length === 0;
            if (isEmpty) {
                // Nếu parent truyền empty => reset form hoàn toàn
                form.resetFields();
            } else {
                // Có giá trị -> set vào form
                form.setFieldsValue(init);
            }
        } catch (e) {
            // Không để lỗi làm crash, chỉ cảnh báo
            console.warn("AdminSearchBar gọi có lỗi", e);
        }
    }, [initialValues, values]);

    // Khi submit -> gọi onSearch (giữ nguyên behavior)
    const handleSearchSubmit = (v: AdminSearchValues) => {
        if (v.keyword) v.keyword = v.keyword.trim();
        onSearch(v);
    };

    /**
     * RESET:
     * - Reset UI ngay lập tức (form.resetFields())
     * - Gọi onSearch({}) để parent load lại data với bộ lọc rỗng
     * - Sau đó gọi onReset() để parent có thể cập nhật internal state nếu cần
     *
     * Thứ tự này giúp tránh trường hợp UI vẫn giữ giá trị cũ
     * (parent và child đồng bộ trật nhịp).
     */
    const handleSearchReset = () => {
        // Reset UI ngay lập tức
        form.resetFields();
        form.setFieldsValue({});

        // Gọi onSearch({}) để parent fetch lại trang 1 với filter rỗng
        try {
            onSearch({});
        } catch (e) {
            // ignore
        }

        // Sau đó gọi onReset để parent cập nhật internal state (nếu parent cần)
        if (onReset) {
            try {
                onReset();
            } catch (e) {
                // ignore
            }
        }
    };

    return (
        <Form<AdminSearchValues>
            form={form}
            layout="vertical"
            onFinish={handleSearchSubmit}
        >
            <div className="bg-white rounded-2xl shadow p-4 mb-3">
                <div className="flex flex-col gap-3">
                    <div className="flex flex-col md:flex-row md:items-end gap-3">
                        <Form.Item
                            name="keyword"
                            label="Từ khoá"
                            className="mb-0 flex-1"
                            initialValue={init?.keyword}
                        >
                            <Input.Search
                                allowClear
                                placeholder={keywordPlaceholder}
                                autoComplete="off"
                                onSearch={() => form.submit()}
                            />
                        </Form.Item>

                        <div className="flex gap-2 md:justify-end">
                            <Button type="primary" htmlType="submit">
                                Tìm kiếm
                            </Button>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                        {showLevelFilter && (
                            <div>
                                <Form.Item
                                    name="levels"
                                    label="Trình độ (JLPT)"
                                    className="mb-0"
                                    initialValue={init?.levels}
                                >
                                    <Select
                                        mode="multiple"
                                        allowClear
                                        placeholder="Tất cả"
                                        options={JLPT_LEVEL_OPTIONS}
                                    />
                                </Form.Item>
                            </div>
                        )}

                        {showStatusFilter && (
                            <div>
                                <Form.Item
                                    name="status"
                                    label="Trạng thái"
                                    className="mb-0"
                                    initialValue={init?.status}
                                >
                                    <Select
                                        allowClear
                                        placeholder="Tất cả"
                                        options={
                                            statusOptions ?? [
                                                {
                                                    label: "ACTIVE",
                                                    value: "ACTIVE",
                                                },
                                                {
                                                    label: "BLOCKED",
                                                    value: "BLOCKED",
                                                },
                                            ]
                                        }
                                    />
                                </Form.Item>
                            </div>
                        )}

                        <div>
                            <Form.Item
                                name="roleId"
                                label="Vai trò"
                                className="mb-0"
                                initialValue={init?.roleId}
                            >
                                <Select
                                    allowClear
                                    placeholder="Tất cả"
                                    options={roleOptions}
                                />
                            </Form.Item>
                        </div>

                        <div className="flex justify-start md:justify-end">
                            <Button
                                onClick={handleSearchReset}
                                className="w-full md:w-auto hover:!border-red-500 hover:!text-red-500"
                            >
                                Xóa lọc
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </Form>
    );
}
