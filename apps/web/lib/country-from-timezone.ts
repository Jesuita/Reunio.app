/**
 * Maps IANA timezone to ISO 3166-1 alpha-2 country code.
 * Used to pre-select the phone number country flag in the booking wizard.
 */
export function countryFromTimezone(timezone: string): string {
  if (timezone.startsWith("America/Argentina") || timezone === "America/Buenos_Aires") return "AR";
  if (
    timezone === "America/Mexico_City" ||
    timezone === "America/Monterrey" ||
    timezone === "America/Merida" ||
    timezone === "America/Cancun" ||
    timezone === "America/Chihuahua" ||
    timezone === "America/Hermosillo" ||
    timezone === "America/Mazatlan" ||
    timezone === "America/Ojinaga" ||
    timezone === "America/Tijuana" ||
    timezone === "America/Bahia_Banderas"
  ) return "MX";
  if (timezone === "America/Santiago") return "CL";
  if (timezone === "America/Bogota") return "CO";
  if (timezone === "America/Lima") return "PE";
  if (timezone === "America/Caracas") return "VE";
  if (timezone === "America/Guayaquil" || timezone === "Pacific/Galapagos") return "EC";
  if (timezone === "America/Asuncion") return "PY";
  if (timezone === "America/Montevideo") return "UY";
  if (timezone === "America/La_Paz") return "BO";
  if (timezone === "America/Panama") return "PA";
  if (timezone === "America/Costa_Rica") return "CR";
  if (timezone === "America/Guatemala") return "GT";
  if (timezone === "America/Tegucigalpa") return "HN";
  if (timezone === "America/Managua") return "NI";
  if (timezone === "America/El_Salvador") return "SV";
  if (timezone === "America/Santo_Domingo") return "DO";
  if (timezone === "America/Havana") return "CU";
  if (timezone === "America/Port-au-Prince") return "HT";
  if (timezone === "America/Puerto_Rico") return "PR";
  return "AR"; // safe LATAM default
}
