export const FAQData = [
  {
    name: 'Security & Privacy',
    items: [
      {
        question: 'How do you make sure the right person claims an item?',
        content: (
          <>
            <p className='mb-2 mx-4'>
              To protect your belongings, our staff are trained to verify
              ownership during the claiming process. You will be asked to
              describe specific, non-visible details about your item (for
              example, "What is the phone's wallpaper?" or "What is the last
              name on the ID card in the wallet?").
            </p>
            <p className='mb-2 mx-4'>
              For high-value items (like electronics or wallets), our staff may
              ask for additional proof of ownership, such as a photo of you with
              the item (if you have one) or unlocking the device.
            </p>
          </>
        )
      },
      {
        question:
          'What about my privacy? What if someone posts a photo of my lost ID or wallet?',
        content: (
          <>
            <p className='mb-2 mx-4'>
              Protecting your personal information is our highest priority. We
              have a multi-layered system to handle this:
            </p>
            <ul className='mt-8 mx-4'>
              <li>
                <strong>Mandatory Post Moderation:</strong> Our staff must
                review and approve all new "found item" posts. Any post with a
                photo that exposes sensitive, personally identifiable
                information (PII) like names, ID numbers, or addresses will be
                rejected.
              </li>
              <li>
                <strong>Finder Responsibility:</strong> We require all users to
                cover, blur, or otherwise obscure any personal information in a
                photo before they can upload it.
              </li>
            </ul>
          </>
        )
      },
      {
        question: 'How do you prevent fraud or system abuse?',
        content: (
          <>
            <p className='mb-2 mx-4'>
              Community participation. If you ever see a claim on the platform
              that you suspect is fraudulent, you can report it directly through
              the app. Our staff will investigate every report.
            </p>
          </>
        )
      }
    ]
  }
]

// <FAQAccordion categories={data} />
