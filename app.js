const express = require('express');
const multer = require('multer');
const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');
const path = require('path');
const rulesValidator = require('./rulesValidator');

const app = express();
const upload = multer({ storage: multer.memoryStorage() });

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

// POST /upload - handle file upload, parse, validate
app.post('/upload', upload.single('paper'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ valid: false, errors: ['لم يتم رفع أي ملف'] });
  }

  const ext = path.extname(req.file.originalname).toLowerCase();
  let textContent = '';

  try {
    if (ext === '.pdf') {
      const pdfData = await pdfParse(req.file.buffer);
      textContent = pdfData.text;
    } else if (ext === '.docx') {
      const result = await mammoth.extractRawText({ buffer: req.file.buffer });
      textContent = result.value;
    } else {
      return res.status(400).json({ valid: false, errors: ['صيغة الملف غير مدعومة. يرجى رفع ملف PDF أو DOCX'] });
    }
  } catch (e) {
    return res.status(500).json({ valid: false, errors: ['فشل في قراءة محتوى الملف'] });
  }

  // Here you would ideally parse the textContent and extract all required paperData fields.
  // For demonstration, we'll simulate some extracted data.
  // In a real app, you need to implement proper parsing logic.

  const paperData = {
    language: textContent.includes('العربية') ? 'Arabic' : 'Other',
    word_count: textContent.trim().split(/\s+/).length,
    files: [ext === '.pdf' ? 'pdf' : 'docx'],
    page_size: 'A4', // assume A4 for demo
    margins: 'medium',
    indent: 1.27,
    line_spacing: 'single',
    has_abstract: /ملخص/.test(textContent),
    has_keywords: /الكلمات المفتاحية/.test(textContent),
    fonts: {
      body: 'Simplified Arabic 14',
      title: 'Simplified Arabic 18 Bold',
      subtitle: 'Simplified Arabic 16 Bold'
    },
    footnotes: {
      auto_numbering: true
    },
    references_style: 'Chicago',
    submission_date: new Date().toISOString().split('T')[0],
    figures: {
      all_have_captions_and_sources: true
    },
    presentation_time: 15,
    non_standard_fonts_attached: true,
    author: {
      degree: 'Master',
      name_titles: false,
      cv_format: 'pdf'
    }
  };

  const validationResult = await rulesValidator.check(paperData);
  res.json(validationResult);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));