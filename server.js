import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = process.env.PORT || 3000;
const HOST = '0.0.0.0';

async function startServer() {
  const app = express();

  // Serve static assets from stitch_doubling_mobile_ui_design if requested
  app.use('/stitch_doubling_mobile_ui_design', express.static(path.join(__dirname, 'stitch_doubling_mobile_ui_design')));

  // Optional: Legacy screen gallery route at /gallery
  app.get('/gallery', (req, res) => {
    res.send(`<!DOCTYPE html>
<html lang="ko" class="dark">
<head>
  <meta charset="UTF-8">
  <title>DOUBLING 4IR Mobile UI Gallery</title>
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-[#070e17] text-white p-6 font-sans">
  <div class="max-w-2xl mx-auto space-y-4">
    <h1 class="text-xl font-bold text-[#C5A059]">DOUBLING Mobile UI Screen Catalog</h1>
    <p class="text-xs text-slate-300">이 갤러리는 초기 퍼블리싱 시안 백업 뷰어입니다. 실제 상호작용 가능한 앱은 <a href="/" class="text-[#C5A059] underline font-bold">홈 메인 앱 (/)</a>에서 실행됩니다.</p>
    <a href="/" class="inline-block px-4 py-2 bg-[#C5A059] text-[#0D1B2A] font-bold rounded-lg text-xs">실제 DOUBLING 앱으로 이동</a>
  </div>
</body>
</html>`);
  });

  // Vite middleware for development vs static build in production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.use((req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, HOST, () => {
    console.log(`DOUBLING App server running at http://${HOST}:${PORT}`);
  });
}

startServer();
