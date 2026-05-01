import { z } from 'zod';

// Schema untuk validasi environment variables
const envSchema = z.object({
  // Server
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().default('6589').transform(Number).pipe(z.number().min(1).max(65535)),
  
  // Database
  DATABASE_URL: z.string().url('DATABASE_URL harus berupa URL PostgreSQL yang valid'),
  
  // JWT
  JWT_SECRET_TOKEN: z.string().min(32, 'JWT_SECRET_TOKEN harus minimal 32 karakter untuk keamanan'),
  
  // CORS
  ALLOWED_ORIGINS: z.string().min(1, 'ALLOWED_ORIGINS harus diisi (gunakan * untuk allow all)'),
  
  // Optional: Sentry, Redis, dll
  SENTRY_DSN: z.string().url().optional(),
  REDIS_URL: z.string().url().optional(),
});

// Type inference dari schema
export type EnvConfig = z.infer<typeof envSchema>;

/**
 * Validasi environment variables saat aplikasi startup
 * Akan throw error jika ada yang tidak valid
 */
export function validateEnv(): EnvConfig {
  try {
    const env = envSchema.parse(process.env);
    
    console.log('✅ Environment variables validated successfully');
    console.log(`📍 Environment: ${env.NODE_ENV}`);
    console.log(`🚀 Port: ${env.PORT}`);
    console.log(`🔒 JWT Secret: ${env.JWT_SECRET_TOKEN.substring(0, 8)}...`);
    console.log(`🌐 CORS Origins: ${env.ALLOWED_ORIGINS}`);
    
    return env;
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('❌ Environment validation failed:');
      error.issues.forEach((err) => {
        console.error(`  - ${err.path.join('.')}: ${err.message}`);
      });
      console.error('\n💡 Tip: Check your .env file and ensure all required variables are set correctly');
    }
    
    process.exit(1);
  }
}

/**
 * Get validated environment config
 * Harus dipanggil setelah validateEnv()
 */
export function getEnvConfig(): EnvConfig {
  return envSchema.parse(process.env);
}
