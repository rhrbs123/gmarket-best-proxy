import express from "express";
import fetch from "node-fetch";
import cors from "cors";
import * as cheerio from "cheerio";

const app = express();
app.use(cors());

app.get("/gmarket", async (req, res) => {
  try {
    const response = await fetch("https://www.gmarket.co.kr/n/best?groupCode=100000005", {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36",
      },
    });

    const html = await response.text();
    const $ = cheerio.load(html);
    const items = [];

    $(".best-list li").slice(0, 50).each((i, el) => {
      const name = $(el).find(".itemname").text().trim();
      const link = $(el).find(".itemname").attr("href");
      const originalPrice = $(el).find(".o-price").text().trim();
      const salePrice = $(el).find(".s-price strong").text().trim();
      const salePercent = $(el).find(".s-price em").text().trim();
      const coupon = $(el).find(".icon.coupon").attr("alt") || "";
      const review = $(el).find(".itemad span:contains('상품평')").text().trim();
      const buyCount = $(el).find(".itemad span:contains('구매')").text().trim();

      items.push({
        rank: i + 1,
        name,
        originalPrice,
        salePrice,
        salePercent,
        coupon,
        review,
        buyCount,
        link: link ? "https://www.gmarket.co.kr" + link : "",
      });
    });

    res.json({ count: items.length, items });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
