import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import axios from 'axios';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 5000;
const schemaPath = path.join(process.cwd(), 'udyam_schema.json');

app.get('/schema', (req, res) => {
  try {
    const schema = JSON.parse(fs.readFileSync(schemaPath, 'utf-8'));
    res.json(schema);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Schema not found' });
  }
});

app.get('/pincode/:pin', async (req, res) => {
  const { pin } = req.params;
  if (!/^[1-9][0-9]{5}$/.test(pin)) return res.status(400).json({ error: 'Invalid pincode' });
  try {
    const r = await axios.get(`https://api.postalpincode.in/pincode/${pin}`);
    const d = r.data?.[0];
    if (!d || d.Status !== 'Success') return res.status(404).json({ error: 'Pincode not found' });
    const po = d.PostOffice?.[0] || {};
    res.json({ state: po.State || '', city: po.District || po.Block || '' });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Lookup failed' });
  }
});

const validators = {
  aadhaar: v => /^[0-9]{12}$/.test(v || ''),
  pan: v => /^[A-Za-z]{5}[0-9]{4}[A-Za-z]{1}$/.test(v || ''),
  name: v => /^[A-Za-z ]{3,}$/.test(v || ''),
  mobile: v => /^[6-9][0-9]{9}$/.test(v || ''),
  pincode: v => /^[1-9][0-9]{5}$/.test(v || ''),
  state: v => (v || '').length >= 2,
  city: v => (v || '').length >= 2
};

app.post('/submit', async (req, res) => {
  try {
    const { aadhaar, name, mobile, pan, pincode, state, city } = req.body || {};
    const checks = [
      ['aadhaar', validators.aadhaar(aadhaar)],
      ['name', validators.name(name)],
      ['mobile', validators.mobile(mobile)],
      ['pan', validators.pan(pan)],
      ['pincode', validators.pincode(pincode)],
      ['state', validators.state(state)],
      ['city', validators.city(city)]
    ];
    const invalid = checks.filter(c => !c[1]).map(c => c[0]);
    if (invalid.length) return res.status(400).json({ error: 'Validation failed', fields: invalid });

    const saved = await prisma.registration.create({
      data: { aadhaar, name, mobile, pan, pincode, state, city }
    });
    res.json({ ok: true, id: saved.id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Save failed' });
  }
});

app.get('/', (req, res) => res.json({ ok: true }));

app.listen(PORT, () => console.log(`API: http://localhost:${PORT}`));
