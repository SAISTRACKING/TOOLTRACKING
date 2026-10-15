// =========================================================
// ToolTracking - Variables de Entorno (Desacopladas)
// Las credenciales NO están expuestas en el código fuente.
// En producción, se inyectan mediante GitHub Secrets & Variables.
// En local, se leen desde el almacenamiento seguro del navegador.
// =========================================================
window.__ENV__ = {
  SUPABASE_URL: 'https://TU-PROYECTO-ACTUAL.supabase.co',
  SUPABASE_ANON_KEY: 'TU_LLAVE_ANON_KEY',
  // ...
};
