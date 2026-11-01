export interface Layers {
  satellite: boolean;
  buildings: boolean;
  roads: boolean;
  trees: boolean;
  campus: boolean;
  traffic: boolean;
  pedestrians: boolean;
  labels: boolean;
  night: boolean;
}

export const DEFAULT_LAYERS: Layers = {
  satellite: true,
  buildings: true,
  roads: false,
  trees: true,
  campus: true,
  traffic: true,
  pedestrians: true,
  labels: true,
  night: false,
};
