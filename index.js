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
      args: ["--no-sandbox", "--disable-setuid-sandbox"]
    });
    const page = await browser.newPage();
    await page.goto("https://www.gmarket.co.kr/n/best?groupCode=100000005", {
      waitUntil: "networkidle2",
      timeout: 0
    });

    // ✅ 실제 렌더링 완료될 때까지 기다림
    await page.waitForSelector(".best-list li", { timeout: 15000 });

    // ✅ 상품정보 수집
    const items = await page.evaluate(() => {
      const data = [];
      document.querySelectorAll(".best-list li").forEach((el, i) => {
        if (i < 50) {
          const name = el.querySelector(".itemname")?.innerText.trim() || "";
          const link = el.querySelector(".itemname")?.getAttribute("href") || "";
          const originalPrice = el.querySelector(".o-price")?.innerText.trim() || "";
          const salePrice = el.querySelector(".s-price strong")?.innerText.trim() || "";
          const salePercent = el.querySelector(".s-price em")?.innerText.trim() || "";
          const review = el.querySelector(".itemad span:nth-child(1)")?.innerText.trim() || "";
          const buyCount = el.querySelector(".itemad span:nth-child(2)")?.innerText.trim() || "";
          const coupon = el.querySelector(".icon.coupon")?.getAttribute("alt") || "";

          if (name) {
            data.push({
              rank: i + 1,
              name,
              originalPrice,
              salePrice,
              salePercent,
              review,
              buyCount,
              coupon,
              link: link ? "https://www.gmarket.co.kr" + link : ""
            });
          }
        }
      });
      return data;
    });

    res.json({ count: items.length, items });
  } catch (error) {
    console.error("❌ Error:", error);
    res.status(500).json({ error: error.message });
  } finally {
    if (browser) await browser.close();
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
