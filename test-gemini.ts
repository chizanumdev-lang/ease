import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI('AIzaSyBWJBVa158McbSBsofCVvf_2KBKQtp9YQU');
const model = genAI.getGenerativeModel({
  model: 'gemini-2.5-flash',
});
model.generateContent('hello').then(console.log).catch(console.error);
