import React, { useEffect, useState } from 'react';
import FormStep from './components/FormStep';
import axios from 'axios';

export default function App() {
  const [step, setStep] = useState<number>(1);
  const [schema, setSchema] = useState<any | null>(null);

  useEffect(() => {
    axios.get('http://localhost:5000/schema')
      .then(r => setSchema(r.data))
      .catch(() => import('./udyam_schema.json').then(m => setSchema(m)));
  }, []);

  if (!schema) return <div className="p-8 text-center">Loading schema...</div>;

  return (
    <div className="min-h-screen flex items-start justify-center py-12">
      <div className="w-full max-w-2xl bg-white shadow-md rounded-lg p-6">
        <h1 className="text-2xl font-semibold mb-4">Udyam Registration — Demo</h1>
        <div className="mb-4">
          <div className="flex items-center gap-4">
            <div className={`flex-1 ${step===1 ? 'font-bold' : 'text-slate-500'}`}>Step 1 — Aadhaar</div>
            <div className={`flex-1 ${step===2 ? 'font-bold' : 'text-slate-500'}`}>Step 2 — PAN & Address</div>
          </div>
          <div className="h-2 mt-3 bg-slate-200 rounded">
            <div className={`h-2 rounded bg-blue-500`} style={{ width: step===1 ? '45%' : '100%' }} />
          </div>
        </div>

        <FormStep
          step={step}
          schema={schema}
          onNext={() => setStep(s => Math.min(2, s + 1))}
          onBack={() => setStep(s => Math.max(1, s - 1))}
          onSubmitComplete={() => { /* show success UI if desired */ }}
        />
      </div>
    </div>
  );
}
