
import { GoogleGenAI } from "@google/genai";
import { ScoutResult, BUILDING_DEFINITIONS, FactionId } from "../types";
import { useGameStore } from "../store/gameStore";

const apiKey = process.env.API_KEY;

// Helper to log interactions
const logInteraction = (type: 'Request' | 'Response' | 'Error', action: string, data: any) => {
  useGameStore.getState().addLog({ type, action, data });
};

export const scoutArea = async (lat: number, lng: number): Promise<ScoutResult[]> => {
  if (!apiKey) throw new Error("API Key missing");
  const ai = new GoogleGenAI({ apiKey });
  const modelId = "gemini-2.5-flash"; 
  
  const prompt = `
    Search for distinct real-world places within a 2km radius of Latitude: ${lat}, Longitude: ${lng}. In Riga Latvia. 
    Return all found places (aim for 30+ results).
    
    For each place, output a single line in this exact pipe-delimited format:
    NAME|TYPE|LATITUDE|LONGITUDE

    Classify TYPE as one of:
    - BLOOD_SOURCE (Hospitals, Clinics, Vets)
    - GRAVEYARD (Cemeteries, Churches)
    - INDUSTRY (Factories, Warehouses)
    - OCCULT (Museums, Historic, Ruins)
    - WEALTH (Banks, Gov, Malls)
    - POPULATION_CENTER (Schools, Parks, Plazas, General)

    Example output line:
    St. Peter's Church|GRAVEYARD|56.9475|24.1093

    Do not include any other text, bullets, or numbering. Just the data lines.
  `;

  logInteraction('Request', 'scoutArea', { lat, lng, modelId, prompt });

  try {
    const response = await ai.models.generateContent({
      model: modelId,
      contents: prompt,
      config: {
        tools: [{ googleMaps: {} }],
        toolConfig: {
          retrievalConfig: { latLng: { latitude: lat, longitude: lng } }
        }
      }
    });

    logInteraction('Response', 'scoutArea', response);

    const text = response.text || "";
    const lines = text.split('\n');
    const results: ScoutResult[] = [];
    
    const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];

    lines.forEach(line => {
        const parts = line.split('|').map(p => p.trim());
        if (parts.length >= 4) {
            const name = parts[0];
            const typeRaw = parts[1].toUpperCase();
            let latitude = parseFloat(parts[2]);
            let longitude = parseFloat(parts[3]);
            
            let t = 'POPULATION_CENTER';
            let factionId = FactionId.PEASANT_VILLAGES;

            if (typeRaw.includes('BLOOD')) { t = 'BLOOD_SOURCE'; factionId = FactionId.HOUSE_LILITU; }
            else if (typeRaw.includes('GRAVE') || typeRaw.includes('CHURCH')) { t = 'GRAVEYARD'; factionId = FactionId.CHURCH_INQUISITION; }
            else if (typeRaw.includes('INDUSTRY')) { t = 'INDUSTRY'; factionId = FactionId.HOUSE_DRACUL; }
            else if (typeRaw.includes('OCCULT') || typeRaw.includes('MUSEUM')) { t = 'OCCULT'; factionId = FactionId.HOUSE_NECROS; }
            else if (typeRaw.includes('WEALTH') || typeRaw.includes('BANK')) { t = 'WEALTH'; factionId = FactionId.MERCHANT_GUILD; }
            else { t = 'POPULATION_CENTER'; factionId = FactionId.PEASANT_VILLAGES; }

            let suggestedBuildingId = 'human_pen';
            if (t === 'BLOOD_SOURCE') suggestedBuildingId = 'blood_font';
            if (t === 'GRAVEYARD') suggestedBuildingId = 'graveyard';
            if (t === 'INDUSTRY') suggestedBuildingId = 'blood_forge';
            if (t === 'OCCULT') suggestedBuildingId = 'blood_altar';
            if (t === 'WEALTH') suggestedBuildingId = 'quarry';

            if (isNaN(latitude) || isNaN(longitude) || (latitude === 0 && longitude === 0)) {
                latitude = lat + (Math.random() - 0.5) * 0.005;
                longitude = lng + (Math.random() - 0.5) * 0.005;
            }

            if (name && name.toLowerCase() !== 'unknown location') {
                results.push({
                    id: Math.random().toString(36).substr(2, 9),
                    name,
                    type: t,
                    suggestedBuildingId,
                    lat: latitude,
                    lng: longitude,
                    controllingFactionId: factionId
                });
            }
        }
    });

    if (results.length === 0 && chunks.length > 0) {
        chunks.forEach((chunk) => {
             const name = chunk.maps?.title || chunk.web?.title || "Unknown";
             if (name === "Unknown") return;
             
             const jitterLat = lat + (Math.random() - 0.5) * 0.006;
             const jitterLng = lng + (Math.random() - 0.5) * 0.006;
             
             results.push({
                id: Math.random().toString(36).substr(2, 9),
                name,
                type: 'POPULATION_CENTER', 
                suggestedBuildingId: 'human_pen',
                lat: jitterLat,
                lng: jitterLng,
                controllingFactionId: FactionId.PEASANT_VILLAGES
             });
        });
    }

    const unique = new Map();
    results.forEach(r => {
        const key = `${r.name}|${r.lat.toFixed(5)}|${r.lng.toFixed(5)}`;
        if (!unique.has(key)) unique.set(key, r);
    });

    return Array.from(unique.values());

  } catch (error) {
    console.error("Scouting failed:", error);
    logInteraction('Error', 'scoutArea', error);
    return [];
  }
};

export const corruptLocationNarrative = async (placeName: string, type: string) => {
   if (!apiKey) return `You have claimed ${placeName}.`;
   const ai = new GoogleGenAI({ apiKey });
   const prompt = `
     Write a single, atmospheric sentence describing a Vampire Lord corrupting the real-world location "${placeName}" into a "${type}". 
     The tone should be gothic, dark, and subtly violent.
   `;

   try {
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
      });
      return response.text || `Darkness consumes ${placeName}.`;
   } catch (error) {
       return `Darkness consumes ${placeName}.`;
   }
}

export const generateDiplomacyFlavor = async (factionName: string, action: string, outcome: string) => {
   if (!apiKey) return `The ${factionName} responded to your ${action}.`;
   const ai = new GoogleGenAI({ apiKey });
   const prompt = `
     Write a very short (20 words max) response from the faction "${factionName}" regarding the player's action "${action}".
     Outcome: ${outcome}.
     Tone: Gothic, serious, R-rated (implied violence/seduction ok, no explicit gore/sex).
   `;
   
   try {
     const response = await ai.models.generateContent({
       model: "gemini-2.5-flash",
       contents: prompt
     });
     return response.text;
   } catch (e) {
     return "They have received your message.";
   }
};

export const generateResearchLore = async (techName: string) => {
  if (!apiKey) return `Knowledge of ${techName} has been etched into your mind.`;
  const ai = new GoogleGenAI({ apiKey });
  const prompt = `
    Write a short, cryptic text (1-2 sentences) about unlocking the forbidden vampire technology "${techName}".
    Style: Lovecraftian/Gothic. Mention blood, shadows, or ancient secrets.
  `;
  
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt
    });
    return response.text;
  } catch (e) {
    return `Knowledge of ${techName} has been etched into your mind.`;
  }
}
