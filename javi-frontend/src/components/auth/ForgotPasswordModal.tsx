import { useState } from "react";
import { Modal, Form, Input, Button, message } from "antd";
import { callForgotPassword } from "@/apis/authApi";

interface Props {
    open: boolean;
    onClose: () => void;
}

export default function ForgotPasswordModal({ open, onClose }: Props) {
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);

    const handleSend = async () => {
        try {
            const { email } = await form.validateFields();
            setLoading(true);
            const res = await callForgotPassword(email);

            const msg =
                res?.data?.message ||
                "Email khôi phục mật khẩu đã được gửi. Vui lòng kiểm tra hộp thư của bạn!";
            message.success(msg);

            form.resetFields();
            onClose();
        } catch (err: any) {
            const beMsg =
                err?.response?.data?.message ||
                err?.response?.data?.error ||
                "Không thể gửi email, vui lòng thử lại.";
            message.error(beMsg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal
            title={<div className="font-normal text-base">Quên mật khẩu</div>}
            open={open}
            onCancel={onClose}
            footer={null}
            centered
            className="with-padding-modal"
            destroyOnClose
        >
            <p className="text-sm text-gray-500 mb-4">
                Nhập email của bạn. Chúng tôi sẽ gửi liên kết đặt lại mật khẩu
                qua email.
            </p>

            <Form form={form} layout="vertical" requiredMark={false}>
                <Form.Item
                    name="email"
                    label={
                        <span className="font-medium text-gray-700">Email</span>
                    }
                    rules={[
                        { required: true, message: "Vui lòng nhập email" },
                        {
                            type: "email",
                            message: "Địa chỉ email không hợp lệ",
                        },
                    ]}
                >
                    <Input
                        placeholder="nhap@vidu.com"
                        className="rounded-lg py-2"
                    />
                </Form.Item>

                <div className="flex justify-end mt-2">
                    <Button
                        onClick={onClose}
                        className="mr-2 rounded-lg hover:!border-red-500 hover:!text-red-500"
                    >
                        Hủy
                    </Button>
                    <Button
                        type="primary"
                        loading={loading}
                        onClick={handleSend}
                        className="bg-[#3e67d6] hover:!bg-[#3558b6] rounded-lg"
                    >
                        Gửi email xác nhận
                    </Button>
                </div>
            </Form>
        </Modal>
    );
}
