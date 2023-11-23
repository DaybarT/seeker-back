function getDateMaster() {
    const now = new Date();
    const fecha = now.toISOString().slice(0, 10); // Obtén la fecha en formato "AAAA-MM-DD"
    const hora = now.toTimeString().split(" ")[0]; // Obtén la hora en formato "HH:MM:SS"
  
    return {fecha,hora};
  }
  