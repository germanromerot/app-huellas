(function (global) {
  "use strict";

  const services = [
    {
      id: "vet_consulta",
      label: "Consulta veterinaria",
      proType: "vet",
      price: 500,
      extraNote: " (+ insumos si aplica)",
      durationMin: 30,
    },
    {
      id: "groom_full",
      label: "Estetica completa (lavado, secado, corte, unas)",
      proType: "groom",
      price: 1800,
      extraNote: "",
      durationMin: 60,
    },
  ];

  const professionals = [
    { id: "vet-1", type: "vet", name: "Dra. Lucia Pereira", specialty: "Veterinaria" },
    { id: "vet-2", type: "vet", name: "Dr. Martin Suarez", specialty: "Veterinario" },
    { id: "vet-3", type: "vet", name: "Dra. Sofia Mendez", specialty: "Veterinaria" },
    { id: "groom-1", type: "groom", name: "Valentina Rocha", specialty: "Estilista" },
    { id: "groom-2", type: "groom", name: "Camila Fernandez", specialty: "Estilista" },
    { id: "groom-3", type: "groom", name: "Agustina Silva", specialty: "Estilista" },
  ];

  // Indexa una lista de objetos por su propiedad id.
  const byId = (items) =>
    items.reduce((acc, item) => {
      acc[item.id] = item;
      return acc;
    }, {});

  const catalog = {
    SERVICES: services,
    PROFESSIONALS: professionals,
    SERVICES_BY_ID: byId(services),
    PROFESSIONALS_BY_ID: byId(professionals),
  };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = catalog;
  }

  const root = global.VetCore || (global.VetCore = {});
  root.config = root.config || {};
  root.config.catalog = catalog;
})(typeof window !== "undefined" ? window : globalThis);
