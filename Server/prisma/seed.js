import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
dotenv.config();

const prisma = new PrismaClient();

async function main() {
  const adminPassword = process.env.ADMIN_PASSWORD || "adminpassword";
  const hashed = await bcrypt.hash(adminPassword, 10);

  // Upsert admin
  await prisma.admin.upsert({
    where: { email: process.env.ADMIN_EMAIL || "admin@example.com" },
    update: {},
    create: {
      email: process.env.ADMIN_EMAIL || "admin@example.com",
      password: hashed,
    },
  });

  await prisma.event.createMany({
    data: [
      {
        title: "Music Concert",
        description: "An evening of great music.",
        location: "Mumbai, India",
        date: new Date(new Date().getTime() + 7 * 24 * 3600 * 1000),
        totalSeats: 200,
        availableSeats: 200,
        price: 999.0,
        img: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTkk4DO8IGYUFnXscnoUErkdxC6uBbAWWZrWg&s",
      },
      {
        title: "Tech Meetup",
        description: "Networking and talks for developers.",
        location: "Bengaluru, India",
        date: new Date(new Date().getTime() + 14 * 24 * 3600 * 1000),
        totalSeats: 100,
        availableSeats: 100,
        price: 99.0,
        img: "https://www.shutterstock.com/image-photo/industrial-engineering-facility-diverse-group-260nw-1515843644.jpg",
      },
      {
        title: "Dance Show",
        description: "Pleasing Hindustani Classical Dance .",
        location: "Gwalior , India",
        date: new Date(new Date().getTime() + 14 * 24 * 3600 * 1000),
        totalSeats: 100,
        availableSeats: 100,
        price: 1000.0,
        img: "https://i.pinimg.com/736x/a0/a0/2e/a0a02e94af6c01fd429180ea6b35ed03.jpg",
      },
    ],
    skipDuplicates: true,
  });

  console.log("Seeded admin and events.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
