import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as Yup from 'yup';
import axios from 'axios';

type Props = {
  step: number;
  schema: any;
  onNext: () => void;
  onBack: () => void;
  onSubmitComplete?: () => void;
};

export default function FormStep({ step, schema, onNext, onBack, onSubmitComplete }: Props) {
  const stepKey = `step${step}`;
  const fields = schema[stepKey] || [];

  const shape = fields.reduce((acc: any, f: any) => {
    const r = f.required ? Yup.string().required(`${f.label} is required`) : Yup.string().nullable();
    try {
      const re = new RegExp(f.validation);
      acc[f.id] = r.matches(re, `${f.label} is invalid`);
    } catch {
      acc[f.id] = r;
    }
    return acc;
  }, {});
  const validationSchema = Yup.object().shape(shape);

  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm({
    resolver: yupResolver(validationSchema)
  });

  const pincode = watch('pincode');
  useEffect(() => {
    if (pincode && /^[1-9][0-9]{5}$/.test(pincode)) {
      axios.get(`http://localhost:5000/pincode/${pincode}`)
        .then(r => {
          if (r.data) {
            if (r.data.state) setValue('state', r.data.state);
            if (r.data.city) setValue('city', r.data.city);
          }
        })
        .catch(() => {});
    }
  }, [pincode, setValue]);

  const onSubmit = async (data: any) => {
    if (step === 1) {
      onNext();
      return;
    }
    try {
      const res = await axios.post('http://localhost:5000/submit', data);
      alert('Submitted successfully! ID: ' + (res.data?.id ?? 'unknown'));
      onSubmitComplete && onSubmitComplete();
    } catch (err: any) {
      const info = err?.response?.data;
      if (info?.fields) {
        alert('Validation failed: ' + info.fields.join(', '));
      } else {
        alert('Submission failed');
      }
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      {fields.map((f: any) => (
        <div key={f.id} className="mb-4">
          <label className="block text-sm font-medium mb-1">{f.label}</label>
          <input
            {...register(f.id)}
            type={f.type || 'text'}
            placeholder={f.placeholder || ''}
            className="w-full border rounded p-2"
          />
          {errors[f.id] && <p className="text-red-600 text-sm mt-1">{String(errors[f.id]?.message)}</p>}
        </div>
      ))}

      <div className="flex justify-between mt-6">
        {step > 1 ? (
          <button type="button" onClick={onBack} className="px-4 py-2 bg-gray-200 rounded">Back</button>
        ) : <div />}

        <div>
          {step < 2 ? (
            <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded">Next</button>
          ) : (
            <button type="submit" className="px-4 py-2 bg-green-600 text-white rounded">Submit</button>
          )}
        </div>
      </div>
    </form>
  );
}
