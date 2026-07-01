# HorseRace Management — Frontend (React + Vite + TS)

Folder structure dat theo dung cau truc cu cua JSP/Servlet (web/WEB-INF/...) de de doi chieu khi convert:

```
src/app/components/
├── auth/                  <- web/WEB-INF/auth
├── landing/                <- web/WEB-INF/landing
├── dashboards/              <- web/WEB-INF/dashboards
│   └── components/          <- web/WEB-INF/dashboards/components
├── admin-workflow/          <- web/WEB-INF/admin-workflow
├── referee-workflow/        <- web/WEB-INF/referee-workflow
├── shared/                  <- web/WEB-INF/tags (layout, dashboardLayout...)
└── ui/                      <- web/WEB-INF/ui (badge, accordion, alert...)

src/services/    -> 1 file service cho moi Controller Java (goi REST API)
src/context/     -> AuthContext thay the HttpSession
src/lib/api.ts   -> fetch client dung chung
src/types/       -> interface TypeScript khop voi Entity Java
```

## Chay du an

```bash
npm install
npm run dev      # http://localhost:5173
```

Backend Spring Boot chay rieng o http://localhost:8080 (xem .env de doi base URL).

## Cac buoc tiep theo

1. Copy theme/css/components UI tu file mau (HR.zip: src/styles, src/app/components/ui) vao day.
2. Voi moi component placeholder (TODO comment), thay noi dung that vao, goi service tuong ung trong src/services.
3. Gui tung Controller Java con lai (HorseOwnerController, JockeyController, RefereeController, SeasonController...) de duoc gen service.ts tuong ung.
