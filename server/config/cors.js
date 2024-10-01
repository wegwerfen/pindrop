import cors from 'cors';
import supertokens from "supertokens-node";

export default function configureCors(app) {
  const allowedOrigins = process.env.WEBSITE_DOMAIN.split(',').map(origin => origin.trim());
  app.use(cors({
    origin: allowedOrigins,
    allowedHeaders: ["content-type", ...supertokens.getAllCORSHeaders()],
    credentials: true,
  }));
}