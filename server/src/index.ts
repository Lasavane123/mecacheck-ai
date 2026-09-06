import "dotenv/config";
import express from "express";
import helmet from "helmet";
import cors from "cors";
import rateLimit from "express-rate-limit";
import diagnosisRouter from "./routes/diagnosis";

const app = express();

app.use(helmet());
app.use(cors()); // TODO étape "sécurité" : restreindre aux origines de l'app en prod
app.use(express.json({ limit: "50kb" })); // limite la taille des messages (section 33)

// Rate limiting global pour maîtriser les coûts de l'API IA (section 33)
const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: Number(process.env.RATE_LIMIT_MAX_REQUESTS_PER_MIN ?? 20),
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Trop de requêtes. Merci de réessayer dans un instant." },
});
app.use(limiter);

app.get("/health", (_req, res) => res.json({ status: "ok" }));

app.use("/api/diagnosis", diagnosisRouter);

// Gestionnaire d'erreurs générique : ne jamais exposer d'erreur technique brute (section 32)
app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err);
  res.status(500).json({ error: "Une erreur inattendue est survenue. Merci de réessayer." });
});

const port = Number(process.env.PORT ?? 3000);
app.listen(port, () => {
  console.log(`MecaCheck AI backend en écoute sur le port ${port}`);
});
