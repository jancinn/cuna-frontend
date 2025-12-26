import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Configurar dotenv para leer .env del directorio padre (cuna-frontend)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Error: No se encontraron las variables de entorno VITE_SUPABASE_URL o VITE_SUPABASE_ANON_KEY');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function runTest() {
    const email = process.argv[2];
    const password = process.argv[3];

    if (!email || !password) {
        console.log('Uso: node scripts/test_edge_function.js <email_responsable> <password>');
        process.exit(1);
    }

    console.log(`🔄 Intentando login con ${email}...`);
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password
    });

    if (authError) {
        console.error('❌ Error de Autenticación:', authError.message);
        process.exit(1);
    }

    console.log('✅ Login exitoso. Token obtenido.');

    const testWorkerEmail = `test.worker.${Date.now()}@example.com`;
    const testPayload = {
        email: testWorkerEmail,
        password: "tempPassword123!",
        nombre: "Trabajador de Prueba Automática"
    };

    console.log(`🔄 Invocando Edge Function 'crear-trabajador' con: ${testWorkerEmail}...`);

    const { data, error } = await supabase.functions.invoke('crear-trabajador', {
        body: testPayload
    });

    if (error) {
        console.error('❌ Error en la invocación:', error);
        // Intentar leer el cuerpo del error si es posible
        if (error instanceof Error) {
            console.error('Mensaje:', error.message);
        }
    } else {
        console.log('✅ Respuesta de la función:', data);
        if (data.error) {
            console.error('❌ La función retornó un error lógico:', data.error);
        } else {
            console.log('🎉 ¡PRUEBA EXITOSA! Trabajador creado.');
        }
    }
}

runTest();
