import axios, { AxiosError } from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
});

export interface Hand {
  id: string;
  stacks: number[];
  dealer_position: number;
  small_blind_position: number;
  big_blind_position: number;
  hole_cards: string[];
  actions: string;
  board_cards: string;
  payoffs: number[];
}

export interface CreateHandRequest {
  stacks: number[];
  dealer_position: number;
  small_blind_position: number;
  big_blind_position: number;
  hole_cards: string[];
  actions: string;
  board_cards: string;
}

interface ApiErrorResponse {
  detail: string | { msg: string; type: string }[];
}

function parseErrorMessage(error: AxiosError<ApiErrorResponse>): string {
  if (!error.response) {
    if (error.code === 'ECONNREFUSED') {
      return `Cannot connect to server at ${API_URL}. Please ensure the backend is running.`;
    }
    if (error.code === 'ETIMEDOUT') {
      return 'Request timed out. The server may be overloaded.';
    }
    return 'Network error: Unable to reach the server.';
  }

  const { status, data } = error.response;

  // Handle validation errors (422)
  if (status === 422) {
    if (Array.isArray(data.detail)) {
      const errors = data.detail.map(err => err.msg).join(', ');
      return `Validation error: ${errors}`;
    }
    return `Validation error: ${data.detail || 'Invalid data format'}`;
  }

  // Handle game logic errors (400)
  if (status === 400) {
    return `Game logic error: ${data.detail || 'Invalid game action'}`;
  }

  // Handle not found (404)
  if (status === 404) {
    return 'Hand not found';
  }

  // Handle server errors (500+)
  if (status >= 500) {
    return `Server error: ${data.detail || 'Internal server error'}`;
  }

  // Generic error
  return data.detail?.toString() || `Error: ${error.message}`;
}

export async function createHand(data: CreateHandRequest): Promise<Hand> {
  try {
    // Validate data before sending
    if (!data.stacks || data.stacks.length !== 6) {
      throw new Error('Must provide exactly 6 player stacks');
    }
    if (!data.hole_cards || data.hole_cards.length !== 6) {
      throw new Error('Must provide exactly 6 hole card sets');
    }
    if (!data.actions || data.actions.trim() === '') {
      throw new Error('Actions cannot be empty');
    }

    // Validate hole cards format
    for (let i = 0; i < data.hole_cards.length; i++) {
      const cards = data.hole_cards[i];
      if (cards.length !== 4) {
        throw new Error(`Player ${i}: Invalid hole cards "${cards}". Expected format like "AsKs"`);
      }
    }

    console.log('Sending hand to API:', {
      ...data,
      api_url: API_URL,
    });

    const response = await apiClient.post<Hand>('/api/hands', data);
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const errorMessage = parseErrorMessage(error as AxiosError<ApiErrorResponse>);
      throw new Error(errorMessage);
    }
    throw new Error(`Failed to create hand: ${(error as Error).message}`);
  }
}

export async function getHands(limit: number = 100): Promise<Hand[]> {
  try {
    const response = await apiClient.get<Hand[]>('/api/hands', {
      params: { limit },
    });
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const errorMessage = parseErrorMessage(error as AxiosError<ApiErrorResponse>);
      throw new Error(errorMessage);
    }
    throw new Error('Failed to fetch hands');
  }
}

export async function getHand(id: string): Promise<Hand> {
  try {
    const response = await apiClient.get<Hand>(`/api/hands/${id}`);
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const errorMessage = parseErrorMessage(error as AxiosError<ApiErrorResponse>);
      throw new Error(errorMessage);
    }
    throw new Error('Failed to fetch hand');
  }
}

export async function checkServerHealth(): Promise<boolean> {
  try {
    await apiClient.get('/health', { timeout: 5000 });
    return true;
  } catch {
    return false;
  }
}