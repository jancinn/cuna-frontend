import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders });
    }

    try {
        const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
        const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

        const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
            auth: { persistSession: false },
        });

        // 1. Verificar Autenticación
        const authHeader = req.headers.get("Authorization");
        if (!authHeader) {
            return new Response(
                JSON.stringify({ error: "No authorization header" }),
                { status: 401, headers: corsHeaders }
            );
        }

        const token = authHeader.replace("Bearer ", "");
        const { data: authData, error: authError } = await supabaseAdmin.auth.getUser(token);

        if (authError || !authData?.user) {
            return new Response(
                JSON.stringify({ error: "Unauthorized" }),
                { status: 401, headers: corsHeaders }
            );
        }

        // 2. Verificar Rol de Responsable
        const { data: requesterRole, error: roleError } = await supabaseAdmin
            .from('cuna_trabajadores')
            .select('rol')
            .eq('usuario_id', authData.user.id)
            .single();

        const role = requesterRole?.rol;
        if (role !== "responsable" && role !== "admin") {
            return new Response(
                JSON.stringify({ error: "Forbidden: Requiere rol responsable o admin" }),
                { status: 403, headers: corsHeaders }
            );
        }

        // 3. Obtener ID a eliminar
        const { trabajadora_id } = await req.json();

        if (!trabajadora_id) {
            return new Response(
                JSON.stringify({ error: "trabajadora_id requerido" }),
                { status: 400, headers: corsHeaders }
            );
        }

        // 4. Eliminar de cuna_trabajadores (Tabla de negocio)
        const { error: dbError } = await supabaseAdmin
            .from("cuna_trabajadores")
            .delete()
            .eq("usuario_id", trabajadora_id);

        if (dbError) {
            console.error("Error deleting from DB:", dbError);
            return new Response(
                JSON.stringify({ error: "Error al eliminar perfil de base de datos: " + dbError.message }),
                { status: 500, headers: corsHeaders }
            );
        }

        // 5. Eliminar de auth.users (Usuario de sistema)
        const { error: authDeleteError } = await supabaseAdmin.auth.admin.deleteUser(trabajadora_id);

        if (authDeleteError) {
            console.error("Error deleting auth user:", authDeleteError);
            // Nota: Si falló esto pero se borró de la DB, queda un usuario huérfano en Auth.
            // Podríamos intentar devolver error, pero el perfil de negocio ya no existe.
            return new Response(
                JSON.stringify({ error: "Perfil eliminado, pero error al borrar usuario de Auth: " + authDeleteError.message }),
                { status: 500, headers: corsHeaders }
            );
        }

        return new Response(
            JSON.stringify({ success: true, message: "Usuario eliminado definitivamente" }),
            { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );

    } catch (err) {
        return new Response(
            JSON.stringify({ error: String(err) }),
            { status: 500, headers: corsHeaders }
        );
    }
});
