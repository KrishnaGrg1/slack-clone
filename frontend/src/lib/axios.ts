import axios from 'axios'

const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  withCredentials: true, // Send cookies with requests
})

export function getApiErrorMessage(
  error: unknown,
  fallback = 'Something went wrong',
): string {
  const responseData = (error as any)?.response?.data
  const apiMessage =
    responseData?.error?.details ||
    responseData?.message ||
    responseData?.error?.message ||
    (error as any)?.message ||
    fallback

  return apiMessage || fallback
}

export default axiosInstance
