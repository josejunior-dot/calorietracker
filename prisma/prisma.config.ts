import path from 'node:path'
import { defineConfig } from 'prisma/config'

export default defineConfig({
  schema: path.join(__dirname, 'schema.prisma'),
  migrate: {
    async development() {
      return {
        url: process.env.DATABASE_URL!,
      }
    },
  },
  migrations: {
    seed: 'npx tsx prisma/seed.ts',
  },
})
