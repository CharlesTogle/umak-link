import CustomRadioGroup from '@/shared/components/CustomRadioGroup'

interface ItemStatusSelectorProps {
  value: 'missing' | 'found'
  onChange: (value: 'missing' | 'found') => void
  className?: string
  isRequired?: boolean
}

const ItemStatusSelector: React.FC<ItemStatusSelectorProps> = ({
  value,
  onChange,
  className = '',
  isRequired = false
}) => {
  return (
    <div className={`mb-4 ${className} font-default-font`}>
      <div className='w-auto'>
        <CustomRadioGroup
          label='Item Status'
          value={value}
          options={[
            { label: 'Found', value: 'found' },
            { label: 'Missing', value: 'missing' }
          ]}
          onChange={val => onChange(val as 'missing' | 'found')}
          direction='vertical'
          isRequired={isRequired}
        />
      </div>
    </div>
  )
}
export default ItemStatusSelector
