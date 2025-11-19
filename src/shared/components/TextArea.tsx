interface TextAreaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  value: string
  setValue: (value: string) => void
  maxLength?: number
}

export default function TextArea (props: TextAreaProps) {
  const { setValue, maxLength, value, className, ...rest } = props

  return (
    <textarea
      {...rest}
      className={`${className} border-2 max-h-25 border-black rounded-xs py-1 px-2 w-full 
                  focus:border-2-umak-blue focus:outline-none font-default-font 
                  text-base overflow-hidden`}
      value={value}
      placeholder={`Max ${maxLength || 150} characters`}
      maxLength={maxLength || 150}
      onChange={e => {
        setValue(e.target.value)
        const target = e.target
        target.style.height = 'auto'
        target.style.height = target.scrollHeight + 'px'
      }}
    />
  )
}
