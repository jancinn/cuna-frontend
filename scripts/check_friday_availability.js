
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

const envPath = path.resolve(process.cwd(), '.env');
const envConfig = dotenv.parse(fs.readFileSync(envPath));

const supabase = createClient(envConfig.VITE_SUPABASE_URL, envConfig.VITE_SUPABASE_ANON_KEY);

async function checkWorkers() {
    console.log('Checking workers availability...');

    const { data: workers, error } = await supabase
        .from('cuna_trabajadores')
        .select('usuario_id, disponible_viernes, activo, rol');

    if (error) {
        console.error('Error fetching workers:', error);
        return;
    }

    console.log(`Total workers: ${workers.length}`);

    const activeServidoras = workers.filter(w => w.activo && w.rol === 'servidora');
    console.log(`Active Servidoras: ${activeServidoras.length}`);

    const fridayAvailable = activeServidoras.filter(w => w.disponible_viernes);
    console.log(`Available for Friday: ${fridayAvailable.length}`);

    if (fridayAvailable.length === 0) {
        console.log('WARNING: No active servidoras are available for Friday!');
        console.log('This explains why Fridays are "Vacante".');
    } else {
        console.log('Friday workers:', fridayAvailable.map(w => w.usuario_id));
    }
}

checkWorkers();
