import { fillCharacterbogen } from './tools/fill-characterbogen.js';
import { PDFDocument } from 'pdf-lib';
import { promises as fs } from 'node:fs';

const outputPath = './tmp/lasse-validation.pdf';
const fieldNames = ['Talent_FW_3', 'Talent_FW_5', 'Talent_FW_10', 'Talent_FW_19', 'Talent_FW_27', 'Talent_FW_35', 'Talent_FW_43', 'Talent_FW_48', 'Talent_FW_51'];
const talentNames = ['Klettern', 'Kraftakt', 'Sinnesschärfe', 'Gassenwissen', 'Orientierung', 'Kriegskunst', 'Alchimie', 'Heilkunde Krankheiten', 'Holzbearbeitung'];

const result = await fillCharacterbogen({ characterPath: './chars/lasse.json', outputPath });
const pdfBytes = await fs.readFile(result.outputPath);
const pdfDoc = await PDFDocument.load(pdfBytes);
const form = pdfDoc.getForm();
const character = JSON.parse(await fs.readFile('./chars/lasse.json', 'utf8'));
const expectedByName = new Map(character.talente.map(talent => [talent.name, String(talent.fertigkeitswert)]));
const actualByField = new Map(fieldNames.map(name => [name, form.getTextField(name).getText() ?? '']));

let allMatch = true;

console.log('PDF fields:');
for (const fieldName of fieldNames) {
  console.log(`${fieldName}=${actualByField.get(fieldName)}`);
}

console.log('Expected talents:');
for (const talentName of talentNames) {
  console.log(`${talentName}=${expectedByName.get(talentName) ?? ''}`);
}

console.log('Pair checks:');
for (let i = 0; i < fieldNames.length; i += 1) {
  const fieldName = fieldNames[i];
  const talentName = talentNames[i];
  const actual = actualByField.get(fieldName) ?? '';
  const expected = expectedByName.get(talentName) ?? '';
  const match = actual === expected;
  if (!match) allMatch = false;
  console.log(`${fieldName}<->${talentName}: ${actual} vs ${expected} => ${match ? 'MATCH' : 'MISMATCH'}`);
}

console.log(`ALL_MATCH=${allMatch}`);
