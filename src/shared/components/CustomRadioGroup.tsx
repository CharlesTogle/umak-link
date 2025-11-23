import FormSectionHeader from '@/shared/components/FormSectionHeader'
import TextArea from './TextArea'

interface BaseOption {
  label: string
  value: string
}

interface StandardOption extends BaseOption {
  type?: never
}

interface TextOption extends BaseOption {
  type: 'text'
}

type Option = StandardOption | TextOption

interface CustomRadioGroupProps {
  value: string
  options: Option[]
  onChange: (value: string) => void
  label?: string
  className?: string
  direction?: 'horizontal' | 'vertical'
  isRequired?: boolean
  name?: string
  customText?: string
  onCustomTextChange?: (text: string) => void
  gap?: string
}

export default function CustomRadioGroup ({
  label,
  value,
  options,
  onChange,
  direction = 'horizontal',
  className = '',
  isRequired = false,
  name = `radio-group-${Math.random().toString(36).substr(2, 9)}`,
  customText = '',
  onCustomTextChange,
  gap
}: CustomRadioGroupProps) {
  const textOption = options.find(o => o.type === 'text')

  // Check if the text option is selected
  const isTextOptionSelected = textOption && value === textOption.value

  const handleRadioChange = (opt: Option) => {
    onChange(opt.value)
  }

  const handleCustomTextChange = (text: string) => {
    if (onCustomTextChange) {
      onCustomTextChange(text)
    } else {
      // Fallback to using onChange if onCustomTextChange is not provided
      onChange(text)
    }
  }

  return (
    <div className={`mb-4 ${className}`}>
      {label && <FormSectionHeader header={label} isRequired={isRequired} />}
      <div
        className={`flex ${
          direction === 'horizontal'
            ? 'flex-col space-y-2 sm:flex-row sm:justify-between sm:gap-2 sm:space-y-0'
            : 'flex-row space-x-2 gap-10'
        }`}
      >
        {options.map((opt, index) =>
          opt.type === 'text' ? (
            <label key={opt.value} className='flex flex-col'>
              <div className='flex items-center mb-1'>
                <input
                  type='radio'
                  name={name}
                  id={`${name}-${index}`}
                  className='appearance-none w-4 h-4 aspect-square border border-gray-400 rounded-full checked:border-[5px] checked:border-[#1e2b87] transition-all cursor-pointer'
                  checked={isTextOptionSelected}
                  onChange={() => handleRadioChange(opt)}
                  aria-label={opt.label}
                />
                <span className='text-md ml-2 text-gray-800 cursor-pointer'>
                  {opt.label}
                </span>
              </div>

              {isTextOptionSelected && (
                <TextArea
                  value={customText}
                  setValue={handleCustomTextChange}
                  placeholder='Enter details here. Max 80 characters'
                  maxLength={80}
                  aria-label={`${opt.label} input`}
                />
              )}
            </label>
          ) : (
            <label
              key={opt.value}
              className='flex items-center cursor-pointer select-none'
            >
              <input
                type='radio'
                name={name}
                id={`${name}-${index}`}
                className='appearance-none w-4 h-4 aspect-square border border-gray-400 rounded-full checked:border-[5px] checked:border-[#1e2b87] transition-all cursor-pointer'
                checked={value === opt.value}
                onChange={() => handleRadioChange(opt)}
                aria-label={opt.label}
              />
              <span
                className={`text-md text-[#0F172B] ${
                  gap ? `ml-${gap}` : 'ml-2!'
                } tracking-tight`}
              >
                {opt.label}
              </span>
            </label>
          )
        )}
      </div>
    </div>
  )
}
