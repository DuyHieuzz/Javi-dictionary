import { Button, Table } from "antd";
import { useState } from "react";

export default function VocabularyListPage() {
    const [data] = useState([
        { id: 1, word: "食べる", meaning: "Ăn" },
        { id: 2, word: "見る", meaning: "Nhìn" },
    ]);

    const columns = [
        { title: "Từ", dataIndex: "word" },
        { title: "Nghĩa", dataIndex: "meaning" },
    ];

    return (
        <div>
            <div className="flex justify-between mb-4">
                <h2 className="text-lg font-semibold">Danh sách từ vựng</h2>
                <Button type="primary">Thêm từ mới</Button>
            </div>
            <Table
                rowKey="id"
                columns={columns}
                dataSource={data}
                pagination={false}
            />
        </div>
    );
}
