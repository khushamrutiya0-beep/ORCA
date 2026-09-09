/**
 * ORCA Location Tool
 * Resolves Indian coastal city names → coordinates using a curated lookup table.
 * No external geocoding API — embedded lookup for 35+ Indian coastal locations.
 */

export interface CityRecord {
  name: string;
  latitude: number;
  longitude: number;
  state: string;
  aliases: string[];
}

/**
 * Curated Indian coastal city lookup (35 locations).
 * Keys are canonical English city names used for lookup.
 */
export const COASTAL_CITY_LOOKUP: Record<string, CityRecord> = {
  'Mumbai': { name: 'Mumbai Offshore (Arabian Sea)', latitude: 18.9220, longitude: 72.8347, state: 'Maharashtra', aliases: ['bombay', 'मुंबई', 'mumbai', 'मुम्बई', 'bom'] },
  'Kochi': { name: 'Kochi (Cochin)', latitude: 9.9312, longitude: 76.2673, state: 'Kerala', aliases: ['cochin', 'kochi', 'कोच्चि', 'कोच्ची', 'kozhikode', 'cochin port', 'કોચ્ચિ'] },
  'Chennai': { name: 'Chennai Coast', latitude: 13.0827, longitude: 80.2707, state: 'Tamil Nadu', aliases: ['madras', 'chennai', 'चेन्नई', 'மதராஸ்', 'maa'] },
  'Visakhapatnam': { name: 'Visakhapatnam (Vizag) Bay of Bengal', latitude: 17.6868, longitude: 83.2185, state: 'Andhra Pradesh', aliases: ['vizag', 'visakhapatnam', 'vishakhapatnam', 'वाइजाग', 'विशाखापट्टनम', 'vtg', 'vtza'] },
  'Kolkata': { name: 'Kolkata / Haldia (Bay of Bengal)', latitude: 21.9000, longitude: 88.0700, state: 'West Bengal', aliases: ['calcutta', 'kolkata', 'कोलकाता', 'haldia'] },
  'Porbandar': { name: 'Porbandar (Arabian Sea)', latitude: 21.6417, longitude: 69.6293, state: 'Gujarat', aliases: ['porbandar', 'पोरबंदर', 'pbd', 'porbandar port', 'પોરબંદર'] },
  'Goa': { name: 'Goa (Arabian Sea)', latitude: 15.4909, longitude: 73.8278, state: 'Goa', aliases: ['goa', 'mormugao', 'गोवा', 'panaji', 'ગોવા'] },
  'Mangalore': { name: 'New Mangalore Port', latitude: 12.9141, longitude: 74.8560, state: 'Karnataka', aliases: ['mangalore', 'mangaluru', 'new mangalore', 'मैंगलोर'] },
  'Tuticorin': { name: 'Tuticorin / Thoothukudi', latitude: 8.7642, longitude: 78.1348, state: 'Tamil Nadu', aliases: ['tuticorin', 'thoothukudi', 'voc port', 'tut', 'தூத்துக்குடி'] },
  'Kanyakumari': { name: 'Kanyakumari (Cape Comorin)', latitude: 8.0883, longitude: 77.5385, state: 'Tamil Nadu', aliases: ['kanyakumari', 'cape comorin', 'कन्याकुमारी', 'trivandrum sea'] },
  'Paradip': { name: 'Paradip Port (Odisha)', latitude: 20.3155, longitude: 86.6116, state: 'Odisha', aliases: ['paradip', 'paradwip', 'पारादीप'] },
  'Ennore': { name: 'Ennore / Kamarajar Port', latitude: 13.2164, longitude: 80.3381, state: 'Tamil Nadu', aliases: ['ennore', 'kamarajar', 'எண்ணூர்'] },
  'Jamnagar': { name: 'Jamnagar (Gulf of Kutch)', latitude: 22.4707, longitude: 70.0577, state: 'Gujarat', aliases: ['jamnagar', 'जामनगर', 'jam'] },
  'Kandla': { name: 'Kandla Port (Gujarat)', latitude: 23.0053, longitude: 70.2206, state: 'Gujarat', aliases: ['kandla', 'deendayal port', 'कांडला'] },
  'Mandvi': { name: 'Mandvi (Gujarat)', latitude: 22.8360, longitude: 69.3614, state: 'Gujarat', aliases: ['mandvi', 'mandvi gujarat', 'माण्डवी'] },
  'Okha': { name: 'Okha Port (Gujarat)', latitude: 22.4659, longitude: 69.0722, state: 'Gujarat', aliases: ['okha', 'okha port', 'ओखा'] },
  'Dwarka': { name: 'Dwarka (Gujarat)', latitude: 22.2346, longitude: 68.9679, state: 'Gujarat', aliases: ['dwarka', 'द्वारका', 'dwaraka'] },
  'Veraval': { name: 'Veraval Fishing Harbour', latitude: 20.9140, longitude: 70.3630, state: 'Gujarat', aliases: ['veraval', 'वेरावल', 'somnath sea'] },
  'Diu': { name: 'Diu (Union Territory)', latitude: 20.7150, longitude: 70.9876, state: 'Diu', aliases: ['diu', 'daman', 'दीव'] },
  'Ratnagiri': { name: 'Ratnagiri (Maharashtra)', latitude: 16.9902, longitude: 73.3120, state: 'Maharashtra', aliases: ['ratnagiri', 'रत्नागिरी'] },
  'Alibag': { name: 'Alibag (Maharashtra)', latitude: 18.6427, longitude: 72.8787, state: 'Maharashtra', aliases: ['alibag', 'alibaug', 'अलिबाग'] },
  'Sindhudurg': { name: 'Sindhudurg (Maharashtra)', latitude: 16.3500, longitude: 73.5500, state: 'Maharashtra', aliases: ['sindhudurg', 'malvan'] },
  'Karwar': { name: 'Karwar (Karnataka)', latitude: 14.8139, longitude: 74.1246, state: 'Karnataka', aliases: ['karwar', 'कारवार', 'naval base karwar'] },
  'Udupi': { name: 'Udupi Coast (Karnataka)', latitude: 13.3409, longitude: 74.7421, state: 'Karnataka', aliases: ['udupi', 'malpe', 'ಉಡುಪಿ'] },
  'Kozhikode': { name: 'Kozhikode / Calicut', latitude: 11.2588, longitude: 75.7804, state: 'Kerala', aliases: ['kozhikode', 'calicut', 'कालीकट', 'calicult'] },
  'Thiruvananthapuram': { name: 'Thiruvananthapuram (Kerala)', latitude: 8.5241, longitude: 76.9366, state: 'Kerala', aliases: ['trivandrum', 'thiruvananthapuram', 'तिरुवनंतपुरम', 'tvm'] },
  'Rameshwaram': { name: 'Rameshwaram / Gulf of Mannar', latitude: 9.2881, longitude: 79.3129, state: 'Tamil Nadu', aliases: ['rameshwaram', 'rameswaram', 'रामेश्वरम'] },
  'Pondicherry': { name: 'Puducherry (Bay of Bengal)', latitude: 11.9416, longitude: 79.8083, state: 'Puducherry', aliases: ['pondicherry', 'puducherry', 'पुडुचेरी'] },
  'Mahabalipuram': { name: 'Mahabalipuram (Tamil Nadu)', latitude: 12.6269, longitude: 80.1928, state: 'Tamil Nadu', aliases: ['mahabalipuram', 'mamallapuram', 'महाबलीपुरम'] },
  'Nellore': { name: 'Nellore Coast (Andhra Pradesh)', latitude: 14.4426, longitude: 80.0037, state: 'Andhra Pradesh', aliases: ['nellore', 'krishnapatnam', 'नेल्लोर'] },
  'Kakinada': { name: 'Kakinada (Andhra Pradesh)', latitude: 16.9891, longitude: 82.2475, state: 'Andhra Pradesh', aliases: ['kakinada', 'काकीनाडा'] },
  'Machilipatnam': { name: 'Machilipatnam (Andhra Pradesh)', latitude: 16.1875, longitude: 81.1389, state: 'Andhra Pradesh', aliases: ['machilipatnam', 'masulipatnam', 'मछलीपट्टनम'] },
  'Bhavnagar': { name: 'Bhavnagar (Gujarat)', latitude: 21.7645, longitude: 72.1519, state: 'Gujarat', aliases: ['bhavnagar', 'भावनगर', 'bhavanagar'] },
  'Port Blair': { name: 'Port Blair (Andaman Islands)', latitude: 11.6234, longitude: 92.7265, state: 'Andaman & Nicobar', aliases: ['port blair', 'andaman', 'अंडमान', 'pbl'] },
  'Nagapattinam': { name: 'Nagapattinam (Tamil Nadu)', latitude: 10.7672, longitude: 79.8449, state: 'Tamil Nadu', aliases: ['nagapattinam', 'nagapatnam', 'நாகப்பட்டினம்'] },
  'Arabian Sea': { name: 'Arabian Sea (Central)', latitude: 16.0, longitude: 68.0, state: 'Arabian Sea', aliases: ['arabian sea', 'arabian', 'अरब सागर', 'અરબી સમુદ્ર'] },
  'Bay of Bengal': { name: 'Bay of Bengal (Central)', latitude: 15.0, longitude: 87.0, state: 'Bay of Bengal', aliases: ['bay of bengal', 'bengal bay', 'बंगाल की खाड़ी', 'બંગાળની ખાડી'] },
  'Indian Ocean': { name: 'Indian Ocean (Equatorial)', latitude: 5.0, longitude: 77.0, state: 'Indian Ocean', aliases: ['indian ocean', 'हिन्द महासागर', 'હિંદ મહાસાગર'] },
};

/**
 * Find a city by any alias (case-insensitive).
 */
export function lookupCityByAlias(text: string): CityRecord | null {
  const lowerText = text.toLowerCase();
  for (const [key, city] of Object.entries(COASTAL_CITY_LOOKUP)) {
    if (lowerText.includes(key.toLowerCase())) return city;
    for (const alias of city.aliases) {
      if (lowerText.includes(alias.toLowerCase())) return city;
    }
  }
  return null;
}

export interface LocationToolInput {
  message: string;
}

export interface LocationToolOutput {
  name: string;
  latitude: number;
  longitude: number;
  state: string;
  resolvedFrom: 'CITY_LOOKUP' | 'DEFAULT';
}

export async function executeLocationTool(input: LocationToolInput): Promise<LocationToolOutput> {
  const city = lookupCityByAlias(input.message);
  if (city) {
    return { name: city.name, latitude: city.latitude, longitude: city.longitude, state: city.state, resolvedFrom: 'CITY_LOOKUP' };
  }
  // Default: Mumbai offshore
  return { name: 'Mumbai Offshore (Arabian Sea)', latitude: 18.9220, longitude: 72.8347, state: 'Maharashtra', resolvedFrom: 'DEFAULT' };
}
