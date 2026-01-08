import { test, expect } from '@playwright/test';

test.describe('Production Management System E2E Flow', () => {
    const uniqueId = Date.now().toString().slice(-4);
    const orderNo = `TEST-ORDER-${uniqueId}`;

    test('should complete the production lifecycle flow', async ({ page }) => {
        // 1. Create a new order
        await page.goto('/orders/new');

        await page.fill('#orderNo', orderNo);
        await page.fill('#customerCode', 'CUST-E2E');
        await page.fill('#customerName', 'E2E Testing Corp');
        await page.fill('#productName', 'E2E Test Product');
        await page.fill('#productSpec', 'A product created by E2E tests');

        // Set dates
        const today = new Date().toISOString().split('T')[0];
        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + 30);
        const dueDateStr = dueDate.toISOString().split('T')[0];

        await page.fill('#orderedDate', today);
        await page.fill('#dueDate', dueDateStr);
        await page.fill('#estimatedPrice', '1000000');

        // Select priority
        await page.click('#priority');
        await page.getByRole('option', { name: 'P2 - 高' }).click();

        // Submit
        await page.click('button:has-text("登録")');

        // 2. Verify redirection and detail page
        await expect(page).toHaveURL(/\/orders\/.+/);
        await expect(page.locator('h2')).toContainText(orderNo);
        // Find the badge and check text
        await expect(page.locator('.badge, span[class*="bg-slate-500"]')).toContainText('下書き');

        // 3. Add BOM Item
        await page.click('text=部品構成 (BOM) を表示');
        await expect(page).toHaveURL(/\/orders\/.+\/bom/);

        await page.click('text=行を追加');

        // Fill the dialog
        await page.fill('#itemCode', 'COMP-E2E');
        await page.fill('#itemName', 'E2E Component');
        await page.fill('#quantity', '10');

        // Select unit
        await page.click('#unit');
        await page.getByRole('option', { name: '個' }).click();

        await page.fill('#unitCost', '500');

        await page.click('button:has-text("保存")');

        // Check if item is added (wait more for state to settle)
        await expect(page.getByText('COMP-E2E', { exact: false }).first()).toBeVisible({ timeout: 10000 });
        await expect(page.locator('text=E2E Component')).toBeVisible();

        // 4. Back to Order Detail
        await page.locator('a[href^="/orders/"]').first().click();
        // Actually, in bom/page.tsx:
        // <h2 className="text-2xl font-bold tracking-tight">部品構成 (BOM) 管理</h2>
        // Let's use the back button next to it.
        await page.click('a[href^="/orders/"] >> internal:has="svg.lucide-arrow-left"');

        // 5. Verify PDF output presence
        const pdfButton = page.locator('button:has-text("生産指示書 PDF 出力")');
        await expect(pdfButton).toBeVisible();
        await expect(pdfButton).toBeEnabled();

        // 6. Navigate to Schedule (Gantt)
        await page.click('link:has-text("日程管理を表示")');
        await expect(page).toHaveURL(/\/orders\/.+\/schedule/);
        await expect(page.getByText('日程管理 (ガントチャート)')).toBeVisible();

        // Either the chart container or the empty message should be visible
        const emptyMsg = page.getByText('スケジュールデータがありません');
        const ganttContainer = page.locator('.gantt-container');
        await expect(emptyMsg.or(ganttContainer)).toBeVisible();
    });
});
