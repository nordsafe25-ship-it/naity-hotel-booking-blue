// Sync Service Configuration
import dotenv from 'dotenv';

dotenv.config();

export const config = {
  // MySQL Configuration - Namecheap Server
  mysql: {
    host: '68.65.123.142',
    port: 3306,
    // Naity Booking Database (Main System)
    naityDb: {
      database: 'naitagfz_Naity_Booking',
      user: 'naitagfz_Naity_Booking',
      password: 'p3cu(+odU6F^',
    },
    // ShamSoft Database (Local Hotel System)
    shamSoftDb: {
      database: 'naitagfz_Cham_Soft',
      user: 'naitagfz_Samir',
      password: 'r(eJX+6Cwjx1',
    },
  },
  
  // Supabase Configuration
  supabase: {
    url: process.env.VITE_SUPABASE_URL || '',
    serviceKey: process.env.SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY || '',
  },
  
  // Sync Configuration
  sync: {
    intervalMs: 5 * 60 * 1000, // 5 minutes
    enableAutoSync: true,
  },
};
