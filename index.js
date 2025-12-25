import express from "express";
import puppeteer from "puppeteer";
import cors from "cors";

const app = express();
app.use(cors());

app.get("/gmarket", async (req, res) => {
  let browser;
  try {
    browser = await puppeteer.launch({
      headless: "new",
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });
    const page = await browser.newPage();

    // ✅ 실제 브라우저처럼 보이게 설정
    await page.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36"
    );

    const apiResponse = new Promise((resolve) => {
      page.on("response", async (response) => {
        const url = response.url();
        // ✅ G마켓 내부 베스트 상품 API 감지
        if (url.includes("bestseller/ajax/getBestSeller")) {
          try {
            const json = await response.json();
            resolve(json);
          } catch (e) {
            console.error("JSON 파싱 실패:", e);
          }
        }
      });
    });

    await page.goto("https://www.gmarket.co.kr/n/best?groupCode=100000005", {
      waitUntil: "networkidle2",
      timeout: 0,
    });

    const data = await apiResponse;
    await browser.close();

    if (!data || !data.data) {
      return res.json({ count: 0, items: [] });
    }

    const products = data.data.itemList.map((item, index) => ({
      rank: index + 1,
      name: item.itemName,
      originalPrice: item.origPrice,
      salePrice: item.sprice,
      salePercent: item.dcRate,
      reviewCount: item.evalCnt,
      buyCount: item.selledCnt,
      link: `https://item.gmarket.co.kr/Item?goodscode=${item.goodscode}`,
      image: item.imageUrl,
    }));

    res.json({ count: products.length, items: products });
  } catch (error) {
    console.error("❌ Error:", error);
    if (browser) await browser.close();
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
