import React, { useEffect, useState } from "react";
import { Form, Input, Select, Button, Row, Col, Space } from "antd";
import {
    SearchOutlined,
    ReloadOutlined,
    FilterOutlined,
} from "@ant-design/icons";

// Kiểu level dùng chung
export type JlptLevel = "N5" | "N4" | "N3" | "N2" | "N1";

export interface AdminSearchValues {
    keyword?: string;
    levels?: JlptLevel[];
    status?: string;
    roleId?: number;
    premiumType?: string;
    // cho phép truyền thêm filter khác
    [key: string]: any;
}

export interface AdminSearchBarProps {
    // Placeholder cho ô keyword
    keywordPlaceholder?: string;

    // Có hiển thị filter level hay không
    showLevelFilter?: boolean;

    // Có hiển thị filter status hay không (dùng cho User)
    showStatusFilter?: boolean;
    statusOptions?: { label: string; value: string }[];

    // Optional: filter dạng select role (User)
    roleOptions?: { label: string; value: number }[];

    // Phần filter nâng cao thêm do từng màn tự truyền vào
    extraAdvancedFilters?: React.ReactNode;

    // Giá trị khởi tạo (khi reload trang / back từ history)
    initialValues?: Partial<AdminSearchValues>;

    // Callback khi bấm Tìm kiếm
    onSearch: (values: AdminSearchValues) => void;

    // Callback khi Reset (optional)
    onReset?: () => void;
}

const JLPT_LEVEL_OPTIONS = [
    { label: "N5", value: "N5" },
    { label: "N4", value: "N4" },
    { label: "N3", value: "N3" },
    { label: "N2", value: "N2" },
    { label: "N1", value: "N1" },
];

function AdminSearchBar(props: AdminSearchBarProps) {
    const {
        keywordPlaceholder = "Tìm theo từ khoá...",
        showLevelFilter = false,
        showStatusFilter = false,
        statusOptions,
        roleOptions,
        extraAdvancedFilters,
        initialValues,
        onSearch,
        onReset,
    } = props;

    const [form] = Form.useForm<AdminSearchValues>();
    const [showAdvanced, setShowAdvanced] = useState(false);

    // gán giá trị khởi tạo nếu có
    useEffect(() => {
        if (initialValues) {
            form.setFieldsValue(initialValues);
        }
    }, [initialValues, form]);

    // xử lý nút tìm kiếm
    const handleSubmit = () => {
        const values = form.getFieldsValue();

        if (values.keyword) {
            values.keyword = values.keyword.trim();
        }

        onSearch(values);
    };

    // xử lý reset
    const handleReset = () => {
        form.resetFields();
        if (onReset) onReset();
        onSearch({});
    };

    return (
        <div className="mb-4 bg-white rounded-2xl shadow px-4 py-4">
            <Form
                form={form}
                layout="vertical"
                onFinish={handleSubmit}
                autoComplete="off"
            >
                {/* Hàng 1: ô keyword to + nút Tìm kiếm ở bên phải */}
                <Row gutter={12} align="middle">
                    <Col xs={24} md={18} lg={18}>
                        <Form.Item name="keyword" label="Từ khoá">
                            <Input
                                size="large"
                                allowClear
                                placeholder={keywordPlaceholder}
                                onPressEnter={() => form.submit()}
                            />
                        </Form.Item>
                    </Col>

                    <Col
                        xs={24}
                        md={6}
                        lg={6}
                        className="flex items-end justify-start md:justify-end"
                    >
                        <Button
                            type="primary"
                            size="large"
                            icon={<SearchOutlined />}
                            onClick={() => form.submit()}
                            className="w-full md:w-auto"
                        >
                            Tìm kiếm
                        </Button>
                    </Col>
                </Row>

                {/* Hàng 2: filter phụ bên trái, Xoá lọc bên phải (thẳng dưới nút Tìm kiếm & cùng hàng filter) */}
                <Row gutter={12}>
                    {/* Bên trái: các filter chiếm 18 cột */}
                    <Col xs={24} md={18}>
                        <Row gutter={12}>
                            {showLevelFilter && (
                                <Col xs={24} sm={12} md={8}>
                                    <Form.Item
                                        name="levels"
                                        label="Trình độ (JLPT)"
                                    >
                                        <Select
                                            mode="multiple"
                                            allowClear
                                            placeholder="Chọn level"
                                            options={JLPT_LEVEL_OPTIONS}
                                            maxTagCount="responsive"
                                        />
                                    </Form.Item>
                                </Col>
                            )}

                            {showStatusFilter && (
                                <Col xs={24} sm={12} md={8}>
                                    <Form.Item name="status" label="Trạng thái">
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
                                </Col>
                            )}

                            {roleOptions && (
                                <Col xs={24} sm={12} md={8}>
                                    <Form.Item name="roleId" label="Vai trò">
                                        <Select
                                            allowClear
                                            placeholder="Tất cả"
                                            options={roleOptions}
                                        />
                                    </Form.Item>
                                </Col>
                            )}
                        </Row>
                    </Col>

                    {/* Bên phải: Xoá lọc + Lọc nâng cao chiếm 6 cột, dùng Form.Item trống label để cùng hàng */}
                    <Col xs={24} md={6}>
                        <Form.Item label=" " colon={false}>
                            <div className="flex justify-start md:justify-end">
                                <Space wrap>
                                    <Button
                                        icon={<ReloadOutlined />}
                                        onClick={handleReset}
                                        className="!border-gray-300 !text-gray-700 hover:!border-red-400 hover:!text-red-500 hover:!bg-red-50"
                                    >
                                        Xoá lọc
                                    </Button>

                                    {extraAdvancedFilters && (
                                        <Button
                                            type={
                                                showAdvanced
                                                    ? "default"
                                                    : "dashed"
                                            }
                                            icon={<FilterOutlined />}
                                            onClick={() =>
                                                setShowAdvanced((prev) => !prev)
                                            }
                                        >
                                            {showAdvanced
                                                ? "Ẩn nâng cao"
                                                : "Lọc nâng cao"}
                                        </Button>
                                    )}
                                </Space>
                            </div>
                        </Form.Item>
                    </Col>
                </Row>

                {/* Khu vực filter nâng cao */}
                {showAdvanced && extraAdvancedFilters && (
                    <div className="mt-3 border-t pt-3">
                        {extraAdvancedFilters}
                    </div>
                )}
            </Form>
        </div>
    );
}

export default AdminSearchBar;
