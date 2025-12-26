import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
    // Handle CORS preflight requests
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        const supabase = createClient(
            Deno.env.get("SUPABASE_URL")!,
            Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
            { auth: { persistSession: false } }
        );

        // 1. Consultar la tabla de negocio
        const { data: workersDB, error: dbError } = await supabase
            .from("cuna_trabajadores")
            .select("usuario_id, nombre, apellido, rol, activo, disponible_viernes, estado_participacion");

        if (dbError) throw dbError;

        // 2. Consultar la lista de usuarios de Auth (para recuperar nombres antiguos)
        const { data: { users: authUsers }, error: authError } = await supabase.auth.admin.listUsers({
            perPage: 1000
        });

        if (authError) console.error("Auth Error:", authError);

        // 3. Combinar datos
        const mappedData = workersDB.map((w: any) => {
            // Buscar datos de identidad (solo para email)
            const authUser = authUsers?.find((u: any) => u.id === w.usuario_id);

            // Nombre y Apellido: Fuente de verdad es la BD
            const nombre = w.nombre || '';
            const apellido = w.apellido || '';
            const nombreCompleto = `${nombre} ${apellido}`.trim() || 'Sin Nombre';

            return {
                id: w.usuario_id,
                usuario_id: w.usuario_id,
                nombre: nombre,
                apellido: apellido,
                nombre_completo: nombreCompleto,
                rol: w.rol,
                activo: w.activo,
                disponible_viernes: w.disponible_viernes,
                estado_participacion: w.estado_participacion || 'activa',
                email: authUser?.email || 'Sin email',
                avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(nombreCompleto)}&background=random`
            };
        });

        // Ordenar alfabéticamente
        mappedData.sort((a: any, b: any) => a.nombre.localeCompare(b.nombre));

        return new Response(
            JSON.stringify(mappedData),
            { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );

    } catch (err) {
        console.error("Unexpected Error:", err);
        return new Response(
            JSON.stringify({ error: err.message }),
            { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }
});
