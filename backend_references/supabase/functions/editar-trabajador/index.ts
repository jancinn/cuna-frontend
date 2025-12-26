import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const supabaseClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_ANON_KEY') ?? '',
            { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
        )

        // 1. Verificar que el usuario que llama es RESPONSABLE
        const { data: { user }, error: userError } = await supabaseClient.auth.getUser()
        if (userError || !user) throw new Error('No autenticado')

        const { data: requesterRole, error: roleError } = await supabaseClient
            .from('cuna_trabajadores')
            .select('rol')
            .eq('usuario_id', user.id)
            .single()

        if (roleError || requesterRole?.rol !== 'responsable') {
            return new Response(
                JSON.stringify({ error: 'No autorizado. Solo responsables pueden editar.' }),
                { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        // 2. Obtener datos del body
        const { usuario_id, nombre } = await req.json()
        if (!usuario_id || !nombre) {
            return new Response(
                JSON.stringify({ error: 'Faltan datos (usuario_id, nombre)' }),
                { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        // 3. Inicializar Admin Client para actualizar auth.users
        const supabaseAdmin = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        )

        // 4. Actualizar metadata del usuario
        const { data: updateData, error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
            usuario_id,
            { user_metadata: { nombre: nombre } }
        )

        if (updateError) throw updateError

        return new Response(
            JSON.stringify({ message: 'Trabajador actualizado exitosamente', data: updateData }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )

    } catch (error) {
        return new Response(
            JSON.stringify({ error: error.message }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
    }
})
