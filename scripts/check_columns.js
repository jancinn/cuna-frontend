
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

const envPath = path.resolve(process.cwd(), '.env');
const envConfig = dotenv.parse(fs.readFileSync(envPath));

const supabase = createClient(envConfig.VITE_SUPABASE_URL, envConfig.VITE_SUPABASE_ANON_KEY);

async function checkColumns() {
    console.log('Checking columns in cuna_trabajadores...');

    // We can't easily query information_schema via supabase-js client usually, 
    // but we can try to select the columns and see if it errors or returns data.

    const { data, error } = await supabase
        .from('cuna_trabajadores')
        .select('usuario_id, nombre, apellido')
        .limit(1);

    if (error) {
        console.error('Error checking columns:', error.message);
        if (error.message.includes('does not exist')) {
            console.log('CONCLUSION: One or more columns do not exist.');
        }
    } else {
        console.log('Success! Columns exist.');
        console.log('Sample data:', data);
    }
}

checkColumns();
