import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
    // Manejo de CORS preflight
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        // 1. Inicializar Cliente Admin (Service Role)
        const supabaseAdmin = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
            { auth: { persistSession: false } }
        );

        // 2. Verificar Autenticación del Invocador
        const authHeader = req.headers.get('Authorization');
        if (!authHeader) {
            return new Response(
                JSON.stringify({ success: false, error: 'Falta cabecera de autorización' }),
                { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        const { data: { user: caller }, error: authError } = await supabaseAdmin.auth.getUser(
            authHeader.replace('Bearer ', '')
        );

        if (authError || !caller) {
            console.error('Auth Error:', authError);
            return new Response(
                JSON.stringify({
                    success: false,
                    error: `Error de autenticación: ${authError?.message || 'Token inválido o expirado'}`
                }),
                { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        // 3. Verificar Rol de Responsable
        const { data: adminProfile, error: profileError } = await supabaseAdmin
            .from('cuna_trabajadores')
            .select('rol')
            .eq('usuario_id', caller.id)
            .single();

        if (profileError || adminProfile?.rol !== 'responsable') {
            return new Response(
                JSON.stringify({ success: false, error: 'Acceso denegado: Se requiere rol de Responsable' }),
                { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        // 4. Leer y Validar Payload
        const { email, password, nombre, apellido, rol, disponible_viernes } = await req.json();

        if (!email || !password || !nombre) {
            return new Response(
                JSON.stringify({ success: false, error: 'Faltan datos requeridos (email, password, nombre)' }),
                { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        const rolFinal = rol === 'responsable' ? 'responsable' : 'servidora';

        // 5. Crear Usuario en Auth
        const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
            email: email,
            password: password,
            email_confirm: true,
            user_metadata: { nombre_completo: `${nombre} ${apellido || ''}`.trim() }
        });

        if (createError) {
            let errorMsg = createError.message;
            if (errorMsg.includes('already registered')) errorMsg = 'El correo electrónico ya está registrado.';
            if (errorMsg.includes('password')) errorMsg = 'La contraseña es demasiado débil.';

            return new Response(
                JSON.stringify({ success: false, error: errorMsg }),
                { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        // 6. Insertar en cuna_trabajadores
        const { error: dbError } = await supabaseAdmin
            .from('cuna_trabajadores')
            .insert({
                usuario_id: newUser.user.id,
                rol: rolFinal,
                activo: true,
                nombre: nombre,
                apellido: apellido || '',
                disponible_viernes: disponible_viernes !== undefined ? disponible_viernes : true
            });

        if (dbError) {
            await supabaseAdmin.auth.admin.deleteUser(newUser.user.id);
            return new Response(
                JSON.stringify({ success: false, error: 'Error al crear perfil: ' + dbError.message }),
                { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        // 7. Respuesta Exitosa
        return new Response(
            JSON.stringify({
                success: true,
                message: 'Trabajador creado exitosamente',
                worker: {
                    id: newUser.user.id,
                    email: newUser.user.email,
                    nombre: nombre
                }
            }),
            { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );

    } catch (error) {
        return new Response(
            JSON.stringify({ success: false, error: error.message || 'Error interno del servidor' }),
            { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }
});
