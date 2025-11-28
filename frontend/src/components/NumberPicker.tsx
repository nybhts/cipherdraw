import { useState } from 'react';

interface NumberPickerProps {
  onNumbersSelected: (numbers: [number, number, number]) => void;
  disabled?: boolean;
}

export function NumberPicker({ onNumbersSelected, disabled = false }: NumberPickerProps) {
  const [numbers, setNumbers] = useState<[number, number, number]>([1, 1, 1]);
  const availableNumbers = [1, 2, 3, 4, 5, 6, 7, 8, 9];

  const handleNumberChange = (index: number, value: number) => {
    const newNumbers = [...numbers] as [number, number, number];
    newNumbers[index] = value;
    setNumbers(newNumbers);
    onNumbersSelected(newNumbers);
  };

  const handleRandomize = () => {
    const randomNumbers: [number, number, number] = [
      Math.floor(Math.random() * 9) + 1,
      Math.floor(Math.random() * 9) + 1,
      Math.floor(Math.random() * 9) + 1,
    ];
    setNumbers(randomNumbers);
    onNumbersSelected(randomNumbers);
  };

  return (
    <div className="bg-gray-800 rounded-xl p-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-bold text-white">Pick Your Numbers</h3>
        <button
          onClick={handleRandomize}
          disabled={disabled}
          className="px-4 py-2 bg-primary-600 hover:bg-primary-700 disabled:bg-gray-600 rounded-lg text-white text-sm transition-colors"
        >
          Randomize
        </button>
      </div>

      <p className="text-gray-400 text-sm mb-6">
        Select 3 numbers between 1-9. Your numbers will be encrypted using FHE.
      </p>

      <div className="flex justify-center gap-8 mb-6">
        {[0, 1, 2].map((index) => (
          <div key={index} className="flex flex-col items-center">
            <label className="text-gray-400 text-sm mb-2">Number {index + 1}</label>
            <div className="relative">
              <select
                value={numbers[index]}
                onChange={(e) => handleNumberChange(index, parseInt(e.target.value))}
                disabled={disabled}
                className="appearance-none w-20 h-20 bg-gray-700 border-2 border-primary-500 rounded-xl text-center text-3xl font-bold text-white cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary-400 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {availableNumbers.map((num) => (
                  <option key={num} value={num}>
                    {num}
                  </option>
                ))}
              </select>
            </div>
          </div>
        ))}
      </div>

      <div className="flex justify-center gap-4">
        <div className="flex items-center gap-2 text-gray-400 text-sm">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
          <span>Numbers encrypted with FHE</span>
        </div>
      </div>
    </div>
  );
}
