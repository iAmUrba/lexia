export function mapErrorToHttpCode(error: Error): { status: number; message: string } {
  const message = error.message.toLowerCase();
  
  if (message.includes("optimisticconcurrencyerror")) {
    return { status: 409, message: error.message }; // Conflict
  }
  
  if (message.includes("solo se puede") || message.includes("no válido") || message.includes("no encontrado")) {
    return { status: 422, message: error.message }; // Unprocessable Entity
  }
  
  // Por defecto, asumimos 500
  return { status: 500, message: "Internal Server Error" };
}
