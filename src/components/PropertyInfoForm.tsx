import { useState } from 'react';
import type { PropertyInfo as PropertyInfoType } from '../types';
import { BARANGAYS } from '../data/transactions';
import NavButtons from './NavButtons';

interface PropertyInfoFormProps {
  data: PropertyInfoType;
  onChange: (data: PropertyInfoType) => void;
  onBack: () => void;
  onNext: () => void;
}

export default function PropertyInfoForm({
  data,
  onChange,
  onBack,
  onNext,
}: PropertyInfoFormProps) {
  const [localTaxDec, setLocalTaxDec] = useState('');

  const update = (field: keyof PropertyInfoType, value: string | string[]) =>
    onChange({ ...data, [field]: value });

  const addTaxDec = () => {
    if (localTaxDec.trim()) {
      onChange({ ...data, taxDeclarations: [...data.taxDeclarations, localTaxDec] });
      setLocalTaxDec('');
    }
  };

  const updateTaxDec = (index: number, value: string) => {
    const updated = [...data.taxDeclarations];
    updated[index] = value;
    onChange({ ...data, taxDeclarations: updated });
  };

  const removeTaxDec = (index: number) => {
    onChange({
      ...data,
      taxDeclarations: data.taxDeclarations.filter((_, i) => i !== index),
    });
  };

  const isValid = data.ownerName.trim() !== '' && data.taxDeclarations.length > 0 &&
    data.taxDeclarations.some((td) => td.trim() !== '') && data.barangay !== '';

  return (
    <div>
      <p className="text-xs text-red-500 mb-4">* Required Fields</p>

      <div className="space-y-5">
        {/* Owner's Name */}
        <div>
          <input
            type="text"
            value={data.ownerName}
            onChange={(e) => update('ownerName', e.target.value)}
            className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-[#1a3c6e] focus:border-[#1a3c6e] placeholder-gray-400 italic"
            placeholder="Owner's Name *"
          />
        </div>

        {/* Tax Declaration Number */}
        <div>
          <div className="flex gap-2 items-center">
            <input
              type="text"
              value={localTaxDec}
              onChange={(e) => setLocalTaxDec(e.target.value)}
              className="flex-1 px-3 py-2.5 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-[#1a3c6e] focus:border-[#1a3c6e] placeholder-gray-400 italic"
              placeholder="Tax Declaration Number *"
              onKeyDown={(e) => e.key === 'Enter' && addTaxDec()}
            />
            <button
              onClick={addTaxDec}
              className="px-4 py-2.5 bg-[#1a3c6e] text-white text-sm font-semibold rounded hover:bg-[#152f55] transition-colors whitespace-nowrap"
            >
              Add Tax Dec
            </button>
          </div>
          <p className="text-xs text-gray-500 italic mt-1">(ex. F-001-12345) maximum of 200 characters</p>
        </div>

        {/* Tax Declaration Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gradient-to-r from-teal-400 to-cyan-400">
                <th className="p-2.5 text-sm font-bold text-white w-10">#</th>
                <th className="p-2.5 text-sm font-bold text-white">Tax Declaration No.</th>
                <th className="p-2.5 text-sm font-bold text-white text-center w-20">Action</th>
              </tr>
            </thead>
            <tbody>
              {data.taxDeclarations.length > 0 ? (
                data.taxDeclarations.map((td, i) => (
                  <tr key={i} className="border-b border-gray-200">
                    <td className="p-2.5 text-sm text-gray-400 text-center">{i + 1}</td>
                    <td className="p-2.5">
                      <input
                        type="text"
                        value={td}
                        onChange={(e) => updateTaxDec(i, e.target.value)}
                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-[#1a3c6e] focus:border-[#1a3c6e]"
                        placeholder="--"
                      />
                    </td>
                    <td className="p-2.5 text-center">
                      <button
                        onClick={() => removeTaxDec(i)}
                        className="text-red-500 hover:text-red-700 text-sm font-medium"
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td className="p-2.5 text-sm text-gray-400 text-center">-</td>
                  <td className="p-2.5 text-sm text-gray-400">--</td>
                  <td className="p-2.5 text-sm text-gray-400 text-center">--</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Title No. */}
        <div>
          <input
            type="text"
            value={data.titleNo}
            onChange={(e) => update('titleNo', e.target.value)}
            className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-[#1a3c6e] focus:border-[#1a3c6e] placeholder-gray-400 italic"
            placeholder="Title No. (T.C.T./C.C.T.)"
          />
          <p className="text-xs text-gray-500 italic mt-1">Required if Tax Declaration Number is not available.</p>
        </div>

        {/* Lot No / Block No / Street */}
        <div className="flex gap-3">
          <div className="flex-1">
            <input
              type="text"
              value={data.lotNo}
              onChange={(e) => update('lotNo', e.target.value)}
              className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-[#1a3c6e] focus:border-[#1a3c6e] placeholder-gray-400 italic"
              placeholder="Lot No."
            />
          </div>
          <div className="flex-1">
            <input
              type="text"
              value={data.blockNo}
              onChange={(e) => update('blockNo', e.target.value)}
              className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-[#1a3c6e] focus:border-[#1a3c6e] placeholder-gray-400 italic"
              placeholder="Block No."
            />
          </div>
          <div className="flex-1">
            <input
              type="text"
              value={data.streetName}
              onChange={(e) => update('streetName', e.target.value)}
              className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-[#1a3c6e] focus:border-[#1a3c6e] placeholder-gray-400 italic"
              placeholder="Street Name"
            />
          </div>
        </div>

        {/* Barangay */}
        <div>
          <select
            value={data.barangay}
            onChange={(e) => update('barangay', e.target.value)}
            className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-[#1a3c6e] focus:border-[#1a3c6e] bg-white text-gray-700"
          >
            <option value="">-- Please Select Barangay --</option>
            {BARANGAYS.map((b) => (
              <option key={b} value={b}>{b}</option>
            ))}
          </select>
          <p className="text-xs text-gray-500 italic mt-1">Barangay *</p>
        </div>
      </div>

      <NavButtons
        onBack={onBack}
        onNext={onNext}
        nextDisabled={!isValid}
      />
    </div>
  );
}
