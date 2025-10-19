import { Form, Input, Button, Card } from "antd";
import { LockOutlined, MailOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../../stores/useAuthStore";
import axiosClient from "../../apis/axiosClient";

export default function LoginPage() {
    const navigate = useNavigate();
    const setToken = useAuthStore((state) => state.setToken);

    const onFinish = async (values: any) => {
        try {
            const response = await axiosClient.post("/auth/login", values);
            setToken(response.data.token);
            navigate("/");
        } catch (error) {
            console.error("Login failed:", error);
        }
    };

    return (
        <div className="flex justify-center items-center min-h-screen bg-gray-50">
            <Card className="w-[380px] shadow-md" bordered={false}>
                <h2 className="text-2xl font-semibold mb-6 text-center">
                    Đăng nhập
                </h2>
                <Form layout="vertical" onFinish={onFinish}>
                    <Form.Item
                        name="email"
                        label="Email"
                        rules={[
                            { required: true, message: "Vui lòng nhập email!" },
                        ]}
                    >
                        <Input
                            prefix={<MailOutlined />}
                            placeholder="Nhập email của bạn"
                        />
                    </Form.Item>
                    <Form.Item
                        name="password"
                        label="Mật khẩu"
                        rules={[
                            {
                                required: true,
                                message: "Vui lòng nhập mật khẩu!",
                            },
                        ]}
                    >
                        <Input.Password
                            prefix={<LockOutlined />}
                            placeholder="Nhập mật khẩu"
                        />
                    </Form.Item>
                    <Button
                        type="primary"
                        htmlType="submit"
                        block
                        size="large"
                        className="mt-2"
                    >
                        Đăng nhập
                    </Button>
                </Form>
                <div className="text-center mt-4">
                    <p className="text-gray-500">
                        Chưa có tài khoản?{" "}
                        <span
                            onClick={() => navigate("/register")}
                            className="text-blue-500 cursor-pointer"
                        >
                            Đăng ký
                        </span>
                    </p>
                </div>
            </Card>
        </div>
    );
}
