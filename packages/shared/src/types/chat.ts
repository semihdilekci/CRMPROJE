export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface ChartData {
  chartType: 'bar' | 'line' | 'pie' | 'donut' | 'area' | 'stackedBar' | 'composed';
  title: string;
  labels: string[];
  data: number[] | { [key: string]: number[] };
  description?: string;
}

export interface TableData {
  columns: string[];
  rows: (string | number)[][];
}

export interface ChatQueryResponse {
  text: string;
  charts?: ChartData[];
  tables?: TableData[];
  exportId?: string;
  exportDescription?: string;
}
