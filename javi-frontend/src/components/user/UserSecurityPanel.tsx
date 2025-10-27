import { useState } from "react";
import { Form, Input, Button, message } from "antd";
import { AiOutlineLock } from "react-icons/ai";
import { callChangePassword } from "@/apis/userApi";
import { useAuthStore } from "@/stores/useAuthStore";

export default function UserSecurityPanel() {
    const [form] = Form.useForm();
    const { user } = useAuthStore();
    const [loading, setLoading] = useState(false);

    const handleChangePassword = async () => {
        if (!user?.id) {
            message.error(
                "Không xác định được người dùng, vui lòng đăng nhập lại!"
            );
            return;
        }

        try {
            const values = await form.validateFields();
            setLoading(true);

            const res = await callChangePassword(user.id, values);
            if (res.data?.result) {
                message.success("Đổi mật khẩu thành công!");
                form.resetFields();
            } else if (res.data?.message) {
                message.error(res.data.message);
            } else {
                message.error("Đổi mật khẩu thất bại, vui lòng thử lại!");
            }
        } catch (error: any) {
            // chỉ hứng message BE nếu có, không thêm điều kiện abort
            const msg =
                error.response?.data?.message ||
                "Không thể đổi mật khẩu, vui lòng thử lại.";
            message.error(msg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-white rounded-2xl shadow p-6 w-full min-h-[400px]">
            <div className="flex items-center gap-2 mb-4 border-b border-gray-200 pb-3">
                <div className="bg-[#3e67d6] w-[28px] h-[28px] rounded-full flex items-center justify-center text-white">
                    <AiOutlineLock className="text-lg" />
                </div>
                <h3 className="text-lg font-normal text-gray-800">
                    Bảo mật tài khoản
                </h3>
            </div>

            <Form
                layout="vertical"
                form={form}
                className="w-full"
                requiredMark={false}
            >
                <Form.Item
                    name="oldPassword"
                    label={
                        <span className="font-medium text-gray-700">
                            Mật khẩu hiện tại
                        </span>
                    }
                    rules={[
                        {
                            required: true,
                            message: "Vui lòng nhập mật khẩu hiện tại",
                        },
                    ]}
                >
                    <Input.Password className="rounded-lg py-2 w-full" />
                </Form.Item>

                <Form.Item
                    name="newPassword"
                    label={
                        <span className="font-medium text-gray-700">
                            Mật khẩu mới
                        </span>
                    }
                    rules={[
                        {
                            required: true,
                            message: "Vui lòng nhập mật khẩu mới",
                        },
                    ]}
                >
                    <Input.Password className="rounded-lg py-2 w-full" />
                </Form.Item>

                <Form.Item
                    name="confirmPassword"
                    label={
                        <span className="font-medium text-gray-700">
                            Nhập lại mật khẩu mới
                        </span>
                    }
                    dependencies={["newPassword"]}
                    rules={[
                        {
                            required: true,
                            message: "Vui lòng xác nhận mật khẩu mới",
                        },
                        ({ getFieldValue }) => ({
                            validator(_, value) {
                                if (
                                    !value ||
                                    getFieldValue("newPassword") === value
                                )
                                    return Promise.resolve();
                                return Promise.reject(
                                    new Error("Mật khẩu không khớp!")
                                );
                            },
                        }),
                    ]}
                >
                    <Input.Password className="rounded-lg py-2 w-full" />
                </Form.Item>

                <div className="flex justify-end mt-4">
                    <Button
                        type="primary"
                        loading={loading}
                        onClick={handleChangePassword}
                        className="bg-[#3e67d6] hover:!bg-[#3558b6] px-6 rounded-lg"
                    >
                        Đổi mật khẩu
                    </Button>
                </div>
            </Form>
        </div>
    );
}
