import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        const supabase = createClient(
            Deno.env.get("SUPABASE_URL")!,
            Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
            { auth: { persistSession: false } }
        );

        const { month, year } = await req.json();

        if (!month || !year) {
            throw new Error("Se requiere mes y año");
        }

        console.log(`Generando calendario para Mes: ${month}, Año: ${year}`);

        // 1. Obtener trabajadoras activas
        const { data: workers, error: workersError } = await supabase
            .from("cuna_trabajadores")
            .select("usuario_id, disponible_viernes, estado_participacion")
            .eq("activo", true)
            .eq("estado_participacion", "activa");

        if (workersError) throw workersError;

        // Mezclar aleatoriamente para equidad
        const shuffledWorkers = workers.sort(() => Math.random() - 0.5);

        // Separar grupos
        // IMPORTANTE: Filtrado estricto por la columna disponible_viernes
        const fridayWorkers = shuffledWorkers.filter(w => w.disponible_viernes === true);
        const sundayWorkers = [...shuffledWorkers]; // Copia para no mutar el original si se manipula

        console.log(`Total trabajadoras: ${workers.length}`);
        console.log(`Disponibles Viernes: ${fridayWorkers.length}`);

        // 2. Generar fechas (Viernes y Domingos)
        // Usar UTC para evitar problemas de zona horaria y asegurar que el mes sea el correcto
        // month viene 1-12, Date usa 0-11
        const startDate = new Date(Date.UTC(year, month - 1, 1));
        // Para obtener el último día del mes, usamos día 0 del mes siguiente
        const endDate = new Date(Date.UTC(year, month, 0));

        const dates = [];

        // Iterar día por día
        for (let d = new Date(startDate); d <= endDate; d.setUTCDate(d.getUTCDate() + 1)) {
            const dayOfWeek = d.getUTCDay(); // 0=Domingo, 5=Viernes

            if (dayOfWeek === 5 || dayOfWeek === 0) {
                dates.push({
                    date: new Date(d), // Copia de la fecha
                    type: dayOfWeek === 5 ? 'viernes' : 'domingo'
                });
            }
        }

        console.log(`Fechas generadas: ${dates.length}`);

        // 3. Algoritmo de Asignación
        const assignments = [];
        const assignedUserIds = new Set(); // Global del mes para intentar no repetir

        for (const dateObj of dates) {
            const dateStr = dateObj.date.toISOString().split('T')[0];

            // Crear/Obtener día en calendario
            const { data: calendarDay, error: calError } = await supabase
                .from("cuna_calendario")
                .upsert({
                    fecha: dateStr,
                    dia_semana: dateObj.type,
                    habilitado: true
                }, { onConflict: 'fecha' })
                .select()
                .single();

            if (calError) throw calError;

            // Asignar 2 slots
            const dailyAssigned = new Set(); // Local del día para no repetir persona el mismo día

            for (let slot = 1; slot <= 2; slot++) {
                let candidate = null;

                // Seleccionar pool correcto
                // Si es viernes, SOLO usar fridayWorkers
                let pool = dateObj.type === 'viernes' ? fridayWorkers : sundayWorkers;

                // 1. Filtrar: No asignado hoy
                let availablePool = pool.filter(w => !dailyAssigned.has(w.usuario_id));

                // 2. Estrategia A: Buscar alguien que NO tenga turno este mes
                candidate = availablePool.find(w => !assignedUserIds.has(w.usuario_id));

                // 3. Estrategia B: Si todos ya tienen turno, repetir (Round Robin)
                if (!candidate && availablePool.length > 0) {
                    candidate = availablePool[0];
                }

                if (candidate) {
                    // SAFETY CHECK: Validar ESTRICTAMENTE que si es viernes, tenga la marca
                    if (dateObj.type === 'viernes' && !candidate.disponible_viernes) {
                        console.error(`VIOLACIÓN DE REGLA: Intentando asignar a ${candidate.usuario_id} en Viernes sin tener ⭐`);
                        candidate = null; // Abortar esta asignación específica
                    }
                }

                if (candidate) {
                    assignedUserIds.add(candidate.usuario_id);
                    dailyAssigned.add(candidate.usuario_id);

                    assignments.push({
                        calendario_id: calendarDay.id,
                        slot_numero: slot,
                        estado: 'asignado',
                        trabajador_id: candidate.usuario_id
                    });

                    // Rotación: Mover al final para dar oportunidad a otros
                    if (dateObj.type === 'viernes') {
                        const idx = fridayWorkers.indexOf(candidate);
                        if (idx > -1) {
                            fridayWorkers.push(fridayWorkers.splice(idx, 1)[0]);
                        }
                    } else {
                        const idx = sundayWorkers.indexOf(candidate);
                        if (idx > -1) {
                            sundayWorkers.push(sundayWorkers.splice(idx, 1)[0]);
                        }
                    }
                } else {
                    // Realmente no hay nadie (pool vacío o todos asignados hoy)
                    console.log(`No se encontró candidato para ${dateStr} (${dateObj.type}) slot ${slot}`);
                    assignments.push({
                        calendario_id: calendarDay.id,
                        slot_numero: slot,
                        estado: 'liberado',
                        trabajador_id: null
                    });
                }
            }
        }

        // 4. Guardar Asignaciones
        if (assignments.length > 0) {
            const { error: insertError } = await supabase
                .from("cuna_turnos")
                .upsert(assignments, { onConflict: 'calendario_id, slot_numero' });

            if (insertError) throw insertError;
        }

        return new Response(
            JSON.stringify({
                success: true,
                message: `Calendario generado para ${month}/${year}`,
                total_fechas: dates.length,
                total_asignaciones: assignments.filter(a => a.trabajador_id).length
            }),
            { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );

    } catch (err) {
        console.error("Error generando calendario:", err);
        return new Response(
            JSON.stringify({ error: err.message }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }
});
