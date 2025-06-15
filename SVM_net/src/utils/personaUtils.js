import PERSONAS_DATA from '../data/personaData'; // Assuming default export

/**
 * Normalizes a given persona ID to its authoritative casing as defined in personaData.js.
 * If the ID is not found, it returns the original ID and logs a warning.
 * @param {string} rawId - The persona ID from the script (case-insensitive).
 * @param {Array<Object>} [personasArray=PERSONAS_DATA] - The array of authoritative persona objects.
 * @returns {string} The authoritative persona ID or the original rawId if not found.
 */
export const normalizePersonaId = (rawId, personasArray = PERSONAS_DATA) => {
  if (!rawId || typeof rawId !== 'string') {
    // console.warn(`[normalizePersonaId] Received invalid rawId: ${rawId}. Returning as is.`);
    return rawId;
  }
  const rawIdLower = rawId.toLowerCase();
  const foundPersona = personasArray.find(p => p.id.toLowerCase() === rawIdLower);

  if (foundPersona) {
    return foundPersona.id; // Return the ID with authoritative casing
  } else {
    console.warn(`[normalizePersonaId] Persona ID '${rawId}' not found in authoritative list. Using original ID. This might lead to issues if the ID is case-sensitive elsewhere.`);
    return rawId; // Fallback to original ID if not found
  }
};

/**
 * Finds a persona object from the authoritative list using a case-insensitive ID.
 * @param {string} rawId - The persona ID to search for (case-insensitive).
 * @param {Array<Object>} [personasArray=PERSONAS_DATA] - The array of authoritative persona objects.
 * @returns {Object|null} The persona object if found, otherwise null.
 */
export const getPersonaByIdCaseInsensitive = (rawId, personasArray = PERSONAS_DATA) => {
  if (!rawId || typeof rawId !== 'string') {
    return null;
  }
  const rawIdLower = rawId.toLowerCase();
  const foundPersona = personasArray.find(p => p.id.toLowerCase() === rawIdLower);
  return foundPersona || null;
};