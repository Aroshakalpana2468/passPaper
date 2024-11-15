const subjects = {
  sinhala: [
    { text: 'බුද්ධ ධර්මය', code: 'buddhism' },
    { text: 'සිංහල', code: 'sinhala' },
    { text: 'ගණිතය', code: 'maths' },
    { text: 'විද්‍යාව', code: 'science' },
    { text: 'English', code: 'english' },
    { text: 'ඉතිහාසය', code: 'history' },
    { text: 'භූගෝල විද්‍යාව', code: 'geography' },
    { text: 'පුරවැසි අධ්‍යාපනය', code: 'civic' },
    { text: 'ව්‍යාපාර හා ගිණුම්කරණය', code: 'business' },
    { text: 'සෞඛ්‍ය හා ශාරීරික අධ්‍යාපනය', code: 'health' },
    { text: 'චිත්‍ර කලාව', code: 'art' },
    { text: 'නර්තනය', code: 'dancing' },
    { text: 'සංගීතය', code: 'music' },
    { text: 'නාට්‍ය හා රංග කලාව', code: 'drama' },
    { text: 'සිංහල සාහිත්‍ය', code: 'sinhala_lit' },
    { text: 'තොරතුරු හා සන්නිවේදන තාක්ෂණය', code: 'ict' }
  ],
  english: [
    { text: 'Buddhism', code: 'buddhism' },
    { text: 'Mathematics', code: 'maths' },
    { text: 'Science', code: 'science' },
    { text: 'History', code: 'history' },
    { text: 'Geography', code: 'geography' },
    { text: 'Civic Education', code: 'civic' },
    { text: 'Business & Accounting', code: 'business' },
    { text: 'Health & Physical Education', code: 'health' },
    { text: 'English', code: 'english' },
    { text: 'English Literature', code: 'english_lit' },
    { text: 'Art', code: 'art' },
    { text: 'Dancing', code: 'dancing' },
    { text: 'Music', code: 'music' },
    { text: 'Drama & Theatre', code: 'drama' },
    { text: 'French', code: 'french' },
    { text: 'Tamil', code: 'tamil' },
    { text: 'ICT', code: 'ict' }
  ]
};

const mainKeyboard = {
  reply_markup: {
    keyboard: [
      ['Grade 11'],
      ['Contact Admin']
    ],
    resize_keyboard: true
  }
};

const mediumKeyboard = {
  reply_markup: {
    inline_keyboard: [
      [
        { text: 'Sinhala Medium', callback_data: 'sinhala_medium' },
        { text: 'English Medium', callback_data: 'english_medium' }
      ]
    ]
  }
};

const generateSubjectButtons = (medium) => {
  const mediumType = medium.split('_')[0];
  const subjectList = subjects[mediumType];

  if (!subjectList) {
    throw new Error(`Invalid medium type: ${mediumType}`);
  }

  const buttons = [];
  for (let i = 0; i < subjectList.length; i += 2) {
    const row = [];
    row.push({
      text: subjectList[i].text,
      callback_data: `${medium}_${subjectList[i].code}`
    });
    
    if (i + 1 < subjectList.length) {
      row.push({
        text: subjectList[i + 1].text,
        callback_data: `${medium}_${subjectList[i + 1].code}`
      });
    }
    buttons.push(row);
  }

  return {
    reply_markup: {
      inline_keyboard: buttons
    }
  };
};

const generateYearButtons = (medium, subject) => {
  const years = [
    '2023', '2022', '2021', '2020', '2019', 
    '2018', '2017', '2016', '2015'

  ];

  const buttons = [];
  for (let i = 0; i < years.length; i += 3) {
    const row = [];
    for (let j = 0; j < 3 && i + j < years.length; j++) {
      row.push({
        text: years[i + j],
        callback_data: `${medium}_${subject}_${years[i + j]}`
      });
    }
    buttons.push(row);
  }

  return {
    reply_markup: {
      inline_keyboard: [
        ...buttons,
        [{ text: '« Back to Subjects', callback_data: medium }]
      ]
    }
  };
};

const getSubjectList = () => {
  const sinhalaList = subjects.sinhala.map(s => `${s.text} (${s.code})`).join('\n');
  const englishList = subjects.english.map(s => `${s.text} (${s.code})`).join('\n');
  return `*Sinhala Medium:*\n${sinhalaList}\n\n*English Medium:*\n${englishList}`;
};

const isValidFileKey = (key) => {
  const [medium, mediumType, subject, year] = key.split('_');
  if (medium !== 'sinhala' && medium !== 'english') return false;
  if (mediumType !== 'medium') return false;
  
  const validSubjects = [...new Set([
    ...subjects.sinhala.map(s => s.code),
    ...subjects.english.map(s => s.code)
  ])];
  
  if (!validSubjects.includes(subject)) return false;
  if (!/^20\d{2}$/.test(year)) return false;
  
  return true;
};

module.exports = {
  mainKeyboard,
  mediumKeyboard,
  generateSubjectButtons,
  generateYearButtons,
  getSubjectList,
  isValidFileKey,
  subjects
};