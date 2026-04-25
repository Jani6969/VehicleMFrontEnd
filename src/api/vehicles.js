const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || '/api').replace(/\/$/, '');

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
    ...options,
  });

  let payload = null;
  try {
    payload = await response.json();
  } catch (error) {
    payload = null;
  }

  if (!response.ok) {
    const errorMessage =
      payload?.message ||
      payload?.errors?.map((item) => item.message || item).join(', ') ||
      'Request failed';
    throw new Error(errorMessage);
  }

  return payload;
}

export function getHealth() {
  return request('/health');
}

export function listVehicles(params = {}) {
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && String(value).trim() !== '') {
      searchParams.set(key, value);
    }
  });

  const query = searchParams.toString();
  return request(`/vehicles${query ? `?${query}` : ''}`);
}

export function getVehicleById(id) {
  return request(`/vehicles/${id}`);
}

export function createVehicle(vehicle) {
  return request('/vehicles', {
    method: 'POST',
    body: JSON.stringify(vehicle),
  });
}

export function updateVehicle(id, vehicle) {
  return request(`/vehicles/${id}`, {
    method: 'PUT',
    body: JSON.stringify(vehicle),
  });
}

export function deleteVehicle(id) {
  return request(`/vehicles/${id}`, {
    method: 'DELETE',
  });
}
