export const mockServidoras = [
  { id: 1, nombre: "Ana García", avatar: "https://i.pravatar.cc/150?u=1", estado: "disponible" },
  { id: 2, nombre: "Beatriz López", avatar: "https://i.pravatar.cc/150?u=2", estado: "cumplido" }, // Ya sirvió
  { id: 3, nombre: "Carla Méndez", avatar: "https://i.pravatar.cc/150?u=3", estado: "disponible" },
  { id: 4, nombre: "Diana Ruiz", avatar: "https://i.pravatar.cc/150?u=4", estado: "extra" }, // Asignación extra
  { id: 5, nombre: "Elena Torres", avatar: "https://i.pravatar.cc/150?u=5", estado: "disponible" },
  { id: 6, nombre: "Fabiola King", avatar: "https://i.pravatar.cc/150?u=6", estado: "disponible" },
  { id: 7, nombre: "Gabriela Solis", avatar: "https://i.pravatar.cc/150?u=7", estado: "cumplido" },
];

export const mockTurnos = [
  {
    fecha: "2025-11-07", // Viernes
    slots: [
      { id: "t1-s1", estado: "confirmado", servidora: { nombre: "Ana García", avatar: "https://i.pravatar.cc/150?u=1" } },
      { id: "t1-s2", estado: "confirmado", servidora: { nombre: "Elena Torres", avatar: "https://i.pravatar.cc/150?u=5" } },
    ]
  },
  {
    fecha: "2025-11-09", // Domingo
    slots: [
      { id: "t2-s1", estado: "solicitud", servidora: { nombre: "Beatriz López", avatar: "https://i.pravatar.cc/150?u=2" } },
      { id: "t2-s2", estado: "asignado", servidora: { nombre: "Carla Méndez", avatar: "https://i.pravatar.cc/150?u=3" } },
    ]
  },
  {
    fecha: "2025-11-14", // Viernes
    slots: [
      { id: "t3-s1", estado: "vacante", servidora: null },
      { id: "t3-s2", estado: "vacante", servidora: null },
    ]
  }
];
