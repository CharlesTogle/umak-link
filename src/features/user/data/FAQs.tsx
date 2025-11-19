export const FAQData = [
  {
    name: 'Category Name 1',
    items: [
      {
        question: 'Accordion header',
        content: (
          <>
            <p>
              At vero eos et accusamus et iusto odio dignissimos ducimus qui
              blanditiis praesentium voluptatum deleniti.
            </p>
            <ol style={{ marginTop: 8 }}>
              <li>Instruction</li>
              <li>Instruction two</li>
              <li>Instruction three</li>
              <li>Instruction 4</li>
            </ol>
          </>
        )
      },
      { question: 'Accordion header', content: 'Answer text here.' },
      { question: 'Accordion header', content: 'Answer text here.' }
    ]
  }
]

// <FAQAccordion categories={data} />
