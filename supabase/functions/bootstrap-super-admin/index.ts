import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const serviceClient = createClient(supabaseUrl, supabaseServiceKey);

    const { email, password } = await req.json();

    // Check if any super_admin already exists
    const { data: existingAdmins } = await serviceClient
      .from("user_roles")
      .select("id")
      .eq("role", "super_admin")
      .limit(1);

    if (existingAdmins && existingAdmins.length > 0) {
      return new Response(
        JSON.stringify({ error: "A super admin already exists. Use the create-admin function instead." }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create a system hospital for the super admin profile
    const { data: existingHospital } = await serviceClient
      .from("hospitals")
      .select("id")
      .eq("slug", "system")
      .single();

    let systemHospitalId: string;
    if (existingHospital) {
      systemHospitalId = existingHospital.id;
    } else {
      const { data: newHospital, error: hospError } = await serviceClient
        .from("hospitals")
        .insert({ name: "System", slug: "system", address: "System Hospital" })
        .select("id")
        .single();
      if (hospError) throw hospError;
      systemHospitalId = newHospital.id;
    }

    // Create the super admin user
    const { data: newUser, error: createError } = await serviceClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { name: "Super Admin", hospital_id: systemHospitalId, role: "super_admin" },
    });

    if (createError) throw createError;

    return new Response(
      JSON.stringify({ success: true, message: "Super admin created successfully" }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
