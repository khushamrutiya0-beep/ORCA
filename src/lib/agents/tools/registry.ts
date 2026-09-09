/**
 * ORCA Agent Tool Registry
 * Central allowlist of all executable tools.
 * Tools call the existing ORCA provider/API layer — no duplication of API parsing.
 * The LLM cannot execute arbitrary code — only allowlisted tools.
 */

import { ToolName, ToolResult } from '../../types';
import { executeWeatherTool } from './weatherTool';
import { executeMarineTool } from './marineTool';
import { executeRiskTool } from './riskTool';
import { executeGeospatialTool } from './geospatialTool';
import { executeLocationTool } from './locationTool';
import { executeAlertTool } from './alertTool';
import { executePfzTool } from './pfzTool';
import { executeSourceTool } from './sourceTool';
import { tideTool } from './tideTool';
import { chlorophyllTool } from './chlorophyllTool';
import { geofenceTool } from './geofenceTool';
import { productivityTool } from './productivityTool';
import { historicalTool } from './historicalTool';
import { routeTool } from './routeTool';

export interface ToolInput {
  latitude: number;
  longitude: number;
  timeIso?: string;
  message?: string;
  weatherData?: unknown;
  oceanData?: unknown;
  nearestPort?: unknown;
  timeLabel?: string;
  radiusKm?: number;
  originLat?: number;
  originLon?: number;
  originName?: string;
  destLat?: number;
  destLon?: number;
  destName?: string;
  liveSstValue?: number;
  waveHeightM?: number;
  windSpeedKmh?: number;
}

export type ToolExecutor = (input: ToolInput) => Promise<ToolResult>;

// Strict allowlist — only these tools can be called by the orchestrator
const TOOL_REGISTRY: Record<ToolName, ToolExecutor> = {
  getWeather: executeWeatherTool,
  getMarineConditions: executeMarineTool,
  assessMarineRisk: executeRiskTool,
  findNearestPort: executeGeospatialTool,
  getLocationContext: async (input: ToolInput): Promise<ToolResult> => {
    const result = await executeLocationTool({ message: input.message ?? '' });
    return {
      tool: 'getLocationContext',
      success: true,
      data: result,
      retrievedAt: new Date().toISOString(),
      sourceAttribution: 'ORCA Coastal City Reference Database',
    };
  },
  // Milestone 5 tools
  getMarineAlerts: async (input: ToolInput): Promise<ToolResult> =>
    executeAlertTool({ latitude: input.latitude, longitude: input.longitude, radiusKm: input.radiusKm }),
  getPFZ: async (input: ToolInput): Promise<ToolResult> =>
    executePfzTool({ latitude: input.latitude, longitude: input.longitude }),
  getDataSourceStatus: async (_input: ToolInput): Promise<ToolResult> =>
    executeSourceTool(),

  // Final PS Coverage tools
  getTide: async (input: ToolInput): Promise<ToolResult> =>
    tideTool.execute({ latitude: input.latitude, longitude: input.longitude }),
  getChlorophyll: async (input: ToolInput): Promise<ToolResult> =>
    chlorophyllTool.execute({ latitude: input.latitude, longitude: input.longitude }),
  getGeofences: async (input: ToolInput): Promise<ToolResult> =>
    geofenceTool.execute({ latitude: input.latitude, longitude: input.longitude, radiusKm: input.radiusKm }),
  analyzeMarineProductivity: async (input: ToolInput): Promise<ToolResult> =>
    productivityTool.execute({ latitude: input.latitude, longitude: input.longitude, liveSstValue: input.liveSstValue }),
  analyzeHistoricalMarineConditions: async (input: ToolInput): Promise<ToolResult> =>
    historicalTool.execute({ latitude: input.latitude, longitude: input.longitude }),
  findSafestRoute: async (input: ToolInput): Promise<ToolResult> =>
    routeTool.execute({
      originLat: input.originLat ?? input.latitude,
      originLon: input.originLon ?? input.longitude,
      originName: input.originName,
      destLat: input.destLat ?? (input.latitude + 2.0),
      destLon: input.destLon ?? (input.longitude + 1.5),
      destName: input.destName,
    }),
};


/**
 * Execute a single tool by name.
 * Throws if the tool name is not in the allowlist.
 */
export async function executeTool(toolName: ToolName, input: ToolInput): Promise<ToolResult> {
  const executor = TOOL_REGISTRY[toolName];
  if (!executor) {
    return {
      tool: toolName,
      success: false,
      error: `Tool "${toolName}" is not in the ORCA tool allowlist`,
      retrievedAt: new Date().toISOString(),
      sourceAttribution: 'ORCA Security Layer',
    };
  }
  try {
    return await executor(input);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return {
      tool: toolName,
      success: false,
      error: message,
      retrievedAt: new Date().toISOString(),
      sourceAttribution: 'ORCA Tool Registry',
    };
  }
}

export const ALLOWLISTED_TOOLS: ToolName[] = Object.keys(TOOL_REGISTRY) as ToolName[];
