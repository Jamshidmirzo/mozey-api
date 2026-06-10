import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const seedEmail = process.env.ADMIN_SEED_EMAIL || 'admin@mozey.uz';
  const seedPassword = process.env.ADMIN_SEED_PASSWORD || 'admin123456';

  // Create superadmin
  const superadminHash = await bcrypt.hash(seedPassword, 12);
  const superadmin = await prisma.admin.upsert({
    where: { email: seedEmail },
    update: {},
    create: {
      email: seedEmail,
      passwordHash: superadminHash,
      role: 'superadmin',
    },
  });
  console.log(`Superadmin created: ${superadmin.email} (${superadmin.id})`);

  // Create editor
  const editorEmail = 'editor@mozey.uz';
  const editorHash = await bcrypt.hash('editor123456', 12);
  const editor = await prisma.admin.upsert({
    where: { email: editorEmail },
    update: {},
    create: {
      email: editorEmail,
      passwordHash: editorHash,
      role: 'editor',
    },
  });
  console.log(`Editor created: ${editor.email} (${editor.id})`);

  console.log('Seed completed successfully.');
}

main()
  .catch((e) => {
    console.error('Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
