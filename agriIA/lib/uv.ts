export function getUVColor(uv: number): string {
  if (uv <= 2) return '#27ae60';
  if (uv <= 5) return '#f5a623';
  if (uv <= 7) return '#e67e22';
  return '#e74c3c';
}

export function getUVLabel(uv: number): string {
  if (uv <= 2) return 'Faible';
  if (uv <= 5) return 'Modere';
  if (uv <= 7) return 'Eleve';
  return 'Tres eleve';
}
