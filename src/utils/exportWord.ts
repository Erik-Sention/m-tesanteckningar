import { Document, Packer, Paragraph, TextRun } from 'docx';

export function exportSummaryToWord(summary: string) {
  const doc = new Document({
    sections: [
      {
        properties: {},
        children: [
          new Paragraph({
            children: [
              new TextRun({
                text: 'Sammanfattning',
                bold: true,
                size: 32,
                color: '4B2991', // Mörklila för hög kontrast
              }),
            ],
            spacing: { after: 300 },
          }),
          ...summary.split('\n').map(line =>
            new Paragraph({
              children: [
                new TextRun({
                  text: line,
                  color: '000000',
                  size: 24,
                }),
              ],
            })
          ),
        ],
      },
    ],
  });

  Packer.toBlob(doc).then(blob => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sammanfattning-${new Date().toISOString().slice(0, 10)}.docx`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  });
} 