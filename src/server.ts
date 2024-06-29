import express from "express";
import { database } from "./database";
import { auth } from "./routes/auth";
import { targets } from "./routes/targets";
import { checkToken } from "./routes/checkToken";
import multer from "multer";
import { checkVerifiedEmail } from "./routes/checkVerifiedEmail";
import dotenv from "dotenv";

dotenv.config();

const app = express();

const PORT = process.env.port || 3000;

app.use(express.json());

app.use('/auth', auth);


app.use(checkToken);
app.use(checkVerifiedEmail);

app.use(express.static('public'))

app.use("/targets", targets);

const upload = multer({ dest: 'uploads/' });

app.listen(PORT, () => {
    database.authenticate().then(() => {
        console.log('Database connected');
    });
    console.log(`Server running on port ${PORT}`);
})