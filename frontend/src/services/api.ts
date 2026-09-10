export interface ColabHealthResponse {
  status: string;
  gpu_name?: string;
  vram_allocated_gb?: number;
  vram_total_gb?: number;
  model_ready?: boolean;
}

export class ColabApiService {
  private baseUrl: string = '';

  constructor(url: string = '') {
    this.setUrl(url);
  }

  setUrl(url: string) {
    // Strip trailing slash
    this.baseUrl = url.trim().replace(/\/+$/, '');
  }

  getUrl(): string {
    return this.baseUrl;
  }

  async checkHealth(): Promise<ColabHealthResponse> {
    if (!this.baseUrl) {
      throw new Error('Colab backend URL is not configured.');
    }

    try {
      const response = await fetch(`${this.baseUrl}/health`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'ngrok-skip-browser-warning': 'true', // Needed if ngrok free tier is used
        },
      });

      if (!response.ok) {
        throw new Error(`Server returned HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (err: any) {
      throw new Error(`Could not connect to Colab backend: ${err.message}`);
    }
  }

  async generate3DModel(imageBlob: Blob, filename: string = 'input.png'): Promise<ArrayBuffer> {
    if (!this.baseUrl) {
      throw new Error('Colab backend URL is not configured.');
    }

    const formData = new FormData();
    formData.append('image', imageBlob, filename);

    const response = await fetch(`${this.baseUrl}/api/generate`, {
      method: 'POST',
      headers: {
        'ngrok-skip-browser-warning': 'true',
      },
      body: formData,
    });

    if (!response.ok) {
      let errDetail = response.statusText;
      try {
        const errJson = await response.json();
        if (errJson.detail) errDetail = errJson.detail;
      } catch (_) {}
      throw new Error(`Colab 3D Generation failed [${response.status}]: ${errDetail}`);
    }

    return await response.arrayBuffer();
  }
}

export const colabApi = new ColabApiService();
