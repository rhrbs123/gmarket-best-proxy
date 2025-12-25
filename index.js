import express from "express";
import fetch from "node-fetch";
import cors from "cors";

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

    // 상품정보 추출 (정규식 기반 파싱)
    const regex = /<a[^>]*class="link__item"[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/g;
    const items = [];
    let match;
    while ((match = regex.exec(html)) !== null) {
      const link = "https://www.gmarket.co.kr" + match[1];
      const itemBlock = match[2];

      const titleMatch = itemBlock.match(/<span class="text__item">([^<]+)<\/span>/);
      const priceMatch = itemBlock.match(/<strong class="text__value">([\d,]+)<\/strong>/);
      const reviewMatch = itemBlock.match(/<span class="text__review">([\d,]+)<\/span>/);

      items.push({
        title: titleMatch ? titleMatch[1].trim() : null,
        price: priceMatch ? priceMatch[1].replace(/,/g, "") : null,
        reviews: reviewMatch ? reviewMatch[1].replace(/,/g, "") : null,
        url: link,
      });
    }

    res.json({ count: items.length, items });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
