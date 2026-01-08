import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { format } from "date-fns";
import { NOTO_SANS_JP_BASE64 } from "./pdf-fonts";
import { Order, WorkOrder } from "@prisma/client";

/**
 * 生産指示書PDFを生成しダウンロードする
 */
export const generateProductionOrderPdf = async (order: Order, bomItems: any[], workOrders: WorkOrder[]) => {
    const doc = new jsPDF();

    // 日本語フォントの設定（フォントデータがある場合）
    if (NOTO_SANS_JP_BASE64 && NOTO_SANS_JP_BASE64 !== "data:font/ttf;base64,...") {
        const fontData = NOTO_SANS_JP_BASE64.split(",")[1];
        doc.addFileToVFS("NotoSansJP-Regular.ttf", fontData);
        doc.addFont("NotoSansJP-Regular.ttf", "NotoSans", "normal");
        doc.setFont("NotoSans");
    } else {
        console.warn("Japanese font not found. Falling back to standard fonts.");
    }

    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 14;

    // --- ヘッダー ---
    doc.setFontSize(20);
    doc.text("生産指示書", pageWidth / 2, 20, { align: "center" });

    doc.setFontSize(10);
    doc.text(`発行日: ${format(new Date(), "yyyy/MM/dd")}`, pageWidth - margin, 10, { align: "right" });
    doc.text(`案件番号: ${order.orderNo}`, margin, 30);

    // --- 案件情報エリア ---
    doc.setDrawColor(200);
    doc.rect(margin, 35, pageWidth - (margin * 2), 40);

    doc.setFontSize(11);
    doc.text(`顧客名: ${order.customerName}`, margin + 5, 45);
    doc.text(`製品名: ${order.productName}`, margin + 5, 55);
    doc.text(`納期: ${format(new Date(order.dueDate), "yyyy/MM/dd")}`, margin + 5, 65);
    doc.text(`仕様: ${order.productSpec || "特になし"}`, margin + 5, 75);

    // --- 工程スケジュール表 ---
    doc.setFontSize(14);
    doc.text("■ 工程スケジュール", margin, 90);

    autoTable(doc, {
        startY: 95,
        head: [["順序", "工程名", "予定開始", "予定終了", "数量", "状態"]],
        body: workOrders.map((wo: any) => [
            wo.processOrder,
            wo.processName,
            format(new Date(wo.plannedStartDate), "MM/dd"),
            format(new Date(wo.plannedEndDate), "MM/dd"),
            wo.plannedQuantity,
            wo.status
        ]),
        styles: { font: "NotoSans", fontStyle: "normal" }, // 日本語フォント適用
        headStyles: { fillColor: [66, 66, 66] },
    });

    // --- BOM (部品一覧) 表 ---
    const finalY = (doc as any).lastAutoTable.finalY + 10;
    doc.setFontSize(14);
    doc.text("■ 使用部品一覧 (BOM)", margin, finalY);

    autoTable(doc, {
        startY: finalY + 5,
        head: [["部品コード", "部品名", "数量", "単位", "備考"]],
        body: bomItems.map((item: any) => [
            item.itemCode,
            item.itemName,
            item.quantity,
            item.unit,
            item.remarks || ""
        ]),
        styles: { font: "NotoSans", fontStyle: "normal" }, // 日本語フォント適用
        headStyles: { fillColor: [0, 121, 107] },
    });

    // PDFを保存
    doc.save(`ProductionOrder_${order.orderNo}.pdf`);
};
