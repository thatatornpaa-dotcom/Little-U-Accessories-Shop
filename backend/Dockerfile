FROM oven/bun:1-alpine

WORKDIR /app

# คัดลอก package.json เพื่อติดตั้ง dependency ก่อน
COPY package.json ./

# ติดตั้ง dependencies ทั้งหมด
RUN bun install

# คัดลอกไฟล์ที่เหลือในโปรเจกต์
COPY . .

# สร้าง Prisma client สำหรับเชื่องต่อกับฐานข้อมูล
RUN bunx prisma generate

EXPOSE 8008

CMD ["bun", "run", "src/app.js"]
