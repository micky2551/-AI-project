# StudyPilot AI

เว็บแอปวางแผนการเรียนสำหรับนักศึกษา พร้อม Email Authentication, Student Dashboard, Admin Dashboard, ตารางงาน, AI Summary และ Quick Quiz

> **สถานะปัจจุบัน:** เป็น MVP starter ที่มีโค้ด Frontend, API server และ SQL schema ให้ติดตั้งและเชื่อมบริการจริง ยังต้องตั้งค่า Supabase และ Gemini API ก่อนที่ Login/Database/AI จะใช้งานได้จริง

## คุณสมบัติ

### นักศึกษา
- สมัครสมาชิก/เข้าสู่ระบบด้วยอีเมลและรหัสผ่าน
- ยืนยันอีเมลตามค่าที่ตั้งไว้ใน Supabase Auth
- Forgot Password / Reset Password / Logout
- Dashboard สรุปงาน รายวิชา และผล Quiz ของบัญชีตัวเอง
- จัดการรายวิชาและงาน/กิจกรรม พร้อมสถานะ ความสำคัญ กำหนดเวลา และตัวล็อกเวลา
- สร้างสรุปบทเรียนด้วย Gemini API (หรือ Claude หากตั้งค่า Anthropic) และบันทึกลงฐานข้อมูล
- สร้าง Quick Quiz จากเนื้อหา พร้อมเฉลย คะแนน และหัวข้อที่ตอบผิด
- ดูประวัติ Quiz และสถิติพัฒนาการ
- แก้ไขชื่อที่ใช้แสดงและส่งลิงก์เปลี่ยนรหัสผ่าน

### Admin
- Dashboard สถิติจากฐานข้อมูล
- ค้นหาและจัดการบทบาท/สถานะบัญชีผ่าน Admin-only SQL RPC
- จัดการรายวิชาส่วนกลาง
- สร้าง/แก้ไข/เผยแพร่เนื้อหาส่วนกลาง
- สร้าง/เผยแพร่ชุด Quiz แบบ JSON
- ดู Audit Logs ที่ฐานข้อมูลบันทึกจากการเปลี่ยน Role/สถานะบัญชี
- ตรวจสอบสถานะ API โดยไม่เปิดเผย Secrets

### ความปลอดภัย
- ใช้ Supabase Auth แทนระบบ Login จำลอง
- บัญชีที่สมัครใหม่จะเป็น `student` เสมอ
- มี Row Level Security (RLS) สำหรับข้อมูลรายบุคคล
- ข้อมูลตารางเรียน เอกสาร และคะแนน Quiz เป็นข้อมูลส่วนตัวของเจ้าของบัญชี
- การเปลี่ยน Role/สถานะผู้ใช้ต้องผ่านฟังก์ชัน SQL ที่ตรวจสอบ Admin
- ป้องกันการปิดใช้งาน Admin คนสุดท้าย
- Gemini/Claude API key ต้องอยู่ใน `.env` ฝั่ง Server เท่านั้น
- API AI ต้องตรวจสอบ Supabase access token และมี rate limit

## สิ่งที่ต้องติดตั้ง

- Node.js 20 หรือใหม่กว่า
- โปรเจกต์ Supabase
- Gemini API Key จาก Google AI Studio สำหรับโควตาฟรี (เฉพาะเมื่อจะใช้สรุปบทเรียน/สร้าง Quiz ด้วย AI)

## 1) ติดตั้งโปรเจกต์

แตก ZIP จากนั้นเปิด Terminal ในโฟลเดอร์ `studypilot-ai` และรัน:

```bash
npm install
```

## 2) ตั้งค่า Supabase

1. สร้างโปรเจกต์ที่ https://supabase.com/dashboard
2. ไปที่ Project Settings / Connect แล้วคัดลอก Project URL และ Publishable/Anon Key
3. คัดลอก `.env.example` เป็น `.env`
4. กรอก URL และ Key ลงในตัวแปรทั้ง `VITE_SUPABASE_*` และ `SUPABASE_*` (ค่าที่ใช้ตรวจ token ฝั่ง API ต้องตรงกับโปรเจกต์เดียวกัน)
5. เปิด SQL Editor ใน Supabase แล้วรันไฟล์ `supabase/schema.sql` ทั้งไฟล์
6. ไปที่ Authentication → URL Configuration แล้วกำหนด Site URL เป็น `http://localhost:5173` และเพิ่ม Redirect URL `http://localhost:5173/**` สำหรับการพัฒนาบนเครื่อง
7. ตั้งค่า Authentication → Email ตามต้องการ ถ้าเปิด Confirm Email ผู้ใช้ต้องกดยืนยันอีเมลจากกล่องจดหมายก่อนเข้าสู่ระบบ

> ห้ามนำ `service_role` key ไปใส่ใน `VITE_` variable หรือ Client Code

## 3) ตั้งค่าบริการ AI (ไม่บังคับ แต่จำเป็นต่อ Summary/Quick Quiz)

### ตัวเลือกแนะนำ: Google Gemini API Free Tier

1. เปิด https://aistudio.google.com/apikey แล้วสร้างหรือคัดลอก Gemini API Key ของคุณ
2. เปิดไฟล์ `.env` ที่โฟลเดอร์รากของโปรเจกต์ (ไม่ใช่ `.env.example`)
3. ตั้งค่าตัวแปรเหล่านี้:

```env
AI_PROVIDER=gemini
GEMINI_API_KEY=วาง_GEMINI_API_KEY_ของคุณตรงนี้
GEMINI_MODEL=gemini-3.5-flash-lite
```

4. บันทึกไฟล์ `.env` แล้วหยุด dev server ด้วย `Ctrl+C` จากนั้นรัน `npm run dev` อีกครั้ง เพื่อให้ Node.js โหลดค่าล่าสุด
5. ลองสร้างสรุปบทเรียนหรือ Quick Quiz อีกครั้ง

Google Gemini API มี Free Tier สำหรับบางโมเดลและมีโควตาตามที่ Google กำหนด ไม่ได้หมายความว่าใช้งานได้ไม่จำกัด ดูรายละเอียดที่ https://ai.google.dev/gemini-api/docs/pricing และ https://ai.google.dev/gemini-api/docs/models

### ตัวเลือกอื่น: Anthropic Claude API

หากมี API key และเครดิตของ Anthropic ให้ตั้งค่าแทนดังนี้:

```env
AI_PROVIDER=anthropic
ANTHROPIC_API_KEY=your_real_key_here
ANTHROPIC_MODEL=claude-sonnet-4-5
ANTHROPIC_VERSION=2023-06-01
```

**สำคัญ:** การตั้ง `ANTHROPIC_MODEL=Gemini` ไม่ทำให้ระบบเปลี่ยนไปใช้ Gemini เพราะ Anthropic API กับ Gemini API เป็นบริการคนละตัว ต้องตั้ง `AI_PROVIDER=gemini` และกำหนด `GEMINI_API_KEY` จึงจะใช้ Gemini ได้

ห้ามใส่ API key ไว้ในตัวแปรที่ขึ้นต้นด้วย `VITE_` หรือในโค้ดหน้าเว็บ และห้าม commit ไฟล์ `.env` ไปยัง Git

หากไม่มี AI API Key ระบบสมาชิก ตารางงาน รายวิชา และ Admin ยังใช้งานได้ แต่ฟีเจอร์ AI จะไม่ทำงานจนกว่าจะตั้งค่า key

## 4) สร้าง Admin คนแรก

1. สมัครบัญชีผ่านหน้า `/register` ด้วยอีเมลที่จะใช้เป็น Admin
2. ยืนยันอีเมลให้เสร็จ (หากเปิด Confirm Email)
3. เปิด Supabase SQL Editor และรันคำสั่งนี้ โดยแทนอีเมลของคุณเอง:

```sql
update public.profiles
set role = 'admin', updated_at = now()
where email = 'YOUR_VERIFIED_ADMIN_EMAIL';
```

4. ตรวจสอบว่าเปลี่ยนบทบาทได้หนึ่งแถว แล้วออกจากระบบและ Login ใหม่
5. ระบบจะนำไปหน้า `/admin`

ห้ามเปิด Public Registration ให้เลือก role เป็น Admin และห้ามสร้างรหัสผ่านเริ่มต้นไว้ใน source code

## 5) รันในเครื่อง

```bash
npm run dev
```

- Frontend: http://localhost:5173
- AI API server: http://localhost:8787/health

หรือรันแยกกัน:

```bash
npm run dev:web
npm run dev:api
```

## 6) Build ตรวจสอบก่อนส่งมอบ

```bash
npm run build
```

## โครงสร้างไฟล์

```text
studypilot-ai/
├─ src/
│  ├─ App.jsx
│  ├─ main.jsx
│  ├─ styles.css
│  └─ lib/
│     ├─ AuthContext.jsx
│     ├─ format.js
│     └─ supabase.js
├─ server/
│  └─ index.js
├─ supabase/
│  └─ schema.sql
├─ .env.example
├─ index.html
├─ package.json
└─ README.md
```

## ขอบเขตและสิ่งที่ต้องต่อยอดก่อนใช้งานจริง

- ตาราง/งานตอนนี้เป็นระบบ CRUD พื้นฐาน ไม่ใช่ตัวแก้ปัญหา scheduling ที่คำนวณตารางเรียนอัตโนมัติครบทุกข้อจำกัด
- ยังไม่มีการส่ง Push Notification หรืออีเมลเตือนงาน
- Admin จัดการบัญชีผ่านโปรไฟล์และระงับสิทธิ์ใน RLS; ไม่ได้ลบผู้ใช้จาก `auth.users` โดยตรง
- Audit Log ใน starter นี้บันทึกการเปลี่ยน Role และสถานะผ่าน RPC; ควรเพิ่ม audit trigger สำหรับการแก้ไขเนื้อหา/รายวิชาหากต้องการ audit ครบทุกกิจกรรม
- Email delivery และ redirect URLs ต้องตั้งค่ากับ Supabase ให้เหมาะกับโดเมนก่อนนำขึ้น production
- ก่อนใช้งานจริงควรเพิ่ม automated tests, ตรวจ dependency audit, ตั้งค่า HTTPS/CORS ให้ตรงโดเมนจริง, และทำ backup นโยบายฐานข้อมูล

## หมายเหตุ

หน้า Admin ใช้ RLS และ RPC เป็นจุดบังคับสิทธิ์ที่ฐานข้อมูล ไม่ใช่แค่ซ่อนเมนูใน Frontend อย่างไรก็ตาม ต้องรัน SQL schema นี้และตรวจสอบ policy ใน Supabase ก่อนนำไป deploy จริง
