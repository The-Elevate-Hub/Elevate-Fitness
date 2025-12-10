import { PrismaClient, Category } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  const hashedAdminPassword = await bcrypt.hash('Elevateitall', 12);
  
  const admin = await prisma.user.upsert({
    where: { phone: '+99999999999' },
    update: {},
    create: {
      phone: '+99999999999',
      name: 'Hemansh Kumar Mishra',
      password: hashedAdminPassword,
      role: 'ADMIN',
    },
  });

  console.log('✅ Admin user created:', admin.phone);

  const products = [
    {
      name: 'Complete Fitness Mastery Course',
      slug: 'complete-fitness-mastery-course',
      description: 'Coming Soon',
      longDesc: 'A complete fitness transformation program designed by experts. Includes workout plans, nutrition guides, and mental wellness training. Perfect for beginners and advanced fitness enthusiasts.',
      price: 35,
      category: 'COURSE' as Category,
      featured: true,
      fileSize: '2.5 GB',
    },
    {
      name: 'Home Workout Blueprint eBook',
      slug: 'home-workout-blueprint-ebook',
      description: 'Your complete guide to effective home workouts with no equipment needed',
      longDesc: 'Master the art of working out at home with our detailed 200-page guide. Includes exercises, meal plans, and productivity templates to keep you on track.',
      price: 38,
      category: 'EBOOK' as Category,
      featured: true,
      fileSize: '15 MB',
    },
    {
      name: 'Fitness & Health eBook',
      slug: 'fitness-health-ebook',
      description: 'Evidence-based nutrition and wellness guide for optimal health',
      longDesc: 'Comprehensive guide covering nutrition science, meal planning, supplements, recovery strategies, and lifestyle optimization. Backed by latest research.',
      price: 38,
      category: 'EBOOK' as Category,
      featured: false,
      fileSize: '18 MB',
    },
  ];

  for (const product of products) {
    await prisma.product.upsert({
      where: { slug: product.slug },
      update: {},
      create: product,
    });
  }

  console.log('✅ Products seeded');

  const influencers = [
    { code: 'FIT2024', name: 'Fitness Pro', email: 'fitnesspro@example.com', commission: 50 },
    { code: 'GAINS', name: 'Gym Expert', email: 'gymexpert@example.com', commission: 50 },
    { code: 'HEALTH', name: 'Wellness Coach', email: 'wellness@example.com', commission: 50 },
  ];

  for (const influencer of influencers) {
    await prisma.influencer.upsert({
      where: { code: influencer.code },
      update: {},
      create: influencer,
    });
  }

  console.log('✅ Influencers seeded');
  console.log('🎉 Seeding complete!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });