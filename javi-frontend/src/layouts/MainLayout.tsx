import { Layout, Menu } from "antd";
import { Outlet, Link } from "react-router-dom";

const { Header, Content, Sider } = Layout;

export default function MainLayout() {
    return (
        <Layout style={{ minHeight: "100vh" }}>
            <Sider theme="light">
                <div className="p-4 font-bold text-xl">Javi</div>
                <Menu mode="inline" defaultSelectedKeys={["1"]}>
                    <Menu.Item key="1">
                        <Link to="/">Từ vựng</Link>
                    </Menu.Item>
                    <Menu.Item key="2">
                        <Link to="/grammar">Ngữ pháp</Link>
                    </Menu.Item>
                    <Menu.Item key="3">
                        <Link to="/kanji">Kanji</Link>
                    </Menu.Item>
                </Menu>
            </Sider>
            <Layout>
                <Header className="bg-white shadow px-6 flex justify-end items-center">
                    <div className="font-medium">Xin chào!</div>
                </Header>
                <Content className="p-6 bg-gray-50">
                    <Outlet />
                </Content>
            </Layout>
        </Layout>
    );
}
