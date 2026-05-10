export const NEIGHBORHOOD_COORDINATES: Record<string, [number, number]> = {
  kipe: [9.5456, -13.6234],
  lambanyi: [9.5312, -13.6456],
  ratoma: [9.5678, -13.6123],
  sonfonia: [9.6123, -13.5456],
  hamdallaye: [9.5234, -13.6567],
  dixinn: [9.5123, -13.7012],
  matam: [9.5345, -13.6890],
  madina: [9.5567, -13.6678],
  kaloum: [9.5089, -13.7123],
  taouyah: [9.5789, -13.6345],
  cosa: [9.5234, -13.6234],
  nongo: [9.6234, -13.5678],
};

export const NEIGHBORHOODS = [
  { id: "kipe", name: "Kipé", commune: "Ratoma", popular: true },
  { id: "lambanyi", name: "Lambanyi", commune: "Ratoma", popular: true },
  { id: "ratoma", name: "Ratoma Centre", commune: "Ratoma", popular: true },
  { id: "sonfonia", name: "Sonfonia", commune: "Ratoma", popular: true },
  { id: "cosa", name: "Cosa", commune: "Ratoma", popular: false },
  { id: "hamdallaye", name: "Hamdallaye", commune: "Ratoma", popular: true },
  { id: "nongo", name: "Nongo", commune: "Ratoma", popular: false },
  { id: "taouyah", name: "Taouyah", commune: "Ratoma", popular: true },
  { id: "koloma", name: "Koloma", commune: "Ratoma", popular: false },
  { id: "dar-es-salam", name: "Dar Es Salam", commune: "Ratoma", popular: false },
  { id: "dixinn", name: "Dixinn", commune: "Dixinn", popular: true },
  { id: "belle-vue", name: "Belle Vue", commune: "Dixinn", popular: true },
  { id: "landreah", name: "Landréah", commune: "Dixinn", popular: false },
  { id: "matam", name: "Matam", commune: "Matam", popular: true },
  { id: "madina", name: "Madina", commune: "Matam", popular: true },
  { id: "enco-5", name: "Enco 5", commune: "Matam", popular: false },
  { id: "kaloum", name: "Kaloum", commune: "Kaloum", popular: true },
  { id: "boulbinet", name: "Boulbinet", commune: "Kaloum", popular: false },
  { id: "tombo", name: "Tombo", commune: "Kaloum", popular: false },
  { id: "coronthie", name: "Coronthie", commune: "Kaloum", popular: false },
  { id: "sangoyah", name: "Sangoyah", commune: "Matoto", popular: false },
  { id: "matoto", name: "Matoto Centre", commune: "Matoto", popular: false },
  { id: "kagbelen", name: "Kagbelen", commune: "Coyah", popular: false },
  { id: "coyah", name: "Coyah", commune: "Coyah", popular: false },
];

export const POPULAR_NEIGHBORHOODS = NEIGHBORHOODS.filter((n) => n.popular);

export const COMMUNES = ["Ratoma", "Dixinn", "Matam", "Kaloum", "Matoto", "Coyah"];

export function getNeighborhoodName(id: string): string {
  return NEIGHBORHOODS.find((n) => n.id === id)?.name ?? id;
}
