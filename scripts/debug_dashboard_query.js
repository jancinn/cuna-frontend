
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

// Load env vars manually since we are in a script
const envPath = path.resolve(process.cwd(), '.env');
const envConfig = dotenv.parse(fs.readFileSync(envPath));

const supabaseUrl = envConfig.VITE_SUPABASE_URL;
const supabaseKey = envConfig.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function debugQuery() {
    console.log('Testing Dashboard Query for Jan 2026...');

    const startStr = '2026-01-01';
    const endStr = '2026-01-31';

    console.log(`Querying range: ${startStr} to ${endStr}`);

    const { data, error } = await supabase
        .from('cuna_calendario')
        .select(`
            id,
            fecha,
            dia_semana,
            habilitado,
            cuna_turnos (
                id,
                slot_numero,
                estado,
                trabajador_id
            )
        `)
        .gte('fecha', startStr)
        .lte('fecha', endStr)
        .order('fecha');

    if (error) {
        console.error('QUERY ERROR:', error);
    } else {
        console.log(`Success! Found ${data.length} rows.`);
        if (data.length > 0) {
            console.log('First row sample:', JSON.stringify(data[0], null, 2));
        } else {
            console.log('No rows found. Checking if any rows exist in cuna_calendario...');
            const { count } = await supabase.from('cuna_calendario').select('*', { count: 'exact', head: true });
            console.log(`Total rows in table: ${count}`);
        }
    }
}

debugQuery();
