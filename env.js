// =========================================================
// ToolTracking - Variables de Entorno (Desacopladas)
// Las credenciales NO están expuestas en el código fuente.
// En producción, se inyectan mediante GitHub Secrets & Variables.
// En local, se leen desde el almacenamiento seguro del navegador.
// =========================================================

window.__ENV__ = {
  SUPABASE_URL: window.ENV_SUPABASE_URL || localStorage.getItem('SUPABASE_URL') || 'https://iuavuxtstzpbwvmbrely.supabase.co',
  SUPABASE_ANON_KEY: window.ENV_SUPABASE_ANON_KEY || localStorage.getItem('SUPABASE_ANON_KEY') || 'sb_publishable_YI0EmePfKteihRVmCvvhaw_bonybHbx',
  ENVIRONMENT: 'production',
  SECURITY_HASH_ALGO: 'SHA-256',
  APP_VERSION: '2.4.0'
};
