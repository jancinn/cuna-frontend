
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

const envPath = path.resolve(process.cwd(), '.env');
const envConfig = dotenv.parse(fs.readFileSync(envPath));

const supabase = createClient(envConfig.VITE_SUPABASE_URL, envConfig.VITE_SUPABASE_ANON_KEY);

async function checkAllColumns() {
    console.log('Checking all columns in cuna_trabajadores...');

    // Select * limit 1 to see what we get
    const { data, error } = await supabase
        .from('cuna_trabajadores')
        .select('*')
        .limit(1);

    if (error) {
        console.error('Error fetching data:', error.message);
        return;
    }

    if (data && data.length > 0) {
        console.log('Columns found:', Object.keys(data[0]));
    } else {
        console.log('No data found, cannot infer columns from select *');
    }
}

checkAllColumns();
