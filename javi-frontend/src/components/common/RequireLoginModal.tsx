import React from "react";
import { Modal, Button } from "antd";
import { Link, useLocation } from "react-router-dom";

interface RequireLoginModalProps {
    open?: boolean;
    onClose?: () => void;
    message?: React.ReactNode;
}

/**
 * Modal yêu cầu đăng nhập (chỉ 1 component duy nhất)
 * - Không có hook kèm theo (để tránh render 2 modal)
 * - Footer tùy chỉnh dùng <Link> để điều hướng ổn định trong SPA
 * - onCancel có để mask / ESC đóng modal
 *
 * Mọi comment do mình sửa đều bằng tiếng Việt.
 */
export default function RequireLoginModal({
    open = false,
    onClose,
    message,
}: RequireLoginModalProps) {
    const location = useLocation();

    const handleCancel = () => {
        onClose?.();
    };

    return (
        <Modal
            // title dùng JSX để dễ tuỳ biến (không in đậm)
            title={
                <div className="font-normal text-base">Yêu cầu đăng nhập</div>
            }
            centered
            open={open}
            onCancel={handleCancel} // đảm bảo click mask / ESC sẽ đóng modal
            footer={
                <div className="flex justify-end gap-2">
                    <Button
                        onClick={handleCancel}
                        className="hover:!border-red-500 hover:!text-red-500"
                    >
                        Hủy
                    </Button>

                    {/* Dùng Link để React Router điều hướng chắc chắn (kèm state.from) */}
                    <Link
                        to="/login"
                        state={{
                            from:
                                location.pathname +
                                location.search +
                                location.hash,
                        }}
                    >
                        <Button type="primary">Đăng nhập</Button>
                    </Link>
                </div>
            }
            maskClosable
            // Giữ with-padding-modal (global) nhưng override body bằng bodyStyle
            className="with-padding-modal"
            bodyStyle={{ padding: 0 }}
        >
            {/* Wrapper body: bạn có thể dùng Tailwind thoải mái */}
            <div className="text-gray-500  text-sm py-3">
                {message ?? "Bạn cần đăng nhập để sử dụng tính năng này !"}
            </div>
        </Modal>
    );
}
