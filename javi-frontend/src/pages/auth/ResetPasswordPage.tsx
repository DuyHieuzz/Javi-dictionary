import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Form, Input, Button, Card, message, Spin } from "antd";
import { callResetPassword, callVerifyResetToken } from "@/apis/authApi";

export default function ResetPasswordPage() {
    const [form] = Form.useForm();
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();

    const token = searchParams.get("token");
    const [loading, setLoading] = useState(false);
    const [verifying, setVerifying] = useState(true);
    const [tokenValid, setTokenValid] = useState(false);

    // Kiểm tra token ngay khi mở trang
    useEffect(() => {
        const verifyToken = async () => {
            if (!token) {
                message.error("Liên kết đặt lại mật khẩu không hợp lệ!");
                navigate("/login");
                return;
            }
            try {
                const res = await callVerifyResetToken(token);
                if (res.status === 200) {
                    setTokenValid(true);
                } else {
                    message.warning(
                        res.data?.message ||
                            "Liên kết đặt lại mật khẩu đã hết hạn hoặc không hợp lệ!"
                    );
                    navigate("/login");
                }
            } catch (err: any) {
                const msg =
                    err?.response?.data?.message ||
                    "Liên kết đặt lại mật khẩu đã hết hạn. Vui lòng yêu cầu email mới!";
                message.error(msg);
                navigate("/search");
            } finally {
                setVerifying(false);
            }
        };
        verifyToken();
    }, [token, navigate]);

    // Gửi yêu cầu đổi mật khẩu
    const handleSubmit = async () => {
        try {
            const values = await form.validateFields();
            setLoading(true);

            const res = await callResetPassword({
                token: token as string, // ép kiểu vì đã check null
                newPassword: values.newPassword,
                confirmPassword: values.confirmPassword,
            });

            if (res.status === 200) {
                message.success("Đổi mật khẩu thành công! Hãy đăng nhập lại.");
                navigate("/login");
            } else {
                message.error(
                    res.data?.message || "Không thể đặt lại mật khẩu!"
                );
            }
        } catch (err: any) {
            const msg =
                err?.response?.data?.message ||
                "Máy chủ không phản hồi, vui lòng thử lại sau.";
            message.error(msg);
        } finally {
            setLoading(false);
        }
    };

    // Hiển thị spinner khi đang verify
    if (verifying) {
        return (
            <div className="flex justify-center items-center min-h-[80vh]">
                <Spin size="large" />
            </div>
        );
    }

    // Nếu token invalid thì return null (đã navigate về login)
    if (!tokenValid) return null;

    return (
        <div className="flex justify-center items-center min-h-[80vh] bg-transparent">
            <Card
                className="shadow-lg border border-gray-100 rounded-2xl p-8 w-full max-w-[520px] bg-white"
                bordered={false}
            >
                <h2 className="text-2xl font-semibold text-center mb-6 text-gray-700">
                    Đặt lại mật khẩu
                </h2>

                <Form layout="vertical" form={form} onFinish={handleSubmit}>
                    <Form.Item
                        name="newPassword"
                        label={
                            <span className="font-medium text-gray-600">
                                Mật khẩu mới
                            </span>
                        }
                        rules={[
                            {
                                required: true,
                                message: "Vui lòng nhập mật khẩu mới",
                            },
                            {
                                min: 6,
                                message: "Mật khẩu phải có ít nhất 6 ký tự",
                            },
                        ]}
                    >
                        <Input.Password
                            placeholder="Nhập mật khẩu mới"
                            className="h-[48px] rounded-lg border-gray-300 text-base"
                        />
                    </Form.Item>

                    <Form.Item
                        name="confirmPassword"
                        label={
                            <span className="font-medium text-gray-600">
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
                                    ) {
                                        return Promise.resolve();
                                    }
                                    return Promise.reject(
                                        "Mật khẩu không khớp!"
                                    );
                                },
                            }),
                        ]}
                    >
                        <Input.Password
                            placeholder="Nhập lại mật khẩu mới"
                            className="h-[48px] rounded-lg border-gray-300 text-base"
                        />
                    </Form.Item>

                    <Button
                        type="primary"
                        htmlType="submit"
                        loading={loading}
                        className="w-full h-[48px] mt-3 bg-[#3e67d6] hover:bg-[#3558b6] text-white text-base rounded-lg transition-all duration-200"
                    >
                        Xác nhận đổi mật khẩu
                    </Button>
                </Form>
            </Card>
        </div>
    );
}
