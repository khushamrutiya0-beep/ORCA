export interface PortRecord {
  id: string;
  name: string;
  state: string;
  type: 'MAJOR' | 'INTERMEDIATE' | 'MINOR';
  coordinates: [number, number]; // [lat, lon]
}

export const INDIAN_COASTAL_PORTS: PortRecord[] = [
  { id: 'IN-BOM', name: 'Mumbai Port Trust (MbPT)', state: 'Maharashtra', type: 'MAJOR', coordinates: [18.9438, 72.8441] },
  { id: 'IN-JNPT', name: 'Jawaharlal Nehru Port (Nhava Sheva)', state: 'Maharashtra', type: 'MAJOR', coordinates: [18.9500, 72.9500] },
  { id: 'IN-COK', name: 'Cochin Port (Kochi)', state: 'Kerala', type: 'MAJOR', coordinates: [9.9667, 76.2667] },
  { id: 'IN-MAA', name: 'Chennai Port', state: 'Tamil Nadu', type: 'MAJOR', coordinates: [13.0833, 80.3000] },
  { id: 'IN-VTZ', name: 'Visakhapatnam Port', state: 'Andhra Pradesh', type: 'MAJOR', coordinates: [17.6833, 83.2833] },
  { id: 'IN-KOL', name: 'Kolkata Port (SMP)', state: 'West Bengal', type: 'MAJOR', coordinates: [22.5333, 88.3167] },
  { id: 'IN-PBD', name: 'Porbandar Port', state: 'Gujarat', type: 'INTERMEDIATE', coordinates: [21.6333, 69.6000] },
  { id: 'IN-MRM', name: 'Mormugao Port (Goa)', state: 'Goa', type: 'MAJOR', coordinates: [15.4167, 73.8000] },
  { id: 'IN-NMP', name: 'New Mangalore Port', state: 'Karnataka', type: 'MAJOR', coordinates: [12.9167, 74.8167] },
  { id: 'IN-TUT', name: 'V.O. Chidambaranar Port (Tuticorin)', state: 'Tamil Nadu', type: 'MAJOR', coordinates: [8.7500, 78.1833] },
  { id: 'IN-PRT', name: 'Paradip Port', state: 'Odisha', type: 'MAJOR', coordinates: [20.2667, 86.6667] },
  { id: 'IN-IXZ', name: 'Port Blair Harbour', state: 'Andaman & Nicobar', type: 'MAJOR', coordinates: [11.6667, 92.7333] },
  { id: 'IN-KNY', name: 'Kanyakumari Fishing Harbour', state: 'Tamil Nadu', type: 'MINOR', coordinates: [8.0780, 77.5550] },
];
