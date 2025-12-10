import { useEffect, useRef, useState } from "react";
import { Modal, Spin, message } from "antd";
import ForceGraph2D from "react-force-graph-2d";
import { callAnalyzeKanji } from "@/apis/kanjiApi";
import {
    IKanjiComponentNode,
    IKanjiDecompositionResult,
} from "@/types/backend";
import { LoadingOutlined } from "@ant-design/icons";

interface Props {
    open: boolean;
    onClose: () => void;
    kanji: string;
}

export default function KanjiDecompositionModal({
    open,
    onClose,
    kanji,
}: Props) {
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState<IKanjiDecompositionResult | null>(null);
    const fgRef = useRef<any>();
    const containerRef = useRef<HTMLDivElement>(null);

    const buildGraph = (root: IKanjiComponentNode) => {
        const nodes: any[] = [];
        const links: any[] = [];

        const traverse = (
            node: IKanjiComponentNode,
            parent?: string,
            level = 0
        ) => {
            nodes.push({
                id: node.kanji,
                label: node.kanji,
                explain: node.explanation,
                isRoot: !parent,
                level,
            });
            if (parent) links.push({ source: parent, target: node.kanji });
            node.components.forEach((child) =>
                traverse(child, node.kanji, level + 1)
            );
        };
        traverse(root);
        return { nodes, links };
    };

    useEffect(() => {
        if (!open) return;
        setLoading(true);

        callAnalyzeKanji(kanji)
            .then((res) => {
                setData(res.data?.result ?? null);
            })
            .catch((err) => {
                console.error("Lỗi khi phân tích Kanji:", err);
                const msg =
                    err.response?.data?.message ||
                    "Không thể phân tích Kanji. Vui lòng thử lại!";
                message.error(msg);
                setData(null);
            })
            .finally(() => setLoading(false));
    }, [open]);

    // Tự động focus lại chữ Hán gốc sau khi thả chuột 2s
    useEffect(() => {
        if (!fgRef.current) return;
        let timeout: NodeJS.Timeout;

        const recenter = () => {
            const graph = fgRef.current.graphData();
            const rootNode = graph.nodes.find((n: any) => n.isRoot);
            if (!rootNode) return;
            fgRef.current.centerAt(rootNode.x, rootNode.y, 800);
        };

        const handler = () => {
            clearTimeout(timeout);
            timeout = setTimeout(recenter, 2000);
        };

        window.addEventListener("mouseup", handler);
        return () => window.removeEventListener("mouseup", handler);
    }, []);

    // Khi modal mở → auto scroll thanh cuộn ngang và dọc ra giữa
    useEffect(() => {
        if (open && containerRef.current) {
            const container = containerRef.current;
            setTimeout(() => {
                container.scrollLeft =
                    (container.scrollWidth - container.clientWidth) / 2;
                container.scrollTop =
                    (container.scrollHeight - container.clientHeight) / 2;
            }, 500);
        }
    }, [open, data]);

    if (loading)
        return (
            <Modal
                open={open}
                onCancel={onClose}
                footer={null}
                centered
                width={800}
            >
                <div className="flex justify-center py-10">
                    <Spin indicator={<LoadingOutlined spin />} size="large" />
                </div>
            </Modal>
        );

    const graphData = data ? buildGraph(data) : null;

    return (
        <Modal
            className="with-padding-modal"
            open={open}
            onCancel={onClose}
            footer={null}
            centered
            width={800}
            bodyStyle={{
                height: 500,
                padding: 0,
                overflow: "auto",
                overflowX: "auto",
            }}
            title={<p className="text-xl font-normal">Phân tích: {kanji}</p>}
        >
            <div
                ref={containerRef}
                className="scroll-container w-full h-full overflow-auto "
                style={{
                    scrollbarWidth: "thin",
                }}
            >
                {graphData ? (
                    <ForceGraph2D
                        ref={fgRef}
                        graphData={graphData}
                        width={containerRef.current?.clientWidth || 800}
                        height={containerRef.current?.clientHeight || 500}
                        nodeLabel={(node: any) =>
                            `${node.label}: ${node.explain || ""}`
                        }
                        nodeAutoColorBy="group"
                        nodeCanvasObject={(node: any, ctx, globalScale) => {
                            const baseRadius = 20;
                            const radius = baseRadius / globalScale;

                            ctx.beginPath();
                            ctx.arc(node.x!, node.y!, radius, 0, 2 * Math.PI);

                            ctx.save();
                            ctx.lineWidth = 1 / globalScale;
                            ctx.strokeStyle = "black";
                            ctx.stroke();
                            ctx.restore();

                            ctx.fillStyle = node.isRoot ? "#d0defe" : "white";
                            ctx.fill();

                            const fontSize = 18 / globalScale;
                            ctx.font = `${fontSize}px sans-serif`;
                            ctx.fillStyle = "black";
                            ctx.textAlign = "center";
                            ctx.textBaseline = "middle";
                            ctx.fillText(node.label, node.x!, node.y!);
                        }}
                        linkDirectionalParticles={4}
                        linkDirectionalParticleWidth={1.2}
                        linkDirectionalParticleSpeed={0.004}
                        linkColor={() => "rgba(0,0,0,0.3)"}
                        linkDirectionalArrowLength={0}
                        enableNodeDrag={true}
                        cooldownTicks={80}
                        // @ts-ignore // comment này không được bỏ
                        d3Force={(fg: any) => {
                            fg.force("link").distance(180);
                            fg.force("charge").strength(-220);
                        }}
                        onEngineStop={() => {
                            setTimeout(() => {
                                const graph = fgRef.current?.graphData();
                                const rootNode = graph?.nodes.find(
                                    (n: any) => n.isRoot
                                );
                                if (rootNode && rootNode.x && rootNode.y) {
                                    fgRef.current.centerAt(
                                        rootNode.x,
                                        rootNode.y,
                                        800
                                    );
                                    fgRef.current.zoomToFit(
                                        400,
                                        100,
                                        (n: any) => n.isRoot || n.level <= 2
                                    );
                                }
                            }, 500);
                        }}
                    />
                ) : (
                    <div className="text-center text-gray-500 mt-10">
                        Không có dữ liệu phân tích.
                    </div>
                )}
            </div>

            {/* Custom thanh cuộn nhỏ hơn */}
            <style>
                {`
                .scroll-container::-webkit-scrollbar {
                    height: 6px;
                    width: 6px;
                }
                .scroll-container::-webkit-scrollbar-thumb {
                    background-color: rgba(0, 0, 0, 0.35);
                    border-radius: 4px;
                }
                .scroll-container::-webkit-scrollbar-thumb:hover {
                    background-color: rgba(0, 0, 0, 0.55);
                }
                `}
            </style>
        </Modal>
    );
}
