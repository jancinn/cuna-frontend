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

        const authHeader = req.headers.get("Authorization");
        if (!authHeader) {
            return new Response(
                JSON.stringify({ error: "No authorization header" }),
                { status: 401, headers: corsHeaders }
            );
        }

        const token = authHeader.replace("Bearer ", "");
        const { data: authData, error: authError } =
            await supabaseAdmin.auth.getUser(token);

        if (authError || !authData?.user) {
            return new Response(
                JSON.stringify({ error: "Unauthorized" }),
                { status: 401, headers: corsHeaders }
            );
        }

        // Verificar rol en tabla cuna_trabajadores en lugar de app_metadata para compatibilidad con sistema actual
        const { data: requesterRole, error: roleError } = await supabaseAdmin
            .from('cuna_trabajadores')
            .select('rol')
            .eq('usuario_id', authData.user.id)
            .single();

        const role = requesterRole?.rol;
        // Permitir 'responsable' (que es el rol usado en este sistema)
        if (role !== "responsable" && role !== "admin") {
            return new Response(
                JSON.stringify({ error: "Forbidden: Requiere rol responsable o admin" }),
                { status: 403, headers: corsHeaders }
            );
        }

        const { trabajadora_id, nombre, apellido, email, password, activo, rol, disponible_viernes, estado_participacion } =
            await req.json();

        if (!trabajadora_id) {
            return new Response(
                JSON.stringify({ error: "trabajadora_id requerido" }),
                { status: 400, headers: corsHeaders }
            );
        }

        const updated = {
            nombre: false,
            apellido: false,
            email: false,
            password: false,
            activo: false,
            rol: false,
            disponible_viernes: false,
            estado_participacion: false
        };

        const adminId = authData.user.id;

        // Datos personales, Estado y Rol
        if (nombre !== undefined || apellido !== undefined || activo !== undefined || rol !== undefined || disponible_viernes !== undefined || estado_participacion !== undefined) {
            const updatePayload: any = {
                // updated_at: new Date().toISOString(), // Comentado por si acaso no existe la columna
                // updated_by: adminId, // Comentado por si acaso no existe la columna
            };
            if (nombre !== undefined) updatePayload.nombre = nombre;
            if (apellido !== undefined) updatePayload.apellido = apellido;
            if (activo !== undefined) updatePayload.activo = activo;
            if (rol !== undefined) updatePayload.rol = rol;
            if (disponible_viernes !== undefined) updatePayload.disponible_viernes = disponible_viernes;
            if (estado_participacion !== undefined) updatePayload.estado_participacion = estado_participacion;

            // Usamos usuario_id como clave foránea en cuna_trabajadores
            const { error } = await supabaseAdmin
                .from("cuna_trabajadores")
                .update(updatePayload)
                .eq("usuario_id", trabajadora_id); // trabajadora_id es el UUID de auth

            if (error) throw error;

            if (nombre) updated.nombre = true;
            if (apellido) updated.apellido = true;
            if (activo !== undefined) updated.activo = true;
            if (rol !== undefined) updated.rol = true;
            if (disponible_viernes !== undefined) updated.disponible_viernes = true;
            if (estado_participacion !== undefined) updated.estado_participacion = true;
        }

        // Email / Password (trabajadora_id YA ES el user_id en este contexto del frontend)
        if (email || password) {
            const { error } =
                await supabaseAdmin.auth.admin.updateUserById(trabajadora_id, {
                    ...(email ? { email } : {}),
                    ...(password ? { password } : {}),
                });

            if (error) throw error;

            if (email) updated.email = true;
            if (password) updated.password = true;
        }

        return new Response(
            JSON.stringify({ success: true }),
            { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    } catch (err) {
        return new Response(
            JSON.stringify({ error: String(err) }),
            { status: 500, headers: corsHeaders }
        );
    }
});
