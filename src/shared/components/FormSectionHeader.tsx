import React from 'react'

interface FormSectionHeaderProps {
  header: React.ReactNode
  isRequired?: boolean
  className?: string
}

const FormSectionHeader: React.FC<FormSectionHeaderProps> = ({
  header,
  isRequired = false,
  className = ''
}) => {
  return (
    <p
      className={`font-default-font text-xl! mb-2 text-slate-900 font-extrabold! flex items-center ${className}`}
    >
      {header}
      {isRequired && (
        <span className='text-umak-red font-default-font text-sm font-normal ml-2'>
          (required)
        </span>
      )}
    </p>
  )
}

export default FormSectionHeader
