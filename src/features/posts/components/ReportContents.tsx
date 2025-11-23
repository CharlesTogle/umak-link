import ImageUploadSection from '@/shared/components/ImageUpload'
import FormSectionHeader from '@/shared/components/FormSectionHeader'
import CustomRadioGroup from '@/shared/components/CustomRadioGroup'
import TextArea from '@/shared/components/TextArea'

interface ReportContentsProps {
  concern: string
  setConcern: React.Dispatch<React.SetStateAction<string>>
  additionalDetails: string
  setAdditionalDetails: React.Dispatch<React.SetStateAction<string>>
  image: File | null
  setImage: React.Dispatch<React.SetStateAction<File | null>>
  customConcernText: string
  setCustomConcernText: React.Dispatch<React.SetStateAction<string>>
  reviewed: boolean
  setReviewed: React.Dispatch<React.SetStateAction<boolean>>
}

export default function ReportContents ({
  concern,
  setConcern,
  additionalDetails,
  setAdditionalDetails,
  image,
  setImage,
  customConcernText,
  setCustomConcernText,
  reviewed,
  setReviewed
}: ReportContentsProps) {
  const handleCustomTextChange = (text: string) => {
    setCustomConcernText(text)
  }

  return (
    <div className='mt-4'>
      <CustomRadioGroup
        label='Select Concern'
        value={concern}
        options={[
          {
            label: 'This is item is rightfully mine',
            value: 'This item is rightfully mine'
          },
          {
            label:
              'I personally know the rightful owner of this item and they have not claimed it yet.',
            value:
              'I personally know the rightful owner of this item and they have not claimed it yet.'
          },
          { label: 'Others', value: 'Others', type: 'text' }
        ]}
        onChange={val => {
          setConcern(val)
          if (val !== 'Others') {
            setCustomConcernText('')
          }
        }}
        customText={customConcernText}
        onCustomTextChange={handleCustomTextChange}
        direction='horizontal'
        isRequired={true}
      />
      <FormSectionHeader header='Additional Details' isRequired={false} />
      <TextArea
        value={additionalDetails}
        setValue={setAdditionalDetails}
        maxLength={150}
        placeholder='Enter additional details (optional). Max 150 characters'
      />
      <ImageUploadSection
        image={image}
        onImageChange={setImage}
        isRequired={false}
        label='Proof of Report'
      />
      <label>
        <FormSectionHeader header='Review' isRequired={true} />
        <div className='flex items-start gap-1 mb-2'>
          <input
            type='checkbox'
            checked={reviewed}
            onChange={e => setReviewed(e.target.checked)}
            className='scale-110 translate-y-0.5'
          />
          I hereby affirm that all information provided is true and correct. I
          understand that any falsification of statements or documents is a
          serious offense under the University of Makati’s Code of Conduct and
          may result in disciplinary action.
        </div>
      </label>
    </div>
  )
}
