import { Button, Card } from "antd";

function App() {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 gap-4">
            <h1 className="text-3xl font-bold text-blue-600">
                Hello Ant Design + Tailwind!
            </h1>

            <Card title="Thẻ Ant Design" className="shadow-lg w-80">
                <p>Đây là card của AntD, styled bằng Tailwind.</p>
            </Card>

            <Button type="primary" className="w-40">
                Nút Primary
            </Button>
        </div>
    );
}

export default App;
