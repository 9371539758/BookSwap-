// frontend/src/features/book/services/upload.api.js
// Uploads a file to the backend /api/uploads endpoint using multipart/form-data
import axios from "axios";

const api = axios.create({ baseURL: "", withCredentials: true });

export const uploadCover = async (file) => {
  const fd = new FormData();
  fd.append("file", file); // field name must match multer .single('file')

  const res = await api.post("/api/uploads", fd, {
    headers: { "Content-Type": "multipart/form-data" },
  });

  // backend returns { success: true, url }
  return res.data.url;
};
