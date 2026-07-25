import axios from "axios";
import FormData from "form-data";
import { env } from "../../utils/env.js";

export const extractInventorySlip = async (file: Express.Multer.File) => {
  const form = new FormData();

  form.append("file", file.buffer, {
    filename: file.originalname,
    contentType: file.mimetype,
  });

  const response = await axios.post(`${env.AI_SERVICE_URL}/extract`, form, {
    headers: form.getHeaders(),
  });

  return response.data;
};
