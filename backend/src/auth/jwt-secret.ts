/** Devuelve JWT_SECRET o detiene el arranque: nunca firmar tokens con un secreto conocido. */
export function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET no está definido. Configúralo en las variables de entorno.');
  }
  return secret;
}
