"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { FileText, Loader2 } from "lucide-react";
import { generateProductionOrderPdf } from "@/lib/utils/pdf-generator";
import { toast } from "sonner";

import { Order, WorkOrder } from "@prisma/client";

interface PdfDownloadButtonProps {
    order: Order;
    bomItems: any[]; // OrderBom doesn't have all fields needed if it's a join, but 'any' is still better avoided if possible. For now, let's at least fix the others.
    workOrders: WorkOrder[];
}

export function PdfDownloadButton({ order, bomItems, workOrders }: PdfDownloadButtonProps) {
    const [isGenerating, setIsGenerating] = useState(false);

    const handleDownload = async () => {
        try {
            setIsGenerating(true);
            await generateProductionOrderPdf(order, bomItems, workOrders);
            toast.success("生産指示書（PDF）を作成しました");
        } catch (error) {
            console.error("PDF generation failed:", error);
            toast.error("PDFの生成に失敗しました");
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <Button
            className="w-full justify-start"
            variant="outline"
            onClick={handleDownload}
            disabled={isGenerating}
        >
            {isGenerating ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
                <FileText className="mr-2 h-4 w-4" />
            )}
            生産指示書 PDF 出力
        </Button>
    );
}
