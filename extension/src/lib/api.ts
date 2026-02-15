import { TodayBoxResponse, ApiError } from './types';

const API_BASE_URL = 'https://solaireai.app';

/**
 * Fetch TodayBox data from the API
 * Uses credentials: 'include' to send Clerk session cookies
 *
 * @returns TodayBox data
 * @throws Error with status code if request fails
 */
export async function fetchTodayBox(): Promise<TodayBoxResponse> {
  const response = await fetch(`${API_BASE_URL}/api/todaybox`, {
    method: 'GET',
    credentials: 'include', // Send cookies for Clerk auth
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const errorData: ApiError = await response.json().catch(() => ({
      error: 'Unknown error',
    }));

    // Create error with status code for different handling
    const error = new Error(errorData.error) as Error & { status: number };
    error.status = response.status;
    throw error;
  }

  const data: TodayBoxResponse = await response.json();
  return data;
}

/**
 * Open a URL in a new tab
 * @param url The URL to open
 */
export function openInNewTab(url: string) {
  if (typeof chrome !== 'undefined' && chrome.tabs) {
    chrome.tabs.create({ url });
  } else {
    window.open(url, '_blank');
  }
}
