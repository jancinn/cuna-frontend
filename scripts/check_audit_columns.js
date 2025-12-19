
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

const envPath = path.resolve(process.cwd(), '.env');
const envConfig = dotenv.parse(fs.readFileSync(envPath));

const supabase = createClient(envConfig.VITE_SUPABASE_URL, envConfig.VITE_SUPABASE_ANON_KEY);

async function checkAuditColumns() {
    console.log('Checking updated_at and updated_by columns...');

    const { data, error } = await supabase
        .from('cuna_trabajadores')
        .select('updated_at, updated_by')
        .limit(1);

    if (error) {
        console.error('Error:', error.message);
    } else {
        console.log('Success! Columns exist.');
    }
}

checkAuditColumns();
