import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
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

export async function createHand(data: CreateHandRequest): Promise<Hand> {
  try {
    console.log('Creating hand with data:', data);
    const response = await apiClient.post<Hand>('/api/hands', data);
    console.log('Hand created successfully:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error creating hand:', error);
    if (axios.isAxiosError(error)) {
      const errorDetail = error.response?.data?.detail || error.message || 'Failed to create hand';
      throw new Error(errorDetail);
    }
    throw new Error('Failed to create hand');
  }
}

export async function getHands(): Promise<Hand[]> {
  try {
    console.log('Fetching hands from:', `${API_URL}/api/hands`);
    const response = await apiClient.get<Hand[]>('/api/hands');
    console.log('Hands fetched successfully, count:', response.data.length);
    return response.data;
  } catch (error) {
    console.error('Error fetching hands:', error);
    
    if (axios.isAxiosError(error)) {
      console.error('Axios error details:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        message: error.message
      });
      
      if (error.code === 'ECONNREFUSED') {
        throw new Error(`Cannot connect to server at ${API_URL}. Make sure the backend is running.`);
      }
      
      if (error.response?.status === 404) {
        throw new Error('API endpoint not found. Check if the backend routes are configured correctly.');
      }
      
      const errorMessage = error.response?.data?.detail || error.message || 'Failed to fetch hands';
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
    console.error('Error fetching hand:', error);
    if (axios.isAxiosError(error)) {
      const errorMessage = error.response?.data?.detail || error.message || 'Failed to fetch hand';
      throw new Error(errorMessage);
    }
    throw new Error('Failed to fetch hand');
  }
}