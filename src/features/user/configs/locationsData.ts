interface Level2 {
  name: string
  level3: string[]
}

interface Level1 {
  name: string
  level2: Level2[]
}

export const locationsData: Level1[] = [
  {
    name: 'HPSB',
    level2: [
      {
        name: '1 Floor',
        level3: ['Lobby', 'Parking Area']
      },
      {
        name: '2 Floor',
        level3: ['Parking Area']
      },
      {
        name: '3 Floor',
        level3: ['Parking Area']
      },
      {
        name: '4 Floor',
        level3: ['Parking Area', 'Bridgeway']
      },
      {
        name: '5 Floor',
        level3: [
          'Room 501',
          'Room 502',
          'Room 503',
          'Room 504',
          'Room 505',
          'Room 506',
          'Room 507',
          'Room 508',
          'Room 509',
          'Room 510',
          'Room 511',
          'Room 512',
          'Room 513',
          'CR Left (5F)',
          'CR Right (5F)'
        ]
      },
      {
        name: '6 Floor',
        level3: [
          'Room 601',
          'Room 602',
          'Room 603',
          'Room 604',
          'Room 605',
          'Room 606',
          'Room 607',
          'Room 608',
          'Room 609',
          'Room 610',
          'Room 611',
          'Room 612',
          'Room 613',
          'CR Left (6F)',
          'CR Right (6F)'
        ]
      },
      {
        name: '7 Floor',
        level3: [
          'Room 701',
          'Room 702',
          'Room 703',
          'Room 704',
          'Room 705',
          'Room 706',
          'Room 707',
          'Room 708',
          'Room 709',
          'Room 710',
          'Room 711',
          'Room 712',
          'Room 713',
          'CR Left (7F)',
          'CR Right (7F)'
        ]
      },
      {
        name: '8 Floor',
        level3: [
          'Room 801',
          'Room 802',
          'Room 803',
          'Room 804',
          'Room 805',
          'Room 806',
          'Room 807',
          'Room 808',
          'Room 809',
          'Room 810',
          'Room 811',
          'Room 812',
          'Room 813',
          'CR Left (8F)',
          'CR Right (8F)'
        ]
      },
      {
        name: '9 Floor',
        level3: [
          'Room 901',
          'Room 902',
          'Room 903',
          'Room 904',
          'Room 905',
          'Room 906',
          'Room 907',
          'Room 908',
          'Room 909',
          'Room 910',
          'Room 911',
          'Room 912',
          'Room 913',
          'CR Left (9F)',
          'CR Right (9F)'
        ]
      },
      {
        name: '10 Floor',
        level3: [
          'Room 1001',
          'Room 1002',
          'Room 1003',
          'Room 1004',
          'Room 1005',
          'Room 1006',
          'Room 1007',
          'Room 1008',
          'Room 1009',
          'Room 1010',
          'Room 1011',
          'Room 1012',
          'Room 1013',
          'CR Left (10F)',
          'CR Right (10F)'
        ]
      },
      {
        name: '11 Floor',
        level3: [
          'Gym Area',
          'Gym Female CR',
          'Gym Male CR',
          'Gym Faculty',
          'Dance Room',
          'Right Male CR',
          'Right Female CR',
          'Cafeteria Area',
          'Clinic Room',
          'Physical Therapy Room'
        ]
      },
      {
        name: '12 Floor',
        level3: [
          'Volleyball Court',
          'Basketball Court',
          'Volleyball Court Female CR',
          'Basketball Court Female CR',
          'Volleyball Court Male CR',
          'Basketball Court Male CR'
        ]
      }
    ]
  },
  {
    name: 'Academic Building 1',
    level2: Array.from({ length: 3 }, (_, i) => ({
      name: `${i + 1} Floor`,
      level3: ['Not Applicable']
    }))
  },
  {
    name: 'Academic Building 2',
    level2: Array.from({ length: 3 }, (_, i) => ({
      name: `${i + 1} Floor`,
      level3: ['Not Applicable']
    }))
  },
  {
    name: 'Academic Building 3',
    level2: Array.from({ length: 3 }, (_, i) => ({
      name: `${i + 1} Floor`,
      level3: ['Not Applicable']
    }))
  },
  {
    name: 'Admin Building',
    level2: [
      { name: 'Basement', level3: ['Not Applicable'] },
      ...Array.from({ length: 5 }, (_, i) => ({
        name: `${i + 1} Floor`,
        level3: ['Not Applicable']
      }))
    ]
  },
  {
    name: 'Oval Guard side Bleachers',
    level2: [
      {
        name: 'Stadium Area',
        level3: ['Red Bleachers', 'Green Bleachers', 'Blue Bleachers']
      }
    ]
  },
  {
    name: 'Oval Fort side Bleachers',
    level2: [
      {
        name: 'Stadium Area',
        level3: ['Red Bleachers', 'Green Bleachers', 'Blue Bleachers']
      }
    ]
  },
  {
    name: 'Oval JP Rizal side Bleachers',
    level2: [
      {
        name: 'Stadium Area',
        level3: ['Red Bleachers', 'Green Bleachers', 'Blue Bleachers']
      }
    ]
  },
  {
    name: 'Oval Right side Bleachers',
    level2: [
      {
        name: 'Stadium Area',
        level3: ['Red Bleachers', 'Green Bleachers', 'Blue Bleachers']
      }
    ]
  }
]

export type { Level1, Level2 }
